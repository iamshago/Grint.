import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Search, Clock, Zap, ArrowRight, Calendar, X } from 'lucide-react'
import BottomNav from '../components/BottomNav'

export default function Program() {
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const [filter, setFilter] = useState('All')
  
  // --- MODALE ---
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

  useEffect(() => {
    async function fetchWorkouts() {
      try {
        setLoading(true)
        // On récupère les workouts ET les exercices liés (pour compter le nombre d'exos)
        const { data, error } = await supabase
          .from('workouts')
          .select('*, workout_exercises(*)')
        
        if (error) throw error
        setWorkouts(data || [])
      } catch (err) {
        console.error("Erreur:", err)
        setErrorMsg(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchWorkouts()
  }, [])

  const handleSchedule = async (dayIndex) => {
    try {
      setSaving(true)
      // 1. Nettoyage : On supprime l'ancien programme de ce jour-là
      await supabase.from('workout_plan').delete().eq('day_of_week', dayIndex)
      
      // 2. Insertion : On ajoute le nouveau
      const { error } = await supabase.from('workout_plan').insert({
        day_of_week: dayIndex,
        workout_id: selectedWorkout.id
      })
      
      if (error) throw error

      setIsModalOpen(false)
      alert(`C'est noté ! ${selectedWorkout.title} prévu pour ${days[dayIndex]}.`)
    } catch (error) {
      alert("Erreur lors de la planification")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const openScheduleModal = (e, workout) => {
    e.stopPropagation() // Empêche d'ouvrir la séance quand on clique sur le calendrier
    setSelectedWorkout(workout)
    setIsModalOpen(true)
  }

  const getDifficultyColor = (diff) => {
    if (diff === 'Beginner') return 'text-green-400 border-green-400/30 bg-green-400/10'
    if (diff === 'Intermediate') return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
    return 'text-red-500 border-red-500/30 bg-red-500/10'
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white pb-24 font-sans relative">
      
      {/* HEADER */}
      <div className="p-6 pt-12 bg-dark-900 sticky top-0 z-20 border-b border-dark-800">
        <h1 className="text-3xl font-bold mb-6">Explore</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input type="text" placeholder="Rechercher..." className="w-full bg-dark-800 border border-dark-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon transition-colors" />
        </div>
      </div>

      {/* FILTRES (Décoratifs pour l'instant) */}
      <div className="px-6 py-4 flex gap-3 overflow-x-auto no-scrollbar">
        {['All', 'Strength', 'Cardio', 'Flexibility'].map(tag => (
          <button key={tag} onClick={() => setFilter(tag)} className={`px-5 py-2 rounded-full text-sm font-bold border transition-all whitespace-nowrap ${filter === tag ? 'bg-neon text-dark-900 border-neon' : 'bg-transparent text-gray-500 border-dark-700'}`}>
            {tag}
          </button>
        ))}
      </div>

      {/* LISTE DES PROGRAMMES */}
      <div className="px-6 space-y-6">
        {errorMsg && (
            <div className="p-4 bg-red-500/10 border border-red-500 text-red-500 rounded-xl text-center">
                Erreur technique : {errorMsg}
            </div>
        )}

        {loading ? (
          <div className="text-center text-gray-500 py-10">Chargement...</div>
        ) : workouts.length === 0 ? (
          <div className="text-center text-gray-500 py-10">Aucun programme trouvé.</div>
        ) : (
          workouts.map((workout) => (
          <div key={workout.id} onClick={() => navigate(`/workout/${workout.id}`)} className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer shadow-lg shadow-black/50 active:scale-95 transition-transform">
            <img src={workout.image_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=60'} alt={workout.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent"></div>

            {/* BOUTON PLANIFIER (Calendrier) */}
            <button 
              onClick={(e) => openScheduleModal(e, workout)} 
              className="absolute top-4 right-4 bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-neon hover:text-dark-900 border border-white/20 transition-colors z-10 shadow-lg"
            >
              <Calendar size={20} />
            </button>

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex justify-between items-end mb-2">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getDifficultyColor(workout.difficulty)}`}>
                  {workout.difficulty || 'General'}
                </span>
                <div className="bg-white/10 p-2 rounded-full text-white group-hover:bg-neon group-hover:text-dark-900 transition-colors">
                  <ArrowRight size={20} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{workout.title}</h3>
              <div className="flex items-center gap-4 text-gray-300 text-xs font-medium">
                <span className="flex items-center gap-1"><Clock size={14} className="text-neon" /> {workout.duration_min} min</span>
                {/* Sécurisation du compteur d'exos */}
                <span className="flex items-center gap-1"><Zap size={14} className="text-neon" /> {workout.workout_exercises?.length || 0} Exos</span>
              </div>
            </div>
          </div>
        )))}
      </div>

      {/* MODALE DE PLANIFICATION */}
      {isModalOpen && selectedWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-dark-800 w-full max-w-sm rounded-3xl border border-dark-700 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Planifier</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-dark-700 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            
            <p className="text-gray-400 text-sm mb-4">
              Quel jour veux-tu faire <span className="text-neon font-bold">{selectedWorkout.title}</span> ?
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {days.map((dayName, index) => (
                <button 
                  key={index} 
                  onClick={() => handleSchedule(index)} 
                  disabled={saving} 
                  className="bg-dark-900 border border-dark-700 py-3 rounded-xl text-xs font-bold uppercase hover:border-neon hover:text-neon transition-colors focus:bg-neon focus:text-dark-900"
                >
                  {dayName}
                </button>
              ))}
            </div>
            
            {saving && <p className="text-center text-neon text-xs animate-pulse font-bold">Enregistrement...</p>}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}