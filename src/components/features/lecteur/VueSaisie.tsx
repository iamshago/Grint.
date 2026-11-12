import type { CSSProperties, ReactNode } from 'react'
import LecteurEntete from './LecteurEntete'

interface VueSaisieProps {
  /** '' quand la vue est à l'écran, sinon 'ls-cache-gauche' (le repos est passé devant). */
  classe: string
  titre: string
  nom: string
  /** Objectif de reps de l'exercice (« 8-10 »). */
  objectif: string
  serie: number
  totalSeries: number
  /** La série vient d'être validée : coche tracée, reflet, segment rempli. */
  validee: boolean
  accent: string
  teinteSerie: string
  teinteValidee: string
  /** Les deux molettes (poids, reps) et la bulle de motivation. */
  children: ReactNode
  onValider: () => void
  onFermer: () => void
  onRecap: () => void
}

const centre: CSSProperties = { position: 'absolute', left: '50%', transform: 'translateX(-50%)' }

/** Saisie d'une série (maquette H1) : S-LecteurSaisie + les segments de série + « Série validée ». */
export default function VueSaisie(p: VueSaisieProps) {
  const fait = p.serie - 1 + (p.validee ? 1 : 0)
  const segments = Array.from({ length: p.totalSeries }, (_, k) => k + 1)
  return (
    <div className={`ls-vue ${p.classe}`}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <LecteurEntete titre={p.titre} onFermer={p.onFermer} onRecap={p.onRecap} />
      </div>
      <div style={{ ...centre, top: 128 }}>
        <span style={{ display: 'inline-flex', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap', backgroundColor: `${p.accent}40`, border: `1px solid ${p.accent}`, color: p.accent }}>
          série{' '}<span className="ls-serie" key={p.serie}>{p.serie}</span>{' '}sur {p.totalSeries}
        </span>
      </div>
      <h2 style={{ ...centre, top: 170, margin: 0, fontFamily: "'PT Serif', Georgia, serif", fontWeight: 700, fontSize: 32, letterSpacing: '-0.96px', color: '#f1f4fb', textAlign: 'center', whiteSpace: 'nowrap' }}>
        {p.nom}
      </h2>
      <div style={{ ...centre, top: 223, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
        <span style={{ fontWeight: 400, fontSize: 16, color: '#989da6' }}>Objectif ciblé :</span>
        <span style={{ fontWeight: 700, fontSize: 16, color: p.accent }}>{p.objectif} reps</span>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 254, display: 'flex', justifyContent: 'center', gap: 6 }}>
        {segments.map((i) => (
          <i
            key={i}
            className="ls-seg"
            style={{ width: i === p.serie && !p.validee ? 28 : 18, background: i <= fait ? p.accent : i === p.serie ? p.teinteSerie : '#2c2e31' }}
          />
        ))}
      </div>
      {p.children}
      <button
        type="button"
        className={`ls-bouton cta-position-safe${p.validee ? ' ls-ok' : ''}`}
        onClick={p.onValider}
        style={{
          position: 'absolute', left: 24, right: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: 16, border: 0, borderRadius: 12, fontFamily: 'inherit', fontWeight: 600, fontSize: 16, lineHeight: '24px',
          backgroundColor: p.accent, color: '#1b1d1f', boxShadow: `0px 0px 20px 0px ${p.accent}4D`, overflow: 'hidden',
          ['--ls-validee' as string]: p.teinteValidee,
        } as CSSProperties}
      >
        <svg className="ls-coche" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b1d1f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <span>{p.validee ? 'Série validée' : 'Valider ma série'}</span>
        <i className="ls-reflet" />
      </button>
    </div>
  )
}
