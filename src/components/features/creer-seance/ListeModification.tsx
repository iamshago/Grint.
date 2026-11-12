import { useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import type { DraftExercise } from '@/lib/myPrograms'
import { TENSION_SHORT } from '@/components/features/ExercisePickerSheet'
import { SLOT_ORDER } from '@/types'
import CarteExercice, { LigneAjouter, enMinutes, type ReglageAffiche } from './CarteExercice'
import LigneEmplacement from './LigneEmplacement'
import { BORNES, type CibleExercice, type CiblePlacement, type EditeurSeance } from './useEditeurSeance'

interface ListeModificationProps {
  ed: EditeurSeance
  /** Ouvre la feuille d'exercices (changer, remplir un emplacement vide, ajouter). */
  onChoisir: (cible: CiblePlacement) => void
  /** Dernier exercice placé (rejoue le « pop »). */
  dernier: { cle: string; tick: number } | null
}

type Champ = 'sets' | 'reps' | 'rest_seconds'

/**
 * Liste des exercices de « Modifier la séance » (planche F5) : chaque exercice se déplie sur ses
 * réglages, un seul ouvert à la fois ; les exercices libres suivent (« Libre ») et se remettent en
 * ordre par appui long ; « Ajouter un exercice » ferme la liste. Un emplacement vidé reprend la
 * ligne vide de F3 (« Recommandé »).
 */
export default function ListeModification({ ed, onChoisir, dernier }: ListeModificationProps) {
  const [ouvert, setOuvert] = useState<string | null>(null)
  // Nombre de changements par réglage (« cle-champ »), pour faire repartir le saut du chiffre.
  const [tics, setTics] = useState<Record<string, number>>({})

  const reglagesDe = (cle: string, cible: CibleExercice, d: DraftExercise): ReglageAffiche[] => {
    const reps = parseInt(d.reps, 10) || 0
    const champs: [string, Champ, number, string][] = [
      ['Séries', 'sets', d.sets, String(d.sets)],
      ['Réps', 'reps', reps, String(reps)],
      ['Repos', 'rest_seconds', d.rest_seconds, enMinutes(d.rest_seconds)],
    ]
    return champs.map(([nom, champ, v, valeur]) => {
      const t = `${cle}-${champ}`
      const regler = (sens: 1 | -1) => {
        ed.regler(cible, { [champ]: v + sens * BORNES[champ].pas })
        setTics((p) => ({ ...p, [t]: (p[t] ?? 0) + 1 }))
      }
      return { nom, valeur, tic: tics[t] ?? 0, moins: () => regler(-1), plus: () => regler(1) }
    })
  }

  const carte = (cle: string, cible: CibleExercice, d: DraftExercise, numero: number, slot: string, appui?: HTMLAttributes<HTMLButtonElement>) => {
    const pop = dernier?.cle === cle
    return (
      <CarteExercice
        key={pop ? `${cle}-${dernier.tick}` : cle}
        numero={numero}
        nom={d.exercise?.name ?? 'Exercice'}
        resume={`${d.sets} séries • ${d.reps} réps • repos ${enMinutes(d.rest_seconds)}`}
        slot={slot}
        ouvert={ouvert === cle}
        onBasculer={() => setOuvert((o) => (o === cle ? null : cle))}
        reglages={reglagesDe(cle, cible, d)}
        onChanger={() => onChoisir(cible.kind === 'slot' ? cible : { kind: 'free-replace', uid: cible.uid })}
        onRetirer={() => {
          setOuvert(null)
          ed.retirer(cible)
        }}
        pop={pop}
        appui={appui}
      />
    )
  }

  let numero = 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {SLOT_ORDER.map((slot) => {
        const d = ed.slots[slot]
        if (!d) {
          return <LigneEmplacement key={slot} titre={TENSION_SHORT[slot]} sous="Recommandé" onClick={() => onChoisir({ kind: 'slot', slot })} />
        }
        numero += 1
        return carte(slot, { kind: 'slot', slot }, d, numero, TENSION_SHORT[slot])
      })}
      {ed.freeExos.length > 0 && (
        <Reorder.Group as="div" axis="y" values={ed.freeExos} onReorder={ed.reordonnerLibres} style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0 }}>
          {ed.freeExos.map((d) => {
            numero += 1
            const n = numero
            return (
              <ItemLibre key={d.uid} draft={d}>
                {(appui) => carte(d.uid, { kind: 'free', uid: d.uid }, d, n, 'Libre', appui)}
              </ItemLibre>
            )
          })}
        </Reorder.Group>
      )}
      <LigneAjouter onClick={() => onChoisir({ kind: 'free-add' })} />
    </div>
  )
}

const empecherDefilement = (e: TouchEvent) => e.preventDefault()

/**
 * Exercice libre réordonnable : un appui long (0,45 s sans bouger) sur la ligne l'attrape, on le
 * glisse à sa place. Aucun élément visible en plus ; un appui court ouvre les réglages.
 */
function ItemLibre({ draft, children }: { draft: DraftExercise; children: (appui: HTMLAttributes<HTMLButtonElement>) => ReactNode }) {
  const controls = useDragControls()
  const minuteur = useRef<number | null>(null)
  const depart = useRef<{ x: number; y: number } | null>(null)
  const attrape = useRef(false)

  const arreter = () => {
    if (minuteur.current) window.clearTimeout(minuteur.current)
    minuteur.current = null
  }

  const appui: HTMLAttributes<HTMLButtonElement> = {
    onPointerDown: (e) => {
      attrape.current = false
      depart.current = { x: e.clientX, y: e.clientY }
      const evenement = e
      arreter()
      minuteur.current = window.setTimeout(() => {
        minuteur.current = null
        attrape.current = true
        controls.start(evenement)
      }, 450)
    },
    onPointerMove: (e) => {
      if (minuteur.current && depart.current && Math.hypot(e.clientX - depart.current.x, e.clientY - depart.current.y) > 8) arreter()
    },
    onPointerUp: arreter,
    onPointerCancel: arreter,
    // Après un appui long, le relâcher n'ouvre pas les réglages.
    onClickCapture: (e) => {
      if (attrape.current) {
        e.preventDefault()
        e.stopPropagation()
        attrape.current = false
      }
    },
    onContextMenu: (e) => e.preventDefault(),
  }

  return (
    <Reorder.Item
      as="div"
      value={draft}
      dragListener={false}
      dragControls={controls}
      onDragStart={() => document.addEventListener('touchmove', empecherDefilement, { passive: false })}
      onDragEnd={() => document.removeEventListener('touchmove', empecherDefilement)}
      style={{ position: 'relative' }}
    >
      {children(appui)}
    </Reorder.Item>
  )
}
