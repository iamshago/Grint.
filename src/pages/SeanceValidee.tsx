import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import SessionCard from '@/components/features/SessionCard'
import FlammeSemaine from '@/components/features/seance-validee/FlammeSemaine'
import WinterSeanceBloc from '@/components/features/seance-validee/WinterSeanceBloc'
import Eclats from '@/components/features/seance-validee/Eclats'
import { ANNEAU_RECORD } from '@/components/features/seance-validee/b1Traces'
import '@/components/features/seance-validee/seance-validee.css'
import { useStreak } from '@/hooks/useStreak'
import { useWinterSeance } from '@/hooks/useWinterSeance'
import { supabase } from '@/lib/supabaseClient'

/** Ce que le lecteur transmet à la fin d'une séance enregistrée. */
export interface SeanceValideeState {
  completedAt: string
  titre: string
  dureeMin: number
  exercices: number
  calories: number
  categorie: string | null
}

const bouton = { width: 40, height: 40, flexShrink: 0, background: '#1b1d1f', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0px 0px 40px 0px rgba(31,32,33,0.4)', border: 0, padding: 0, cursor: 'pointer' } as const

/**
 * Séance validée (maquette B1-Seance-validee) : la flamme qui s'allume, la semaine qui se coche,
 * la carte de la séance et, si tu es dans Winter, ce que la séance t'a rapporté. Toucher la
 * flamme rejoue tout (la racine alterne sv-ra / sv-rb).
 */
export default function SeanceValidee() {
  const navigate = useNavigate()
  const etat = useLocation().state as SeanceValideeState | null
  const [cycle, setCycle] = useState<'sv-ra' | 'sv-rb'>('sv-ra')
  const [userId, setUserId] = useState<string | null>(null)
  const [records, setRecords] = useState<number | null>(null)
  const { streakCount, weekDays, loading } = useStreak(userId)
  const { seance: winter, pret: winterPret } = useWinterSeance(etat?.completedAt ?? null)

  useEffect(() => {
    if (!etat) {
      navigate('/home', { replace: true })
      return
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
      if (!user) return setRecords(0)
      // Records de cette séance : le déclencheur poste un « pr » à l'heure de la séance
      supabase.from('posts').select('id').eq('user_id', user.id).eq('type', 'pr').gte('created_at', etat.completedAt)
        .then(({ data }) => setRecords((data ?? []).length))
    })
  }, [etat, navigate])

  // Tout est chargé avant d'afficher : la séquence de B1 part d'un seul coup
  if (!etat || !userId || loading || records === null || !winterPret) return <div className="fixed inset-0 bg-[#0c0c0c]" />

  const aujourdhui = (new Date(etat.completedAt).getDay() + 6) % 7
  const jours = weekDays.map((d) => d.category)
  const valide = (liste: Array<string | null>) => liste.includes('upper') && liste.some((c) => c === 'lower' || c === 'bbl')
  const avantSeance = jours.map((c, i) => (i === aujourdhui ? null : c))
  const boost = valide(jours) && !valide(avantSeance)
  const terminer = () => navigate('/home', { replace: true })

  return (
    <div
      className={`${cycle} fixed inset-0 overflow-y-auto overflow-x-hidden`}
      style={{ background: '#0c0c0c', color: '#f1f4fb', fontFamily: 'Figtree, system-ui, sans-serif', lineHeight: 1.5, WebkitFontSmoothing: 'antialiased' }}
    >
      {/* Entête du lecteur (G-LecteurEntete) */}
      <div className="sticky top-0 z-10" style={{ background: '#0c0c0c', padding: '8px 16px 16px', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)', display: 'flex', alignItems: 'center' }}>
        <button type="button" aria-label="Fermer" onClick={terminer} style={bouton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f1f4fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
        </button>
        <h1 style={{ flex: '1 1 0%', margin: 0, textAlign: 'center', fontFamily: "'PT Serif', Georgia, serif", fontWeight: 700, fontSize: 20, lineHeight: '28px', letterSpacing: '-0.6px', color: '#f1f4fb' }}>Séance validée</h1>
        <button type="button" aria-label="Historique des séances" onClick={() => navigate('/profile/history')} style={bouton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f1f4fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M3 5h.01" /><path d="M3 12h.01" /><path d="M3 19h.01" /><path d="M8 5h13" /><path d="M8 12h13" /><path d="M8 19h13" /></svg>
        </button>
      </div>

      <div className="relative w-full max-w-[402px] mx-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 112px)' }}>
        <div style={{ marginTop: 32 }}>
          <FlammeSemaine
            avant={boost ? Math.max(0, streakCount - 1) : streakCount}
            apres={streakCount}
            jours={jours}
            aujourdhui={aujourdhui}
            boost={boost}
            onRejouer={() => setCycle(cycle === 'sv-ra' ? 'sv-rb' : 'sv-ra')}
          />
        </div>

        <div className="sv-entre relative" style={{ animationDelay: '1.55s', margin: '37px 16px 0' }}>
          <SessionCard
            title={etat.titre}
            date={etat.completedAt}
            durationMin={etat.dureeMin}
            exerciseCount={etat.exercices}
            calories={etat.calories}
            prCount={records}
          />
          {records > 0 && (
            <>
              {/* Éclat sur le record : même place qu'en maquette, à 105 px du bord droit de la carte */}
              <i className="sv-anneau" style={{ left: `calc(100% - ${370 - (ANNEAU_RECORD.x - 16)}px)`, top: ANNEAU_RECORD.y - 376, width: ANNEAU_RECORD.taille, height: ANNEAU_RECORD.taille, animationDelay: `${ANNEAU_RECORD.delai}s` }} />
              <Eclats origine={[297, 499.5]} x={`calc(100% - ${370 - (297 - 16)}px)`} y={499.5 - 376} />
            </>
          )}
        </div>

        {winter && (
          <div style={{ margin: '16px 16px 0' }}>
            <WinterSeanceBloc s={winter} />
          </div>
        )}
      </div>

      {/* Bouton du lecteur (G-BoutonLecteur, accent jaune) */}
      <button
        type="button"
        onClick={terminer}
        className="sv-entre"
        style={{
          animationDelay: '1.95s', position: 'fixed', left: 24, right: 24, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)', zIndex: 15,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16, border: 0, borderRadius: 12,
          fontFamily: 'inherit', fontWeight: 600, fontSize: 16, lineHeight: '24px', backgroundColor: '#ffee8c', color: '#1b1d1f',
          boxShadow: '0px 0px 20px 0px #ffee8c4D', maxWidth: 354, margin: '0 auto',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b1d1f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="M20 6 9 17l-5-5" /></svg>
        <span>Terminer</span>
      </button>
    </div>
  )
}
