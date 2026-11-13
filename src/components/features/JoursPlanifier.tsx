/**
 * Les jours de la feuille « Planifier » (Programmer, aperçu d'un programme perso, détail d'un programme) :
 * même grille qu'avant, plus une étiquette « Auj. » sur aujourd'hui pour savoir quel jour on est sans quitter l'app.
 * `value` = jour JavaScript (0 = dimanche), comme `workout_plan.day_of_week`.
 */
export const JOURS_SEMAINE = [
  { label: 'Lundi', value: 1 },
  { label: 'Mardi', value: 2 },
  { label: 'Mercredi', value: 3 },
  { label: 'Jeudi', value: 4 },
  { label: 'Vendredi', value: 5 },
  { label: 'Samedi', value: 6 },
  { label: 'Dimanche', value: 0 },
]

/** Jour JavaScript (0 = dimanche) d'un jour de l'Accueil (0 = lundi). */
export const jourDepuisAccueil = (jourAccueil: number) => (jourAccueil === 6 ? 0 : jourAccueil + 1)

interface JoursPlanifierProps {
  selection: number[]
  onBasculer: (jour: number) => void
  /** Couleur du texte d'un jour pas choisi (classe Tailwind), comme dans chaque feuille. */
  texteInactif?: string
}

export default function JoursPlanifier({ selection, onBasculer, texteInactif = 'text-tx-2' }: JoursPlanifierProps) {
  const aujourdhui = new Date().getDay()

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {JOURS_SEMAINE.map((day) => {
        const choisi = selection.includes(day.value)
        const estAujourdhui = day.value === aujourdhui
        return (
          <button
            key={day.value}
            type="button"
            onClick={() => onBasculer(day.value)}
            aria-pressed={choisi}
            aria-label={estAujourdhui ? `${day.label}, aujourd'hui` : day.label}
            className={`py-3 rounded-12 text-xs font-sans font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              choisi ? 'bg-tx-1 text-pr-1' : `bg-surface ${texteInactif}`
            } ${day.label === 'Dimanche' ? 'col-span-2' : ''}`}
          >
            <span>{day.label}</span>
            {estAujourdhui && (
              <span
                aria-hidden="true"
                className={`shrink-0 rounded-[6px] border px-1.5 text-[10px] leading-[15px] tracking-[0.25px] ${
                  choisi ? 'border-pr-1/50 text-pr-1' : 'border-tx-3 text-tx-2'
                }`}
              >
                Auj.
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
