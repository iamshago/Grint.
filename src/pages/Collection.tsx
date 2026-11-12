import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DarkLayout from '@/components/layout/DarkLayout'
import TopFadeOverlay from '@/components/ui/TopFadeOverlay'
import Medaille from '@/components/features/winter/Medaille'
import VitrineMedaille from '@/components/features/collection/VitrineMedaille'
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile'
import { useCollection } from '@/hooks/useCollection'
import { firstNameOnly } from '@/lib/displayName'
import { dateCourte, enregistrerVues, type MedailleCollection } from '@/lib/collection'
import '@/components/features/collection/collection.css'

const serif = "'PT Serif', Georgia, serif"
const titreSection = { margin: 0, fontFamily: serif, fontWeight: 700, fontSize: 20, letterSpacing: '-0.6px' } as const

/**
 * Page Collection (maquette E4 « Collection · mix », retenue) : le compte, la série du défi
 * Winter et la Régularité. À l'ouverture, la nouvelle médaille arrive en tournant puis le
 * compteur monte ; toucher une médaille l'ouvre en grand (VitrineMedaille).
 */
export default function Collection() {
  const navigate = useNavigate()
  const { profile } = useCurrentUserProfile()
  const { medailles, defi, loading } = useCollection(profile?.id)
  const [choisie, setChoisie] = useState<MedailleCollection | null>(null)

  // Ce qui est gagné est maintenant vu (les « nouveau » restent affichés pendant cette visite)
  useEffect(() => {
    if (!loading && profile?.id) enregistrerVues(profile.id, medailles.filter((m) => m.gagnee).map((m) => m.id))
  }, [loading, profile?.id, medailles])

  const retour = () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1)
    else navigate('/profile')
  }

  if (loading) return <DarkLayout hideTabBar>{null}</DarkLayout>

  const series = [
    ...(defi ? [{ titre: defi.name, liste: medailles.filter((m) => m.serie === 'winter') }] : []),
    { titre: 'Régularité', liste: medailles.filter((m) => m.serie === 'regularite') },
  ]
  const affichees = series.flatMap((s) => s.liste)
  const total = affichees.filter((m) => m.gagnee).length
  const nouvelles = affichees.filter((m) => m.nouveau).length
  const chiffres = nouvelles > 0 ? [total - nouvelles, total] : [total]
  const prenom = firstNameOnly(profile?.display_name) || profile?.username || ''

  return (
    <DarkLayout hideTabBar>
      <TopFadeOverlay variant="dark" />
      <div style={{ position: 'relative', overflowX: 'hidden', paddingBottom: 24, fontFamily: 'Figtree, system-ui, sans-serif', color: '#f1f4fb', lineHeight: 1.5 }}>
        <div style={{ height: 64, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button type="button" onClick={retour} aria-label="Retour" style={{ position: 'absolute', left: 16, top: 12, width: 40, height: 40, borderRadius: '50%', background: '#1b1d1f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f1f4fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
          </button>
          <h1 style={{ margin: 0, fontFamily: serif, fontWeight: 700, fontSize: 20, letterSpacing: '-0.6px' }}>Collection</h1>
        </div>
        <div style={{ margin: '4px 16px 0', display: 'flex', alignItems: 'baseline', gap: 6, lineHeight: 1 }}>
          <span style={{ display: 'inline-block', height: 40, overflow: 'hidden' }}>
            <span className={chiffres.length > 1 ? 'col-compte' : ''} style={{ display: 'flex', flexDirection: 'column', fontFamily: serif, fontWeight: 700, fontSize: 40, lineHeight: '40px', color: '#ffee8c' }}>
              {chiffres.map((n, i) => <span key={i}>{n}</span>)}
            </span>
          </span>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#989da6' }}>/ {affichees.length}</span>
        </div>

        {series.map((s, i) => (
          <div key={s.titre}>
            <div style={{ margin: `${i === 0 ? 22 : 26}px 16px 10px`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h2 style={titreSection}>{s.titre}</h2>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#989da6' }}>{s.liste.filter((m) => m.gagnee).length} / {s.liste.length}</span>
            </div>
            <div style={{ margin: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px 0' }}>
              {s.liste.map((m) => (
                <button key={m.id} type="button" className="col-medaille" onClick={() => setChoisie(m)} aria-label={m.nom} style={{ border: 0, background: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontFamily: 'inherit', color: 'inherit', cursor: 'pointer' }}>
                  <Medaille
                    modele={m.id}
                    etat={m.gagnee ? 'gagnee' : 'verrouillee'}
                    relief={m.nouveau ? '3d' : 'plat'}
                    anim={m.nouveau ? 'arrivee' : 'aucune'}
                    taille={96}
                  />
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, lineHeight: '16px' }}>
                    <b style={{ fontSize: 13, fontWeight: 700, color: m.gagnee ? '#f1f4fb' : '#989da6' }}>{m.nom}</b>
                    <span style={{ fontSize: 12, fontWeight: 600, color: m.nouveau ? '#ffee8c' : '#989da6' }}>
                      {m.nouveau ? 'Nouveau' : m.gagnee && m.date ? dateCourte(m.date) : m.progres || '\u00a0'}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {choisie && <VitrineMedaille key={choisie.id} medaille={choisie} prenom={prenom} onFermer={() => setChoisie(null)} />}
    </DarkLayout>
  )
}
