// @ts-nocheck
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { ChevronLeft, Plus, X } from 'lucide-react'
import DarkLayout from '@/components/layout/DarkLayout'
import { supabase } from '@/lib/supabaseClient'
import { getAvatarById } from '@/lib/avatars'
import { computeStreakForUser } from '@/hooks/useStreak'

/** Badge flamme Figma avec numéro de streak */
function StreakBadge({ count }: { count: number }) {
  return (
    <div className="relative w-[32px] h-[40px] shrink-0" style={{ overflow: 'visible' }}>
      {/* Glow derrière — copie floutée de la flamme */}
      <img
        src="/assets/flame-badge.svg"
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ filter: 'blur(7px)', opacity: 0.25, transform: 'scale(1.35)', transformOrigin: 'center center' }}
      />
      {/* Flamme principale */}
      <img
        src="/assets/flame-badge.svg"
        alt=""
        className="absolute inset-0 w-full h-full"
      />
      {/* Cœur clair intérieur */}
      <img
        src="/assets/flame-badge-inner.svg"
        alt=""
        className="absolute"
        style={{ top: '40%', left: '25%', width: '50%', height: '50%', opacity: 0.85 }}
      />
      {/* Chiffre streak */}
      <span
        className="absolute left-1/2 -translate-x-1/2 font-sans font-semibold text-[10px] text-[#1b1d1f] text-center whitespace-nowrap"
        style={{ top: '55%' }}
      >
        {count}
      </span>
    </div>
  )
}

