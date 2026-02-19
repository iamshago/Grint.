import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft, Play, Pause, Check, SkipForward, Timer } from 'lucide-react'

export default function WorkoutSession() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [workout, setWorkout] = useState(null)
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)

  const isCircuitMode = workout?.title?.toLowerCase().includes('abdos') || workout?.title?.toLowerCase().includes('circuit')
  // NOUVEAU : On détecte si c'est le BBL Day
  const isBBL = workout?.title?.toUpperCase().includes('BBL')

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: wData, error: wError } = await supabase
          .from('workouts')
          .select(`*, workout_exercises(*, exercise:exercises(*))`)
          .eq('id', id)
          .single()

        if (wError) throw wError
        setWorkout(wData)
        
        const sortedExos = (wData.workout_exercises || []).sort((a, b) => a.order_index - b.order_index)
        setExercises(sortedExos)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

const finishWorkout = async () => {
    try {
        // 1. Calcul estimatif des calories (7 kcal / min par défaut)
        const estimatedCalories = workout.duration_min * 7

        // 2. On enregistre la VRAIE fin de séance dans notre nouvelle table
        await supabase.from('completed_workouts').insert({
            workout_id: workout.id,
            duration_min: workout.duration_min,
            calories: estimatedCalories
        })

        // 3. (On garde ce petit log pour le mode circuit pour ne pas casser l'accueil)
        if (isCircuitMode && exercises.length > 0) {
            await supabase.from('user_progress').insert({
                exercise_id: exercises[0].exercise_id,
                weight_used: 0,
                reps_done: 1,
                notes: 'Circuit validé'
            })
        }
        
        navigate('/')
    } catch (err) {
        console.error(err)
    }
  }

  if (loading) return <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center">Chargement...</div>
  if (!workout) return <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center">Séance introuvable.</div>

  return (
    <div className="min-h-screen bg-dark-900 text-white font-sans relative flex flex-col">
      <div className="p-6 pt-12 flex items-center gap-4 bg-dark-900 sticky top-0 z-20 shrink-0 border-b border-dark-800">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-dark-800 rounded-full flex items-center justify-center border border-dark-700 active:scale-95 transition-transform shrink-0 hover:border-white/30">
          <ArrowLeft size={20} />
        </button>
        <div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter">{workout.title}</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase">{isCircuitMode ? 'Mode Circuit Chrono' : 'Musculation Étape par Étape'}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
          {isCircuitMode ? (
              <CircuitTimerView exercises={exercises} onFinish={finishWorkout} isBBL={isBBL} />
          ) : (
              <StandardWorkoutView exercises={exercises} onFinish={finishWorkout} isBBL={isBBL} />
          )}
      </div>
    </div>
  )
}

