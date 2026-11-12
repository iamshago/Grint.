import { useEffect, useRef, useState, type PointerEvent as PointerEventReact } from 'react'
import Medaille from '@/components/features/winter/Medaille'
import { dateLongue, type MedailleCollection } from '@/lib/collection'

interface VitrineMedailleProps {
  medaille: MedailleCollection
  /** Prénom gravé au revers */
  prenom: string
  onFermer: () => void
}

/** Rotation Y (et X) en degrés d'une transformation calculée (rotateY(a) rotateX(b)), pour reprendre la main en douceur. */
function angles(el: Element | null | undefined): { y: number; x: number } {
  if (!el) return { y: 0, x: 0 }
  const t = getComputedStyle(el).transform
  if (!t || t === 'none') return { y: 0, x: 0 }
  const m = new DOMMatrix(t)
  return { y: (Math.atan2(-m.m13, m.m11) * 180) / Math.PI, x: (Math.atan2(-m.m32, m.m22) * 180) / Math.PI }
}

// Le doigt : degrés par pixel glissé (une médaille de 240 px fait un demi-tour sur ~330 px), seuil avant de tourner,
// élan gardé au lâcher, ressort (raideur, amortissement) qui pose la médaille de face ou de dos.
const DEG_PX = 0.55, SEUIL = 6, ELAN = 0.3, RAIDEUR = 110, AMORTI = 15

/**
 * La médaille touchée s'ouvre en grand (E4) : elle tourne sur elle-même puis se balance ;
 * la toucher la fait tourner encore et montre son revers gravé. À gagner : la barre de progression.
 * Au doigt (gagnée) : glisser à l'horizontale la fait pivoter autour de son axe vertical (le revers passé 90°) ;
 * au lâcher, elle continue sur sa lancée puis se pose de face ou de dos, avec un ressort, et reprend son balancement.
 */
