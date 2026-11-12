import { placeParts } from '@/lib/winter'

interface WinterPlaceBarProps {
  avatar: string
  /** Avant le départ : jours restants, à la place du rang. */
  daysToStart: number | null
  place: number | null
  pts: number
  /** Places gagnées (+) ou perdues (−) depuis ta dernière visite. */
  deltaPlace: number
  /** Points gagnés depuis ta dernière visite. */
  gain: number
  /** « à 3 pts de agz », « en tête », « départ le 16 novembre ». */
  ecart: string
  onClick: () => void
}

/** Ta place, toujours visible en bas de la page défi, avec ▲ ou ▼ depuis ta dernière visite (C5). */
export default function WinterPlaceBar({ avatar, daysToStart, place, pts, deltaPlace, gain, ecart, onClick }: WinterPlaceBarProps) {
  const anim = deltaPlace > 0 ? 'winter-rang' : deltaPlace < 0 ? 'winter-rang-bas' : undefined
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Voir ta place dans la course"
      className="fixed left-1/2 -translate-x-1/2 z-30 w-[calc(100%-32px)] max-w-[370px] h-[64px] pl-[12px] pr-[16px] rounded-[16px] bg-tx-1 text-bg-1 flex items-center gap-[12px] text-left shadow-[0_8px_24px_rgba(31,32,33,.32)]"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
    >
      <img src={avatar} alt="" className="size-[40px] rounded-full object-cover shrink-0" style={{ boxShadow: '0 0 0 2px #ffee8c' }} />
      <div className="flex-1 min-w-0 flex flex-col">
        <b className={`${anim ?? ''} font-sans text-[16px] font-bold leading-[20px] whitespace-nowrap`}>
          {daysToStart !== null ? (
            <>J-{daysToStart}</>
          ) : place ? (
            <>
              {placeParts(place).n}
              <sup>{placeParts(place).suffix}</sup>
            </>
          ) : (
            '–'
          )}{' '}
          · {pts} pts
          {deltaPlace > 0 && <span className="winter-fleche" style={{ color: '#2fb36b' }}>▲ {deltaPlace}</span>}
          {deltaPlace < 0 && <span className="winter-fleche" style={{ color: '#ff5a52' }}>▼ {-deltaPlace}</span>}
        </b>
        <span className={`${anim ?? ''} font-sans text-[12px] text-tx-3 leading-[16px] truncate`}>{ecart}</span>
      </div>
      {gain > 0 && (
        <span className="winter-gain shrink-0 font-sans text-[14px] font-extrabold text-tx-1 bg-pr-1 rounded-full px-[10px] py-[4px] shadow-[0_0_18px_rgba(255,238,140,.45)]">
          +{gain} pt{gain > 1 ? 's' : ''}
        </span>
      )}
    </button>
  )
}
