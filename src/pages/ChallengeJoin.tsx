import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useChallengeParticipation } from '@/hooks/useChallengeParticipation'
import type { Challenge } from '@/types'

/** Page Rejoindre — full-bleed, photo hero + carte sticky en bas. */
export default function ChallengeJoin() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)
  const { join, loading: joining } = useChallengeParticipation(id)

  useEffect(() => {
    if (!id) return
    supabase
      .from('challenges')
      .select('id, name, description, hero_image_url, cover_image_url, starts_at, ends_at, sessions_per_week_per_member, is_active')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        const ch = (data as Challenge | null) ?? null
        setChallenge(ch)
        setLoading(false)
        if (!ch) navigate('/community', { replace: true })
      })
  }, [id, navigate])

  // Si déjà rejoint → rediriger directement vers la page Détail (on ne doit jamais
  // pouvoir revenir sur Join une fois rejoint)
  useEffect(() => {
    if (!id) return
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) navigate(`/community/challenges/${id}`, { replace: true })
    })
  }, [id, navigate])

  const handleJoin = async () => {
    try {
      await join()
      if (id) navigate(`/community/challenges/${id}`, { replace: true })
    } catch {
      // erreur silencieuse — pourrait être améliorée avec un toast plus tard
    }
  }

  if (loading || !challenge) {
    return (
      <div className="h-[100dvh] bg-tx-1 flex items-center justify-center text-bg-1 font-sans">
        Chargement…
      </div>
    )
  }

  const heroUrl = challenge.hero_image_url || '/assets/challenges/kikicac-hero.jpg'

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-tx-1 text-bg-1">
      {/* Photo hero */}
      <img
        src={heroUrl}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      {/* Voile sombre top pour la lisibilité du back button */}
      <div className="absolute inset-x-0 top-0 h-[200px] bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

      {/* Bouton retour */}
      <button
        type="button"
        aria-label="Retour"
        onClick={() => navigate(-1)}
        className="absolute left-[16px] top-[72px] size-[40px] rounded-[24px] bg-white flex items-center justify-center z-10"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 12L6 8L10 4" stroke="#1b1d1f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Titre "Défis" centré — fix lisibilité sur photo sombre (Figma le dessine en dark
          mais c'est invisible en condition réelle, on force light + ombre) */}
      <p
        className="absolute left-1/2 -translate-x-1/2 top-[28px] font-serif font-bold text-[20px] text-bg-1 tracking-[-0.6px] z-10"
        style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
      >
        Défis
      </p>

      {/* Carte sticky bas */}
      <div className="absolute left-0 right-0 bottom-0 bg-tx-1 rounded-t-[24px] flex flex-col items-center gap-[12px] px-[24px] py-[32px] pb-[120px]">
        <h1 className="font-serif font-bold text-[32px] text-bg-1 tracking-[-0.96px] text-center">
          {challenge.name}
        </h1>
        <ChallengeDescription description={challenge.description} />
      </div>

      {/* CTA Rejoindre */}
      <button
        type="button"
        onClick={handleJoin}
        disabled={joining}
        className="absolute left-[24px] right-[24px] bottom-[40px] bg-pr-1 rounded-[12px] py-[16px] font-sans font-semibold text-[16px] text-tx-1 shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)] disabled:opacity-60"
      >
        {joining ? 'Rejoindre en cours…' : 'Rejoindre vos amis'}
      </button>
    </div>
  )
}

/** Met en évidence en gold les passages clés "X séances par semaine" et la date de fin
 *  s'ils sont présents dans la description du défi. */
function ChallengeDescription({ description }: { description: string }) {
  const HIGHLIGHT_PATTERNS = [
    /\b\d+\s+séances?\s+par\s+semaine\b/i,
    /\b\d+\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i,
  ]

  // Construction d'un tableau de fragments avec marquage gold
  type Frag = { text: string; gold: boolean }
  let fragments: Frag[] = [{ text: description, gold: false }]
  for (const pat of HIGHLIGHT_PATTERNS) {
    const next: Frag[] = []
    for (const f of fragments) {
      if (f.gold) {
        next.push(f)
        continue
      }
      const re = new RegExp(pat.source, pat.flags)
      let rest = f.text
      while (true) {
        const m = re.exec(rest)
        if (!m) {
          next.push({ text: rest, gold: false })
          break
        }
        const before = rest.slice(0, m.index)
        const match = m[0]
        const after = rest.slice(m.index + match.length)
        if (before) next.push({ text: before, gold: false })
        next.push({ text: match, gold: true })
        rest = after
      }
    }
    fragments = next
  }

  return (
    <p className="font-sans text-[15px] text-bg-1 text-center leading-snug">
      {fragments.map((f, i) =>
        f.gold ? (
          <strong key={i} className="font-sans font-bold text-pr-1">{f.text}</strong>
        ) : (
          <span key={i}>{f.text}</span>
        ),
      )}
    </p>
  )
}
