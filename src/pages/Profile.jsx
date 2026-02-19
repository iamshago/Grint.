import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, LineChart, Line } from 'recharts'
import { ArrowLeft, MoreHorizontal, Flame, Trophy, Calendar as CalendarIcon, Timer, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

// --- 1. VUE CALORIES ---
const CaloriesView = ({ data, totalKcal }) => (
  <div className="h-full flex flex-col justify-between animate-in fade-in duration-500">
    <div className="mb-2">
      <div className="text-4xl font-black text-white tracking-tight flex items-baseline gap-2">
        {totalKcal.toLocaleString()} <span className="text-lg text-[#CCFF00] font-bold">Kcal</span>
      </div>
      <p className="text-xs text-gray-500 font-bold uppercase mt-1 tracking-wider">
        Dépense sur 7 jours
      </p>
    </div>
    <div className="h-48 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={14}>
          <RechartsTooltip 
            cursor={{fill: 'rgba(204, 255, 0, 0.1)', radius: 4}}
            contentStyle={{backgroundColor: '#1C1C1E', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}
            formatter={(val) => [`${val} Kcal`]}
            labelStyle={{display: 'none'}}
            itemStyle={{color: '#CCFF00', fontWeight: 'bold'}}
          />
          <XAxis 
            dataKey="day" 
            axisLine={false} 
            tickLine={false} 
            tick={{fill: '#666', fontSize: 11, fontWeight: 'bold'}} 
            dy={10}
          />
          <Bar dataKey="calories" radius={[20, 20, 20, 20]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.calories > 0 ? '#CCFF00' : '#2C2C2E'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)

// --- 2. VUE PRs ---
const PRsView = ({ exercises, history }) => {
  const [selectedExId, setSelectedExId] = useState(null)
  const [chartData, setChartData] = useState([])
  const [currentPR, setCurrentPR] = useState(0)

  useEffect(() => {
    if (exercises.length > 0 && !selectedExId) setSelectedExId(exercises[0].id)
  }, [exercises])

  useEffect(() => {
    if (!selectedExId || history.length === 0) return
    const logs = history.filter(h => h.exercise_id === selectedExId)
    
    if (logs.length > 0) {
      const max = Math.max(...logs.map(l => l.weight_used))
      setCurrentPR(max)
      setChartData(logs.map(log => ({
        date: new Date(log.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        weight: log.weight_used
      })))
    } else {
      setCurrentPR(0)
      setChartData([])
    }
  }, [selectedExId, history])

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      {/* Sélecteur de pilules (Sous-catégories) */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-2 mask-linear-gradient">
        {exercises.map(ex => (
          <button
            key={ex.id}
            onClick={() => setSelectedExId(ex.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-bold transition-all border shrink-0 ${
              selectedExId === ex.id 
                ? 'bg-[#CCFF00] text-black border-[#CCFF00]' 
                : 'bg-transparent text-gray-500 border-white/10'
            }`}
          >
            {ex.name}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-end relative">
        <div className="absolute top-0 left-0">
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-1 tracking-widest">Record Actuel</p>
          <div className="text-4xl font-black text-white">{currentPR} <span className="text-lg text-[#CCFF00]">KG</span></div>
        </div>

        <div className="h-32 w-full mt-auto">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <RechartsTooltip 
                  contentStyle={{backgroundColor: '#1C1C1E', border: 'none', borderRadius: '8px'}}
                  itemStyle={{color: '#CCFF00'}}
                  labelStyle={{display:'none'}}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#CCFF00" 
                  strokeWidth={3} 
                  dot={{fill: '#1C1C1E', stroke: '#CCFF00', strokeWidth: 2, r: 4}} 
                  activeDot={{r: 6, fill: '#fff'}}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-600">Pas encore de données</div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- 3. VUE FREQUENCY ---
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
    const d = new Date(year, currentDate.getMonth(), day)
    const dateStr = d.toLocaleDateString('en-CA') 
    return workoutDates.includes(dateStr)
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white capitalize text-lg">{monthName} {year}</h3>
        <div className="flex gap-1">
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-1 hover:bg-white/10 rounded-full text-gray-400"><ChevronLeft size={20}/></button>
          <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-1 hover:bg-white/10 rounded-full text-gray-400"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
          <span key={d} className="text-[10px] text-gray-600 font-black">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-3 gap-x-1 justify-items-center content-start">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const day = i + 1
          const active = isWorkoutDay(day)
          return (
            <div key={day} className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all ${active ? 'bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'text-gray-500'}`}>
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- PAGE PRINCIPALE ---
export default function Profile() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Calories') 
  const [loading, setLoading] = useState(true)
  
  // Données
  const [chartData, setChartData] = useState([])
  const [totalKcal, setTotalKcal] = useState(0)
  const [recentWorkouts, setRecentWorkouts] = useState([])
  const [fullHistory, setFullHistory] = useState([])
  const [exercisesList, setExercisesList] = useState([])
  const [workoutDates, setWorkoutDates] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)

      // 1. On récupère les logs de progression (Pour les Graphiques, PRs et Fréquence)
      const { data: logs, error } = await supabase
        .from('user_progress')
        .select(`*, exercise:exercises(*)`)
        .order('created_at', { ascending: true })

      if (error) throw error

      // 2. NOUVEAU : On récupère la table des VRAIES séances terminées
      const { data: completedSessions, error: compError } = await supabase
        .from('completed_workouts')
        .select('*, workouts(title)')
        .order('completed_at', { ascending: false })
        .limit(10)

      if (compError) throw compError

      if (logs) {
        setFullHistory(logs)

        // --- Dates de fréquence ---
        const dates = [...new Set(logs.map(log => new Date(log.created_at).toLocaleDateString('en-CA')))]
        setWorkoutDates(dates)

        // --- Liste d'Exercices ---
        const priority = ['Squat', 'Bench Press', 'Deadlift', 'Hip Thrust']
        const uniqueExIds = [...new Set(logs.map(p => p.exercise?.id).filter(Boolean))]
        const uniqueExs = uniqueExIds.map(id => {
          const name = logs.find(p => p.exercise_id === id).exercise.name
          return { id, name }
        }).sort((a, b) => {
           const pA = priority.indexOf(a.name); const pB = priority.indexOf(b.name);
           if (pA !== -1 && pB !== -1) return pA - pB
           if (pA !== -1) return -1
           if (pB !== -1) return 1
           return a.name.localeCompare(b.name)
        })
        setExercisesList(uniqueExs)

        // --- Calories (Graphique à barres) ---
        const last7Days = []
        let weeklySum = 0
        const now = new Date()
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now)
          d.setDate(d.getDate() - i)
          const dateStr = d.toLocaleDateString('en-CA')
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3) 
          
          const dailyLogs = logs.filter(l => new Date(l.created_at).toLocaleDateString('en-CA') === dateStr)
          let dailyCals = 0
          dailyLogs.forEach(l => {
             const factor = l.exercise?.calorie_factor || 0.015
             dailyCals += (l.weight_used * l.reps_done * factor)
          })
          weeklySum += dailyCals
          last7Days.push({ day: dayName, calories: Math.round(dailyCals) })
        }
        setChartData(last7Days)
        setTotalKcal(Math.round(weeklySum))

        // --- RECENT WORKOUTS (Mis à jour avec la nouvelle table) ---
        if (completedSessions) {
            const formattedRecents = completedSessions.map(session => {
                // On cherche s'il y a eu des PRs enregistrés ce jour là
                const sessionDateStr = new Date(session.completed_at).toLocaleDateString('en-CA')
                const prCount = logs.filter(l => 
                    new Date(l.created_at).toLocaleDateString('en-CA') === sessionDateStr && 
                    l.notes && l.notes.includes("PR")
                ).length

                return {
                    id: session.id,
                    title: session.workouts?.title || 'Séance Supprimée',
                    date: new Date(session.completed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).toUpperCase(),
                    calories: session.calories || 0,
                    duration: session.duration_min || 0,
                    prs: prCount,
                    isBBL: (session.workouts?.title || '').toUpperCase().includes('BBL')
                }
            })
            setRecentWorkouts(formattedRecents)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans selection:bg-[#CCFF00] selection:text-black">
      
     {/* HEADER */}
      <div className="px-6 pt-12 pb-6 flex justify-between items-center sticky top-0 z-20 bg-black/80 backdrop-blur-md">
        <button onClick={() => navigate('/')} className="w-10 h-10 bg-[#1C1C1E] rounded-full flex items-center justify-center border border-white/10 active:scale-95 transition-transform">
          <ArrowLeft size={20} />
        </button>
        
        <h1 className="text-xl font-bold tracking-wide">My Statistic</h1>
        
        <button onClick={() => navigate('/settings')} className="w-10 h-10 bg-[#1C1C1E] rounded-full flex items-center justify-center border border-white/10 active:scale-95 transition-transform">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="px-6 space-y-6">

        {/* --- CARTE PRINCIPALE --- */}
        <div className="bg-[#1C1C1E] p-6 rounded-[32px] border border-white/5 shadow-2xl relative overflow-hidden h-[400px] flex flex-col">
          
          <div className="flex items-center gap-3 mb-2 overflow-x-auto no-scrollbar shrink-0 -mx-6 px-6 py-4">
            {['Calories', 'PRs', 'Frequency'].map(tab => {
                const isActive = activeTab === tab
                return (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 rounded-full text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap ${
                      isActive 
                        ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_0_10px_rgba(204,255,0,0.3)]' 
                        : 'bg-black/30 text-gray-400 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {tab === 'Calories' && <Flame size={14} fill={isActive ? "black" : "none"} />}
                    {tab === 'PRs' && <Trophy size={14} fill={isActive ? "black" : "none"} />}
                    {tab === 'Frequency' && <CalendarIcon size={14} />}
                    {tab}
                  </button>
                )
            })}
             <div className="w-1 shrink-0"></div>
          </div>

          <div className="flex-1 overflow-hidden">
             {activeTab === 'Calories' && <CaloriesView data={chartData} totalKcal={totalKcal} />}
             {activeTab === 'PRs' && <PRsView exercises={exercisesList} history={fullHistory} />}
             {activeTab === 'Frequency' && <FrequencyView workoutDates={workoutDates} />}
          </div>
        </div>

        {/* --- RECENT WORKOUTS --- */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Recent Workouts</h2>
            <button className="text-xs text-[#CCFF00] font-bold">See All</button>
          </div>

          <div className="space-y-4">
            {recentWorkouts.length === 0 && !loading && (
              <div className="text-center text-gray-500 py-6 text-sm">Pas encore d'historique de séance terminée.</div>
            )}

            {recentWorkouts.map((workout, i) => {
              // THÈME BBL DYNAMIQUE
              const cText = workout.isBBL ? 'text-pink-500' : 'text-[#CCFF00]'
              const cBgLight = workout.isBBL ? 'bg-pink-500/10 text-pink-500' : 'bg-[#CCFF00]/10 text-[#CCFF00]'
              const cBgSolid = workout.isBBL ? 'bg-pink-500 text-black' : 'bg-[#CCFF00] text-black'

              return (
                <div key={workout.id || i} className="bg-[#1C1C1E] p-5 rounded-[24px] border border-white/5 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white text-base">{workout.title}</h3>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">{workout.date}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <Timer size={14} className={cText} />
                        <span>{workout.duration} min</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                        <TrendingUp size={14} className={cText} />
                        <span>Vol. Élevé</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1">
                    <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${cBgLight}`}>
                          <Flame size={12} fill="currentColor" />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 block leading-none mb-0.5">Calories</span>
                          <span className="text-sm font-bold text-white leading-none">{workout.calories} Kcal</span>
                        </div>
                    </div>

                    {workout.prs > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${cBgSolid}`}>
                              <Trophy size={12} fill="currentColor" />
                          </div>
                          <div>
                              <span className="text-[10px] text-gray-500 block leading-none mb-0.5">Records</span>
                              <span className={`text-sm font-bold leading-none ${cText}`}>+{workout.prs} PR</span>
                          </div>
                        </div>
                    ) : (
                        <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-gray-500 font-bold">
                          Maintain
                        </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
      </div>

      <BottomNav />
    </div>
  )
}