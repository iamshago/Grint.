import { useEffect, useRef, useState } from 'react'
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
  /** Places gagnées (+) ou perdues (−) depuis lundi. */
  evol: number | null
}

interface WinterRaceProps {
  lignes: LigneCourse[]
  summit: number
}

// Le premier a une carte plus haute (88 au lieu de 72) quand il a des points
const topDe = (r: number, avecTete: boolean) => (r === 1 ? 0 : avecTete ? 100 + (r - 2) * 84 : (r - 1) * 84)

/**
 * La course : tout le monde, du premier au dernier (C5). Elle est sous la montagne : l'animation
 * part quand elle arrive à l'écran. Les flèches de la semaine sautent de haut en bas, puis
 * chaque ligne glisse de sa place à ta dernière visite vers sa place maintenant.
 */
export default function WinterRace({ lignes, summit }: WinterRaceProps) {
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const [vue, setVue] = useState(false)
  const [phase, setPhase] = useState<'avant' | 'maintenant'>('avant')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVue(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -25% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!vue) return
    const t = window.setTimeout(() => setPhase('maintenant'), 1000)
    return () => window.clearTimeout(t)
  }, [vue])

  const n = lignes.length
  const rangDe = (l: LigneCourse) => (phase === 'avant' ? l.rangAvant : l.rang)
  const avecTete = (lignes.find((l) => rangDe(l) === 1)?.pts ?? 0) > 0
  const hauteur = n === 0 ? 0 : topDe(n, avecTete) + (n === 1 && avecTete ? 88 : 72)

  return (
    <div ref={ref} className="relative" style={{ height: hauteur, filter: 'drop-shadow(0px 0px 12px rgba(31,32,33,0.12))' }}>
      {lignes.map((l) => {
        const r = rangDe(l)
        return (
          <div key={l.id} id={l.moi ? 'winter-ma-ligne' : undefined} className="winter-ligne" style={{ top: topDe(r, avecTete), zIndex: l.moi ? 2 : 1 }}>
            <WinterRaceRow
              rang={r}
              tete={r === 1 && avecTete}
              nom={l.nom}
              avatar={l.avatar}
              pts={l.pts}
              summit={summit}
              moi={l.moi}
              evol={vue ? l.evol : null}
              delai={150 + (l.rangAvant - 1) * 60}
              onClick={l.moi ? undefined : () => navigate(`/profile/friends/${l.id}`)}
            />
          </div>
        )
      })}
    </div>
  )
}
