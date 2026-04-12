// @ts-nocheck
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from './supabaseClient'

type AccentMode = 'default' | 'bbl'

interface AccentContextType {
  /** Couleur d'accent active : jaune par défaut, rose si BBL */
  accent: string
  /** Mode actif */
  mode: AccentMode
  /** true si on est en mode BBL */
  isBBL: boolean
}

const AccentContext = createContext<AccentContextType>({
  accent: '#ffee8c',
  mode: 'default',
  isBBL: false,
})

/** Couleurs d'accent selon le mode */
const ACCENT_COLORS: Record<AccentMode, string> = {
  default: '#ffee8c',
  bbl: '#FF69B4',
}

/** Couleurs par catégorie pour les checkboxes jours */
export const CATEGORY_COLORS = {
  upper: { bg: '#ffee8c', glow: 'rgba(255,238,140,0.4)', text: '#ffee8c' },
  lower: { bg: '#507fff', glow: 'rgba(34,89,255,0.4)', text: '#507fff' },
  bbl: { bg: '#FF69B4', glow: 'rgba(255,105,180,0.4)', text: '#FF69B4' },
} as const

export function AccentProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AccentMode>('default')

  useEffect(() => {
    checkTodayWorkout()
  }, [])

  async function checkTodayWorkout() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const todayDow = (new Date().getDay() + 6) % 7 // 0=Lun, 6=Dim
      const { data: plan } = await supabase
        .from('workout_plan')
        .select('workout_id, workouts(category)')
        .eq('user_id', user.id)
        .eq('day_of_week', todayDow)
        .single()

      if (plan?.workouts?.category === 'bbl') {
        setMode('bbl')
      }
    } catch {
      // pas de séance ou pas connecté
    }
  }

  const value: AccentContextType = {
    accent: ACCENT_COLORS[mode],
    mode,
    isBBL: mode === 'bbl',
  }

  return (
    <AccentContext.Provider value={value}>
      {children}
    </AccentContext.Provider>
  )
}

/** Hook pour accéder à la couleur d'accent */
export function useAccent() {
  return useContext(AccentContext)
}
