import { useNavigate, useLocation } from 'react-router-dom'
import { Home, User, Dumbbell } from 'lucide-react'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  // Fonction pour savoir si le bouton est actif
  const isActive = (path) => location.pathname === path

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-800 pb-safe pt-2 px-6 h-20 flex justify-around items-start z-50">
      
      {/* Bouton ACCUEIL */}
      <button 
        onClick={() => navigate('/')}
        className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-neon' : 'text-gray-500'}`}
      >
        <Home size={24} strokeWidth={isActive('/') ? 3 : 2} />
        <span className="text-[10px] font-bold">Accueil</span>
      </button>

      {/* Bouton PROFIL */}
      <button 
        onClick={() => navigate('/profile')}
        className={`flex flex-col items-center gap-1 ${isActive('/profile') ? 'text-neon' : 'text-gray-500'}`}
      >
        <User size={24} strokeWidth={isActive('/profile') ? 3 : 2} />
        <span className="text-[10px] font-bold">Profil</span>
      </button>

    </div>
  )
}