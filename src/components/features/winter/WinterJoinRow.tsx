import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface WinterJoinRowProps {
  /** Avatars des autres participants (3 affichés). */
  others: string[]
  /** Nombre d'autres participants au-delà des 3 avatars. */
  extra: number
  /** Ton avatar, une fois inscrit. */
  meAvatar: string | null
  joined: boolean
  /** Vrai juste après le toucher sur Rejoindre : joue l'arrivée et les éclats. */
  justJoined: boolean
  onJoin: () => void
  className?: string
}

const ETOILE = 'polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%)'
// Éclats du bouton (maquette G-CarteDefiWinter) : taille, forme, couleur, trajectoire.
const ECLATS: Array<{ s: number; shape: 'etoile' | 'rond' | 'feuille'; c: string; x: number; y: number; r: number }> = [
  { s: 9, shape: 'etoile', c: '#ffee8c', x: -60, y: -40, r: -80 },
  { s: 7, shape: 'rond', c: '#fff6c2', x: -30, y: -54, r: 40 },
  { s: 9, shape: 'etoile', c: '#f1f4fb', x: 14, y: -60, r: 90 },
  { s: 7, shape: 'rond', c: '#ffee8c', x: 52, y: -40, r: 0 },
  { s: 8, shape: 'feuille', c: '#ffee8c', x: 58, y: -8, r: 120 },
  { s: 8, shape: 'feuille', c: '#fff6c2', x: -64, y: -6, r: -120 },
]

/** Bas de la carte Winter avant inscription : la pile d'avatars et le bouton Rejoindre (maquette D1). */
export default function WinterJoinRow({ others, extra, meAvatar, joined, justJoined, onJoin, className }: WinterJoinRowProps) {
  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      <div className="absolute left-[16px] bottom-[17px] flex items-center pr-[20px]">
        {joined && meAvatar && (
          <div
            className={cn(
              'relative z-[2] size-[40px] shrink-0 rounded-[23.226px] border-[1.5px] border-pr-1 shadow-[0px_0px_16px_0px_rgba(31,32,33,0.4)] overflow-hidden -mr-[20px]',
              justJoined && 'winter-arrive',
            )}
          >
            <img src={meAvatar} alt="Toi" className="absolute inset-0 size-full object-cover" />
          </div>
        )}
        {others.map((src, i) => (
          <div
            key={i}
            className="relative size-[40px] shrink-0 rounded-[23.226px] border-[1.5px] border-tx-1 shadow-[0px_0px_16px_0px_rgba(31,32,33,0.4)] overflow-hidden -mr-[20px]"
          >
            <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
          </div>
        ))}
        {extra > 0 && (
          <div className="relative size-[40px] shrink-0 rounded-[23.226px] border-[1.5px] border-tx-1 bg-tx-2 text-bg-1 flex items-center justify-center font-sans font-bold text-[12px] -mr-[20px]">
            +{extra}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          if (!joined) onJoin()
        }}
        aria-label={joined ? 'Inscrit au défi' : 'Rejoindre le défi'}
        className={cn(
          'pointer-events-auto absolute right-[16px] bottom-[16px] rounded-[8px] flex items-center justify-center gap-[6px] px-[16px] py-[12px] transition-[background-color,opacity,transform] duration-300 active:scale-95',
          joined ? 'bg-tx-2 opacity-80' : 'bg-pr-1',
        )}
      >
        <span className={cn('font-sans font-semibold text-[16px] leading-[1.5]', joined ? 'text-tx-3' : 'text-tx-1')}>
          {joined ? 'Inscrit' : 'Rejoindre'}
        </span>
        <span className="winter-eclats absolute left-1/2 top-1/2 size-0" aria-hidden="true">
          {ECLATS.map((e, i) => (
            <i
              key={i}
              style={{
                width: e.s,
                height: e.s,
                margin: -e.s / 2,
                background: e.c,
                clipPath: e.shape === 'etoile' ? ETOILE : undefined,
                borderRadius: e.shape === 'rond' ? '50%' : e.shape === 'feuille' ? '0 50% 0 50%' : undefined,
                '--x': `${e.x}px`,
                '--y': `${e.y}px`,
                '--r': `${e.r}deg`,
              } as CSSProperties}
            />
          ))}
        </span>
      </button>
    </div>
  )
}
