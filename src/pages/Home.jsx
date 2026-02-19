import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Play, Clock, Dumbbell, Calendar, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  const [todaysWorkout, setTodaysWorkout] = useState(null)
  const [loading, setLoading] = useState(true)

  // --- 1. GESTION DES DATES INTELLIGENTE ---
  const now = new Date()
  const currentDayIndex = now.getDay() // 0 = Dimanche, 1 = Lundi...
  
  // Générer la semaine en cours (Dimanche à Samedi)
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(now)
    // On recule jusqu'à Dimanche (currentDayIndex) puis on avance de i jours
    date.setDate(now.getDate() - currentDayIndex + i)
    
    return {
      dayName: date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''), // "Lun"
      dayNumber: date.getDate(), // 19
      isToday: i === currentDayIndex
    }
  })
  
  // Date complète pour le header
  const todayFullDate = now.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  })

  useEffect(() => {
    getScheduledWorkout()
  }, [currentDayIndex])

  async function getScheduledWorkout() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('workout_plan')
        .select(`workout_id, workouts (*)`)
        .eq('day_of_week', currentDayIndex)
        .maybeSingle()

      if (data && data.workouts) {
        setTodaysWorkout(data.workouts)
      } else {
        setTodaysWorkout(null)
      }
    } catch (error) {
      console.log("Erreur planning:", error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans pb-24">
      
      {/* HEADER */}
      <div className="p-6 pt-12 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Hello Sarah !</h1>
          <p className="text-gray-400 text-sm uppercase tracking-wider font-bold mt-1 capitalize">
            {todayFullDate}
          </p>
        </div>
        <div className="w-12 h-12 bg-dark-800 rounded-2xl border border-dark-700 flex items-center justify-center overflow-hidden">
           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Avatar" className="w-full h-full" />
        </div>
      </div>

      {/* CALENDRIER AVEC NUMÉROS */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-bold mb-4 text-gray-200">Planning</h2>
        <div className="flex justify-between">
          {weekDays.map((d, i) => (
            <div 
              key={i} 
              className={`flex flex-col items-center justify-center w-11 h-20 rounded-2xl border transition-all ${
                d.isToday 
                  ? 'bg-neon text-dark-900 border-neon shadow-lg shadow-neon/20 transform scale-105' 
                  : 'bg-dark-800 border-dark-700 text-gray-500'
              }`}
            >
              <span className="text-[10px] font-bold uppercase mb-1 opacity-80">{d.dayName}</span>
              <span className="text-xl font-black">{d.dayNumber}</span>
              {d.isToday && <div className="w-1 h-1 bg-dark-900 rounded-full mt-1"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* CARTE : GÉRER LE PLANNING */}
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
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Assigner mes séances</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-600 group-hover:text-neon" />
          </div>
      </div>

      {/* SÉANCE DU JOUR */}
      <div className="px-6">
        <h2 className="text-lg font-bold mb-4 text-gray-200">Séance du jour</h2>
        
        {loading ? (
          <div className="h-64 bg-dark-800 rounded-3xl animate-pulse flex items-center justify-center text-gray-500">Chargement...</div>
        ) : todaysWorkout ? (
          <div className="bg-dark-800 rounded-3xl p-6 relative overflow-hidden border border-dark-700 shadow-2xl">
            <div className="relative z-10">
              <span className="bg-neon/20 text-neon text-[10px] font-black px-3 py-1 rounded-full uppercase border border-neon/20 tracking-widest">
                {todaysWorkout.difficulty || 'INTENSE'}
              </span>
              <h2 className="text-3xl font-black mt-4 mb-2 text-white italic uppercase tracking-tighter">{todaysWorkout.title}</h2>
              <div className="flex items-center gap-6 text-gray-400 text-xs font-bold mb-8">
                <span className="flex items-center gap-2"><Clock size={16} className="text-neon" /> {todaysWorkout.duration_min} MIN</span>
                <span className="flex items-center gap-2"><Dumbbell size={16} className="text-neon" /> MUSCULATION</span>
              </div>

              <button 
                onClick={() => navigate(`/workout/${todaysWorkout.id}`)}
                className="w-full bg-neon text-dark-900 font-black py-4 rounded-2xl flex items-center justify-between px-6 active:scale-95 transition-transform shadow-lg shadow-neon/20"
              >
                <span>COMMENCER</span>
                <div className="bg-dark-900/10 p-2 rounded-full">
                  <Play size={20} fill="currentColor" />
                </div>
              </button>
            </div>
            {/* Image de fond subtile */}
            <img 
                src={todaysWorkout.image_url || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=60"} 
                className="absolute top-0 right-0 w-1/2 h-full object-cover opacity-20 mask-image-linear-gradient"
                alt="Bg"
            />
          </div>
        ) : (
          <div className="bg-dark-800/50 rounded-3xl p-10 text-center border border-dark-700">
            <p className="text-gray-400 font-medium text-sm mb-2">Aucune séance planifiée.</p>
            <p className="text-xs text-gray-600 mb-6">Aujourd'hui, c'est repos ou freestyle !</p>
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