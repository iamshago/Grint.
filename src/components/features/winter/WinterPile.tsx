/** Un participant posé sur la montagne. */
export interface Grimpeur {
  id: string
  nom: string
  avatar: string
  pts: number
  /** Visage (ami ou premier) plutôt qu'un simple point. */
  visage: boolean
  /** Premier de la course : anneau jaune. */
  tete: boolean
}

interface WinterPileProps {
  membres: Grimpeur[]
  ouvert: boolean
  onToggle: () => void
}

/**
 * Amis au même endroit du chemin (1 pt d'écart ou moins) : une pile avec un compteur.
 * Toucher la pile la déploie vers le haut, avec prénom et points (maquette C7).
 */
export default function WinterPile({ membres, ouvert, onToggle }: WinterPileProps) {
  const n = membres.length
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={membres.map((m) => `${m.nom} ${m.pts} pts`).join(', ')}
      aria-expanded={n > 1 ? ouvert : undefined}
      className="absolute left-0 top-0 size-[26px] p-0 m-0 border-0 bg-transparent cursor-pointer"
    >
      {membres.map((m, i) => (
        <span
          key={m.id}
          className="winter-membre absolute left-0 top-0 size-[26px]"
          style={{ zIndex: n - i, transform: ouvert ? `translate(0px, ${-i * 32}px)` : `translate(${i * 9}px, 0px)` }}
        >
          <img
            src={m.avatar}
            alt=""
            className="block size-[26px] rounded-full object-cover"
            style={{ boxShadow: `${m.tete ? '0 0 0 2px #ffee8c' : '0 0 0 1.5px rgba(241,244,251,.85)'}, 0 4px 10px rgba(0,0,0,.35)` }}
          />
          <span
            className="winter-nom absolute left-[32px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[rgba(13,16,36,.85)] text-bg-1 text-[11px] font-bold px-[8px] py-[2px]"
            style={{ opacity: ouvert ? 1 : 0 }}
          >
            {m.nom} · {m.pts}
          </span>
        </span>
      ))}
      {n > 1 && (
        <span
          className="winter-compte absolute top-[-6px] z-[9] min-w-[16px] h-[16px] px-[4px] rounded-full bg-bg-1 text-tx-1 text-[10px] font-extrabold leading-[16px] text-center"
          style={{ left: 14 + (n - 1) * 9, opacity: ouvert ? 0 : 1 }}
        >
          {n}
        </span>
      )}
    </button>
  )
}
