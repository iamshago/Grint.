import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft, CheckCircle2, ChevronRight, Dumbbell, Repeat, Lightbulb, Zap, History, Trophy } from 'lucide-react'

// --- CITATIONS DE REPOS ---
const restingQuotes = [
  "Respire par le ventre...",
  "Bois une gorgée d'eau 💧",
  "Relâche tes épaules.",
  "Visualise la réussite.",
  "La douleur est temporaire.",
  "Concentre-toi.",
  "Chaque répétition compte !"
]

export default function WorkoutSession() {
  const { id } = useParams()
  const navigate = useNavigate()

  // --- DONNÉES ---
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  
  // --- ÉTAT SÉANCE ---
  const [currentExIndex, setCurrentExIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)
  const [isFinished, setIsFinished] = useState(false)
  
  // --- SAISIE ---
  const [weightInput, setWeightInput] = useState('')
  const [repsInput, setRepsInput] = useState('')
  const [lastLog, setLastLog] = useState(null) // Pour afficher "Dernière fois : 50kg"

  // --- CHRONO ---
  const [isResting, setIsResting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [currentQuote, setCurrentQuote] = useState("")

  // 1. CHARGEMENT DES EXERCICES
  useEffect(() => {
    async function fetchExercises() {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select(`*, exercise:exercises (*)`)
        .eq('workout_id', id)
        .order('order_index')

      if (error) console.error(error)
      else setExercises(data || [])
      setLoading(false)
    }
    fetchExercises()
  }, [id])

  // 2. RECUPÉRER L'HISTORIQUE (Dès qu'on change d'exo)
  useEffect(() => {
    if (exercises.length > 0) {
      const currentEx = exercises[currentExIndex]
      // Récupérer la perf précédente pour pré-remplir
      fetchLastPerformance(currentEx.exercise.id, currentEx.reps)
    }
  }, [currentExIndex, exercises])

  async function fetchLastPerformance(exerciseId, targetReps) {
    const { data } = await supabase
      .from('user_progress')
      .select('weight_used, reps_done')
      .eq('exercise_id', exerciseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setLastLog(data)
      setWeightInput(data.weight_used)
      setRepsInput(data.reps_done)
    } else {
      setLastLog(null)
      setWeightInput('')
      // Si pas d'historique, on met l'objectif par défaut (ex: "10")
      setWeightInput('') // On laisse le poids vide pour forcer la saisie
      setRepsInput(targetReps.split('-')[0] || targetReps)
    }
  }

  // 3. GESTION DU CHRONO
  useEffect(() => {
    let interval = null
    if (isResting && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    } else if (timeLeft === 0 && isResting) {
      handleSkipRest()
    }
    return () => clearInterval(interval)
  }, [isResting, timeLeft])

  // --- FONCTION PRINCIPALE : VALIDER UNE SÉRIE ---
  const handleValidateSet = async () => {
    const currentEx = exercises[currentExIndex]
    const weight = parseFloat(weightInput) || 0
    const reps = parseInt(repsInput) || 0

    // A. CORRECTION DE LA DATE (Bug du décalage)
    // On crée une date qui compense le décalage horaire pour que Supabase l'enregistre à l'heure locale
    const now = new Date()
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString()

    // B. DÉTECTION "NOUVEAU PR"
    // On regarde vite fait dans le passé si on a déjà fait mieux
    const { data: history } = await supabase
      .from('user_progress')
      .select('weight_used')
      .eq('exercise_id', currentEx.exercise.id)
    
    const maxEver = history?.length > 0 ? Math.max(...history.map(h => h.weight_used)) : 0
    const isPr = weight > maxEver && maxEver > 0

    // C. SAUVEGARDE
    if (reps > 0) {
      await supabase.from('user_progress').insert({
        exercise_id: currentEx.exercise.id,
        weight_used: weight,
        reps_done: reps,
        created_at: localDate, // <-- C'est ici que la magie opère
        notes: isPr ? "NEW PR" : `Série ${currentSet}`
      })
    }

    // D. SUITE (Repos ou Fin)
    setCurrentQuote(restingQuotes[Math.floor(Math.random() * restingQuotes.length)])
    
    if (currentSet >= currentEx.sets) {
      // Exercice fini
      if (currentExIndex >= exercises.length - 1) {
        setIsFinished(true)
      } else {
        startRest(currentEx.rest_seconds, true) // Vrai = Exo suivant
      }
    } else {
      // Série suivante
      startRest(currentEx.rest_seconds, false) // Faux = Même exo
    }
  }

  const startRest = (seconds, isNextEx) => {
    setTimeLeft(seconds)
    setIsResting(true)
    if (isNextEx) {
      setCurrentExIndex(prev => prev + 1)
      setCurrentSet(1)
    } else {
      setCurrentSet(prev => prev + 1)
    }
  }

  const handleSkipRest = () => {
    setIsResting(false)
    setTimeLeft(0)
  }

  // --- RENDU VISUEL ---

  if (loading) return <div className="min-h-screen bg-dark-900 flex items-center justify-center text-neon font-bold">Chargement...</div>

  // ECRAN DE FIN
  if (isFinished) {
    return (
      <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-32 h-32 bg-neon rounded-full flex items-center justify-center mb-6 text-dark-900 animate-bounce">
          <CheckCircle2 size={64} />
        </div>
        <h1 className="text-4xl font-bold text-neon mb-2">Séance Terminée !</h1>
        <p className="text-gray-400 mb-12">Données sauvegardées. Repose-toi bien.</p>
        <button onClick={() => navigate('/')} className="w-full bg-dark-800 border border-neon text-neon py-4 rounded-2xl font-bold hover:bg-neon hover:text-dark-900 transition-colors">
          Retour à l'accueil
        </button>
      </div>
    )
  }

  // ECRAN DE REPOS
  if (isResting) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-neon/5 rounded-full blur-3xl animate-pulse"></div>
        <h2 className="text-gray-400 font-bold uppercase tracking-widest mb-8 z-10">Repos</h2>
        <div className="text-[100px] font-black text-white tabular-nums leading-none mb-8 z-10 font-mono">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
        <div className="z-10 max-w-xs mx-auto mb-12 bg-dark-800/50 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
          <div className="flex justify-center text-neon mb-2"><Zap size={24} fill="currentColor" /></div>
          <p className="text-lg font-medium text-gray-200 italic">"{currentQuote}"</p>
        </div>
        <button onClick={handleSkipRest} className="bg-dark-800 border border-dark-700 text-white px-8 py-4 rounded-full font-bold hover:bg-dark-700 hover:text-neon transition-colors z-10 flex items-center gap-2">
          Reprendre <ChevronRight size={20} />
        </button>
      </div>
    )
  }

  // ECRAN D'EXERCICE (Le cœur de l'action)
  const currentEx = exercises[currentExIndex]
  const exDetails = currentEx.exercise

  return (
    <div className="min-h-screen bg-dark-900 text-white flex flex-col">
      
      {/* HEADER */}
      <div className="p-6 flex items-center justify-between bg-dark-900 z-20">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-400 hover:text-white">
          <ArrowLeft />
        </button>
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-400 uppercase font-bold">Exercice</span>
          <span className="text-neon font-bold">{currentExIndex + 1} / {exercises.length}</span>
        </div>
      </div>

      {/* TITRE & INFO */}
      <div className="px-6 pb-2">
        <h1 className="text-4xl font-bold mb-2 leading-tight">{exDetails.name}</h1>
        <p className="text-neon text-sm font-bold uppercase tracking-wider mb-6">{exDetails.muscle_target}</p>
        
        {exDetails.tips && (
          <div className="bg-dark-800 border border-neon/20 p-4 rounded-xl mb-6 flex gap-3 shadow-lg shadow-black/20">
            <Lightbulb className="text-neon shrink-0 mt-1" size={20} />
            <p className="text-sm text-gray-300 leading-relaxed">
              <span className="text-neon font-bold block mb-1">Conseil technique :</span>
              {exDetails.tips}
            </p>
          </div>
        )}

        {/* BARRE DE PROGRESSION SÉRIES */}
        <div className="flex gap-2 mb-4">
          {Array.from({ length: currentEx.sets }).map((_, i) => (
            <div key={i} className={`h-2 flex-1 rounded-full transition-colors ${i + 1 <= currentSet ? 'bg-neon' : 'bg-dark-700'}`}></div>
          ))}
        </div>
      </div>

      {/* CARTE DE SAISIE */}
      <div className="flex-1 px-6 flex flex-col justify-center -mt-4">
        <div className="bg-dark-800 rounded-3xl p-8 border border-dark-700 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 left-0 bg-neon text-dark-900 font-bold px-4 py-2 rounded-br-2xl text-sm">
            SÉRIE {currentSet}
          </div>
          
          {/* RAPPEL PERF PRÉCÉDENTE */}
          {lastLog && (
             <div className="absolute top-4 right-6 flex items-center gap-1 text-xs text-gray-400 bg-dark-900/50 px-2 py-1 rounded-lg border border-white/10">
               <History size={12} className="text-neon" />
               Last: <span className="text-white font-mono">{lastLog.weight_used}kg x {lastLog.reps_done}</span>
             </div>
          )}

          <div className="mt-8 space-y-6">
            {/* Input Poids */}
            <div>
              <label className="flex items-center gap-2 text-gray-400 text-sm font-bold mb-2">
                <Dumbbell size={16} className="text-neon"/> POIDS (KG)
              </label>
              <input 
                type="number" 
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="-" 
                className="w-full bg-dark-900 text-white text-4xl font-black p-4 rounded-xl border-2 border-transparent focus:border-neon focus:outline-none transition-colors text-center placeholder-dark-700"
                autoFocus
              />
            </div>

            {/* Input Reps */}
            <div>
              <label className="flex items-center gap-2 text-gray-400 text-sm font-bold mb-2">
                <Repeat size={16} className="text-neon"/> RÉPÉTITIONS
              </label>
              <input 
                type="number" 
                value={repsInput}
                onChange={(e) => setRepsInput(e.target.value)}
                placeholder={currentEx.reps} 
                className="w-full bg-dark-900 text-white text-4xl font-black p-4 rounded-xl border-2 border-transparent focus:border-neon focus:outline-none transition-colors text-center placeholder-dark-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* BOUTON VALIDER */}
      <div className="p-6 bg-dark-900 mt-auto">
        <button 
          onClick={handleValidateSet}
          className="w-full bg-neon text-dark-900 font-black text-xl py-5 rounded-2xl shadow-lg shadow-neon/20 hover:bg-neon-hover active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <CheckCircle2 size={28} />
          VALIDER
        </button>
      </div>

    </div>
  )
}