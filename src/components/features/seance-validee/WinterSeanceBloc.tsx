import type { CSSProperties, ReactNode } from 'react'
import type { WinterSeance } from '@/hooks/useWinterSeance'
import Medaille from '@/components/features/winter/Medaille'

const MEDAILLE_ICONE = (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ffee8c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-label="Médaille" role="img" style={{ display: 'block' }}>
    <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
  </svg>
)
const puce: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 10px', borderRadius: 9999, background: '#2c2c2e',
  fontWeight: 600, fontSize: 12, lineHeight: 1, color: '#dde0e7', whiteSpace: 'nowrap',
}
const badgeRang: CSSProperties = {
  position: 'absolute', left: 26, bottom: -4, boxSizing: 'border-box', minWidth: 18, height: 18, padding: '0 5px', borderRadius: 8,
  border: '1px solid #1b1d1f', background: '#ffee8c', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 700, fontSize: 10, color: '#1b1d1f',
}

/** Rang qui roule d'une valeur à l'autre (deux chiffres empilés, .sv-rang les fait glisser). */
function Rang({ de, a }: { de: number; a: number }) {
  return (
    <span style={badgeRang}>
      <span style={{ display: 'block', height: 10, overflow: 'hidden' }}>
        <span className="sv-rang" style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ display: 'block', height: 10, lineHeight: '10px' }}>{de}</span>
          <span style={{ display: 'block', height: 10, lineHeight: '10px' }}>{a}</span>
        </span>
      </span>
    </span>
  )
}

/**
 * Bloc Winter de la séance validée (B1-Seance-validee) : +1 pt, les missions bouclées
 * (une médaille chacune), qui tu doubles, la jauge vers le sommet et la médaille du palier.
 * Balisage, tailles et délais repris de la maquette.
 */
