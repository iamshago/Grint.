import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { useNavigate } from 'react-router-dom'
import WinterRaceRow from './WinterRaceRow'

export interface LigneCourse {
  id: string
  nom: string
  avatar: string
  pts: number
  moi: boolean
  /** Place maintenant, et place à ta dernière visite (d'où la ligne part en glissant). */
  rang: number
  rangAvant: number
  /** Place de lundi, pour la flèche de la semaine ; null = pas de flèche (avant le départ). */
  rangLundi: number | null
  /** Ta ligne, quand ta place a bougé depuis ta dernière visite : sa flèche est celle du dépassement
   *  (places gagnées ou perdues depuis cette visite), posée quand la ligne arrive, comme sur « ta place ». */
  depuisVisite?: number
}

/** Ta ligne, en coordonnées de la page : de sa place d'avant à sa place maintenant. */
export interface MaLigne {
  haut: number
  bas: number
  /** Vrai si ta ligne monte (la place d'arrivée est en haut de l'étendue). */
  monte: boolean
}

export interface WinterRaceHandle {
  maLigne(): MaLigne | null
}

interface WinterRaceProps {
  lignes: LigneCourse[]
  summit: number
  /** false : chaque ligne à sa place de ta dernière visite ; true : à sa place maintenant (elle glisse). */
  jouee: boolean
  /** Ta place a baissé : ta ligne passe sous celle qui te double. */
  descend?: boolean
  /** La course arrive à l'écran (une seule fois). */
  onVue: () => void
  ref?: Ref<WinterRaceHandle>
}

// Le premier a une carte plus haute (88 au lieu de 72) quand il a des points
const topDe = (r: number, avecTete: boolean) => (r === 1 ? 0 : avecTete ? 100 + (r - 2) * 84 : (r - 1) * 84)
const hauteurDe = (r: number, avecTete: boolean) => (r === 1 && avecTete ? 88 : 72)
// Le premier n'a sa carte sombre que s'il a des points
const teteDe = (lignes: LigneCourse[], cle: 'rang' | 'rangAvant') => (lignes.find((l) => l[cle] === 1)?.pts ?? 0) > 0

/**
 * La course : tout le monde, du premier au dernier (C5). Elle est sous la montagne : les flèches
 * de la semaine sautent de haut en bas quand elle arrive à l'écran. Le glissement de chaque ligne,
 * de sa place à ta dernière visite vers sa place maintenant, est commandé par la page (`jouee`) :
 * il part tout seul quand la course arrive à l'écran, ou après le défilement si tu touches « ta place ».
 */
export default function WinterRace({ lignes, summit, jouee, descend = false, onVue, ref }: WinterRaceProps) {
  const navigate = useNavigate()
  const boite = useRef<HTMLDivElement>(null)
  const [vue, setVue] = useState(false)
  const onVueRef = useRef(onVue)
  useEffect(() => {
    onVueRef.current = onVue
  })

  useEffect(() => {
    const el = boite.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVue(true)
          onVueRef.current()
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -25% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      maLigne() {
        const el = boite.current
        const l = lignes.find((x) => x.moi)
        if (!el || !l) return null
        const y0 = el.getBoundingClientRect().top + window.scrollY
        const tAvant = teteDe(lignes, 'rangAvant')
        const tMaint = teteDe(lignes, 'rang')
        const depart = jouee ? topDe(l.rang, tMaint) : topDe(l.rangAvant, tAvant)
        const hDepart = jouee ? hauteurDe(l.rang, tMaint) : hauteurDe(l.rangAvant, tAvant)
        const arrivee = topDe(l.rang, tMaint)
        const hArrivee = hauteurDe(l.rang, tMaint)
        return {
          haut: y0 + Math.min(depart, arrivee),
          bas: y0 + Math.max(depart + hDepart, arrivee + hArrivee),
          monte: arrivee <= depart,
        }
      },
    }),
    [lignes, jouee],
  )

  const n = lignes.length
  const rangDe = (l: LigneCourse) => (jouee ? l.rang : l.rangAvant)
  const avecTete = teteDe(lignes, jouee ? 'rang' : 'rangAvant')
  const hauteur = n === 0 ? 0 : topDe(n, avecTete) + (n === 1 && avecTete ? 88 : 72)

  return (
    <div ref={boite} className="relative" style={{ height: hauteur, filter: 'drop-shadow(0px 0px 12px rgba(31,32,33,0.12))' }}>
      {lignes.map((l) => {
        const r = rangDe(l)
        return (
          <div
            key={l.id}
            id={l.moi ? 'winter-ma-ligne' : undefined}
            className="winter-ligne"
            style={{ top: topDe(r, avecTete), zIndex: l.moi ? (descend ? 0 : 2) : 1 }}
          >
            <WinterRaceRow
              rang={r}
              tete={r === 1 && avecTete}
              nom={l.nom}
              avatar={l.avatar}
              pts={l.pts}
              summit={summit}
              moi={l.moi}
              evol={!vue ? null : l.depuisVisite !== undefined ? (jouee ? l.depuisVisite : null) : l.rangLundi !== null ? l.rangLundi - r : null}
              // à l'arrivée elles sautent de haut en bas ; une flèche qui change ressaute quand sa ligne s'est posée
              delai={jouee ? 1150 : 400 + (l.rangAvant - 1) * 80}
              onClick={l.moi ? undefined : () => navigate(`/profile/friends/${l.id}`)}
            />
          </div>
        )
      })}
    </div>
  )
}
