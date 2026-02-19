import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Play, Clock, Dumbbell, Calendar, ChevronRight, Check, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  
  // --- NOUVEAU : ÉTATS POUR LE PROFIL ---
  const [userName, setUserName] = useState('Sarah')
  const [userMotto, setUserMotto] = useState('Prête à tout casser ?')

  const [todaysWorkout, setTodaysWorkout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isCompleted, setIsCompleted] = useState(false)

  // --- 1. CHARGEMENT DES PRÉFÉRENCES (Nom & Motto) ---
  useEffect(() => {
    const storedName = localStorage.getItem('userName')
    const storedMotto = localStorage.getItem('userMotto') // On peut l'utiliser plus tard si tu veux l'afficher
    if (storedName) setUserName(storedName)
    if (storedMotto) setUserMotto(storedMotto)
  }, [])

  // --- 2. GESTION DU CALENDRIER ---
  const [selectedDate, setSelectedDate] = useState(new Date())
  const selectedDayIndex = selectedDate.getDay() 
  
  const now = new Date()
  const currentDayOfWeek = now.getDay()
  const diffToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
  const mondayDate = new Date(now)
  mondayDate.setDate(now.getDate() - diffToMonday)

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(mondayDate)
    d.setDate(mondayDate.getDate() + i)
    return {
      dateObj: d,
      dayName: d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
      dayNumber: d.getDate(),
      isSelected: d.toDateString() === selectedDate.toDateString(),
      isToday: d.toDateString() === now.toDateString()
    }
  })

  const headerDate = selectedDate.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  })

  // --- 3. RÉCUPÉRATION SÉANCE & STATUS ---
  useEffect(() => {
    getWorkoutAndStatus()
  }, [selectedDate])

  async function getWorkoutAndStatus() {
    try {
      setLoading(true)
      setIsCompleted(false)
      setTodaysWorkout(null)

      const { data: planData, error: planError } = await supabase
        .from('workout_plan')
        .select(`workout_id, workouts (*, workout_exercises(exercise_id))`)
        .eq('day_of_week', selectedDayIndex)
        .maybeSingle()

      if (planError) throw planError

      if (planData && planData.workouts) {
        setTodaysWorkout(planData.workouts)

        // Vérification si terminé
        const dateStr = selectedDate.toISOString().split('T')[0]
        const exerciseIds = planData.workouts.workout_exercises.map(we => we.exercise_id)
        
        if (exerciseIds.length > 0) {
            const { data: logs } = await supabase
                .from('user_progress')
                .select('id')
                .in('exercise_id', exerciseIds)
                .gte('created_at', `${dateStr}T00:00:00`)
                .lte('created_at', `${dateStr}T23:59:59`)
                .limit(1)

            if (logs && logs.length > 0) setIsCompleted(true)
        }
      }
    } catch (error) {
      console.log("Erreur:", error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans pb-24">
      
      {/* HEADER DYNAMIQUE */}
      <div className="p-6 pt-12 flex justify-between items-center">
        <div>
          {/* Ici on utilise la variable userName */}
          <h1 className="text-3xl font-bold text-white">Hello {userName} !</h1>
          <p className="text-gray-400 text-sm uppercase tracking-wider font-bold mt-1 capitalize">
            {headerDate}
          </p>
        </div>
        <div className="w-12 h-12 bg-dark-800 rounded-2xl border border-dark-700 flex items-center justify-center overflow-hidden">
           {/* L'avatar change aussi selon le nom */}
           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="Avatar" className="w-full h-full" />
        </div>
      </div>

      {/* CALENDRIER */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-bold mb-4 text-gray-200">Planning</h2>
        <div className="flex justify-between">
          {weekDays.map((d, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedDate(d.dateObj)}
              className={`flex flex-col items-center justify-center w-11 h-20 rounded-2xl border transition-all cursor-pointer ${
                d.isSelected 
                  ? 'bg-neon text-dark-900 border-neon shadow-lg shadow-neon/20 transform scale-105' 
                  : 'bg-dark-800 border-dark-700 text-gray-500 hover:border-gray-500'
              }`}
            >
              <span className="text-[10px] font-bold uppercase mb-1 opacity-80">{d.dayName}</span>
              <span className="text-xl font-black">{d.dayNumber}</span>
              {d.isToday && !d.isSelected && <div className="w-1 h-1 bg-neon rounded-full mt-1"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* BOUTON GÉRER */}
      <div className="px-6 mb-6">
          <div 
            onClick={() => navigate('/program')} 
            className="bg-dark-800 p-4 rounded-3xl border border-dashed border-dark-600 flex items-center justify-between group cursor-pointer hover:border-neon transition-colors"
          >
              <div className="flex items-center gap-4">
                <div className="bg-neon/10 p-3 rounded-2xl text-neon">
                    <Calendar size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm">Gérer mon planning</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Modifier la semaine</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-600 group-hover:text-neon" />
          </div>
      </div>

      {/* SÉANCE DU JOUR */}
      <div className="px-6">
        <h2 className="text-lg font-bold mb-4 text-gray-200">
            {selectedDate.toDateString() === now.toDateString() ? "Séance du jour" : `Prévu ce ${selectedDate.toLocaleDateString('fr-FR', {weekday:'long'})}`}
        </h2>
        
        {loading ? (
          <div className="h-64 bg-dark-800 rounded-3xl animate-pulse flex items-center justify-center text-gray-500">Chargement...</div>
        ) : todaysWorkout ? (
          <div className={`bg-dark-800 rounded-3xl p-6 relative overflow-hidden border border-dark-700 transition-all ${
              isCompleted 
                ? 'shadow-[0_0_40px_rgba(204,255,0,0.05)]' 
                : 'shadow-2xl'
          }`}>
            
            {/* BADGE CHECK */}
            {isCompleted && (
                <div className="absolute top-4 right-4 w-8 h-8 bg-neon text-dark-900 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                    <Check size={18} strokeWidth={4} />
                </div>
            )}

            <div className="relative z-10">
              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border tracking-widest ${
                  isCompleted 
                    ? 'bg-neon text-dark-900 border-neon' 
                    : 'bg-neon/20 text-neon border-neon/20'
              }`}>
                {isCompleted ? 'TERMINÉ' : (todaysWorkout.difficulty || 'INTENSE')}
              </span>
              
              <h2 className="text-3xl font-black mt-4 mb-2 text-white italic uppercase tracking-tighter">{todaysWorkout.title}</h2>
              
              <div className="flex items-center gap-6 text-gray-400 text-xs font-bold mb-8">
                <span className="flex items-center gap-2"><Clock size={16} className="text-neon" /> {todaysWorkout.duration_min} MIN</span>
                <span className="flex items-center gap-2"><Dumbbell size={16} className="text-neon" /> MUSCULATION</span>
              </div>

              {/* BOUTON DYNAMIQUE */}
              <button 
                onClick={() => navigate(`/workout/${todaysWorkout.id}`)}
                className={`w-full font-black py-4 rounded-2xl flex items-center justify-between px-6 active:scale-95 transition-transform shadow-lg ${
                    isCompleted
                        ? 'bg-transparent border-2 border-neon text-neon hover:bg-neon hover:text-dark-900' 
                        : 'bg-neon text-dark-900 hover:bg-neon-hover shadow-neon/20' 
                }`}
              >
                <span>{isCompleted ? 'REVOIR LA SÉANCE' : 'COMMENCER'}</span>
                <div className={`${isCompleted ? 'bg-neon/10' : 'bg-dark-900/10'} p-2 rounded-full`}>
                  {isCompleted ? <RotateCcw size={20} /> : <Play size={20} fill="currentColor" />}
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-dark-800/50 rounded-3xl p-10 text-center border border-dark-700">
            <p className="text-gray-400 font-medium text-sm mb-2">Rien de prévu pour ce jour.</p>
            <p className="text-xs text-gray-600 mb-6">Repos ou ajoute une séance manuellement.</p>
            <button 
                onClick={() => navigate('/program')}
                className="text-neon text-xs font-bold uppercase tracking-widest underline hover:text-white transition-colors"
            >
                Choisir une séance
            </button>
          </div>
        )}
      </div>
    </div>
  )
}