export default function WinterSeanceBloc({ s }: { s: WinterSeance }) {
  const pct = (v: number) => `${((Math.min(v, s.summit) / s.summit) * 100).toFixed(3)}%`
  const delaisPuces = [2.6, 2.9, 3.2]
  const puces: Array<{ cle: string; contenu: ReactNode }> = [
    { cle: 'seance', contenu: <><b style={{ fontWeight: 800, color: '#ffee8c' }}>+1</b>Séance</> },
    ...(s.missions.hautBas ? [{ cle: 'hautbas', contenu: <>{MEDAILLE_ICONE}Haut + bas</> }] : []),
    ...(s.missions.record ? [{ cle: 'record', contenu: <>{MEDAILLE_ICONE}Record</> }] : []),
  ]

  return (
    <div
      className="sv-entre"
      style={{ animationDelay: '1.75s', width: '100%', boxSizing: 'border-box', padding: '16px 24px 18px', borderRadius: 24, background: '#1b1d1f' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <p style={{ margin: 0, fontFamily: "'PT Serif', Georgia, serif", fontWeight: 700, fontSize: 20, lineHeight: 1.25, letterSpacing: '-0.6px', color: '#f1f4fb' }}>{s.nom}</p>
        <span className="sv-pop" style={{ animationDelay: '2.35s', flexShrink: 0, display: 'block', padding: '4px 10px', borderRadius: 9999, background: '#ffee8c', boxShadow: '0 0 18px rgba(255,238,140,.35)', fontWeight: 800, fontSize: 13, lineHeight: '16px', color: '#1b1d1f', whiteSpace: 'nowrap' }}>+1 pt</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {puces.map((p, i) => (
          <span key={p.cle} className="sv-puce" style={{ ...puce, animationDelay: `${delaisPuces[i]}s` }}>{p.contenu}</span>
        ))}
      </div>

      {s.depasse && (
        <div style={{ display: 'flex', alignItems: 'center', height: 44, marginTop: 14 }}>
          <div style={{ position: 'relative', width: 92, height: 40, flexShrink: 0 }}>
            <div className="sv-recule" style={{ position: 'absolute', left: 52, top: 0, width: 40, height: 40, zIndex: 1 }}>
              <img src={s.depasse.avatar} alt={s.depasse.nom} style={{ display: 'block', width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', background: '#2c2c2e', boxShadow: '0 0 0 2px #1b1d1f' }} />
              <Rang de={s.depasse.rangAvant} a={s.depasse.rang} />
            </div>
            <div className="sv-passe" style={{ position: 'absolute', left: 0, top: 0, width: 40, height: 40, zIndex: 2 }}>
              <i className="sv-onde" style={{ left: 0, top: 0, width: 40, height: 40, animationDelay: '4.12s' }} />
              <img src={s.moiAvatar} alt="Toi" style={{ display: 'block', width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', background: '#2c2c2e', boxShadow: '0 0 0 2px #ffee8c, 0 0 16px rgba(255,238,140,.45)' }} />
              <Rang de={s.rangAvant} a={s.rang} />
            </div>
          </div>
          <p className="sv-glisse" style={{ animationDelay: '4.05s', margin: '0 0 0 16px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 14, lineHeight: 1.2, color: '#f1f4fb', whiteSpace: 'nowrap' }}>
            <span style={{ width: 20, height: 20, flexShrink: 0, borderRadius: '50%', background: 'rgba(255,238,140,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffee8c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></svg>
            </span>
            Tu passes devant {s.depasse.nom}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
        <div style={{ flex: '1 1 0%', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: 12, lineHeight: 1, color: '#dde0e7', paddingBottom: 3 }}>Vers le sommet</span>
            <span style={{ display: 'flex', alignItems: 'flex-end', gap: 4, lineHeight: 1 }}>
              <span style={{ display: 'block', height: 20, overflow: 'hidden' }}>
                <span className="sv-compteur" style={{ display: 'block', fontFamily: "'PT Serif', Georgia, serif", fontWeight: 700, fontSize: 18, color: '#ffee8c', fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ display: 'block', height: 20, lineHeight: '20px' }}>{s.ptsAvant}</span>
                  <span style={{ display: 'block', height: 20, lineHeight: '20px' }}>{s.pts}</span>
                </span>
              </span>
              <span style={{ fontWeight: 700, fontSize: 12, color: '#989da6', paddingBottom: 3 }}>/ {s.summit}</span>
            </span>
          </div>
          <div style={{ position: 'relative', marginTop: 6, height: 12, borderRadius: 8, overflow: 'hidden', background: '#3d4149' }}>
            <div className="sv-barre" style={{ height: '100%', borderRadius: 8, background: '#ffee8c', boxShadow: '0 0 15.5px 5px rgba(255,255,255,0.2)', '--sv-de': pct(s.ptsAvant), '--sv-a': pct(s.pts) } as CSSProperties} />
            <i style={{ position: 'absolute', top: 0, bottom: 0, left: `calc(${pct(s.palier.seuil)} - 1px)`, width: 2, background: '#1b1d1f' }} />
          </div>
        </div>
        <span className={s.palier.nouveau ? 'sv-chute' : undefined} style={{ position: 'relative', display: 'block', width: 40, height: 40, flexShrink: 0, opacity: s.palier.nouveau ? 1 : 0.28 }}>
          {s.palier.nouveau && <i className="sv-onde" style={{ left: 0, top: 0, width: 40, height: 40, animationDelay: '3.18s' }} />}
          <Medaille modele={s.palier.modele} etat={s.palier.nouveau ? 'gagnee' : 'verrouillee'} anim={s.palier.nouveau ? 'nouveau' : 'aucune'} taille={40} />
          {s.palier.nouveau && (
            <i className="sv-pop" aria-label="Nouveau" style={{ animationDelay: '3.45s', position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: '50%', background: '#ffee8c', boxShadow: '0 0 0 2px #1b1d1f, 0 0 10px rgba(255,238,140,.6)' }} />
          )}
        </span>
      </div>
    </div>
  )
}
