import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, User, Target, Quote, Trash2 } from 'lucide-react'

export default function Settings() {
  const navigate = useNavigate()
  const [name, setName] = useState('Sarah')
  const [motto, setMotto] = useState('Prête à tout casser ?')
  const [weightGoal, setWeightGoal] = useState('')
  const [showSave, setShowSave] = useState(false)

  // Charger les données au démarrage
  useEffect(() => {
    const savedName = localStorage.getItem('userName')
    const savedMotto = localStorage.getItem('userMotto')
    const savedGoal = localStorage.getItem('userGoal')
    
    if (savedName) setName(savedName)
    if (savedMotto) setMotto(savedMotto)
    if (savedGoal) setWeightGoal(savedGoal)
  }, [])

  const handleSave = () => {
    localStorage.setItem('userName', name)
    localStorage.setItem('userMotto', motto)
    localStorage.setItem('userGoal', weightGoal)
    
    setShowSave(true)
    setTimeout(() => {
        setShowSave(false)
        navigate('/') // Retour accueil pour voir le changement
    }, 1000)
  }

  // Petit composant pour les sections
  const Section = ({ icon: Icon, title, children }) => (
    <div className="bg-[#1C1C1E] p-5 rounded-3xl border border-white/5 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-neon/10 flex items-center justify-center text-neon">
            <Icon size={16} />
        </div>
        <h3 className="font-bold text-white text-sm">{title}</h3>
      </div>
      {children}
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-24 relative">
      
      {/* HEADER */}
      <div className="px-6 pt-12 pb-6 flex justify-between items-center sticky top-0 z-20 bg-black/80 backdrop-blur-md">
        <button onClick={() => navigate('/profile')} className="w-10 h-10 bg-[#1C1C1E] rounded-full flex items-center justify-center border border-white/10 active:scale-95 transition-transform">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold tracking-wide">Réglages</h1>
        <div className="w-10"></div> {/* Spacer pour centrer le titre */}
      </div>

      <div className="px-6">
        
        {/* AVATAR (Visuel uniquement pour l'instant) */}
        <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full border-4 border-[#1C1C1E] overflow-hidden shadow-2xl relative">
                <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`} 
                    alt="Avatar" 
                    className="w-full h-full bg-dark-800"
                />
            </div>
            <p className="text-xs text-gray-500 mt-3 font-medium">L'avatar est généré selon ton prénom</p>
        </div>

        {/* FORMULAIRE */}
        <Section icon={User} title="Profil">
            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block ml-1">Ton Prénom</label>
            <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/30 text-white font-bold p-4 rounded-xl border border-white/10 focus:border-neon focus:outline-none transition-colors"
            />
        </Section>

        <Section icon={Quote} title="Motivation">
            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block ml-1">Ta phrase d'accueil</label>
            <input 
                type="text" 
                value={motto}
                onChange={(e) => setMotto(e.target.value)}
                className="w-full bg-black/30 text-white font-medium p-4 rounded-xl border border-white/10 focus:border-neon focus:outline-none transition-colors"
            />
        </Section>

        <Section icon={Target} title="Objectif">
            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block ml-1">Poids Cible (Optionnel)</label>
            <div className="relative">
                <input 
                    type="number" 
                    value={weightGoal}
                    onChange={(e) => setWeightGoal(e.target.value)}
                    placeholder="Ex: 65"
                    className="w-full bg-black/30 text-white font-bold p-4 rounded-xl border border-white/10 focus:border-neon focus:outline-none transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">KG</span>
            </div>
        </Section>

        {/* ZONE DE DANGER (Déco pour l'instant) */}
        <div className="mt-8 pt-8 border-t border-white/5">
            <button className="flex items-center gap-2 text-red-500 text-xs font-bold px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors w-full justify-center">
                <Trash2 size={16} />
                Réinitialiser toutes les données
            </button>
        </div>

      </div>

      {/* BOUTON SAUVEGARDER FLOTTANT */}
      <div className="fixed bottom-8 left-0 right-0 px-6 z-30">
        <button 
            onClick={handleSave}
            className={`w-full py-4 rounded-2xl font-black text-dark-900 flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95 ${
                showSave ? 'bg-green-500 scale-95' : 'bg-neon hover:bg-neon-hover'
            }`}
        >
            {showSave ? (
                <>C'EST ENREGISTRÉ ! 🎉</>
            ) : (
                <><Save size={20} /> SAUVEGARDER</>
            )}
        </button>
      </div>

    </div>
  )
}