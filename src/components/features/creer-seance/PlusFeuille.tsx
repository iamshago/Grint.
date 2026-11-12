import { useEffect, useState } from 'react'
import WorkoutEditor from './WorkoutEditor'
import { IconeDossierPlus, IconeHaltere, IconePlus } from './icones'
import './creer-seance.css'

export type EtapeCreer = 'ferme' | 'feuille' | 'editeur'

interface PlusFeuilleProps {
  etape: EtapeCreer
  onEtape: (etape: EtapeCreer) => void
  onCreerProgramme: () => void
  /** Séance enregistrée depuis l'éditeur : la page recharge ses séances. */
  onSeanceEnregistree: () => void
}

const ACTION = {
  boxSizing: 'border-box',
  width: '100%',
  margin: 0,
  border: 0,
  padding: '14px 16px',
  borderRadius: 12,
  fontFamily: 'inherit',
  fontWeight: 600,
  fontSize: 16,
  lineHeight: '24px',
  cursor: 'pointer',
} as const

/**
 * Le + de « Programmer mes séances » (planche F1) : le + tourne en ×, la feuille d'actions
 * monte avec un ressort et ses actions entrent en cascade ; « Créer une séance » fait monter
 * la nouvelle séance du bas pendant que la page recule (la page applique `f1-recule`).
 */
export default function PlusFeuille({ etape, onEtape, onCreerProgramme, onSeanceEnregistree }: PlusFeuilleProps) {
  const [editeurMonte, setEditeurMonte] = useState(false)
  const [editeurVu, setEditeurVu] = useState(false)
  // Le + passe au-dessus du voile tant que la feuille est ouverte (et pendant qu'il redescend).
  const [fabDevant, setFabDevant] = useState(false)

  useEffect(() => {
    if (etape === 'editeur') {
      setEditeurMonte(true)
      let r2 = 0
      const r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => setEditeurVu(true))
      })
      return () => {
        cancelAnimationFrame(r1)
        cancelAnimationFrame(r2)
      }
    }
    setEditeurVu(false)
    // L'éditeur redescend, puis se démonte (la prochaine séance repart de zéro).
    const t = setTimeout(() => setEditeurMonte(false), 560)
    return () => clearTimeout(t)
  }, [etape])

  useEffect(() => {
    if (etape !== 'ferme') {
      setFabDevant(true)
      return
    }
    const t = setTimeout(() => setFabDevant(false), 450)
    return () => clearTimeout(t)
  }, [etape])

  useEffect(() => {
    if (etape !== 'feuille') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEtape('ferme')
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [etape, onEtape])

  const fermer = () => onEtape('ferme')
  const feuilleVue = etape === 'feuille'
  const clsFab = etape === 'feuille' ? 'f1-ouvert' : etape === 'editeur' ? 'f1-cache' : ''

  return (
    <>
      <button
        type="button"
        className={`f1-voile ${feuilleVue ? 'f1-vu' : ''}`}
        onClick={fermer}
        aria-label="Fermer"
        tabIndex={feuilleVue ? 0 : -1}
        style={{ position: 'fixed', inset: 0, zIndex: 50, border: 0, padding: 0, background: 'rgba(0,0,0,0.4)' }}
      />

      <button
        type="button"
        className={`f1-fab ${clsFab}`}
        onClick={() => onEtape(feuilleVue ? 'ferme' : 'feuille')}
        aria-label="Créer"
        aria-expanded={feuilleVue}
        style={{ position: 'fixed', right: 24, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)', zIndex: fabDevant ? 52 : 40, boxSizing: 'border-box', width: 56, height: 56, margin: 0, padding: 0, border: 0, borderRadius: 9999, background: '#1b1d1f', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0px 8px 24px 0px rgba(31,32,33,0.32)', cursor: 'pointer' }}
      >
        <IconePlus taille={28} trait="#ffee8c" />
      </button>

      <div
        className={`f1-feuille ${feuilleVue ? 'f1-vu' : ''}`}
        role="dialog"
        aria-label="Que veux-tu créer ?"
        aria-hidden={!feuilleVue}
        style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 51, boxSizing: 'border-box', width: '100%', maxWidth: 402, margin: '0 auto', background: '#ffffff', borderRadius: '24px 24px 0 0', padding: '20px 20px 32px', display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'Figtree, Inter, system-ui, sans-serif', lineHeight: 1.5, color: '#1b1d1f' }}
      >
        <button
          type="button"
          className="f1-action"
          tabIndex={feuilleVue ? 0 : -1}
          onClick={onCreerProgramme}
          style={{ ...ACTION, display: 'flex', alignItems: 'center', gap: 12, background: '#f1f4fb', textAlign: 'left', color: '#1b1d1f' }}
        >
          <IconeDossierPlus taille={20} trait="#1b1d1f" />
          <span>Créer un programme</span>
        </button>
        <button
          type="button"
          className="f1-action"
          tabIndex={feuilleVue ? 0 : -1}
          onClick={() => onEtape('editeur')}
          style={{ ...ACTION, display: 'flex', alignItems: 'center', gap: 12, background: '#f1f4fb', textAlign: 'left', color: '#1b1d1f' }}
        >
          <IconeHaltere taille={20} trait="#1b1d1f" />
          <span>Créer une séance</span>
        </button>
        <button
          type="button"
          className="f1-action"
          tabIndex={feuilleVue ? 0 : -1}
          onClick={fermer}
          style={{ ...ACTION, background: '#1b1d1f', textAlign: 'center', color: '#ffee8c' }}
        >
          <span>Annuler</span>
        </button>
      </div>

      {editeurMonte && (
        <div
          className={`f1-editeur ${editeurVu ? 'f1-vu' : ''}`}
          style={{ position: 'fixed', left: 0, right: 0, top: 'calc(env(safe-area-inset-top, 0px) + 46px)', bottom: 0, zIndex: 60, borderRadius: '22px 22px 0 0', overflow: 'hidden', boxShadow: '0 -10px 40px rgba(0,0,0,.35)', background: '#f1f4fb' }}
        >
          <WorkoutEditor embedded onExit={fermer} onSaved={onSeanceEnregistree} />
          <button
            type="button"
            onClick={fermer}
            aria-label="Fermer la nouvelle séance"
            style={{ position: 'absolute', left: '50%', top: 0, width: 120, height: 24, marginLeft: -60, border: 0, padding: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i style={{ width: 40, height: 5, borderRadius: 4, background: 'rgba(27,29,31,.25)' }} />
          </button>
        </div>
      )}
    </>
  )
}
