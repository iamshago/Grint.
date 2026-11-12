import { useEffect, useState, type RefObject } from 'react'

/** La nuit commence à 18 h et finit à 7 h, heure du téléphone. */
export const NUIT_DEBUT = 18
export const NUIT_FIN = 7

/** Vrai de 18 h à 7 h (heure locale). */
export function estNuit(d: Date = new Date()): boolean {
  const h = d.getHours()
  return h >= NUIT_DEBUT || h < NUIT_FIN
}

/** Millisecondes jusqu'à la prochaine bascule (7 h ou 18 h, heure locale). */
function avantBascule(d: Date): number {
  const p = new Date(d.getTime())
  p.setMinutes(0, 0, 0)
  const h = d.getHours()
  if (h >= NUIT_DEBUT) {
    p.setDate(p.getDate() + 1)
    p.setHours(NUIT_FIN)
  } else if (h < NUIT_FIN) {
    p.setHours(NUIT_FIN)
  } else {
    p.setHours(NUIT_DEBUT)
  }
  return p.getTime() - d.getTime()
}

/**
 * Jour ou nuit, selon l'heure du téléphone. Si l'app reste ouverte au passage de 7 h
 * ou de 18 h, la valeur change toute seule (pas besoin de recharger).
 */
export function useNuit(): boolean {
  const [nuit, setNuit] = useState(() => estNuit())

  useEffect(() => {
    let minuteur: number | undefined
    const maj = () => {
      const maintenant = new Date()
      setNuit(estNuit(maintenant))
      window.clearTimeout(minuteur)
      minuteur = window.setTimeout(maj, avantBascule(maintenant) + 500)
    }
    maj()
    // Un téléphone en veille gèle les minuteurs : on revérifie au retour sur l'app.
    const auRetour = () => {
      if (document.visibilityState === 'visible') maj()
    }
    document.addEventListener('visibilitychange', auRetour)
    return () => {
      window.clearTimeout(minuteur)
      document.removeEventListener('visibilitychange', auRetour)
    }
  }, [])

  return nuit
}

/** La dernière version de Winter vue sur ce téléphone (carte ou page, une seule mémoire pour les deux). */
const CLE_VUE = 'grint-winter-moment'
/** Le temps de voir l'ancienne version avant que la bascule commence. */
const DELAI_BASCULE = 900

function lireVue(): boolean | null {
  try {
    const v = window.localStorage.getItem(CLE_VUE)
    return v === 'nuit' ? true : v === 'jour' ? false : null
  } catch {
    return null
  }
}

function retenirVue(nuit: boolean) {
  try {
    window.localStorage.setItem(CLE_VUE, nuit ? 'nuit' : 'jour')
  } catch {
    // navigation privée : pas de mémoire, on montre simplement la bonne version
  }
}

/**
 * Jour ou nuit à afficher sur un élément Winter (carte ou montagne). Si la dernière version vue
 * n'est pas celle de l'heure (vu de jour, revenu après 18 h ; ou l'inverse le matin), l'élément
 * arrive dans l'ancienne version et la bascule se joue sous les yeux, une fois : dès qu'il est
 * à l'écran et que ses images sont chargées (`pret`). Le premier élément Winter vu la consomme.
 */
export function useNuitVue(ref: RefObject<HTMLElement | null>, pret: boolean): boolean {
  const nuit = useNuit()
  const [affichee, setAffichee] = useState(() => lireVue() ?? estNuit())
  const [aLEcran, setALEcran] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // à moitié visible au moins (isIntersecting serait vrai dès le premier pixel)
    const io = new IntersectionObserver((e) => setALEcran(e.some((x) => x.intersectionRatio >= 0.5)), { threshold: [0, 0.5] })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])

  useEffect(() => {
    if (!aLEcran || !pret) return
    if (affichee === nuit) {
      retenirVue(nuit)
      return
    }
    const t = window.setTimeout(() => {
      setAffichee(nuit)
      retenirVue(nuit)
    }, DELAI_BASCULE)
    return () => window.clearTimeout(t)
  }, [aLEcran, pret, nuit, affichee])

  return affichee
}
