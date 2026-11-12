import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CATEGORY_COLORS, type WorkoutCategory } from '@/lib/categoryColors'
import FlammeVivante from './FlammeVivante'
import './carte-streak-vivante.css'

const LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const NOMS: Record<string, string> = { upper: 'haut du corps', lower: 'bas du corps', bbl: 'BBL' }
/** Délai avant que la journée se coche (maquette : 1,4 s après l'ouverture). */
const DELAI_COCHE = 1400

type Jours = Array<string | null>
const valide = (j: Jours) => j.includes('upper') && (j.includes('lower') || j.includes('bbl'))
const vide = (j: Jours) => j.every((c) => !c)

interface CarteStreakVivanteProps {
  /** Semaines validées (données réelles, séance du jour comprise). */
  compte: number
  /** Catégorie de chaque jour, lundi → dimanche. */
  jours: Jours
  /** Le compte est définitif (tant qu'il charge, rien ne se joue). */
  pret: boolean
  /** Les jours sont connus : une semaine vide passe en braise sans attendre le compte. */
  semaineConnue: boolean
  /** Jour d'une séance pas encore fêtée : il se coche tout seul quand la carte est à l'écran. */
  aFeter: number | null
  /** Jour de la dernière séance de la semaine : rejoué quand on touche une pastille. */
  dernier: number | null
  /** La journée vient de se cocher : on ne la fête qu'une fois. */
  onFete: () => void
  className?: string
  style?: CSSProperties
}

/**
 * Carte streak de l'Accueil, maquette « la flamme vivante » (Main) et « semaine vide » (A2) :
 * la journée se coche toute seule, la flamme jaillit (semaine validée) ou se rallume depuis la
 * base (première séance), 6 roule à 7, +1, la barre s'éclaire. Toucher un jour rejoue.
 */
export default function CarteStreakVivante({ compte, jours, pret, semaineConnue, aFeter, dernier, onFete, className, style }: CarteStreakVivanteProps) {
  const racine = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [anim, setAnim] = useState<{ jour: number; phase: 'avant' | 'apres'; tour: number } | null>(null)
  const vue = anim ?? (aFeter !== null ? { jour: aFeter, phase: 'avant' as const, tour: 0 } : null)
  const aFeterRef = useRef(aFeter)
  aFeterRef.current = aFeter
  const onFeteRef = useRef(onFete)
  onFeteRef.current = onFete

  // La carte est dans le carrousel : la journée ne se coche que quand on la voit.
  useEffect(() => {
    const el = racine.current
    if (!el || typeof IntersectionObserver === 'undefined') return setVisible(true)
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!vue || vue.phase !== 'avant' || !pret || !visible) return
    const { jour, tour } = vue
    const t = setTimeout(() => {
      setAnim({ jour, phase: 'apres', tour })
      if (aFeterRef.current !== null) onFeteRef.current()
    }, DELAI_COCHE)
    return () => clearTimeout(t)
  }, [vue?.jour, vue?.phase, vue?.tour, pret, visible]) // eslint-disable-line

  // Ce qui s'affiche : avant la coche, la journée est encore vide et le compte d'avant.
  let affJours = jours
  let affCompte = compte
  let etat = semaineConnue && vide(jours) ? 'braise' : 'active'
  if (vue) {
    const sans = jours.map((c, i) => (i === vue.jour ? null : c))
    const boost = valide(jours) && !valide(sans)
    if (vue.phase === 'avant') {
      affJours = sans
      affCompte = Math.max(0, compte - (boost ? 1 : 0))
      etat = vide(sans) ? 'braise' : 'active'
    } else {
      etat = boost ? 'boost' : vide(sans) ? 'allume' : 'active'
    }
  }
  const pop = vue?.phase === 'apres' ? vue.jour : null
  const rejouer = (i: number) => {
    const jour = jours[i] ? i : dernier
    if (jour === null) return
    setAnim((a) => ({ jour, phase: 'avant', tour: (a?.tour ?? 0) + 1 }))
  }
  const touchable = dernier !== null

  return (
    <div
      ref={racine}
      className={`sk-carte sk-${etat}${className ? ` ${className}` : ''}`}
      style={{ position: 'relative', boxSizing: 'border-box', padding: '24px 16px', display: 'flex', gap: 16, background: '#1b1d1f', borderRadius: 24, fontFamily: 'Figtree, system-ui, sans-serif', lineHeight: 1.5, WebkitFontSmoothing: 'antialiased', ...style }}
    >
      <FlammeVivante />
      <div style={{ flex: '1 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <p style={{ position: 'relative', margin: '0 0 8px 0', lineHeight: 1, color: '#f1f4fb' }}>
            <span style={{ fontWeight: 700, fontSize: 24, lineHeight: '32px' }}><span className="sk-roule">{affCompte}</span> </span>
            <span style={{ fontSize: 12, lineHeight: '16px', color: '#989da6' }}>/ 52 semaines</span>
            <span className="sk-plus1" aria-hidden="true" style={{ position: 'absolute', left: 30, top: -10, fontSize: 12, fontWeight: 800, color: '#ffee8c' }}>+1</span>
          </p>
          <div style={{ width: '100%', height: 12, borderRadius: 8, background: 'rgba(77,80,87,0.5)' }}>
            <div className="sk-barreFill" style={{ height: 12, borderRadius: 8, background: '#f1f4fb', boxShadow: '0px 0px 15.5px 5px rgba(255,255,255,0.2)', width: `${Math.round((affCompte / 52) * 100)}%`, transition: 'width 1s cubic-bezier(.22,1,.36,1) .45s' }}><i /></div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
          {LABELS.map((label, i) => {
            const c = affJours[i] ? CATEGORY_COLORS[affJours[i] as WorkoutCategory] ?? CATEGORY_COLORS.upper : null
            const bg = c ? c.bg : 'rgba(156,163,176,0.3)'
            const contenu = (
              <>
                <span className={pop === i && c ? 'sk-pop' : undefined} style={{ width: 16, height: 16, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: bg, background: bg, boxShadow: c ? `0px 0px 24px 0px ${c.glow}` : 'none' }}>
                  {c && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1b1d1f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M20 6 9 17l-5-5" /></svg>}
                </span>
                <span style={{ fontWeight: 600, fontSize: 12, lineHeight: '16px', color: c ? c.text : '#989da6' }}>{label}</span>
              </>
            )
            const boite: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 0, border: 0, background: 'transparent', fontFamily: 'inherit' }
            return touchable ? (
              <button key={label} type="button" className="sk-jour" onClick={() => rejouer(i)} aria-label={`${label} : ${affJours[i] ? NOMS[affJours[i] as string] ?? 'séance' : 'pas de séance'}, touche pour rejouer`} style={boite}>{contenu}</button>
            ) : (
              <div key={label} style={boite}>{contenu}</div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
