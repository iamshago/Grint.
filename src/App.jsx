import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import WorkoutSession from './pages/WorkoutSession'
import Profile from './pages/Profile'
import Program from './pages/Program' // <--- Vérifie que ce fichier existe bien dans src/pages/
import BottomNav from './components/BottomNav'
import Settings from './pages/Settings' // <--- Ajoute ça en haut

// Le Layout gère l'affichage du menu du bas
function Layout({ children }) {
  const location = useLocation()
  
  // On cache le menu seulement si on est DANS une séance de sport (/workout/...)
  const hideNav = location.pathname.startsWith('/workout/')
  
  return (
    <>
      {children}
      {/* Si on n'est pas en séance, on affiche le menu */}
      {!hideNav && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* 1. Page d'accueil */}
          <Route path="/" element={<Home />} />
          
          {/* 2. Page des Programmes (Celle qui posait problème) */}
          <Route path="/program" element={<Program />} />
          
          {/* 3. Page de Profil */}
          <Route path="/profile" element={<Profile />} />
          
          {/* 4. Page de Séance (ID dynamique) */}
          <Route path="/workout/:id" element={<WorkoutSession />} />

          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}