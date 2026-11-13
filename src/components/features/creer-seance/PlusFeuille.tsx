import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'
import WorkoutEditor from './WorkoutEditor'
import { IconeCorbeille, IconeDossierPlus, IconeHaltere, IconePlus, IconeSignet } from './icones'
import { estVide, garderBrouillon, lireBrouillon, nbExercices, oublierBrouillon, type Brouillon } from './brouillonSeance'
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
 *
 * Fermer une séance commencée sans l'enregistrer pose la question (planche F6) : la garder pour
 * plus tard (sur le téléphone, brouillonSeance.ts), l'annuler, ou continuer. Tant qu'une séance est
 * gardée, « Créer une séance » propose de la terminer ou d'en commencer une nouvelle (planche F7).
 */
export default function PlusFeuille({ etape, onEtape, onCreerProgramme, onSeanceEnregistree }: PlusFeuilleProps) {
  const [editeurMonte, setEditeurMonte] = useState(false)
  const [editeurVu, setEditeurVu] = useState(false)
  // Le + passe au-dessus du voile tant que la feuille est ouverte (et pendant qu'il redescend).
  const [fabDevant, setFabDevant] = useState(false)

  // Séance gardée pour plus tard : rangée par compte.
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    let actif = true
    supabase.auth.getSession().then(({ data }) => {
      if (actif) setUserId(data.session?.user.id ?? null)
    })
    return () => {
      actif = false
    }
  }, [])
  // La séance en cours, telle que l'éditeur la tient (null : rien à garder ou déjà enregistrée).
  const enCours = useRef<Brouillon | null>(null)
  // Chaque ouverture de l'éditeur repart de zéro, ou de la séance gardée (F7 « Terminer ma séance »).
  const [depart, setDepart] = useState<Brouillon | null>(null)
  const [ouverture, setOuverture] = useState(0)
  // F7 : les choix de la feuille se remplacent par « Terminer ma séance » / « Nouvelle séance ».
  const [garde, setGarde] = useState<Brouillon | null>(null)
  const [reprendre, setReprendre] = useState(false)
  // F6 : la question quand on ferme une séance commencée.
  const [question, setQuestion] = useState(false)

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

  // Les choix d'origine reviennent une fois la feuille redescendue (pas pendant qu'elle descend).
  useEffect(() => {
    if (etape === 'feuille') return
    const t = setTimeout(() => setReprendre(false), 500)
    return () => clearTimeout(t)
  }, [etape])

  // La question se referme d'elle-même si la séance se ferme autrement (enregistrée).
  useEffect(() => {
    if (etape !== 'editeur') setQuestion(false)
  }, [etape])

  useEffect(() => {
    if (!question) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuestion(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [question])

  const fermer = () => onEtape('ferme')

  const ouvrirEditeur = (b: Brouillon | null) => {
    setDepart(b)
    enCours.current = b
    setOuverture((n) => n + 1)
    onEtape('editeur')
  }

  // « Créer une séance » : la séance gardée d'abord (F7), sinon une séance vide.
  const creerSeance = () => {
    const b = lireBrouillon(userId)
    if (b) {
      setGarde(b)
      setReprendre(true)
    } else {
      ouvrirEditeur(null)
    }
  }
  const terminer = () => ouvrirEditeur(garde)
  const nouvelle = () => {
    // La séance gardée est jetée : on ne la repropose plus.
    oublierBrouillon(userId)
    setGarde(null)
    ouvrirEditeur(null)
  }

  // Fermer la séance (poignée, toucher au-dessus, tirer vers le bas) : la question si elle est commencée.
  const doitDemander = () => {
    const b = enCours.current
    return Boolean(b && !estVide(b))
  }
  const demanderFermeture = () => {
    if (doitDemander()) {
      setQuestion(true)
      return
    }
    // Séance vidée : il n'y a plus rien à reproposer.
    oublierBrouillon(userId)
    fermer()
  }
  const garderPourPlusTard = () => {
    if (enCours.current) garderBrouillon(userId, enCours.current)
    setQuestion(false)
    fermer()
  }
  const annulerSeance = () => {
    oublierBrouillon(userId)
    setQuestion(false)
    fermer()
  }
  const seanceEnregistree = () => {
    oublierBrouillon(userId)
    onSeanceEnregistree()
  }

  // Tirer la fiche vers le bas pour la fermer, quand la séance est en haut de son défilement.
  const ficheRef = useRef<HTMLDivElement>(null)
  const glisse = useRef<{ y0: number; dy: number; actif: boolean } | null>(null)
  const defileEnHaut = () => {
    const d = ficheRef.current?.querySelector('[data-editeur-defile]') as HTMLElement | null
    return !d || d.scrollTop <= 0
  }
  const glisserDebut = (e: TouchEvent) => {
    glisse.current = { y0: e.touches[0].clientY, dy: 0, actif: defileEnHaut() }
  }
  const glisserSuite = (e: TouchEvent) => {
    const g = glisse.current
    const fiche = ficheRef.current
    if (!g || !fiche) return
    const dy = e.touches[0].clientY - g.y0
    if (!g.actif) {
      // Le geste a commencé en pleine liste : on ne prend la main que si on est revenu en haut.
      if (dy > 0 && defileEnHaut()) { g.actif = true; g.y0 = e.touches[0].clientY }
      return
    }
    g.dy = Math.max(0, dy)
    if (g.dy > 0) {
      fiche.style.transition = 'none'
      fiche.style.transform = `translateY(${g.dy}px)`
    }
  }
  const glisserFin = () => {
    const g = glisse.current
    const fiche = ficheRef.current
    glisse.current = null
    if (!g || !fiche) return
    if (g.dy > 110 && !doitDemander()) {
      // La fiche file vers le bas depuis là où le doigt l'a laissée, puis se ferme.
      fiche.style.transition = 'transform .4s cubic-bezier(.32,.72,0,1)'
      fiche.style.transform = 'translateY(102%)'
      demanderFermeture()
      return
    }
    // Séance commencée : la fiche revient en place et la question monte par-dessus (F6).
    if (g.dy > 110) setQuestion(true)
    fiche.style.transition = ''
    fiche.style.transform = ''
  }
  const feuilleVue = etape === 'feuille'
  // F7 : la première ligne de la feuille passe sur deux lignes (nom de la séance gardée), le × monte d'autant.
  const clsFab = etape === 'feuille' ? (reprendre ? 'f1-ouvert f1-haute' : 'f1-ouvert') : etape === 'editeur' ? 'f1-cache' : ''

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
        {reprendre && garde ? (
          // F7 : une séance est gardée — la terminer, ou en commencer une nouvelle (elle est alors jetée).
          <>
            <button
              key="terminer"
              type="button"
              className="f1-action f1-entre"
              tabIndex={feuilleVue ? 0 : -1}
              onClick={terminer}
              style={{ ...ACTION, display: 'flex', alignItems: 'center', gap: 12, background: '#f1f4fb', textAlign: 'left', color: '#1b1d1f' }}
            >
              <IconeHaltere taille={20} trait="#1b1d1f" style={{ flexShrink: 0 }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block' }}>Terminer ma séance</span>
                <span style={{ display: 'block', fontSize: 12, lineHeight: '16px', color: '#989da6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {[garde.name.trim(), `${nbExercices(garde)} exercice${nbExercices(garde) > 1 ? 's' : ''}`].filter(Boolean).join(' • ')}
                </span>
              </span>
            </button>
            <button
              key="nouvelle"
              type="button"
              className="f1-action f1-entre"
              tabIndex={feuilleVue ? 0 : -1}
              onClick={nouvelle}
              style={{ ...ACTION, display: 'flex', alignItems: 'center', gap: 12, background: '#f1f4fb', textAlign: 'left', color: '#1b1d1f' }}
            >
              <IconePlus taille={20} trait="#1b1d1f" />
              <span>Nouvelle séance</span>
            </button>
            <button
              key="annuler-reprise"
              type="button"
              className="f1-action f1-entre"
              tabIndex={feuilleVue ? 0 : -1}
              onClick={fermer}
              style={{ ...ACTION, background: '#1b1d1f', textAlign: 'center', color: '#ffee8c' }}
            >
              <span>Annuler</span>
            </button>
          </>
        ) : (
          <>
            <button
              key="programme"
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
              key="seance"
              type="button"
              className="f1-action"
              tabIndex={feuilleVue ? 0 : -1}
              onClick={creerSeance}
              style={{ ...ACTION, display: 'flex', alignItems: 'center', gap: 12, background: '#f1f4fb', textAlign: 'left', color: '#1b1d1f' }}
            >
              <IconeHaltere taille={20} trait="#1b1d1f" />
              <span>Créer une séance</span>
            </button>
            <button
              key="annuler"
              type="button"
              className="f1-action"
              tabIndex={feuilleVue ? 0 : -1}
              onClick={fermer}
              style={{ ...ACTION, background: '#1b1d1f', textAlign: 'center', color: '#ffee8c' }}
            >
              <span>Annuler</span>
            </button>
          </>
        )}
      </div>

      {editeurMonte && (
        // Toucher au-dessus de la fiche la referme, comme une fiche iOS.
        <div
          aria-hidden="true"
          onClick={demanderFermeture}
          style={{ position: 'fixed', left: 0, right: 0, top: 0, height: 'calc(env(safe-area-inset-top, 0px) + 46px)', zIndex: 59 }}
        />
      )}
      {editeurMonte && (
        <div
          ref={ficheRef}
          className={`f1-editeur ${editeurVu ? 'f1-vu' : ''}`}
          onTouchStart={glisserDebut}
          onTouchMove={glisserSuite}
          onTouchEnd={glisserFin}
          onTouchCancel={glisserFin}
          style={{ position: 'fixed', left: 0, right: 0, top: 'calc(env(safe-area-inset-top, 0px) + 46px)', bottom: 0, zIndex: 60, borderRadius: '22px 22px 0 0', overflow: 'hidden', boxShadow: '0 -10px 40px rgba(0,0,0,.35)', background: '#f1f4fb' }}
        >
          <WorkoutEditor
            key={ouverture}
            embedded
            depart={depart}
            onBrouillon={(b) => {
              enCours.current = b
            }}
            onExit={fermer}
            onSaved={seanceEnregistree}
          />
          <button
            type="button"
            onClick={demanderFermeture}
            aria-label="Fermer la nouvelle séance"
            style={{ position: 'absolute', left: '50%', top: 0, width: 120, height: 24, marginLeft: -60, border: 0, padding: 0, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <i style={{ width: 40, height: 5, borderRadius: 4, background: 'rgba(27,29,31,.25)' }} />
          </button>
        </div>
      )}

      {/* F6 : la question, même feuille que le +, par-dessus la séance. */}
      {editeurMonte && (
        <>
          <button
            type="button"
            className={`f1-voile ${question ? 'f1-vu' : ''}`}
            onClick={() => setQuestion(false)}
            aria-label="Continuer la séance"
            tabIndex={question ? 0 : -1}
            style={{ position: 'fixed', inset: 0, zIndex: 70, border: 0, padding: 0, background: 'rgba(0,0,0,0.4)' }}
          />
          <div
            className={`f1-feuille ${question ? 'f1-vu' : ''}`}
            role="dialog"
            aria-label="Séance pas enregistrée"
            aria-hidden={!question}
            style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 71, boxSizing: 'border-box', width: '100%', maxWidth: 402, margin: '0 auto', background: '#ffffff', borderRadius: '24px 24px 0 0', padding: '20px 20px 32px', display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'Figtree, Inter, system-ui, sans-serif', lineHeight: 1.5, color: '#1b1d1f' }}
          >
            <button
              type="button"
              className="f1-action"
              tabIndex={question ? 0 : -1}
              onClick={garderPourPlusTard}
              style={{ ...ACTION, display: 'flex', alignItems: 'center', gap: 12, background: '#f1f4fb', textAlign: 'left', color: '#1b1d1f' }}
            >
              <IconeSignet taille={20} trait="#1b1d1f" />
              <span>Garder pour plus tard</span>
            </button>
            <button
              type="button"
              className="f1-action"
              tabIndex={question ? 0 : -1}
              onClick={annulerSeance}
              style={{ ...ACTION, display: 'flex', alignItems: 'center', gap: 12, background: '#f1f4fb', textAlign: 'left', color: '#1b1d1f' }}
            >
              <IconeCorbeille taille={20} trait="#1b1d1f" />
              <span>Annuler la séance</span>
            </button>
            <button
              type="button"
              className="f1-action"
              tabIndex={question ? 0 : -1}
              onClick={() => setQuestion(false)}
              style={{ ...ACTION, background: '#1b1d1f', textAlign: 'center', color: '#ffee8c' }}
            >
              <span>Continuer</span>
            </button>
          </div>
        </>
      )}
    </>
  )
}
