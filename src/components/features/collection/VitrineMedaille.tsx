import { useState } from 'react'
import Medaille from '@/components/features/winter/Medaille'
import { dateLongue, type MedailleCollection } from '@/lib/collection'

interface VitrineMedailleProps {
  medaille: MedailleCollection
  /** Prénom gravé au revers */
  prenom: string
  onFermer: () => void
}

/**
 * La médaille touchée s'ouvre en grand (E4) : elle tourne sur elle-même puis se balance ;
 * la toucher la fait tourner encore et montre son revers gravé. À gagner : la barre de progression.
 */
export default function VitrineMedaille({ medaille: m, prenom, onFermer }: VitrineMedailleProps) {
  const [tour, setTour] = useState<'' | 'a' | 'b'>('')
  const date = m.date ? dateLongue(m.date) : ''
  const gravure = [prenom.toUpperCase(), date].filter(Boolean).join(' · ')
  const haut = 'env(safe-area-inset-top, 0px)'

  return (
    <div className="col-voile" style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(12,12,12,0.96)', fontFamily: 'Figtree, system-ui, sans-serif', lineHeight: 1.5, color: '#f1f4fb' }}>
      <button type="button" aria-label="Fermer" onClick={onFermer} style={{ position: 'absolute', inset: 0, border: 0, padding: 0, background: 'transparent', cursor: 'pointer' }} />
      <button type="button" aria-label="Fermer" onClick={onFermer} style={{ position: 'absolute', right: 16, top: `calc(${haut} + 12px)`, width: 40, height: 40, border: 0, padding: 0, borderRadius: '50%', background: '#1b1d1f', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f1f4fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
      </button>
      <div style={{ position: 'absolute', left: 0, right: 0, top: `calc(${haut} + 168px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
        <span aria-hidden="true" style={{ position: 'absolute', top: -70, left: '50%', width: 380, height: 380, marginLeft: -190, borderRadius: '50%', background: `radial-gradient(closest-side, ${m.gagnee ? 'rgba(255,238,140,0.2)' : 'rgba(255,238,140,0)'}, rgba(255,238,140,0))` }} />
        <button
          type="button"
          className="col-surgit"
          onClick={() => { if (m.gagnee) setTour((t) => (t === 'a' ? 'b' : 'a')) }}
          aria-label="Faire tourner la médaille"
          style={{ position: 'relative', pointerEvents: 'auto', border: 0, padding: 0, margin: 0, background: 'none', cursor: 'pointer' }}
        >
          <Medaille
            modele={m.id}
            etat={m.gagnee ? 'gagnee' : 'verrouillee'}
            relief={m.gagnee ? '3d' : 'plat'}
            anim="vitrine"
            tour={tour}
            gravure={gravure}
            taille={240}
          />
        </button>
        <h2 className="col-monte" style={{ position: 'relative', margin: '44px 0 0', fontFamily: "'PT Serif', Georgia, serif", fontWeight: 700, fontSize: 32, lineHeight: '40px', letterSpacing: '-0.96px', color: '#f1f4fb' }}>{m.nom}</h2>
        {m.gagnee ? (
          <p className="col-monte" style={{ position: 'relative', margin: '6px 0 0', fontSize: 14, fontWeight: 600, color: '#989da6' }}>{date}</p>
        ) : (
          <div className="col-monte" style={{ position: 'relative', marginTop: 14, width: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: '100%', height: 12, borderRadius: 8, background: 'rgba(77,80,87,0.5)', overflow: 'hidden' }}>
              <div className="col-barre" style={{ height: 12, borderRadius: 8, background: '#ffee8c', boxShadow: '0 0 12px rgba(255,238,140,.45)', transformOrigin: 'left', width: `${m.pct}%` }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#989da6' }}>{m.progres}</span>
          </div>
        )}
      </div>
    </div>
  )
}
