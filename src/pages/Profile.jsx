import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { ChevronLeft, ChevronRight, Trophy, Flame, Calendar as CalendarIcon, Timer, Dumbbell, TrendingUp } from 'lucide-react'
import BottomNav from '../components/BottomNav'

// --- COMPOSANT : GRAPHIQUE CALORIES ---
const CaloriesView = ({ data, totalCalories }) => (
  <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 relative overflow-hidden h-80 flex flex-col justify-between shadow-xl">
    <div className="flex justify-between items-start z-10">
      <div>
        <div className="text-3xl font-black text-white">
          {totalCalories.toLocaleString()} <span className="text-sm font-medium text-gray-400">Kcal</span>
        </div>
        <p className="text-xs text-gray-500 font-bold uppercase mt-1">Last 7 Days (Calculé)</p>
      </div>
      <div className="bg-neon/10 p-2 rounded-full text-neon">
        <Flame size={24} fill="currentColor" />
      </div>
    </div>

    <div className="h-40 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Bar dataKey="calories" radius={[6, 6, 6, 6]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.active ? '#CCFF00' : '#333'} />
            ))}
          </Bar>
          <Tooltip 
            cursor={{fill: 'transparent'}}
            contentStyle={{backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.8)'}}
            itemStyle={{color: '#CCFF00', fontWeight: 'bold'}}
            formatter={(value) => [`${Math.round(value)} Kcal`]}
            labelStyle={{display: 'none'}}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
    
    <div className="flex justify-between mt-2 px-1">
      {data.map((d, i) => (
        <span key={i} className={`text-[10px] font-bold ${d.active ? 'text-white' : 'text-gray-600'}`}>
          {d.day}
        </span>
      ))}
    </div>
  </div>
)

