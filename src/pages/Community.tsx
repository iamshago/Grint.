// @ts-nocheck
import { useRef } from 'react'
import { getAvatarById } from '@/lib/avatars'

// --- Types ---

interface Challenge {
  id: string
  title: string
  description: React.ReactNode
  imageUrl: string
}

interface Reaction {
  emoji: string
  active: boolean
}

interface FeedPost {
  id: string
  userName: string
  avatarId: string
  timeAgo: string
  content: React.ReactNode
  highlightValue: string
  highlightEmoji: string
  reactions: Reaction[]
  likedBy?: string
}

// --- Données mockées ---

const CHALLENGES: Challenge[] = [
  {
    id: '1',
    title: 'The Power-Up challenge',
    description: (
      <>
        Comptabilisez <strong className="font-bold">12 séances</strong> au total
        <br />(3 par personne) en une semaine.
      </>
    ),
    imageUrl: '/assets/challenge-bg.png',
  },
  {
    id: '2',
    title: 'Upper Lower',
    description: '2 à 4 fois / semaines',
    imageUrl: '/assets/workouts/upper-body-h.png',
  },
  {
    id: '3',
    title: 'Full Body',
    description: '3 fois / semaine',
    imageUrl: '/assets/workouts/push-day.png',
  },
]

const FEED_POSTS: FeedPost[] = [
  {
    id: '1',
    userName: 'Florian',
    avatarId: 'superman',
    timeAgo: 'Il y a 3 heures',
    content: (
      <>
        À passé la barre des <strong className="text-tx-1 font-bold">40kg</strong> au{' '}
        <strong className="text-tx-1 font-bold">Bench</strong>.
      </>
    ),
    highlightValue: '40',
    highlightEmoji: '🎉',
    reactions: [
      { emoji: '❤️', active: true },
      { emoji: '😂', active: false },
      { emoji: '😲', active: false },
      { emoji: '🔥', active: false },
    ],
    likedBy: 'Lucas',
  },
  {
    id: '2',
    userName: 'Margo',
    avatarId: 'adventurer',
    timeAgo: 'Il y a 3 heures',
    content: (
      <>
        À validé sa semaine et gagné <strong className="text-tx-1 font-bold">1 jeton</strong>.
      </>
    ),
    highlightValue: '1',
    highlightEmoji: '🎉',
    reactions: [
      { emoji: '❤️', active: false },
      { emoji: '😂', active: false },
      { emoji: '😲', active: false },
      { emoji: '🔥', active: false },
    ],
  },
  {
    id: '3',
    userName: 'Lucas',
    avatarId: 'hulk',
    timeAgo: 'Il y a 3 heures',
    content: (
      <>
        À passé la barre des <strong className="text-tx-1 font-bold">12kg</strong> à la presse.
      </>
    ),
    highlightValue: '12',
    highlightEmoji: '🎉',
    reactions: [
      { emoji: '❤️', active: true },
      { emoji: '😂', active: false },
      { emoji: '😲', active: false },
      { emoji: '🔥', active: false },
    ],
  },
]

// --- Composants ---

/** Carte défi horizontale scrollable */
function ChallengeCard({ challenge }: { challenge: Challenge }) {
  return (
    <div className="h-[224px] w-[248px] rounded-[16px] overflow-hidden relative shrink-0">
      <img
        src={challenge.imageUrl}
        alt={challenge.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0 flex flex-col justify-end p-[16px] backdrop-blur-[8px] text-bg-1"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.3) 100%), linear-gradient(180deg, rgba(31,32,33,0) 40%, rgba(0,0,0,0.7) 100%)',
        }}
      >
        <p className="font-serif font-bold text-[24px] tracking-[-0.72px] leading-normal">
          {challenge.title}
        </p>
        <div className="font-sans text-[12px] leading-[1.3] mt-[8px]">
          {challenge.description}
        </div>
      </div>
    </div>
  )
}

/** Bouton réaction emoji */
function ReactionButton({ emoji, active }: { emoji: string; active: boolean }) {
  return (
    <button
      className={`w-[44px] flex items-center justify-center px-[12px] py-[8px] rounded-[8px] border text-[20px] ${
        active
          ? 'bg-bg-2 border-bg-2'
          : 'bg-white border-bg-2'
      }`}
      aria-label={`Réaction ${emoji}`}
    >
      {emoji}
    </button>
  )
}

