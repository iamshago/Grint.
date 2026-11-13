import type { CSSProperties, ReactNode } from 'react'

/** Icônes des planches F1 / F3 / G1, tracés recopiés tels quels du canevas (Lucide). */
interface IconeProps {
  taille?: number
  trait?: string
  epaisseur?: number
  style?: CSSProperties
}

function Svg({ taille = 16, trait = 'currentColor', epaisseur = 2, style, children, plein }: IconeProps & { children: ReactNode; plein?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={taille}
      height={taille}
      fill={plein ?? 'none'}
      stroke={trait}
      strokeWidth={epaisseur}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', ...style }}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const IconeImagePlus = (p: IconeProps) => (
  <Svg {...p}>
    <path d="M16 5h6" />
    <path d="M19 2v6" />
    <path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    <circle cx="9" cy="9" r="2" />
  </Svg>
)

export const IconeRetour = (p: IconeProps) => (
  <Svg {...p}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </Svg>
)

export const IconeHaltere = (p: IconeProps) => (
  <Svg {...p}>
    <path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z" />
    <path d="m2.5 21.5 1.4-1.4" />
    <path d="m20.1 3.9 1.4-1.4" />
    <path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z" />
    <path d="m9.6 14.4 4.8-4.8" />
  </Svg>
)

export const IconePlus = (p: IconeProps) => (
  <Svg {...p}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </Svg>
)

export const IconeX = (p: IconeProps) => (
  <Svg {...p}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Svg>
)

export const IconeRecherche = (p: IconeProps) => (
  <Svg {...p}>
    <path d="m21 21-4.34-4.34" />
    <circle cx="11" cy="11" r="8" />
  </Svg>
)

export const IconeAppareil = (p: IconeProps) => (
  <Svg {...p}>
    <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />
    <circle cx="12" cy="13" r="3" />
  </Svg>
)

export const IconeCoche = (p: IconeProps) => (
  <Svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </Svg>
)

export const IconeDossierPlus = (p: IconeProps) => (
  <Svg {...p}>
    <path d="M12 10v6" />
    <path d="M9 13h6" />
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  </Svg>
)

/** « Garder pour plus tard » (planche F6). */
export const IconeSignet = (p: IconeProps) => (
  <Svg {...p}>
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </Svg>
)

/** « Annuler la séance » (planche F6), même tracé que « Retirer » dans la carte d'un exercice. */
export const IconeCorbeille = (p: IconeProps) => (
  <Svg {...p}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </Svg>
)
