import type { HTMLAttributes } from 'react'
import { IconePlus } from './icones'
import './creer-seance.css'

/** Repos en m:ss (90 → « 1:30 »), comme la planche F5. */
export const enMinutes = (s: number) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')

export interface ReglageAffiche {
  nom: string
  valeur: string
  /** Nombre de changements : alterne les animations vA / vB pour que le saut reparte à chaque toucher. */
  tic: number
  moins: () => void
  plus: () => void
}

interface CarteExerciceProps {
  numero: number
  nom: string
  /** « 4 séries • 8 réps • repos 1:30 » */
  resume: string
  /** Libellé de l'emplacement (« Contraction »…) ou « Libre ». */
  slot: string
  ouvert: boolean
  onBasculer: () => void
  reglages: ReglageAffiche[]
  onChanger: () => void
  onRetirer: () => void
  /** Rejoue l'entrée « pop » (exercice tout juste ajouté). */
  pop?: boolean
  /** Gestes posés sur l'entête (appui long pour remettre en ordre un exercice libre). */
  appui?: HTMLAttributes<HTMLButtonElement>
}

/**
 * Exercice de « Modifier la séance » (planche F5) : la ligne montre ses chiffres ; la toucher ouvre
 * dessous ses trois réglages (− / +), puis « Changer » et « Retirer ». Balisage repris de la planche.
 */
export default function CarteExercice({ numero, nom, resume, slot, ouvert, onBasculer, reglages, onChanger, onRetirer, pop, appui }: CarteExerciceProps) {
  return (
    <div
      className={`${ouvert ? '' : 'f5-ferme'} ${pop ? 'f3-pop' : ''}`}
      style={{ boxSizing: 'border-box', width: '100%', borderRadius: 12, background: '#f1f4fb', boxShadow: '0px 0px 24px 0px rgba(31,32,33,0.08)', overflow: 'hidden' }}
    >
      <button
        type="button"
        {...appui}
        className={`f5-touche ${appui ? 'f5-appui' : ''}`}
        onClick={onBasculer}
        aria-expanded={ouvert}
        style={{ boxSizing: 'border-box', width: '100%', margin: 0, display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: 0, background: 'transparent', fontFamily: 'inherit', textAlign: 'left', color: '#1b1d1f' }}
      >
        <span className="f5-rond" style={{ width: 40, height: 40, borderRadius: 9999, flexShrink: 0, background: ouvert ? '#1b1d1f' : '#dde0e7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 16, lineHeight: '24px', color: ouvert ? '#ffee8c' : '#1b1d1f' }}>{numero}</span>
        </span>
        <span style={{ flex: '1 1 0%', minWidth: 0, overflow: 'hidden' }}>
          <span style={{ display: 'block', fontWeight: 600, fontSize: 16, lineHeight: '24px', color: '#1b1d1f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nom}</span>
          <span style={{ display: 'block', fontWeight: 600, fontSize: 12, lineHeight: '16px', color: '#989da6', whiteSpace: 'nowrap' }}>{resume}</span>
        </span>
        <span style={{ fontWeight: 600, fontSize: 12, lineHeight: '16px', color: '#989da6', whiteSpace: 'nowrap' }}>{slot}</span>
        <svg className="f5-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#989da6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0, transform: `rotate(${ouvert ? 180 : 0}deg)` }} aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div className="f5-tiroir" style={{ gridTemplateRows: ouvert ? '1fr' : '0fr' }} aria-hidden={!ouvert}>
        <div>
          <div className="f5-reglages" style={{ padding: '0 12px 12px' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {reglages.map((r) => (
                <div key={r.nom} style={{ boxSizing: 'border-box', flex: '1 1 0%', minWidth: 0, background: '#ffffff', borderRadius: 12, padding: '8px 0 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 11, lineHeight: '16px', letterSpacing: '0.3px', textTransform: 'uppercase', color: '#989da6' }}>{r.nom}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button type="button" className="f5-touche" onClick={r.moins} tabIndex={ouvert ? 0 : -1} aria-label={`Moins de ${r.nom.toLowerCase()}`} style={{ boxSizing: 'border-box', width: 28, height: 28, margin: 0, padding: 0, border: 0, borderRadius: 9999, background: '#dde0e7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#1b1d1f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} aria-hidden="true"><path d="M5 12h14" /></svg>
                    </button>
                    <span className={r.tic === 0 ? '' : r.tic % 2 ? 'f5-vA' : 'f5-vB'} style={{ display: 'inline-block', minWidth: 40, textAlign: 'center', fontWeight: 700, fontSize: 18, lineHeight: '24px', fontVariantNumeric: 'tabular-nums', color: '#1b1d1f' }}>{r.valeur}</span>
                    <button type="button" className="f5-touche" onClick={r.plus} tabIndex={ouvert ? 0 : -1} aria-label={`Plus de ${r.nom.toLowerCase()}`} style={{ boxSizing: 'border-box', width: 28, height: 28, margin: 0, padding: 0, border: 0, borderRadius: 9999, background: '#dde0e7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#1b1d1f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} aria-hidden="true"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 12, padding: '0 4px' }}>
              <button type="button" onClick={onChanger} tabIndex={ouvert ? 0 : -1} style={ACTION}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} aria-hidden="true"><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>
                Changer
              </button>
              <button type="button" onClick={onRetirer} tabIndex={ouvert ? 0 : -1} style={ACTION}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} aria-hidden="true"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                Retirer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ACTION = { display: 'inline-flex', alignItems: 'center', gap: 6, margin: 0, padding: 0, border: 0, background: 'transparent', fontFamily: 'inherit', fontWeight: 600, fontSize: 12, lineHeight: '16px', color: '#3d4149', cursor: 'pointer' } as const

/** Dernière ligne de la liste (planche F5) : « Ajouter un exercice », rond avec un +. */
export function LigneAjouter({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="f5-touche"
      onClick={onClick}
      style={{ boxSizing: 'border-box', width: '100%', margin: 0, border: 0, display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, background: '#f1f4fb', boxShadow: '0px 0px 24px 0px rgba(31,32,33,0.08)', fontFamily: 'inherit', textAlign: 'left' }}
    >
      <span style={{ width: 40, height: 40, borderRadius: 9999, flexShrink: 0, background: '#dde0e7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconePlus taille={16} trait="#1b1d1f" />
      </span>
      <span style={{ fontWeight: 600, fontSize: 16, lineHeight: '24px', color: '#1b1d1f' }}>Ajouter un exercice</span>
    </button>
  )
}