/** Carte d'un ami — cliquable pour voir son profil */
function FriendCard({ friend, onClick }: { friend: any; onClick?: () => void }) {
  const avatar = getAvatarById(friend.avatar_id || friend.avatarId)
  const isActive = friend.status === 'active'

  return (
    <button onClick={onClick} className="relative w-full h-[80px] bg-[#1b1d1f] rounded-[12px] flex items-center px-[12px] text-left active:scale-[0.98] transition-transform">
      {/* Avatar */}
      <div className="w-[48px] h-[48px] rounded-full overflow-hidden shrink-0 bg-[#3d4149]">
        {avatar ? (
          <img src={avatar.src} alt={avatar.label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#3d4149]" />
        )}
      </div>

      {/* Infos */}
      <div className="ml-[12px] flex-1 min-w-0">
        <p className="font-serif text-[20px] leading-[24px] truncate">
          <span className="text-tx-3">@</span>
          <span className="text-bg-1">{friend.username || friend.display_name}</span>
        </p>
        <div className="flex items-center gap-[6px] mt-[2px]">
          {isActive ? (
            <>
              <span className="w-[6px] h-[6px] rounded-full bg-[#ffee8c] shrink-0" />
              <span className="font-sans font-semibold text-[12px] text-[#ffee8c]">Actuellement en séance</span>
            </>
          ) : (
            <span className="text-[12px]">
              <span className="font-sans font-normal text-tx-3">Dernière séance il y a </span>
              <span className="font-sans font-semibold text-[#ffee8c]">{friend.lastSessionAgo || 'longtemps'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Badge streak */}
      <div className="shrink-0 ml-[8px]">
        <StreakBadge count={friend.streak ?? 0} />
      </div>
    </button>
  )
}

/** Popup centré pour ajouter un ami */
function AddFriendPopup({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Recherche d'utilisateur par username
  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setError('')
    setResults([])
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_id')
        .ilike('username', `%${query.trim()}%`)
        .limit(5)

      if (err) throw err
      if (data && data.length > 0) {
        setResults(data)
      } else {
        setError('Aucun utilisateur trouvé')
      }
    } catch (e) {
      // Table n'existe peut-être pas encore — pas grave
      setError('Aucun utilisateur trouvé')
    } finally {
      setSearching(false)
    }
  }

  // Ajouter un ami
  const handleAdd = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSuccess('Connecte-toi pour ajouter des amis')
        return
      }
      await supabase.from('friendships').insert({
        requester_id: user.id,
        addressee_id: friendId,
        status: 'pending',
      })
      setSuccess('Demande envoyée !')
      setTimeout(() => onClose(), 1500)
    } catch (e) {
      setError('Erreur lors de l\'envoi')
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-[24px]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Popup centré */}
      <div className="relative bg-[#1b1d1f] rounded-[24px] w-full max-w-[354px] p-[24px] flex flex-col gap-[16px]">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-[8px] flex-1 pr-[12px]">
            <h2 className="font-serif font-bold text-[20px] text-bg-1 tracking-[-0.6px]">
              Ajouter un ami
            </h2>
            <p className="font-sans text-[16px] text-bg-1 leading-[22px]">
              Saisissez l'identifiant de l'ami que vous souhaitez ajouter.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="bg-[#3d4149] p-[12px] rounded-[24px] shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={16} className="text-bg-1" />
          </button>
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setError(''); setSuccess('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Rechercher un identifiant"
          className="bg-[#3d4149] border border-tx-3 rounded-[8px] p-[16px] w-full text-[16px] text-bg-1 placeholder-tx-3 outline-none focus:border-[#ffee8c]/60 transition-colors font-sans"
        />

        {/* Résultats de recherche */}
        {results.length > 0 && (
          <div className="flex flex-col gap-[8px]">
            {results.map((user) => {
              const av = getAvatarById(user.avatar_id)
              return (
                <div key={user.id} className="flex items-center gap-[12px] bg-[#3d4149] rounded-[12px] p-[10px]">
                  <div className="w-[32px] h-[32px] rounded-full overflow-hidden bg-[#1b1d1f] shrink-0">
                    {av && <img src={av.src} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <span className="font-sans text-[14px] text-bg-1 flex-1">@{user.username}</span>
                  <button
                    onClick={() => handleAdd(user.id)}
                    className="bg-[#ffee8c] px-[12px] py-[6px] rounded-[8px] font-sans font-semibold text-[12px] text-[#1b1d1f]"
                  >
                    Ajouter
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Messages */}
        {error && <p className="font-sans text-[14px] text-tx-3 text-center">{error}</p>}
        {success && <p className="font-sans text-[14px] text-[#ffee8c] text-center">{success}</p>}

        {/* Bouton Ajouter / Rechercher */}
        <button
          onClick={handleSearch}
          disabled={!query.trim() || searching}
          className={[
            'rounded-[12px] p-[16px] w-full font-sans font-semibold text-[16px] transition-all',
            query.trim()
              ? 'bg-[#ffee8c] text-[#1b1d1f] opacity-100'
              : 'bg-tx-3 text-[#1b1d1f] opacity-40 cursor-not-allowed',
          ].join(' ')}
        >
          {searching ? 'Recherche...' : 'Ajouter'}
        </button>
      </div>
    </div>
  )
}

/** Page liste d'amis — données réelles depuis Supabase ou fallback fake */
export default function Friends() {
  const navigate = useNavigate()
  const [showAddPopup, setShowAddPopup] = useState(false)
  const [friends, setFriends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFriends()
  }, [])

  async function fetchFriends() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Pas connecté — données fictives
        setFriends([])
        setLoading(false)
        return
      }

      // Chercher les amitiés acceptées
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted')

      if (!friendships || friendships.length === 0) {
        setFriends([])
        setLoading(false)
        return
      }

      // Récupérer les IDs amis
      const friendIds = friendships.map((f) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      )

      // Récupérer les profils
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_id')
        .in('id', friendIds)

      if (profiles) {
        // Pour chaque ami, calculer le statut et le streak
        const enriched = await Promise.all(profiles.map(async (profile) => {
          // Vérifier s'il a une séance en cours (complétée dans les 2 dernières heures)
          const twoHoursAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
          const { data: recent } = await supabase
            .from('completed_workouts')
            .select('completed_at')
            .eq('user_id', profile.id)
            .gte('completed_at', twoHoursAgo)
            .limit(1)

          const isActive = recent && recent.length > 0

          // Dernière séance
          const { data: lastWorkout } = await supabase
            .from('completed_workouts')
            .select('completed_at')
            .eq('user_id', profile.id)
            .order('completed_at', { ascending: false })
            .limit(1)

          let lastSessionAgo = 'longtemps'
          if (lastWorkout && lastWorkout.length > 0) {
            const diff = Date.now() - new Date(lastWorkout[0].completed_at).getTime()
            const mins = Math.floor(diff / 60000)
            if (mins < 60) lastSessionAgo = `${mins} minutes`
            else if (mins < 1440) lastSessionAgo = `${Math.floor(mins / 60)} heures`
            else lastSessionAgo = `${Math.floor(mins / 1440)} jours`
          }

          // Streak via helper partagé
          const streak = await computeStreakForUser(profile.id)

          return {
            ...profile,
            status: isActive ? 'active' : 'idle',
            lastSessionAgo,
            streak,
          }
        }))

        setFriends(enriched)
      } else {
        setFriends([])
      }
    } catch (e) {
      console.error('Erreur fetch friends:', e)
      setFriends([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <DarkLayout scrollable hideTabBar className="pb-40">
      {/* Top bar */}
      <div className="flex items-center justify-between px-[16px] pt-2">
        <button
          onClick={() => navigate('/profile')}
          aria-label="Retour au profil"
          className="bg-[#1b1d1f] p-[12px] rounded-[24px] flex items-center justify-center min-w-[44px] min-h-[44px]"
        >
          <ChevronLeft size={16} className="text-bg-1" />
        </button>
        <h1 className="font-serif font-bold text-[20px] text-bg-1 tracking-[-0.6px]">
          Amis
        </h1>
        <button
          onClick={() => setShowAddPopup(true)}
          aria-label="Ajouter un ami"
          className="bg-[#1b1d1f] p-[12px] rounded-[24px] flex items-center justify-center min-w-[44px] min-h-[44px]"
        >
          <Plus size={16} className="text-bg-1" />
        </button>
      </div>

      {/* Liste */}
      <div className="px-[16px] mt-[24px] flex flex-col gap-[12px]">
        {loading ? (
          <div className="flex items-center justify-center h-[200px]">
            <span className="text-tx-3">Chargement...</span>
          </div>
        ) : friends.length === 0 ? (
          <div className="bg-[#1b1d1f] rounded-[16px] h-[100px] flex items-center justify-center">
            <p className="text-tx-3 text-[14px]">Aucun ami pour le moment</p>
          </div>
        ) : (
          friends.map((friend, i) => (
            <FriendCard
              key={friend.id || i}
              friend={friend}
              onClick={() => navigate(`/profile/friends/${friend.id}`)}
            />
          ))
        )}
      </div>

      {/* Popup ajout ami */}
    </DarkLayout>

      {showAddPopup && createPortal(
        <AddFriendPopup onClose={() => setShowAddPopup(false)} />,
        document.body
      )}
    </>
  )
}

/** Données fictives quand pas connecté */
/* Les amis sont chargés uniquement depuis la table friendships en base de données */
