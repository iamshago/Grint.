import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import PanneauFrequence from './PanneauFrequence'
import PanneauRecord from './PanneauRecord'
import PanneauCalories from './PanneauCalories'
import { NG, type ExoRecord } from './crete'
import type { PanneauProps } from './panneaux'
import './performance.css'

type Onglet = 'frequence' | 'record' | 'calories'
type Groupe = 'onglet' | 'crete' | 'bulle'

interface CartePerformanceProps {
  workoutDays: Record<string, string>
  calories: number[]
  /** Exercices avec leur historique, triés comme les records (du plus lourd au plus léger) */
  exos: ExoRecord[]
  /** Exercice affiché (celui de la carte Record) */
  exoActif: string | null
  onChoisirExo: (nom: string) => void
}

interface Etat {
  pose: Partial<Record<Groupe, boolean>>
  onglet: Onglet
  ongletAvant: Onglet
  nOnglet: number
  jeu: number
  mode: 'dessin' | 'onde'
  exoAvant: string | null
  sel: number | null
  nBulle: number
}

// Onglets : position et largeur de chaque pastille (planche O3)
const ONGLETS: Array<[Onglet, string, number, number]> = [['frequence', 'Fréquence', 16, 90], ['record', 'Record personnel', 114, 128], ['calories', 'Calories', 250, 76]]
const ab = (n: number) => (n % 2 ? 'A' : 'B') as 'A' | 'B'
const libelle = (couleur: string) => ({ fontWeight: 600, fontSize: 12, lineHeight: '18px', whiteSpace: 'nowrap', color: couleur }) as const

/**
 * Carte performance du Profil (maquette O3 v2) : Fréquence / Record personnel / Calories.
 * Onglets animés (la pastille glisse, le contenu glisse en fondu) ; arriver sur Record redessine
 * la crête ; changer d'exercice la fait onduler ; toucher un point ouvre sa bulle en ressort.
 * Chaque animation existe sous deux noms (A, B) : le nom change à chaque action, ce qui la rejoue ;
 * au repos, aucune classe d'animation.
 */