export default function VitrineMedaille({ medaille: m, prenom, onFermer }: VitrineMedailleProps) {
  const [tour, setTour] = useState<'' | 'a' | 'b' | 'fixe'>('')
  const [balance, setBalance] = useState(true)
  const date = m.date ? dateLongue(m.date) : ''
  const gravure = [prenom.toUpperCase(), date].filter(Boolean).join(' · ')
  const haut = 'env(safe-area-inset-top, 0px)'

  // Pivot : rotateY(base) rotateX(incl) rotateY(angle). Au moment où le doigt prend la main, base et incl
  // reprennent le balancement en cours (exactement), angle reprend le tour en cours : aucun saut.
  const pivot = useRef<HTMLDivElement>(null)
  const p = useRef({ base: 0, incl: 0, angle: 0, vAngle: 0, vIncl: 0, cible: 0, id: 0, doigt: -1, x0: 0, a0: 0, tient: false, glisse: false, traces: [] as Array<[number, number]> })
  const poser = () => {
    const q = p.current
    if (pivot.current) pivot.current.style.transform = `rotateY(${q.base}deg) rotateX(${q.incl}deg) rotateY(${q.angle}deg)`
  }
  useEffect(() => () => cancelAnimationFrame(p.current.id), [])

  const prendre = () => {
    const q = p.current, el = pivot.current
    cancelAnimationFrame(q.id)
    const bal = el?.parentElement, tr = el?.firstElementChild
    // le balancement et le tour en cours passent dans le pivot, puis s'arrêtent
    if (balance) {
      const b = angles(bal)
      q.angle += q.base
      q.base = b.y
      q.incl = b.x
      bal?.getAnimations().forEach((a) => a.cancel())
      setBalance(false)
    }
    if (tour !== 'fixe') {
      q.angle += angles(tr).y
      tr?.getAnimations().forEach((a) => a.cancel())
      setTour('fixe')
    }
    if (el) el.style.willChange = 'transform'
    poser()
  }

  const lacher = (vitesse: number) => {
    const q = p.current
    const reduit = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    // elle continue sur sa lancée : la cible est le demi-tour (face ou dos) le plus proche de là où l'élan la porte
    const v = Math.max(-2400, Math.min(2400, vitesse))
    const total = q.base + q.angle + (reduit ? 0 : v * ELAN)
    q.cible = Math.round(total / 180) * 180 - q.base
    q.vAngle = reduit ? 0 : v
    q.vIncl = 0
    let avant = performance.now()
    const pas = (t: number) => {
      const dt = Math.min(0.032, (t - avant) / 1000)
      avant = t
      for (let k = 0; k < 4; k++) {
        const h = dt / 4
        q.vAngle += (-RAIDEUR * (q.angle - q.cible) - AMORTI * q.vAngle) * h
        q.angle += q.vAngle * h
        q.vIncl += (-RAIDEUR * q.incl - AMORTI * q.vIncl) * h
        q.incl += q.vIncl * h
      }
      const pose = reduit || (Math.abs(q.angle - q.cible) < 0.05 && Math.abs(q.vAngle) < 2 && Math.abs(q.incl) < 0.05 && Math.abs(q.vIncl) < 2)
      if (pose) {
        // posée : tout se ramène à un seul angle (0 ou 180 modulo 360), et le balancement reprend
        q.angle = ((((q.base + q.cible) % 360) + 360) % 360)
        q.base = 0
        q.incl = 0
        poser()
        if (pivot.current) pivot.current.style.willChange = ''
        setBalance(true)
        return
      }
      poser()
      q.id = requestAnimationFrame(pas)
    }
    q.id = requestAnimationFrame(pas)
  }

  const surAppui = (e: PointerEventReact<HTMLButtonElement>) => {
    if (!m.gagnee || p.current.doigt !== -1) return
    const q = p.current
    q.doigt = e.pointerId
    q.x0 = e.clientX
    q.tient = false
    q.glisse = false
    q.traces = [[e.timeStamp, q.angle]]
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const surGlisse = (e: PointerEventReact<HTMLButtonElement>) => {
    const q = p.current
    if (e.pointerId !== q.doigt) return
    const dx = e.clientX - q.x0
    if (!q.tient) {
      if (Math.abs(dx) < SEUIL) return
      q.tient = true
      q.glisse = true
      prendre()
      q.x0 = e.clientX
      q.a0 = q.angle
    }
    q.angle = q.a0 + (e.clientX - q.x0) * DEG_PX
    q.traces.push([e.timeStamp, q.angle])
    while (q.traces.length > 2 && e.timeStamp - q.traces[0][0] > 100) q.traces.shift()
    poser()
  }
  const surLacher = (e: PointerEventReact<HTMLButtonElement>) => {
    const q = p.current
    if (e.pointerId !== q.doigt) return
    q.doigt = -1
    if (!q.tient) return
    q.tient = false
    // vitesse des 100 dernières ms, en degrés par seconde (immobile avant de lâcher : pas d'élan)
    const [t0, a0] = q.traces[0], [t1, a1] = q.traces[q.traces.length - 1]
    const vitesse = e.timeStamp - t1 > 80 || t1 <= t0 ? 0 : ((a1 - a0) / (t1 - t0)) * 1000
    lacher(vitesse)
  }

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
          // un toucher (sans glisser) relance le tour de la planche, même après un glissé
          onClick={() => { if (m.gagnee && !p.current.glisse) setTour((t) => (t === 'a' ? 'b' : 'a')) }}
          onPointerDown={surAppui}
          onPointerMove={surGlisse}
          onPointerUp={surLacher}
          onPointerCancel={surLacher}
          aria-label="Faire tourner la médaille"
          style={{ position: 'relative', pointerEvents: 'auto', border: 0, padding: 0, margin: 0, background: 'none', cursor: m.gagnee ? 'grab' : 'pointer', touchAction: m.gagnee ? 'none' : undefined, WebkitUserSelect: 'none', userSelect: 'none' }}
        >
          <Medaille
            modele={m.id}
            etat={m.gagnee ? 'gagnee' : 'verrouillee'}
            relief={m.gagnee ? '3d' : 'plat'}
            anim="vitrine"
            tour={tour}
            balance={balance}
            pivotRef={pivot}
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
