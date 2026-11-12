import { useEffect, useMemo, useRef, useState } from 'react'
import type { Exercise, SlotType } from '@/types'
import { IconePlus, IconeRecherche, IconeX } from '@/components/features/creer-seance/icones'
import '@/components/features/creer-seance/creer-seance.css'

/** Libellés courts pour le tag de type de tension sur chaque exo. */
export const TENSION_SHORT: Record<SlotType, string> = {
  contraction: 'Contraction',
  stretch: 'Étirement',
  unilateral: 'Unilatéral',
  isolation: 'Isolation',
}

interface ExercisePickerSheetProps {
  open: boolean
  onClose: () => void
  catalog: Exercise[]
  onSelect: (exercise: Exercise) => void
  /** Titre contextuel (ex. « Exercice — Tension de contraction » ou « Ajouter un exercice »). */
  title?: string
  /** Slot ciblé : les exos de ce type de tension sont mis en avant (« Recommandés »). */
  slot?: SlotType | null
}

/**
 * Feuille de sélection d'un exercice dans le catalogue (`exercises`, read-only) — planche G-FeuilleExercices.
 * Posée dans la page (absolute, plein cadre) : le voile s'éclaircit, la feuille monte du bas.
 * Recherche en haut + liste scrollable (« Recommandés » = type de l'emplacement en premier).
 */
export default function ExercisePickerSheet({
  open,
  onClose,
  catalog,
  onSelect,
  title = 'Ajouter un exercice',
  slot,
}: ExercisePickerSheetProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) {
      // Comme la planche : la recherche se vide une fois la feuille redescendue.
      const vider = setTimeout(() => setQuery(''), 520)
      return () => clearTimeout(vider)
    }
    // Focus différé après l'animation d'ouverture — évite le saut de viewport
    // iOS Safari provoqué par autoFocus.
    const focusTimer = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 250)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return catalog
    return catalog.filter((e) => e.name.toLowerCase().includes(q))
  }, [catalog, query])

  // Slot ciblé : exos du bon type de tension d'abord (« Recommandés »), reste ensuite.
  const recommended = slot ? results.filter((e) => e.tension_type === slot) : []
  const others = slot ? results.filter((e) => e.tension_type !== slot) : results

  const cls = open ? 'fe-ouvert' : ''

  const renderRow = (exercise: Exercise) => (
    <button
      key={exercise.id}
      type="button"
      className="fe-touche"
      onClick={() => {
        onSelect(exercise)
        onClose()
      }}
      style={{ boxSizing: 'border-box', width: '100%', margin: 0, border: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 16, borderRadius: 12, background: '#1b1d1f', textAlign: 'left', fontFamily: 'inherit' }}
    >
      <span style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 16, lineHeight: '24px', color: '#f1f4fb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exercise.name}</span>
        {exercise.tension_type && (
          <span style={{ boxSizing: 'border-box', flexShrink: 0, fontSize: 10, lineHeight: '15px', textTransform: 'uppercase', letterSpacing: '0.25px', color: '#989da6', border: '1px solid #3d4149', borderRadius: 6, padding: '2px 6px' }}>
            {TENSION_SHORT[exercise.tension_type]}
          </span>
        )}
      </span>
      <span style={{ width: 32, height: 32, borderRadius: 9999, background: '#ffee8c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <IconePlus taille={16} trait="#1b1d1f" />
      </span>
    </button>
  )

  const titreSection = (texte: string) => (
    <span style={{ fontWeight: 600, fontSize: 12, lineHeight: '16px', textTransform: 'uppercase', letterSpacing: '0.3px', color: '#989da6' }}>{texte}</span>
  )

  return (
    <div
      aria-hidden={!open}
      style={{ position: 'absolute', inset: 0, zIndex: 300, overflow: 'hidden', pointerEvents: 'none', fontFamily: 'Figtree, Inter, system-ui, sans-serif', lineHeight: 1.5, color: '#1b1d1f' }}
    >
      <button
        type="button"
        className={`fe-voile ${cls}`}
        onClick={onClose}
        aria-label="Fermer"
        tabIndex={open ? 0 : -1}
        style={{ position: 'absolute', inset: 0, border: 0, padding: 0, background: 'rgba(0,0,0,0.4)' }}
      />
      <div
        className={`fe-feuille ${cls}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ boxSizing: 'border-box', position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', maxHeight: '78%', background: '#1c1c1e', borderRadius: '24px 24px 0 0', paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))', pointerEvents: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, borderRadius: 9999, background: '#3d4149' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 12px', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontFamily: "'PT Serif', Georgia, serif", fontWeight: 700, fontSize: 20, lineHeight: '28px', color: '#f1f4fb' }}>{title}</h3>
          <button type="button" onClick={onClose} aria-label="Fermer" style={{ border: 0, background: '#3d4149', borderRadius: 9999, padding: 8, display: 'flex', cursor: 'pointer' }}>
            <IconeX taille={18} trait="#f1f4fb" />
          </button>
        </div>
        <div style={{ padding: '0 20px 12px', flexShrink: 0 }}>
          <label style={{ boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 12, background: '#3d4149', borderRadius: 12, padding: '14px 16px' }}>
            <IconeRecherche taille={16} trait="#989da6" style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              className="fe-champ"
              type="text"
              placeholder="Rechercher un exercice"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ boxSizing: 'border-box', width: '100%', margin: 0, padding: 0, border: 0, background: 'transparent', fontFamily: 'inherit', fontSize: 16, lineHeight: '24px', color: '#f1f4fb', caretColor: '#f1f4fb' }}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Effacer" style={{ border: 0, padding: 0, background: 'transparent', display: 'flex', cursor: 'pointer' }}>
                <IconeX taille={16} trait="#989da6" />
              </button>
            )}
          </label>
        </div>
        <div className="fe-liste" style={{ boxSizing: 'border-box', overflowY: 'auto', padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.length === 0 ? (
            <p style={{ margin: 0, padding: '40px 0', textAlign: 'center', fontSize: 14, lineHeight: '20px', color: '#989da6' }}>Aucun exercice ne correspond.</p>
          ) : slot ? (
            <>
              {recommended.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {titreSection('Recommandés')}
                  {recommended.map(renderRow)}
                </div>
              )}
              {others.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {titreSection('Autres exercices')}
                  {others.map(renderRow)}
                </div>
              )}
            </>
          ) : (
            results.map(renderRow)
          )}
        </div>
      </div>
    </div>
  )
}
