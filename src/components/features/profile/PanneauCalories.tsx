import type { CSSProperties } from 'react'
import { DAY_LABELS } from '@/hooks/useStreak'
import { attributsPanneau, type PanneauProps } from './panneaux'

interface PanneauCaloriesProps {
  panneau: PanneauProps
  /** Calories par jour de la semaine en cours (lundi → dimanche) */
  calories: number[]
  /** Arrivée sur l'onglet : le total compte, les barres poussent */
  arrivee: boolean
  so: 'A' | 'B'
}

/** Onglet « Calories » de la carte performance (contenu de l'app, animé comme dans O3). */
export default function PanneauCalories({ panneau, calories, arrivee, so }: PanneauCaloriesProps) {
  const total = calories.reduce((a, b) => a + b, 0)
  const max = Math.max(...calories, 1)

  return (
    <div {...attributsPanneau(panneau, { padding: 16 })}>
      <p style={{ margin: '0 0 4px', lineHeight: 1, color: '#f1f4fb' }}>
        <span style={{ fontFamily: "'PT Serif', Georgia, serif", fontWeight: 700, fontSize: 48 }}>
          <span className={'o3-n' + (arrivee ? ' o3-compte' + so : '')} style={{ ...({ '--n': String(total), '--n0': '0', '--n1': String(total) } as CSSProperties), counterReset: 'o3n var(--n)', animationDelay: '.1s' }} />
        </span>
        <span style={{ fontSize: 16, color: '#989da6' }}> </span>
        <span style={{ fontWeight: 600, fontSize: 12, color: '#ffee8c' }}>Kcal</span>
      </p>
      <p style={{ margin: '0 0 16px', fontSize: 12, color: '#989da6' }}>Dépense sur 7 jours</p>
      <div style={{ height: 150, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 4px' }}>
        {calories.map((v, i) => (
          <div key={i} style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
            <div className={arrivee ? 'o3-barre' + so : ''} style={{ width: 12, height: `${Math.max(v / max * 100, v > 0 ? 8 : 0).toFixed(0)}%`, minHeight: v > 0 ? 12 : 0, borderRadius: '16px 16px 0 0', backgroundColor: '#ffee8c', transformOrigin: 'bottom', animationDelay: `${(0.15 + 0.05 * i).toFixed(2)}s` }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', marginTop: 8 }}>
        {DAY_LABELS.map((j) => (
          <span key={j} style={{ flex: '1 1 0%', textAlign: 'center', fontWeight: 600, fontSize: 12, color: '#f1f4fb' }}>{j}</span>
        ))}
      </div>
    </div>
  )
}
