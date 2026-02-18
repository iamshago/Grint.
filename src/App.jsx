import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import WorkoutSession from './pages/WorkoutSession'
import Profile from './pages/Profile'
import BottomNav from './components/BottomNav'

// On crée un petit composant "Layout" pour gérer où afficher le menu
function Layout({ children }) {
  const location = useLocation()
  // On cache le menu SEULEMENT si on est DANS une séance de sport (/workout/...)
  const hideNav = location.pathname.startsWith('/workout/')
  
  return (
    <>
      {children}
      {!hideNav && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/workout/:id" element={<WorkoutSession />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}