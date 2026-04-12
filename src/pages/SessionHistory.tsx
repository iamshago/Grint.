// @ts-nocheck
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import DarkLayout from '@/components/layout/DarkLayout'
import { supabase } from '@/lib/supabaseClient'
import SessionCard from '@/components/features/SessionCard'

interface CompletedWorkout {
  id: string
  completed_at: string
  calories: number
  duration_min: number
  workout_id: string
  workouts: {
    title: string
    duration_min: number
    category: string | null
    workout_exercises: { id: string }[]
  } | null
}

/** Page Historique des séances — dark mode, route /profile/history */
export default function SessionHistory() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<CompletedWorkout[]>([])
  const [prCounts, setPrCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('completed_workouts')
        .select(`
          id,
          completed_at,
          calories,
          duration_min,
          workout_id,
          workouts (
            title,
            duration_min,
            category,
            workout_exercises ( id )
          )
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })

      if (error) throw error
      setSessions(data || [])

      // Compter les PR par séance complétée
      // Un PR = la première fois qu'un poids max est atteint pour un exercice
      await computePRCounts(user.id, data || [])
    } catch (err) {
      console.error('Erreur fetchHistory:', err)
    } finally {
      setLoading(false)
    }
  }

  /** Calcule le nombre de PR battus lors de chaque séance */
  async function computePRCounts(userId: string, completedWorkouts: CompletedWorkout[]) {
    try {
      // Récupérer tous les logs de l'utilisateur, triés par date
      const { data: allLogs } = await supabase
        .from('user_progress')
        .select('exercise_id, weight_used, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (!allLogs || allLogs.length === 0) return

      // Pour chaque exercice, suivre le max connu et quand il a été battu
      const maxByExercise: Record<string, number> = {}
      // Map: date (YYYY-MM-DD) → nombre de PR battus ce jour
      const prByDay: Record<string, number> = {}

      allLogs.forEach((log) => {
        const day = new Date(log.created_at).toISOString().split('T')[0]
        const prev = maxByExercise[log.exercise_id] || 0

        if (log.weight_used > prev) {
          // Nouveau PR (sauf le tout premier log d'un exercice, qui est un "PR" initial)
          if (prev > 0) {
            prByDay[day] = (prByDay[day] || 0) + 1
          }
          maxByExercise[log.exercise_id] = log.weight_used
        }
      })

      // Mapper les PR par completed_workout id
      const counts: Record<string, number> = {}
      completedWorkouts.forEach((cw) => {
        const day = new Date(cw.completed_at).toISOString().split('T')[0]
        counts[cw.id] = prByDay[day] || 0
      })

      setPrCounts(counts)
    } catch (err) {
      console.error('Erreur computePRCounts:', err)
    }
  }

  return (
    <DarkLayout scrollable hideTabBar className="overflow-x-hidden pb-40">

      {/* ==================== TOP BAR — fixed : safe-area géré par son propre padding ==================== */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-[#0c0c0c]/90 backdrop-blur-sm px-[16px] pt-2 pb-[16px] safe-area-top">
        <div className="relative flex items-center justify-center">
          <button
            onClick={() => navigate('/profile')}
            className="absolute left-0 bg-[#1b1d1f] p-[12px] rounded-[24px] flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Retour au profil"
          >
            <ChevronLeft size={16} className="text-bg-1" />
          </button>
          <h1 className="font-serif font-bold text-[20px] text-bg-1 tracking-[-0.6px]">
            Toutes mes séances
          </h1>
        </div>
      </div>

      {/* ==================== CONTENU ==================== */}
      <div className="px-[16px] pt-[120px] flex flex-col gap-[16px]">

        {loading && (
          <div className="flex items-center justify-center pt-[40px]">
            <span className="text-tx-3 text-[14px]">Chargement...</span>
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="bg-[#1b1d1f] rounded-[16px] h-[100px] flex items-center justify-center">
            <p className="text-tx-3 text-[14px]">Aucune séance terminée</p>
          </div>
        )}

        {!loading && sessions.map((session) => (
          <SessionCard
            key={session.id}
            title={session.workouts?.title || 'Séance'}
            date={session.completed_at}
            durationMin={session.duration_min || session.workouts?.duration_min || 0}
            exerciseCount={session.workouts?.workout_exercises?.length ?? 0}
            calories={session.calories || 0}
            prCount={prCounts[session.id] || 0}
          />
        ))}
      </div>
    </DarkLayout>
  )
}
