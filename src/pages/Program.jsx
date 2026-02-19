import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Search, Clock, Zap, Calendar, X, ChevronLeft, Dumbbell, ArrowLeft } from 'lucide-react'

export default function Program() {
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  
  // --- NOUVEAU : Barre de recherche ---
  const [searchTerm, setSearchTerm] = useState('')

  // Filtres (On a ajouté Abdos)
  const [activeFilter, setActiveFilter] = useState('All')
  const filters = ['All', 'U/L', 'PPL', 'Upper', 'Lower', 'Abdos']

  const [previewWorkout, setPreviewWorkout] = useState(null)
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const weekDays = [
    { label: 'Lundi', value: 1 },
    { label: 'Mardi', value: 2 },
    { label: 'Mercredi', value: 3 },
    { label: 'Jeudi', value: 4 },
    { label: 'Vendredi', value: 5 },
    { label: 'Samedi', value: 6 },
    { label: 'Dimanche', value: 0 }
  ]

  useEffect(() => {
    async function fetchWorkouts() {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('workouts')
          .select(`*, workout_exercises (*, exercise:exercises (*))`)
        
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
      await supabase.from('workout_plan').delete().eq('day_of_week', dayIndex)
      
      const { error } = await supabase.from('workout_plan').insert({
        day_of_week: dayIndex,
        workout_id: selectedWorkout.id
      })
      
      if (error) throw error

      setIsModalOpen(false)
      setPreviewWorkout(null) 
      
      const dayName = weekDays.find(d => d.value === dayIndex).label
      alert(`C'est noté ! ${selectedWorkout.title} prévu pour ${dayName}.`)
    } catch (error) {
      alert("Erreur")
    } finally {
      setSaving(false)
    }
  }

  const openScheduleModal = (workout) => {
    setSelectedWorkout(workout)
    setIsModalOpen(true)
  }

  const getDifficultyColor = (diff) => {
    if (diff === 'Beginner') return 'text-green-400 border-green-400/30 bg-green-400/10'
    if (diff === 'Intermediate') return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
    return 'text-red-500 border-red-500/30 bg-red-500/10'
  }

  // --- LOGIQUE DE RECHERCHE, DE FILTRAGE ET DE TRI ---
  let processedWorkouts = workouts.filter(workout => {
    const title = workout.title.toLowerCase()
    const search = searchTerm.toLowerCase()

    // 1. Recherche par texte (Si on a tapé quelque chose)
    if (search && !title.includes(search)) return false

    // 2. Filtres par catégorie
    if (activeFilter === 'All') return true
    
    if (activeFilter === 'U/L') return title.includes('upper') || title.includes('lower')
    if (activeFilter === 'PPL') return title.includes('push') || title.includes('pull') || title.includes('leg')
    if (activeFilter === 'Upper') return title.includes('upper') || title.includes('push') || title.includes('pull')
    if (activeFilter === 'Lower') return title.includes('lower') || title.includes('leg') || title.includes('bbl')
    if (activeFilter === 'Abdos') return title.includes('abdos') || title.includes('circuit')
    
    return true
  })

  // 3. Tri sur-mesure demandé
  processedWorkouts.sort((a, b) => {
    const titleA = a.title.toLowerCase()
    const titleB = b.title.toLowerCase()

    // Fonction d'aide pour donner un "poids" (rank) selon la catégorie
    const getRank = (t) => {
      if (activeFilter === 'U/L') {
        if (t.includes('upper') && t.includes('men')) return 1
        if (t.includes('upper') && t.includes('women')) return 2
        if (t.includes('lower')) return 3
      }
      if (activeFilter === 'Upper') {
        if (t.includes('upper') && t.includes('women')) return 1
        if (t.includes('upper') && t.includes('men')) return 2
      }
      if (activeFilter === 'Lower') {
        if (t.includes('lower body')) return 1
        if (t.includes('bbl')) return 2
        if (t.includes('leg')) return 3
      }
      return 99 // Valeur par défaut pour les autres
    }

    // On trie par le rank calculé
    const rankA = getRank(titleA)
    const rankB = getRank(titleB)
    
    // Si ce n'est pas un cas spécifique de tri, on laisse l'ordre alphabétique normal
    if (rankA === 99 && rankB === 99) return titleA.localeCompare(titleB)
    
    return rankA - rankB
  })

  // Thème BBL pour la preview
  const isBBL = previewWorkout?.title?.toUpperCase().includes('BBL')
  const cText = isBBL ? 'text-pink-500' : 'text-neon'
  const cBg = isBBL ? 'bg-pink-500' : 'bg-neon'
  const cBgLight = isBBL ? 'bg-pink-500/10' : 'bg-neon/10'
  const cShadow = isBBL ? 'shadow-[0_0_20px_rgba(236,72,153,0.3)]' : 'shadow-[0_0_20px_rgba(204,255,0,0.3)]'

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans relative pb-6">
      
      <div className="p-6 pt-12 bg-dark-900 sticky top-0 z-20 border-b border-dark-800">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/')} className="w-10 h-10 bg-dark-800 rounded-full flex items-center justify-center border border-dark-700 active:scale-95 transition-transform hover:border-white/30">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold">Explore</h1>
        </div>

        {/* BARRE DE RECHERCHE CONNECTÉE */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher une séance..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-800 border border-dark-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-neon transition-colors" 
          />
          {/* Petit bouton pour effacer la recherche si on a tapé quelque chose */}
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={16} />
            </button>
          )}
        </div>

        {/* BARRE DE FILTRES */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6 mask-linear-gradient">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold transition-all border shrink-0 ${
                activeFilter === filter 
                  ? 'bg-neon text-dark-900 border-neon shadow-[0_0_15px_rgba(204,255,0,0.3)]' 
                  : 'bg-dark-800 text-gray-400 border-dark-700 hover:border-gray-500'
              }`}
            >
              {filter}
            </button>
          ))}
          <div className="w-1 shrink-0"></div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="text-center text-gray-500 py-10">Chargement...</div>
        ) : processedWorkouts.length === 0 ? (
          <div className="text-center text-gray-500 py-10">Aucune séance ne correspond.</div>
        ) : processedWorkouts.map((workout) => (
          
          <div 
            key={workout.id} 
            onClick={() => setPreviewWorkout(workout)} 
            className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer shadow-lg active:scale-95 transition-transform border border-dark-700 hover:border-dark-600"
          >
            <img src={workout.image_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=60'} alt={workout.title} className="absolute inset-0 w-full h-full object-cover opacity-50 transition-opacity" />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent"></div>

            <button 
              onClick={(e) => { e.stopPropagation(); openScheduleModal(workout) }} 
              className="absolute top-4 right-4 bg-dark-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-full flex items-center gap-2 border border-white/10 hover:border-neon transition-colors z-10"
            >
              <Calendar size={14} className={workout.title.toUpperCase().includes('BBL') ? 'text-pink-500' : 'text-neon'} />
              Planifier
            </button>

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border mb-3 inline-block ${getDifficultyColor(workout.difficulty)}`}>
                {workout.difficulty || 'General'}
              </span>
              <h3 className="text-2xl font-bold text-white mb-2 italic uppercase">{workout.title}</h3>
              <div className="flex items-center gap-4 text-gray-300 text-xs font-medium">
                <span className="flex items-center gap-1"><Clock size={14} className={workout.title.toUpperCase().includes('BBL') ? 'text-pink-500' : 'text-neon'} /> {workout.duration_min} min</span>
                <span className="flex items-center gap-1"><Zap size={14} className={workout.title.toUpperCase().includes('BBL') ? 'text-pink-500' : 'text-neon'} /> {workout.workout_exercises?.length || 0} Exos</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- ÉCRAN DE DÉTAIL --- */}
      {previewWorkout && (
        <div className="fixed inset-0 z-[100] bg-dark-900 flex flex-col animate-in slide-in-from-right-8 duration-200">
            <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                <div className="relative h-64">
                    <img src={previewWorkout.image_url} alt="Cover" className="w-full h-full object-cover opacity-40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent"></div>
                    <button onClick={() => setPreviewWorkout(null)} className="absolute top-12 left-6 w-10 h-10 bg-dark-800/80 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
                        <ChevronLeft size={20} />
                    </button>
                </div>

                <div className="px-6 -mt-10 relative z-10">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border mb-3 inline-block ${getDifficultyColor(previewWorkout.difficulty)}`}>
                        {previewWorkout.difficulty}
                    </span>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">{previewWorkout.title}</h2>
                    <p className="text-sm text-gray-400 mb-6">{previewWorkout.description}</p>
                    
                    <div className="flex items-center gap-6 mb-8 border-b border-white/10 pb-6">
                        <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-xl ${cBgLight} ${cText}`}><Clock size={18}/></div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Durée</p>
                                <p className="font-bold text-sm">{previewWorkout.duration_min} min</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-xl ${cBgLight} ${cText}`}><Dumbbell size={18}/></div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">Exercices</p>
                                <p className="font-bold text-sm">{previewWorkout.workout_exercises?.length || 0}</p>
                            </div>
                        </div>
                    </div>

                    <h3 className="font-bold text-lg mb-4">Programme</h3>
                    <div className="space-y-3">
                        {previewWorkout.workout_exercises?.sort((a,b) => a.order_index - b.order_index).map((exo, index) => (
                            <div key={index} className="bg-dark-800 p-4 rounded-2xl border border-dark-700 flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center font-black text-gray-400 text-xs shrink-0">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-white text-sm">{exo.exercise?.name}</h4>
                                    <p className={`text-xs font-medium mt-1 ${cText}`}>
                                        {exo.sets} séries <span className="text-gray-500 mx-1">•</span> {exo.reps} {/* Ici on affiche "45s" pour les abdos, "10 reps" pour le reste */}
                                        {exo.reps.includes('s') ? '' : ' reps'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6 bg-dark-900 border-t border-dark-800 shrink-0">
                <button 
                    onClick={() => openScheduleModal(previewWorkout)}
                    className={`w-full text-dark-900 font-black py-4 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all ${cBg} ${cShadow}`}
                >
                    PLANIFIER CETTE SÉANCE
                </button>
            </div>
        </div>
      )}

      {/* --- MODALE --- */}
      {isModalOpen && selectedWorkout && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-dark-800 w-full max-w-sm rounded-3xl border border-dark-700 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Planifier</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-dark-700 rounded-full text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            
            <p className="text-gray-400 text-sm mb-4">
              Quel jour veux-tu faire <span className={selectedWorkout.title.toUpperCase().includes('BBL') ? 'text-pink-500 font-bold' : 'text-neon font-bold'}>{selectedWorkout.title}</span> ?
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {weekDays.map((day) => (
                <button 
                  key={day.value} 
                  onClick={() => handleSchedule(day.value)} 
                  disabled={saving} 
                  className={`bg-dark-900 border border-dark-700 py-3 rounded-xl text-xs font-bold uppercase transition-colors focus:text-dark-900 ${
                    selectedWorkout.title.toUpperCase().includes('BBL') ? 'focus:bg-pink-500' : 'focus:bg-neon'
                  } ${day.label === 'Dimanche' ? 'col-span-2' : ''}`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {saving && <p className="text-center text-gray-400 text-xs font-bold">Enregistrement...</p>}
          </div>
        </div>
      )}
    </div>
  )
}