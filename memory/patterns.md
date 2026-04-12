# Patterns & Conventions — Grint.

> Ce fichier documente les patterns récurrents du projet pour que Claude Code les réutilise automatiquement.

## Pattern : Composant UI avec variantes
```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/** Bouton principal de l'app Grint */
export function Button({ variant, size = 'md', children, className, onClick }: ButtonProps) {
  const baseStyles = 'rounded-[12px] font-semibold transition-all';
  const variants = {
    primary: 'bg-[#1f2021] text-[#ffee8c]',
    secondary: 'bg-[#ffee8c] text-[#1f2021]',
    ghost: 'bg-transparent text-[#1b1d1f] border border-[#e6e8ed]',
  };
  // ...
}
```

## Pattern : Hook custom avec Supabase
```tsx
export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setWorkouts(data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkouts();
  }, []);

  return { workouts, loading, error };
}
```

## Pattern : Page avec layout
```tsx
// Pages light mode
export default function HomePage() {
  return (
    <LightLayout>
      <CalendarWeek />
      <WorkoutCard />
    </LightLayout>
  );
}

// Pages dark mode
export default function ProfilePage() {
  return (
    <DarkLayout>
      <ProfileHeader />
      <StatsGrid />
    </DarkLayout>
  );
}
```

## Pattern : Couleurs (jamais de hex hardcodé dans les composants)
```
// BIEN : utiliser les tokens
className="bg-[var(--bg-1)] text-[var(--tx-1)]"

// ACCEPTABLE : Tailwind arbitrary values avec les hex du design system
className="bg-[#f1f4fb] text-[#1b1d1f]"

// MAL : inventer des couleurs
className="bg-gray-100 text-gray-900"
```

## Pattern : Positionnement Figma → Code (écrans plein écran)

Le fichier Figma utilise un frame de **402×874px** (iPhone 16 Pro) incluant :
- **62px** de status bar en haut
- **34px** de home indicator en bas
- Zone utile : 402×778px

Pour convertir les positions absolues Figma en positions dans le code (sans status bar ni home indicator) :
```
positionCode = positionFigma - 52  (approximation de l'offset status bar)
```

### Règle des CTAs : bottom 56px
Tous les boutons d'action principaux (CTA) des écrans workout sont positionnés à **`bottom: 56px`** du bord inférieur du viewport. Cette règle s'applique à toutes les vues :
- Vue liste : "Commencer ta séance" / "Lancer l'exercice" / "Terminer la séance"
- Vue input : "Valider ma série"
- Vue repos : "Passer le repos" + bouton retour
- Vue récap : "Terminer ma séance"

### Containers de saisie (poids/reps)
```
left: 32px, right: 32px (w=338px sur 402)
height: 141px
border-radius: 24px
bg: var(--tx-1)
gap entre les deux containers : 24px
```

### Badge série
```
rounded-[8px] (rectangle arrondi, PAS une pilule)
px-12 py-6 (px-3 py-1.5 en Tailwind)
bg: accent/40% (${accentColor}40)
border: 1px solid accent
text: 12px Figtree SemiBold uppercase
```