export default function CartePerformance({ workoutDays, calories, exos, exoActif, onChoisirExo }: CartePerformanceProps) {
  const debut: Onglet = exos.length > 0 ? 'record' : 'frequence'
  const [st, setSt] = useState<Etat>({ pose: {}, onglet: debut, ongletAvant: debut, nOnglet: 0, jeu: 0, mode: 'dessin', exoAvant: null, sel: null, nBulle: 0 })
  const minuteurs = useRef<Partial<Record<Groupe, number>>>({})

  // Lance un groupe d'animations ; à la fin, le groupe repasse au repos (plus de classe d'animation).
  const jouer = useCallback((groupes: Groupe[], s: Partial<Etat>) => {
    groupes.forEach((g) => {
      window.clearTimeout(minuteurs.current[g])
      minuteurs.current[g] = window.setTimeout(() => setSt((e) => ({ ...e, pose: { ...e.pose, [g]: true } })), g === 'bulle' ? 900 : 2600)
    })
    setSt((e) => ({ ...e, ...s, pose: { ...e.pose, ...Object.fromEntries(groupes.map((g) => [g, false])) } }))
  }, [])
  useEffect(() => () => Object.values(minuteurs.current).forEach((t) => window.clearTimeout(t)), [])

  // Largeur dispo : la carte est dessinée en 370 px et mise à l'échelle sur les écrans plus étroits
  const boite = useRef<HTMLDivElement>(null)
  const [echelle, setEchelle] = useState(1)
  // À l'ouverture, la crête se dessine (une fois) quand la carte arrive à l'écran ; ouverte sur « Fréquence »
  // (aucun record), ce sont les jours faits du mois qui éclosent
  const dessinee = useRef(false)
  const [apparitionF, setApparitionF] = useState(0)
  useLayoutEffect(() => {
    const el = boite.current
    if (!el) return
    const mesure = () => setEchelle(Math.min(1, el.clientWidth / 370))
    mesure()
    const ro = new ResizeObserver(mesure)
    ro.observe(el)
    let io: IntersectionObserver | null = null
    const lancer = () => {
      if (dessinee.current) return
      dessinee.current = true
      if (debut === 'record') jouer(['crete'], { jeu: 1, mode: 'dessin' })
      else setApparitionF(1)
    }
    const r = el.getBoundingClientRect()
    if (r.top < window.innerHeight - 0.2 * r.height && r.bottom > 0) lancer()
    else {
      io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { lancer(); io?.disconnect() } }, { threshold: 0.2 })
      io.observe(el)
    }
    return () => { ro.disconnect(); io?.disconnect() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const joue = (g: Groupe) => st.pose[g] === false
  const og = st.onglet, ogAv = st.ongletAvant
  const io = ONGLETS.findIndex((o) => o[0] === og), iav = ONGLETS.findIndex((o) => o[0] === ogAv)
  const animO = joue('onglet'), so = ab(st.nOnglet)
  const oc = ONGLETS[io], oa = ONGLETS[iav]
  const xm = Math.min(oa[2], oc[2]), wm = Math.max(oa[2] + oa[3], oc[2] + oc[3]) - xm
  const indVars = { '--x0': oa[2] + 'px', '--w0': oa[3] + 'px', '--xm': xm + 'px', '--wm': wm + 'px', '--x1': oc[2] + 'px', '--w1': oc[3] + 'px' } as unknown as CSSProperties
  const panneau = (k: Onglet): PanneauProps => {
    const actif = k === og
    return {
      actif,
      sens: (io > iav ? 36 : -36) + 'px',
      cls: animO ? (actif ? 'o3-entre' + so : k === ogAv ? 'o3-sort' + so : '') : '',
    }
  }
  const choisirOnglet = (k: Onglet) => {
    if (k === og) return
    const s = { onglet: k, ongletAvant: og, nOnglet: st.nOnglet + 1 }
    if (k === 'record') jouer(['onglet', 'crete'], { ...s, jeu: st.jeu + 1, mode: 'dessin', sel: null })
    else jouer(['onglet'], s)
  }
  const ng = useMemo(() => Math.max(NG, ...exos.map((e) => e.seances.length)), [exos])
  const nom = exoActif && exos.some((e) => e.nom === exoActif) ? exoActif : exos[0]?.nom ?? ''

  return (
    <div ref={boite} style={{ position: 'relative', width: '100%', height: 436 * echelle }}>
      <div style={{ position: 'relative', width: 370, height: 436, overflow: 'hidden', borderRadius: 16, background: 'linear-gradient(to bottom, #1b1d1f, #0c0c0c)', transform: echelle < 1 ? `scale(${echelle})` : undefined, transformOrigin: 'top left', fontFamily: 'Figtree, system-ui, sans-serif', lineHeight: 1.5, color: '#f1f4fb' }}>
        {/* onglets : la pastille jaune glisse et porte avec elle les libellés sombres */}
        <div style={{ position: 'relative', height: 58 }}>
          {ONGLETS.map(([k, lib, x, w]) => (
            <span key={k}>
              <button type="button" className="o3-ob" onClick={() => choisirOnglet(k)} aria-label={lib} style={{ position: 'absolute', top: 16, left: x, width: w, height: 42, margin: 0, padding: 0, border: 0, borderRadius: 9999, background: 'transparent', zIndex: 2, cursor: 'pointer' }} />
              <div className="o3-op" style={{ position: 'absolute', top: 16, left: x, width: w, height: 42, borderRadius: 9999, backgroundColor: '#3d4149', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={libelle('#f1f4fb')}>{lib}</span></div>
            </span>
          ))}
          <div className={animO ? 'o3-glisse' + so : ''} style={{ position: 'absolute', top: 16, left: 0, height: 42, width: oc[3], transform: `translateX(${oc[2]}px)`, overflow: 'hidden', borderRadius: 9999, backgroundColor: '#ffee8c', zIndex: 1, pointerEvents: 'none', ...indVars }}>
            <div className={animO ? 'o3-contre' + so : ''} style={{ position: 'absolute', top: 0, left: 0, width: 370, height: 42, transform: `translateX(-${oc[2]}px)`, ...indVars }}>
              {ONGLETS.map(([k, lib, x, w]) => (
                <div key={k} style={{ position: 'absolute', top: 0, left: x, width: w, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={libelle('#1b1d1f')}>{lib}</span></div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', top: 58, left: 0, right: 0, height: 378 }}>
          <PanneauFrequence panneau={panneau('frequence')} workoutDays={workoutDays} arrivee={animO && og === 'frequence'} so={so} apparition={apparitionF} />
          {exos.length > 0 ? (
            <PanneauRecord
              panneau={panneau('record')}
              exos={exos}
              nom={nom}
              ng={ng}
              mode={joue('crete') ? st.mode : ''}
              exoAvant={st.exoAvant}
              sc={ab(st.jeu)}
              sel={st.sel}
              bulleCls={joue('bulle') ? 'o3-bulle' + ab(st.nBulle) : ''}
              onChoisirExo={(e) => {
                jouer(['crete'], { exoAvant: nom, jeu: st.jeu + 1, mode: 'onde', sel: null })
                onChoisirExo(e)
              }}
              onChoisirPoint={(sel) => jouer(['bulle'], { sel, nBulle: st.nBulle + 1 })}
            />
          ) : (
            // Aucun record : le message de l'app (état absent de la planche)
            <div style={{ position: 'absolute', inset: 0, display: og === 'record' ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ margin: 0, fontSize: 14, color: '#989da6' }}>Aucune donnée pour le moment</p>
            </div>
          )}
          <PanneauCalories panneau={panneau('calories')} calories={calories} arrivee={animO && og === 'calories'} so={so} />
        </div>
      </div>
    </div>
  )
}
