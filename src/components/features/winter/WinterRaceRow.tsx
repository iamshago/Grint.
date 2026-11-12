import { WINTER_MONTAGNE } from '@/lib/winter'
import { cn } from '@/lib/utils'
import WinterSnow, { FLOCONS_TETE } from './WinterSnow'
import FondJourNuit from './FondJourNuit'

interface WinterRaceRowProps {
  rang: number
  /** Carte sombre du premier (seulement s'il a des points). */
  tete: boolean
  nom: string
  avatar: string
  pts: number
  summit: number
  moi: boolean
  /** Places gagnées (+) ou perdues (−) depuis lundi ; null = pas de flèche. */
  evol: number | null
  /** Délai d'apparition de la flèche (ms), pour qu'elles sautent de haut en bas. */
  delai: number
  onClick?: () => void
}

const VOILE_TETE = 'linear-gradient(90deg, rgba(13,16,36,.95) 0%, rgba(13,16,36,.8) 32%, rgba(13,16,36,0) 56%)'
/** Le même voile en plein jour : même forme, bleu de jour au lieu du bleu nuit (comme la carte Winter). */
const VOILE_TETE_JOUR = 'linear-gradient(90deg, rgba(24,48,112,.92) 0%, rgba(24,48,112,.76) 32%, rgba(24,48,112,0) 56%)'

/**
 * Une ligne de la course (G-LigneCourse) : la ligne du classement de l'app, avec une piste
 * vers le sommet et la flèche de la semaine. Seul le premier a sa carte sombre, avec le
 * sommet de la montagne et la neige.
 */
export default function WinterRaceRow({ rang, tete, nom, avatar, pts, summit, moi, evol, delai, onClick }: WinterRaceRowProps) {
  const pct = Math.min(100, (pts / summit) * 100)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${rang}. ${nom}, ${pts} pts`}
      className={cn(
        'relative block w-full text-left overflow-hidden active:scale-[0.99] transition-transform',
        tete ? 'h-[88px] rounded-[16px] bg-[#0d1024] shadow-[0_8px_24px_rgba(13,16,36,.35)]' : 'h-[72px] rounded-[12px] bg-white',
      )}
    >
      {tete && (
        // suit l'heure comme la montagne et la carte Winter
        <FondJourNuit
          jour={WINTER_MONTAGNE.teteJour}
          nuit={WINTER_MONTAGNE.tete}
          voile={{ jour: VOILE_TETE_JOUR, nuit: VOILE_TETE }}
          dessus={<WinterSnow flocons={FLOCONS_TETE} fall={100} />}
        />
      )}

      <div
        className={cn('absolute rounded-full overflow-hidden bg-white', tete ? 'left-[14px] top-[18px] size-[52px]' : 'left-[12px] top-[12px] size-[48px]')}
        style={{ boxShadow: tete ? '0 0 0 2px #ffee8c, 0 0 18px rgba(255,238,140,.45)' : moi ? '0 0 0 2.5px #ffee8c' : 'none' }}
      >
        <img src={avatar} alt="" className="size-full object-cover" />
      </div>
      <div
        className={cn(
          'absolute bg-pr-1 rounded-[8px] px-[8px] py-[4px] flex items-center justify-center border-[0.8px]',
          tete ? 'bottom-[14px] left-[44px] border-[#0d1024]' : 'bottom-[12px] left-[40px] border-white',
        )}
      >
        <span className="font-sans font-semibold text-[8px] text-tx-1">{rang}</span>
      </div>

      <p
        className={cn(
          'absolute flex items-center whitespace-nowrap font-serif font-bold text-[20px]',
          tete ? 'left-[80px] top-[16px] gap-[6px] text-bg-1' : 'left-[72px] top-[10px] gap-[8px] text-tx-1',
        )}
      >
        {nom}
        {tete && (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ffee8c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-label="En tête" role="img" className="block">
            <path d="M4 22V4l12 5-12 5" />
          </svg>
        )}
        {evol !== null && <Fleche evol={evol} delai={delai} />}
      </p>

      <div
        className={cn('absolute h-[8px] rounded-[8px] overflow-hidden', tete ? 'left-[80px] right-[104px] top-[56px] bg-[rgba(241,244,251,.18)]' : 'left-[72px] right-[104px] top-[48px] bg-surface')}
      >
        <div
          className={cn('h-full rounded-[8px]', tete ? 'bg-pr-1 shadow-[0_0_12px_rgba(255,238,140,.6)]' : 'bg-tx-1')}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div
        className={cn(
          'absolute bg-pr-1 rounded-[8px] flex items-center justify-center p-[12px] min-w-[72px]',
          tete ? 'top-1/2 -translate-y-1/2 right-[16px]' : 'bottom-[15px] right-[15px]',
        )}
      >
        <span className="font-sans font-semibold text-[16px] text-tx-1 leading-none whitespace-nowrap">
          {pts} <span className="font-medium text-[12px] text-[#49452c]">pts</span>
        </span>
      </div>
    </button>
  )
}

/** ▲ n vert = places gagnées depuis lundi, ▼ n rouge = perdues, = gris si rien ne bouge. */
function Fleche({ evol, delai }: { evol: number; delai: number }) {
  const style = { animationDelay: `${delai}ms` }
  if (evol > 0) return <span className="winter-evol" style={{ ...style, color: '#2fb36b' }}>▲ {evol}</span>
  if (evol < 0) return <span className="winter-evol" style={{ ...style, color: '#e8413a' }}>▼ {-evol}</span>
  return <span className="winter-evol" style={{ ...style, color: '#989da6' }}>=</span>
}
