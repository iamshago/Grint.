import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useLocation, useNavigationType, type NavigationType } from 'react-router-dom'

/**
 * Changement de page (A0, ligne « Changement de page » : fondu et léger glissement).
 * La nouvelle page arrive en fondu en glissant de quelques pixels : vers la gauche quand on
 * avance, vers la droite au retour. Joué une fois par changement de chemin, à l'entrée seulement.
 *
 * Le glissement passe par `left` (position relative le temps de l'animation), pas par
 * `transform` : un transform sur un parent change la référence des `position: fixed`
 * (barres du bas, boutons retour fixes) et les ferait sauter. Ici les éléments fixes restent
 * en place et suivent seulement le fondu ; les entêtes sticky glissent avec la page. Rien ne
 * reste posé une fois l'animation finie.
 */
const DUREE = 250
const COURBE = 'cubic-bezier(.22,1,.36,1)'
const DECALAGE = 14

/** Écrans qui animent déjà leur propre entrée : lecteur, séance validée, page Rejoindre du défi. */
const SANS_TRANSITION = [/^\/workout\//, /^\/seance-validee/, /^\/community\/challenges\/[^/]+\/join/]
const ONGLETS = ['/home', '/community', '/profile']

/**
 * Retour par le geste iOS (glisser depuis le bord) : Safari a déjà fait glisser la page
 * précédente, on ne rejoue rien par-dessus. Safari 18+ le dit (`hasUAVisualTransition`) ;
 * avant, on le devine : un toucher parti du bord, sans clic, juste avant le retour.
 * Écouteurs posés au chargement du module, en capture, pour passer avant ceux du routeur.
 */
let gesteNavigateur = false
let toucherBord = 0
if (typeof window !== 'undefined') {
  window.addEventListener('touchstart', (e) => {
    const x = e.touches[0]?.clientX ?? -1
    toucherBord = x >= 0 && (x < 24 || x > window.innerWidth - 24) ? performance.now() : 0
  }, { capture: true, passive: true })
  window.addEventListener('click', () => { toucherBord = 0 }, true)
  window.addEventListener('popstate', (e) => {
    gesteNavigateur = 'hasUAVisualTransition' in e
      ? (e as PopStateEvent & { hasUAVisualTransition: boolean }).hasUAVisualTransition
      : toucherBord > 0 && performance.now() - toucherBord < 1500
  }, true)
}

/** Onglet de rattachement et profondeur : les pages lancées depuis l'Accueil sont un cran sous /home. */
function rang(chemin: string) {
  const s = chemin.split('/').filter(Boolean)
  const onglet = s[0] === 'community' ? 1 : s[0] === 'profile' || s[0] === 'stats' ? 2 : 0
  const racine = ONGLETS.includes(chemin)
  return { onglet, racine, profondeur: racine ? 1 : Math.max(2, s.length + (onglet === 0 ? 1 : 0)) }
}

/** +1 on avance (la page arrive de la droite), -1 on revient (elle arrive de la gauche). */
function sens(de: string, vers: string, type: NavigationType, idxDe: number | null, idxVers: number | null) {
  if (type === 'POP') return idxDe !== null && idxVers !== null && idxVers > idxDe ? 1 : -1
  const a = rang(de)
  const b = rang(vers)
  if (a.racine && b.racine) return b.onglet < a.onglet ? -1 : 1
  return a.onglet === b.onglet && b.profondeur < a.profondeur ? -1 : 1
}

const lireIdx = (): number | null => {
  const idx = (window.history.state as { idx?: unknown } | null)?.idx
  return typeof idx === 'number' ? idx : null
}

/** Enveloppe des routes (App.tsx) : la barre d'onglets reste en dehors et ne bouge pas. */
export default function TransitionPage({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const type = useNavigationType()
  const cadre = useRef<HTMLDivElement>(null)
  const page = useRef<HTMLDivElement>(null)
  const avant = useRef<{ chemin: string; idx: number | null; t: number } | null>(null)

  useLayoutEffect(() => {
    const idx = lireIdx()
    const t = performance.now()
    const prec = avant.current
    avant.current = { chemin: pathname, idx, t }
    const geste = type === 'POP' && gesteNavigateur
    gesteNavigateur = false
    const el = page.current
    const boite = cadre.current
    if (!prec || prec.chemin === pathname || !el || !boite || geste) return
    // Redirection (/ → /home au lancement…) : la page d'avant n'a pas vraiment été vue
    if (type === 'REPLACE' && t - prec.t < 300) return
    if (SANS_TRANSITION.some((r) => r.test(pathname))) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const dx = sens(prec.chemin, pathname, type, prec.idx, idx) * DECALAGE
    // Le temps du glissement : le cadre coupe ce qui dépasse (pas de défilement horizontal),
    // `clip` ne crée pas de conteneur de défilement, les entêtes sticky continuent de coller.
    boite.style.overflowX = 'clip'
    el.style.position = 'relative'
    const anim = el.animate(
      [{ opacity: 0, left: `${dx}px` }, { opacity: 1, left: '0px' }],
      { duration: DUREE, easing: COURBE },
    )
    const rendre = () => {
      boite.style.overflowX = ''
      el.style.position = ''
    }
    anim.onfinish = rendre
    // Changement de page avant la fin : on rend la main tout de suite (l'événement « cancel »
    // arriverait après la transition suivante et lui retirerait sa position relative)
    return () => {
      anim.onfinish = null
      anim.cancel()
      rendre()
    }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={cadre}>
      <div ref={page}>{children}</div>
    </div>
  )
}