// ==========================================
// COMPOSANT : SLIDER HORIZONTAL MINIMALISTE
// ==========================================
const HorizontalPicker = ({ value, onChange, min, max, stepKey }) => {
    const scrollRef = useRef(null)
    const itemWidth = 80 // Largeur fixe de chaque chiffre (w-20)
    const items = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  
    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = (value - min) * itemWidth
      }
    }, [stepKey, min])
  
    const handleScroll = (e) => {
      const scrollLeft = e.target.scrollLeft
      const index = Math.round(scrollLeft / itemWidth)
      const newValue = min + index
      if (newValue !== value && newValue >= min && newValue <= max) {
        onChange(newValue)
      }
    }
  
    return (
      <div 
        className="relative w-full h-24 overflow-hidden"
        style={{ 
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%, black 60%, transparent)',
            maskImage: 'linear-gradient(to right, transparent, black 40%, black 60%, transparent)' 
        }}
      >
        {/* FINI LE CADRE CENTRAL MOCHE, JUSTE LE SCROLL PUR */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory no-scrollbar items-center"
          style={{ paddingLeft: 'calc(50% - 40px)', paddingRight: 'calc(50% - 40px)' }}
        >
          {items.map(num => (
            <div 
              key={num} 
              className={`shrink-0 w-20 h-24 flex items-center justify-center snap-center transition-all duration-300 cursor-grab active:cursor-grabbing ${
                  value === num ? 'scale-110 opacity-100' : 'scale-90 opacity-30'
              }`}
            >
              <span className={`transition-colors ${value === num ? 'text-6xl font-black text-white' : 'text-4xl font-bold text-gray-500'}`}>
                  {num}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
}

// ==========================================
// 1. LE MODE CIRCUIT ABDOS
// ==========================================
const CircuitTimerView = ({ exercises, onFinish, isBBL }) => {
    const cText = isBBL ? 'text-pink-500' : 'text-neon'
    const cBg = isBBL ? 'bg-pink-500' : 'bg-neon'
    const cShadow = isBBL ? 'shadow-[0_0_40px_rgba(236,72,153,0.3)]' : 'shadow-[0_0_40px_rgba(204,255,0,0.3)]'
    const cShadowText = isBBL ? 'drop-shadow-[0_0_35px_rgba(236,72,153,0.5)]' : 'drop-shadow-[0_0_35px_rgba(204,255,0,0.5)]'

    const [playlist, setPlaylist] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [timeLeft, setTimeLeft] = useState(0)
    const [isRunning, setIsRunning] = useState(false)
    const [isFinished, setIsFinished] = useState(false)

    useEffect(() => {
        if (exercises.length === 0) return
        const generatedList = []
        const totalSets = exercises[0].sets || 1 

        for (let tour = 1; tour <= totalSets; tour++) {
            exercises.forEach((exo) => {
                const duration = parseInt(exo.reps.replace('s', '')) || 30
                generatedList.push({ type: 'WORK', name: exo.exercise.name, duration: duration, tour: tour, totalTours: totalSets })
                if (exo.rest_seconds > 0) {
                    generatedList.push({ type: 'REST', name: 'Repos', duration: exo.rest_seconds, tour: tour, totalTours: totalSets })
                }
            })
        }
        setPlaylist(generatedList)
        if (generatedList.length > 0) setTimeLeft(generatedList[0].duration)
    }, [exercises])

    useEffect(() => {
        let interval = null
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
        } else if (isRunning && timeLeft === 0) {
            skipNext()
        }
        return () => clearInterval(interval)
    }, [isRunning, timeLeft, currentIndex, playlist])

    const toggleTimer = () => setIsRunning(!isRunning)
    const skipNext = () => {
        if (currentIndex < playlist.length - 1) {
            const nextIndex = currentIndex + 1
            setCurrentIndex(nextIndex)
            setTimeLeft(playlist[nextIndex].duration)
        } else {
            setIsRunning(false)
            setIsFinished(true)
        }
    }

    if (playlist.length === 0) return null

    if (isFinished) return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in">
            <div className={`w-24 h-24 ${cBg} text-dark-900 rounded-full flex items-center justify-center mb-6 ${cShadow}`}>
                <Check size={48} strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-black italic uppercase mb-2">Circuit Terminé !</h2>
            <button onClick={onFinish} className={`w-full ${cBg} text-dark-900 font-black py-4 rounded-2xl mt-8`}>
                VALIDER LA SÉANCE
            </button>
        </div>
    )

    const currentStep = playlist[currentIndex]
    const nextStep = playlist[currentIndex + 1]
    const isRest = currentStep.type === 'REST'
    const mins = Math.floor(timeLeft / 60)
    const secs = timeLeft % 60
    const timeDisplay = `${mins > 0 ? mins + ':' : ''}${secs < 10 && mins > 0 ? '0' : ''}${secs}`
    const progress = ((currentIndex) / playlist.length) * 100

    return (
        <div className="flex-1 flex flex-col p-6 animate-in fade-in relative pb-24">
            <div className="text-center mb-12">
                <span className="bg-dark-800 border border-dark-700 text-gray-300 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
                    Tour {currentStep.tour} / {currentStep.totalTours}
                </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                <h2 className={`text-3xl font-black uppercase tracking-wide mb-6 text-center ${isRest ? 'text-gray-400' : cText}`}>
                    {currentStep.name}
                </h2>
                <div className={`text-[130px] font-black leading-none tabular-nums tracking-tighter transition-all duration-300 ${isRest ? 'text-white' : `${cText} ${cShadowText}`}`}>
                    {timeDisplay}
                </div>
            </div>

            <div className="mt-8 text-center h-12">
                {nextStep && (
                    <p className="text-sm text-gray-500 font-medium">Suivant : <span className="text-white font-bold">{nextStep.name}</span></p>
                )}
            </div>

            <div className="mt-8 relative w-full flex items-center justify-center h-24">
                <button onClick={toggleTimer} className={`absolute z-10 w-24 h-24 rounded-full flex items-center justify-center transition-transform active:scale-95 ${isRunning ? 'bg-dark-800 border-2 border-dark-700 text-white' : `${cBg} text-dark-900 ${cShadow}`}`}>
                    {isRunning ? <Pause size={36} fill="currentColor" /> : <Play size={36} fill="currentColor" className="ml-2" />}
                </button>
                <button onClick={skipNext} className="absolute right-4 w-12 h-12 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-gray-400 hover:text-white active:scale-95">
                    <SkipForward size={20} />
                </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-2 bg-dark-800">
                <div className={`h-full transition-all duration-300 ${cBg}`} style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    )
}

// ==========================================
// 2. LE MODE MUSCULATION (MINIMALISTE & THÉMÉ)
// ==========================================
const StandardWorkoutView = ({ exercises, onFinish, isBBL }) => {
    // --- VARIABLES DE THÈME ---
    const cText = isBBL ? 'text-pink-500' : 'text-neon'
    const cBg = isBBL ? 'bg-pink-500' : 'bg-neon'
    const cBgLight = isBBL ? 'bg-pink-500/10' : 'bg-neon/10'
    const cBorderLight = isBBL ? 'border-pink-500/20' : 'border-neon/20'
    const cShadow = isBBL ? 'shadow-[0_0_20px_rgba(236,72,153,0.3)]' : 'shadow-[0_0_20px_rgba(204,255,0,0.3)]'

    const [playlist, setPlaylist] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    
    const [weight, setWeight] = useState(0)
    const [reps, setReps] = useState(10)
    const [history, setHistory] = useState({}) 

    const [restTimeLeft, setRestTimeLeft] = useState(0)
    const [savingStep, setSavingStep] = useState(false)

    useEffect(() => {
        async function fetchHistory() {
            if (exercises.length === 0) return
            const exIds = exercises.map(e => e.exercise_id)
            const { data } = await supabase
                .from('user_progress')
                .select('exercise_id, weight_used, reps_done, created_at')
                .in('exercise_id', exIds)
                .order('created_at', { ascending: false }) 

            if (data) {
                const hist = {}
                data.forEach(log => {
                    if (!hist[log.exercise_id]) hist[log.exercise_id] = log
                })
                setHistory(hist)
            }
        }
        fetchHistory()
    }, [exercises])

    useEffect(() => {
        if (exercises.length === 0) return
        const generated = []
        exercises.forEach((exo, eIdx) => {
            for (let s = 1; s <= exo.sets; s++) {
                generated.push({ type: 'WORK', exo, setNum: s, totalSets: exo.sets })
                let nextName = ''
                if (s < exo.sets) nextName = exo.exercise.name
                else if (eIdx < exercises.length - 1) nextName = exercises[eIdx + 1].exercise.name

                if (nextName) {
                    generated.push({ type: 'REST', duration: exo.rest_seconds, nextName })
                }
            }
        })
        setPlaylist(generated)
    }, [exercises])

    useEffect(() => {
        const currentStep = playlist[currentIndex]
        if (currentStep && currentStep.type === 'WORK') {
            const lastLog = history[currentStep.exo.exercise_id]
            const targetReps = parseInt(currentStep.exo.reps.split('-')[0]) || 10
            
            setWeight(lastLog ? lastLog.weight_used : 0)
            setReps(lastLog ? lastLog.reps_done : targetReps)
        }
    }, [currentIndex, playlist, history])

    useEffect(() => {
        let interval = null
        if (playlist[currentIndex]?.type === 'REST' && restTimeLeft > 0) {
            interval = setInterval(() => setRestTimeLeft(prev => prev - 1), 1000)
        } else if (playlist[currentIndex]?.type === 'REST' && restTimeLeft === 0) {
            handleNext()
        }
        return () => clearInterval(interval)
    }, [currentIndex, restTimeLeft, playlist])

    const handleNext = () => {
        if (currentIndex < playlist.length - 1) {
            const nextIdx = currentIndex + 1
            setCurrentIndex(nextIdx)
            if (playlist[nextIdx].type === 'REST') {
                setRestTimeLeft(playlist[nextIdx].duration)
            }
        } else {
            setCurrentIndex(playlist.length) 
        }
    }

    const validateSet = async () => {
        setSavingStep(true)
        try {
            await supabase.from('user_progress').insert({
                exercise_id: currentStep.exo.exercise_id,
                weight_used: weight,
                reps_done: reps
            })

            setHistory(prev => ({
                ...prev,
                [currentStep.exo.exercise_id]: { weight_used: weight, reps_done: reps }
            }))

            handleNext()
        } catch (e) {
            console.error(e)
            alert("Erreur d'enregistrement.")
        } finally {
            setSavingStep(false)
        }
    }

    if (playlist.length === 0) return null

    if (currentIndex >= playlist.length) return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in">
            <div className={`w-24 h-24 ${cBg} text-dark-900 rounded-full flex items-center justify-center mb-6 ${cShadow}`}>
                <Check size={48} strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-black italic uppercase mb-2">Séance Terminée</h2>
            <p className="text-gray-400 mb-8">Un entraînement de championne.</p>
            <button onClick={onFinish} className={`w-full ${cBg} text-dark-900 font-black py-4 rounded-2xl ${cShadow}`}>
                RETOURNER À L'ACCUEIL
            </button>
        </div>
    )

    const currentStep = playlist[currentIndex]
    const progress = (currentIndex / playlist.length) * 100
    const stepKey = `${currentIndex}`

    return (
        <div className="flex-1 flex flex-col p-6 animate-in fade-in relative pb-24">
            
            <div className="text-center mb-6">
                {currentStep.type === 'WORK' ? (
                    <span className={`${cBgLight} border ${cBorderLight} ${cText} text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full`}>
                        Série {currentStep.setNum} sur {currentStep.totalSets}
                    </span>
                ) : (
                    <span className="bg-dark-800 border border-dark-700 text-gray-400 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
                        Récupération
                    </span>
                )}
            </div>

            {currentStep.type === 'WORK' ? (
                <div className="flex-1 flex flex-col justify-between">
                    <div>
                        <h2 className="text-4xl font-black text-center uppercase tracking-tighter mb-2">
                            {currentStep.exo.exercise.name}
                        </h2>
                        <p className="text-center text-gray-500 font-medium mb-10">
                            Objectif ciblé : <span className="text-white font-bold">{currentStep.exo.reps} reps</span>
                        </p>
                    </div>

                    <div className="space-y-6 mb-10">
                        {/* SLIDER POIDS - Épuré et Minimaliste */}
                        <div className="bg-dark-800 rounded-[32px] pt-6 pb-2 border border-dark-700 shadow-inner">
                            <p className="text-center text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Poids (KG)</p>
                            <HorizontalPicker 
                                value={weight} 
                                onChange={setWeight} 
                                min={0} max={200} 
                                stepKey={stepKey} 
                            />
                        </div>

                        {/* SLIDER REPS - Épuré et Minimaliste */}
                        <div className="bg-dark-800 rounded-[32px] pt-6 pb-2 border border-dark-700 shadow-inner">
                            <p className="text-center text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Répétitions</p>
                            <HorizontalPicker 
                                value={reps} 
                                onChange={setReps} 
                                min={0} max={50} 
                                stepKey={stepKey} 
                            />
                        </div>
                    </div>

                    <div className="mt-auto">
                        <button 
                            onClick={validateSet} 
                            disabled={savingStep}
                            className={`w-full ${cBg} text-dark-900 font-black py-5 rounded-2xl ${cShadow} active:scale-95 transition-all flex items-center justify-center gap-2`}
                        >
                            {savingStep ? "SAUVEGARDE..." : <><Check size={20} strokeWidth={3}/> VALIDER LA SÉRIE</>}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Timer size={48} className="text-gray-600 mb-8 animate-pulse" />
                    
                    <div className="text-[130px] font-black leading-none tabular-nums tracking-tighter text-white mb-8">
                        {Math.floor(restTimeLeft / 60)}:{restTimeLeft % 60 < 10 ? '0' : ''}{restTimeLeft % 60}
                    </div>

                    <p className="text-gray-500 font-medium text-lg mb-12">
                        Prépare-toi pour : <span className="text-white font-bold">{currentStep.nextName}</span>
                    </p>

                    <button 
                        onClick={handleNext} 
                        className="bg-dark-800 border border-dark-700 text-white font-bold px-8 py-4 rounded-full active:scale-95 transition-transform flex items-center gap-2 hover:border-white/30"
                    >
                        PASSER LE REPOS <SkipForward size={18} />
                    </button>
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 h-2 bg-dark-800">
                <div className={`h-full transition-all duration-300 ${cBg}`} style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    )
}