import { useNavigate, useParams } from 'react-router-dom'
import WorkoutEditor from '@/components/features/creer-seance/WorkoutEditor'

/**
 * Création / édition d'une séance perso en page (routes /workouts/new,
 * /my-programs/:id/workouts/new, /my-programs/:id/workouts/:workoutId/edit).
 * L'écran est celui des planches F3 / F4 (WorkoutEditor) ; depuis « Programmer »,
 * le même éditeur monte dans une feuille (planche F1).
 */
export default function MyWorkoutEdit() {
  const navigate = useNavigate()
  const { id: programId, workoutId } = useParams()
  // Séance orpheline (route /workouts/new) : pas de programme parent → on
  // retourne au Programs Hub et on ne crée aucun lien user_program_workouts.
  const returnTo = programId ? `/my-programs/${programId}` : '/programs'

  return (
    <WorkoutEditor
      programId={programId}
      workoutId={workoutId}
      onExit={() => navigate(returnTo)}
      onSaved={() => navigate(returnTo)}
    />
  )
}
