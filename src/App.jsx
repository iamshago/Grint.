import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import WorkoutSession from './pages/WorkoutSession'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route par défaut : L'accueil */}
        <Route path="/" element={<Home />} />
        
        {/* Route dynamique : La page de sport (l'ID change selon la séance) */}
        <Route path="/workout/:id" element={<WorkoutSession />} />
      </Routes>
    </BrowserRouter>
  )
}