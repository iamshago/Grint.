import type { CSSProperties } from 'react'
import { List, X } from 'lucide-react'

interface LecteurEnteteProps {
  titre: string
  onFermer: () => void
  onRecap: () => void
}

const rond: CSSProperties = {
  width: 40, height: 40, flexShrink: 0, background: '#1b1d1f', borderRadius: 24, border: 0, padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0px 0px 40px 0px rgba(31,32,33,0.4)',
}

/** Entête du lecteur (G-LecteurEntete) : fermer, titre de la séance, récapitulatif. */
export default function LecteurEntete({ titre, onFermer, onRecap }: LecteurEnteteProps) {
  return (
    <div style={{ background: '#0c0c0c', padding: '8px 16px 16px 16px', display: 'flex', alignItems: 'center' }}>
      <button type="button" onClick={onFermer} aria-label="Annuler la séance" className="active:scale-95 transition-transform" style={rond}>
        <X size={16} color="#f1f4fb" style={{ display: 'block' }} />
      </button>
      <h1 style={{ flex: '1 1 0%', margin: 0, textAlign: 'center', fontFamily: "'PT Serif', Georgia, serif", fontWeight: 700, fontSize: 20, lineHeight: '28px', letterSpacing: '-0.6px', color: '#f1f4fb' }}>
        {titre}
      </h1>
      <button type="button" onClick={onRecap} aria-label="Récapitulatif" className="active:scale-95 transition-transform" style={rond}>
        <List size={16} color="#f1f4fb" style={{ display: 'block' }} />
      </button>
    </div>
  )
}