// --- COMPOSANT : CALENDRIER ---
const FrequencyView = ({ workoutDates }) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const days = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1 
    return { days, firstDay: adjustedFirstDay }
  }

  const { days, firstDay } = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleString('default', { month: 'long' })
  const year = currentDate.getFullYear()

  const isWorkoutDay = (day) => {
    const checkDate = new Date(year, currentDate.getMonth(), day).toISOString().split('T')[0]
    return workoutDates.includes(checkDate)
  }

  return (
    <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 h-80 shadow-xl flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-white capitalize text-lg">{monthName} {year}</h3>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-dark-700 rounded-full text-gray-400"><ChevronLeft size={20}/></button>
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-dark-700 rounded-full text-gray-400"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center mb-4">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
          <span key={d} className="text-xs text-gray-500 font-bold">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 justify-items-center flex-1 content-start">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1
          const active = isWorkoutDay(day)
          return (
            <div key={day} className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all ${active ? 'bg-neon text-dark-900 shadow-lg shadow-neon/30 scale-110' : 'text-gray-500 bg-dark-900/50'}`}>
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- COMPOSANT : PRs ---
const PRSView = ({ exercises, history }) => {
  const [selectedExId, setSelectedExId] = useState(null)
  const [chartData, setChartData] = useState([])
  const [prValue, setPrValue] = useState(0)

  useEffect(() => {
    if (exercises.length > 0 && !selectedExId) setSelectedExId(exercises[0].id)
  }, [exercises])

  useEffect(() => {
    if (!selectedExId || history.length === 0) return
    const logs = history.filter(h => h.exercise_id === selectedExId)
    if (logs.length > 0) {
      setPrValue(Math.max(...logs.map(l => l.weight_used)))
      setChartData(logs.map(log => ({
        date: new Date(log.created_at).toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit'}),
        weight: log.weight_used
      })))
    } else {
      setPrValue(0)
      setChartData([])
    }
  }, [selectedExId, history])

  return (
    <div className="bg-dark-800 p-6 rounded-3xl border border-dark-700 h-80 flex flex-col shadow-xl">
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
        {exercises.map(ex => (
          <button
            key={ex.id}
            onClick={() => setSelectedExId(ex.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedExId === ex.id ? 'bg-white text-dark-900' : 'bg-dark-900 text-gray-500'
            }`}
          >
            {ex.name}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-end relative">
        <div className="absolute top-0 left-0">
          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Current Record</p>
          <div className="text-4xl font-black text-neon">{prValue} <span className="text-lg text-white">KG</span></div>
        </div>

        <div className="h-32 -mx-2 mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line type="monotone" dataKey="weight" stroke="#CCFF00" strokeWidth={3} dot={{fill:'#CCFF00', r:3}} />
              <Tooltip contentStyle={{backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px'}} itemStyle={{color: '#CCFF00'}} labelStyle={{display:'none'}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// --- PAGE PRINCIPALE ---
export default function Profile() {
  const [activeTab, setActiveTab] = useState('calories') 
  const [history, setHistory] = useState([])
  const [exercisesList, setExercisesList] = useState([])
  const [workoutDates, setWorkoutDates] = useState([])
  const [recentWorkouts, setRecentWorkouts] = useState([])
  const [caloriesData, setCaloriesData] = useState([])
  const [totalWeeklyCalories, setTotalWeeklyCalories] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      // 1. Récupérer l'historique AVEC le calorie_factor
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*, exercise:exercises(id, name, calorie_factor)')
        .order('created_at', { ascending: true })

      // 2. Récupérer les programmes
      const { data: workoutsData } = await supabase
        .from('workouts')
        .select('id, title, workout_exercises(exercise_id)')

      if (progressData) {
        setHistory(progressData)
        
        // Liste unique des exos triée
        const priority = ['Squat', 'Bench Press', 'Deadlift', 'Hip Thrust']
        const uniqueExIds = [...new Set(progressData.map(p => p.exercise?.id).filter(Boolean))]
        const uniqueExs = uniqueExIds.map(id => {
          const name = progressData.find(p => p.exercise_id === id).exercise.name
          return { id, name }
        }).sort((a, b) => {
           const pA = priority.indexOf(a.name); const pB = priority.indexOf(b.name);
           if (pA !== -1 && pB !== -1) return pA - pB
           if (pA !== -1) return -1
           if (pB !== -1) return 1
           return a.name.localeCompare(b.name)
        })
        setExercisesList(uniqueExs)

        // Dates Uniques
        const dates = [...new Set(progressData.map(log => log.created_at.split('T')[0]))]
        setWorkoutDates(dates)

        // --- CALCUL DES CALORIES RÉEL (Last 7 Days) ---
        const last7Days = []
        let weeklySum = 0
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(d.getDate() - i)
          const dateStr = d.toISOString().split('T')[0]
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3)
          
          // On cherche tous les logs de ce jour
          const dailyLogs = progressData.filter(log => log.created_at.startsWith(dateStr))
          
          // Formule: Poids * Reps * Coefficient
          let dailyCalories = 0
          dailyLogs.forEach(log => {
             const factor = log.exercise.calorie_factor || 0.015 // Valeur par défaut si null
             dailyCalories += (log.weight_used * log.reps_done * factor)
          })
          
          last7Days.push({ day: dayName, calories: Math.round(dailyCalories), active: dailyCalories > 0 })
          weeklySum += dailyCalories
        }
        setCaloriesData(last7Days)
        setTotalWeeklyCalories(Math.round(weeklySum))

        // --- LOGIQUE RECENT WORKOUTS & PR DETECTION ---
        const grouped = {}
        progressData.forEach(log => {
          const date = log.created_at.split('T')[0]
          if (!grouped[date]) {
             grouped[date] = { date, logs: [] }
          }
          grouped[date].logs.push(log)
        })

        // On transforme l'objet groupé en tableau trié (récent d'abord)
        const recent = Object.values(grouped)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5) 
          .map(session => {
             // 1. Trouver le titre
             let title = "Entraînement Libre"
             if (workoutsData) {
               const sessionExIds = new Set(session.logs.map(l => l.exercise_id))
               let bestMatch = null
               let maxMatches = 0
               workoutsData.forEach(w => {
                 const wExIds = w.workout_exercises.map(we => we.exercise_id)
                 const matches = Array.from(sessionExIds).filter(id => wExIds.includes(id)).length
                 if (matches > maxMatches) {
                   maxMatches = matches
                   bestMatch = w
                 }
               })
               if (bestMatch && maxMatches > 0) title = bestMatch.title
             }

             // 2. Calculer les calories de la séance
             let sessionCalories = 0
             session.logs.forEach(log => {
                const factor = log.exercise.calorie_factor || 0.015
                sessionCalories += (log.weight_used * log.reps_done * factor)
             })

             // 3. Détecter si c'est un PR
             // Pour chaque log de cette séance, on regarde si le poids > max historique AVANT cette séance
             let isPr = false
             session.logs.forEach(log => {
                // On cherche les logs du même exo, mais AVANT cette date
                const previousLogs = progressData.filter(p => 
                    p.exercise_id === log.exercise_id && 
                    new Date(p.created_at) < new Date(session.date) // Strictement avant ce jour
                )
                
                const previousMax = previousLogs.length > 0 
                    ? Math.max(...previousLogs.map(p => p.weight_used)) 
                    : 0
                
                if (log.weight_used > previousMax && previousMax > 0) {
                    isPr = true // On a battu un record historique !
                }
             })

             return {
               title,
               date: session.date,
               duration: Math.round(session.logs.length * 3.5), // ~3.5 min par set (effort + repos)
               calories: Math.round(sessionCalories),
               isPr: isPr
             }
          })
        setRecentWorkouts(recent)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <div className="min-h-screen bg-dark-900 flex items-center justify-center text-neon">Chargement...</div>

  return (
    <div className="min-h-screen bg-dark-900 text-white pb-24 font-sans">
      
      {/* HEADER */}
      <div className="px-6 pt-10 pb-6 flex justify-between items-center bg-dark-900 sticky top-0 z-20">
        <h1 className="text-2xl font-bold">My Statistic</h1>
        <button className="w-10 h-10 bg-dark-800 rounded-full flex items-center justify-center text-white border border-dark-700">
           <TrendingUp size={20} />
        </button>
      </div>

      {/* TABS */}
      <div className="px-6 mb-6">
        <div className="flex bg-dark-800 p-1 rounded-2xl border border-dark-700">
          {[
            { id: 'calories', label: 'Calories', icon: Flame },
            { id: 'frequency', label: 'Frequency', icon: CalendarIcon },
            { id: 'prs', label: 'PRs', icon: Trophy },
          ].map(tab => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-white text-dark-900 shadow-lg' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {isActive && <Icon size={16} className="text-neon" fill={tab.id === 'calories' ? "currentColor" : "none"} />}
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="px-6 mb-8 transition-all duration-300">
        {activeTab === 'calories' && <CaloriesView data={caloriesData} totalCalories={totalWeeklyCalories} />}
        {activeTab === 'frequency' && <FrequencyView workoutDates={workoutDates} />}
        {activeTab === 'prs' && <PRSView exercises={exercisesList} history={history} />}
      </div>

      {/* RECENT WORKOUTS */}
      <div className="px-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Recent Workouts</h2>
          <button className="text-xs text-neon font-bold">See All</button>
        </div>

        <div className="space-y-4">
          {recentWorkouts.map((workout, i) => (
            <div key={i} className="bg-dark-800 p-5 rounded-3xl border border-dark-700 flex flex-col gap-4 shadow-lg">
              
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-white">{workout.title}</h3>
                <span className="text-xs text-gray-500 font-medium">
                  {new Date(workout.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                </span>
              </div>

              <div className="flex items-center gap-4 text-gray-400 text-xs font-bold">
                 <span className="flex items-center gap-1 bg-dark-900/50 px-2 py-1 rounded-lg">
                   <Timer size={12} className="text-gray-300"/> {workout.duration} Min
                 </span>
                 <span className="flex items-center gap-1 bg-dark-900/50 px-2 py-1 rounded-lg">
                   <Dumbbell size={12} className="text-gray-300"/> Volume Load
                 </span>
              </div>

              <div className="flex items-center justify-between mt-1">
                 <div className="flex items-center gap-2">
                    <div className="bg-dark-900/80 p-2 rounded-full text-neon">
                        <Flame size={18} fill="currentColor"/>
                    </div>
                    <div>
                        <span className="text-xs text-gray-500 block">Burned</span>
                        <span className="text-sm font-bold text-white">{workout.calories} Kcal</span>
                    </div>
                 </div>

                 {/* LOGIQUE PR : On affiche le badge seulement si isPr est vrai */}
                 {workout.isPr ? (
                   <div className="bg-neon text-dark-900 px-3 py-1.5 rounded-lg text-xs font-black shadow-lg shadow-neon/20 flex items-center gap-1">
                     <Trophy size={12} /> NEW PR
                   </div>
                 ) : (
                    <div className="text-gray-600 text-xs font-bold px-3 py-1.5 border border-dark-600 rounded-lg">
                        Maintain
                    </div>
                 )}
              </div>

            </div>
          ))}
          
          {recentWorkouts.length === 0 && (
              <div className="text-center py-10 bg-dark-800 rounded-3xl border border-dashed border-dark-600">
                  <p className="text-gray-500 text-sm">Aucune séance récente.</p>
                  <p className="text-neon text-xs font-bold mt-2">Go train ! 💪</p>
              </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}