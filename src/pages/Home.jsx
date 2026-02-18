import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Play, Clock, Dumbbell } from 'lucide-react'
import { useNavigate } from 'react-router-dom' // Pour changer de page

export default function Home() {
  const navigate = useNavigate() // Le GPS de l'app
  const [todaysWorkout, setTodaysWorkout] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTodaysWorkout()
  }, [])

  async function getTodaysWorkout() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .limit(1)
        .single()

      if (error) throw error
      if (data) setTodaysWorkout(data)
    } catch (error) {
      console.log("Erreur:", error.message)
    } finally {
      setLoading(false)
    }
  }

  // Jours fictifs pour le design
  const days = [
    { day: 'Lun', date: '09' }, { day: 'Mar', date: '10' }, 
    { day: 'Mer', date: '11', active: true },
    { day: 'Jeu', date: '12' }, { day: 'Ven', date: '13' }
  ]

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans pb-20">
      {/* HEADER */}
      <div className="p-6 pt-12 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-neon">Hi! Sarah</h1>
          <p className="text-gray-400 text-sm">Prête à tout casser ?</p>
        </div>
        <div className="w-10 h-10 bg-dark-800 rounded-full border-2 border-neon overflow-hidden">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Avatar" />
        </div>
      </div>

      {/* CALENDRIER */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Planning</h2>
        <div className="flex justify-between">
          {days.map((d, i) => (
            <div key={i} className={`flex flex-col items-center justify-center w-14 h-20 rounded-2xl border ${d.active ? 'bg-neon text-dark-900 border-neon' : 'bg-dark-800 border-dark-700 text-gray-400'}`}>
              <span className="text-xs font-medium mb-1">{d.day}</span>
              <span className="text-lg font-bold">{d.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PROGRAMME DU JOUR */}
      <div className="px-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Séance du jour</h2>
        
        {loading ? (
          <div className="h-64 bg-dark-800 rounded-3xl animate-pulse flex items-center justify-center text-gray-500">Chargement...</div>
        ) : todaysWorkout ? (
          <div className="bg-dark-800 rounded-3xl p-6 relative overflow-hidden border border-dark-700 shadow-2xl shadow-neon/10">
            <div className="relative z-10">
              <span className="bg-neon/20 text-neon text-xs font-bold px-3 py-1 rounded-full uppercase border border-neon/20">
                {todaysWorkout.day_name}
              </span>
              <h2 className="text-4xl font-bold mt-4 mb-2 text-white">{todaysWorkout.title}</h2>
              <div className="flex items-center gap-6 text-gray-400 text-sm mb-8">
                <span className="flex items-center gap-2"><Clock size={16} className="text-neon" /> {todaysWorkout.duration_min} min</span>
                <span className="flex items-center gap-2"><Dumbbell size={16} className="text-neon" /> Hypertrophie</span>
              </div>

              {/* C'est ici que ça change : On active la navigation vers la page workout */}
              <button 
                onClick={() => navigate(`/workout/${todaysWorkout.id}`)}
                className="w-full bg-neon text-dark-900 font-black py-4 rounded-2xl flex items-center justify-between px-6 hover:bg-neon-hover transition-transform active:scale-95"
              >
                <span>COMMENCER</span>
                <div className="bg-dark-900/10 p-2 rounded-full">
                  <Play size={24} fill="currentColor" />
                </div>
              </button>
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-neon/10 rounded-full blur-3xl"></div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">Pas de séance aujourd'hui</div>
        )}
      </div>
    </div>
  )
}