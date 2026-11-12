import Medaille from '@/components/features/winter/Medaille'
import type { MedailleCollection } from '@/lib/collection'

interface CarteCollectionProps {
  medailles: MedailleCollection[]
  onOuvrir: () => void
}

/**
 * Carte « Collection » du Profil (maquette E1) : le compte, les 4 dernières médailles gagnées
 * (la plus récente d'abord, point jaune si elle est nouvelle) et « +n » pour les autres.
 */
export default function CarteCollection({ medailles, onOuvrir }: CarteCollectionProps) {
  const gagnees = medailles
    .filter((m) => m.gagnee)
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
  const vues = gagnees.slice(0, 4)
  const reste = gagnees.length - vues.length

  return (
    <button
      type="button"
      onClick={onOuvrir}
      aria-label="Ouvrir la collection"
      style={{ position: 'relative', display: 'block', width: '100%', boxSizing: 'border-box', padding: '14px 12px 16px', borderRadius: 16, background: '#1b1d1f', color: '#f1f4fb', textAlign: 'left', lineHeight: 1.5 }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ffee8c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" /><circle cx="12" cy="8" r="6" /></svg>
        <span style={{ flex: '1 1 0%', fontWeight: 700, fontSize: 14, color: '#ffee8c' }}>Collection</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#f1f4fb' }}>{gagnees.length} <span style={{ color: '#989da6', fontWeight: 600 }}>/ {medailles.length}</span></span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#989da6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="m9 18 6-6-6-6" /></svg>
      </span>
      {vues.length > 0 && (
        // 4 × 64 + 52 sur 346 px : 9,5 px entre chaque, comme le space-between de la planche
        <span style={{ display: 'flex', marginTop: 14, alignItems: 'center', gap: 9.5 }}>
          {vues.map((m) => (
            <span key={m.id} style={{ position: 'relative', display: 'block' }}>
              <Medaille modele={m.id} etat="gagnee" anim={m.nouveau ? 'nouveau' : 'aucune'} taille={64} />
              {m.nouveau && (
                <i aria-label="Nouveau" style={{ position: 'absolute', top: 2, right: 2, width: 10, height: 10, borderRadius: '50%', background: '#ffee8c', boxShadow: '0 0 0 2px #1b1d1f, 0 0 10px rgba(255,238,140,.6)' }} />
              )}
            </span>
          ))}
          {reste > 0 && (
            <span style={{ width: 52, height: 52, borderRadius: '50%', background: '#3d4149', color: '#f1f4fb', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+{reste}</span>
          )}
        </span>
      )}
    </button>
  )
}
