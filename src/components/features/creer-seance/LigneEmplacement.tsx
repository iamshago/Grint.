import { IconePlus } from './icones'

interface LigneEmplacementProps {
  /** Numéro de l'exercice (emplacement rempli) ; absent = emplacement vide (+). */
  numero?: number
  titre: string
  /** « 3 séries • 10 réps » si rempli, « Recommandé » sinon. */
  sous: string
  /** Type de l'emplacement, à droite (rempli seulement). */
  slot?: string
  /** Rejoue l'entrée « pop » (l'exercice vient d'être placé). */
  pop?: boolean
  onClick: () => void
}

/** Ligne d'exercice de la nouvelle séance (planches F3 / F4) — même ligne que l'aperçu d'une séance. */
export default function LigneEmplacement({ numero, titre, sous, slot, pop, onClick }: LigneEmplacementProps) {
  const plein = numero != null
  return (
    <button
      type="button"
      className={`f3-touche ${pop ? 'f3-pop' : ''}`}
      onClick={onClick}
      style={{ boxSizing: 'border-box', width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: 0, borderRadius: 12, background: '#f1f4fb', boxShadow: '0px 0px 24px 0px rgba(31,32,33,0.08)', fontFamily: 'inherit', textAlign: 'left', color: '#1b1d1f' }}
    >
      <span style={{ width: 40, height: 40, borderRadius: 9999, flexShrink: 0, background: '#dde0e7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {plein ? (
          <span style={{ fontWeight: 600, fontSize: 16, lineHeight: '24px', color: '#1b1d1f' }}>{numero}</span>
        ) : (
          <IconePlus taille={16} trait="#1b1d1f" />
        )}
      </span>
      <span style={{ flex: '1 1 0%', minWidth: 0, overflow: 'hidden' }}>
        <span style={{ display: 'block', margin: 0, fontWeight: 600, fontSize: 16, lineHeight: '24px', color: '#1b1d1f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titre}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 12, lineHeight: '16px', color: '#989da6' }}>{sous}</span>
        </span>
      </span>
      {plein && slot && (
        <span style={{ fontWeight: 600, fontSize: 12, lineHeight: '16px', color: '#989da6', whiteSpace: 'nowrap' }}>{slot}</span>
      )}
    </button>
  )
}
