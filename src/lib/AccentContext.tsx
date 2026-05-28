// @ts-nocheck
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from './supabaseClient'
import { CATEGORY_ACCENT, DEFAULT_ACCENT } from './categoryColors'

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
  accent: DEFAULT_ACCENT,
  mode: 'default',
  isBBL: false,
})

/** Couleurs d'accent selon le mode (dérivées de la source unique categoryColors) */
const ACCENT_COLORS: Record<AccentMode, string> = {
  default: DEFAULT_ACCENT,
  bbl: CATEGORY_ACCENT.bbl,
}

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
        .select('workout_id, source, workouts(category), user_workouts(category)')
        .eq('user_id', user.id)
        .eq('day_of_week', todayDow)
        .maybeSingle()

      const cat = plan?.workouts?.category || plan?.user_workouts?.category
      if (cat === 'bbl') {
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
