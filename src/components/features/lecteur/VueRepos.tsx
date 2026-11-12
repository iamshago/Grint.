import { ArrowRight, ChevronLeft } from 'lucide-react'
import LecteurEntete from './LecteurEntete'

interface VueReposProps {
  /** '' quand le repos est à l'écran, sinon 'ls-cache-droite'. */
  classe: string
  /** Le repos est à l'écran : la barre glisse, le chrono peut battre. */
  actif: boolean
  titre: string
  nom: string
  /** Secondes restantes affichées, et durée totale du repos (pour la barre). */
  reste: number
  total: number
  accent: string
  onVideo?: () => void
  onPasser: () => void
  onRetour: () => void
  onFermer: () => void
  onRecap: () => void
}

/** Repos (maquette H1) : S-LecteurRepos + la barre qui se vide sous le chrono, qui bat les 10 dernières secondes. */
export default function VueRepos(p: VueReposProps) {
  const chrono = Math.floor(p.reste / 60) + ':' + String(p.reste % 60).padStart(2, '0')
  const pct = p.total > 0 ? Math.max(0, Math.min(100, (p.reste / p.total) * 100)) : 0
  return (
    <div className={`ls-vue ${p.classe}`} style={{ background: '#0c0c0c' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <LecteurEntete titre={p.titre} onFermer={p.onFermer} onRecap={p.onRecap} />
      </div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 256, height: 256, marginTop: -70, borderRadius: 9999, filter: 'blur(100px)', opacity: 0.48, backgroundColor: p.accent }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', marginTop: -70 }}>
        <p className={p.actif && p.reste <= 10 ? 'ls-bat' : undefined} style={{ margin: 0, fontWeight: 700, fontSize: 116, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-3.48px', color: '#f1f4fb', textAlign: 'center' }}>
          {chrono}
        </p>
      </div>
      <div style={{ position: 'absolute', left: 'calc(50% - 100px)', width: 200, top: '50%', marginTop: 4, height: 4, borderRadius: 4, background: `${p.accent}33`, overflow: 'hidden' }}>
        <div className="ls-barre" style={{ height: '100%', width: `${pct.toFixed(1)}%`, borderRadius: 4, background: p.accent, boxShadow: `0 0 8px ${p.accent}99`, ...(p.actif ? {} : { transition: 'none' }) }} />
      </div>
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: '50%', marginTop: 35, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p style={{ margin: 0, fontWeight: 400, fontSize: 12, color: '#989da6' }}>Prépare-toi pour</p>
        <p style={{ margin: '4px 0 0 0', fontFamily: "'PT Serif', Georgia, serif", fontWeight: 700, fontSize: 20, letterSpacing: '-0.6px', color: '#f1f4fb' }}>{p.nom}</p>
        {p.onVideo && (
          <button
            type="button"
            onClick={p.onVideo}
            className="active:scale-95 transition-transform"
            style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderRadius: 24, border: 0, backgroundColor: `${p.accent}40`, cursor: 'pointer' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={p.accent} stroke={p.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} aria-hidden="true">
              <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
            </svg>
            <span style={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', color: p.accent }}>Comment l'exécuter ?</span>
          </button>
        )}
      </div>
      <div className="cta-position-safe" style={{ position: 'absolute', left: 24, right: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={p.onRetour}
          aria-label="Retour"
          className="active:scale-95 transition-transform"
          style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 12, border: 0, background: '#1b1d1f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronLeft size={20} color="#f1f4fb" style={{ display: 'block' }} />
        </button>
        <button
          type="button"
          className="ls-bouton"
          onClick={p.onPasser}
          style={{ flex: '1 1 0%', border: 0, background: '#1b1d1f', padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: 'inherit' }}
        >
          <span style={{ fontWeight: 600, fontSize: 16, lineHeight: '24px', color: '#f1f4fb' }}>Passer le repos</span>
          <ArrowRight size={20} color="#f1f4fb" style={{ display: 'block' }} />
        </button>
      </div>
    </div>
  )
}