/** Carte de post dans le feed */
function FeedPostCard({ post }: { post: FeedPost }) {
  const avatar = getAvatarById(post.avatarId)
  const likedByAvatar = post.likedBy ? getAvatarById('hulk') : null

  return (
    <div className="flex flex-col gap-[8px] items-start w-full">
      {/* Carte principale */}
      <div className="bg-white border-[1.5px] border-white rounded-[12px] h-[111px] w-full relative overflow-hidden">
        {/* Avatar */}
        <div className="absolute left-[10.5px] top-[10.5px] w-[48px] h-[48px] rounded-full bg-tx-1 overflow-hidden">
          {avatar && (
            <img src={avatar.src} alt={post.userName} className="w-full h-full object-cover" />
          )}
        </div>

        {/* Nom + heure */}
        <p className="absolute left-[70.5px] top-[12.5px] font-serif font-bold text-[20px] text-tx-1 leading-normal whitespace-nowrap">
          {post.userName}
        </p>
        <p className="absolute left-[70.5px] top-[40.5px] font-sans text-[12px] text-tx-3 leading-normal whitespace-nowrap">
          {post.timeAgo}
        </p>

        {/* Contenu */}
        <p className="absolute left-[14.5px] top-[74.5px] font-sans text-[16px] text-tx-2 leading-normal whitespace-nowrap pr-[120px]">
          {post.content}
        </p>

        {/* Cercle décoratif droit (Figma: left:301.5, right:-43.5, rotated ring) */}
        <div className="absolute right-[-43px] top-1/2 -translate-y-1/2 w-[111px] h-[109px]">
          <div className="w-full h-full rounded-full border-[3px] border-surface opacity-60" />
        </div>

        {/* Highlight droit (valeur + emoji) — Figma: left:301.5 = right ~68px */}
        <div className="absolute right-[0px] top-1/2 -translate-y-1/2 w-[68px] flex flex-col items-center pb-[4px]">
          <span className="font-serif font-bold text-[48px] text-tx-1 leading-none">
            {post.highlightValue}
          </span>
          <span className="font-sans text-[24px] text-tx-2 text-center leading-none -mt-[4px]">
            {post.highlightEmoji}
          </span>
        </div>
      </div>

      {/* Réactions + liked by */}
      <div className="flex flex-col gap-[8px] items-start pl-[8px]">
        {/* Emoji reactions */}
        <div className="flex gap-[8px] items-center">
          {post.reactions.map((r, i) => (
            <ReactionButton key={i} emoji={r.emoji} active={r.active} />
          ))}
        </div>

        {/* Liked by */}
        {post.likedBy && likedByAvatar && (
          <div className="flex gap-[8px] items-center">
            <div className="w-[24px] h-[24px] rounded-full bg-tx-2 overflow-hidden">
              <img src={likedByAvatar.src} alt={post.likedBy} className="w-full h-full object-cover" />
            </div>
            <p className="font-sans text-[12px] text-tx-2">
              Aimé par <strong className="font-bold">{post.likedBy}</strong> et{' '}
              <strong className="font-bold">d'autres personnes</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// --- Page ---

/** Page Communauté — Light mode, Défis + Feed */
export default function Community() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="min-h-screen bg-bg-1 pb-[140px]">
      {/* Titre — Figma y=100 */}
      <h1 className="font-serif font-bold text-[32px] text-tx-1 tracking-[-0.96px] leading-normal px-[16px] pt-[100px]">
        Communauté
      </h1>

      {/* Section Défis — Figma y=153 (53px from top of title, ~15px gap) */}
      <h2 className="font-serif font-bold text-[24px] text-tx-1 tracking-[-0.72px] leading-normal px-[16px] mt-[15px]">
        Défis
      </h2>
      {/* Cards — Figma y=196 (43px from "Défis" heading, ~15px gap) */}
      <div
        ref={scrollRef}
        className="flex gap-[16px] overflow-x-auto px-[16px] mt-[15px] scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CHALLENGES.map((c) => (
          <ChallengeCard key={c.id} challenge={c} />
        ))}
      </div>

      {/* Section Tous les posts — Figma y=452 (~32px from end of cards) */}
      <h2 className="font-serif font-bold text-[24px] text-tx-1 tracking-[-0.72px] leading-normal px-[16px] mt-[32px]">
        Tous les posts
      </h2>
      {/* Feed — Figma y=495 (~15px gap) */}
      <div className="flex flex-col gap-[16px] px-[16px] mt-[15px]">
        {FEED_POSTS.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
