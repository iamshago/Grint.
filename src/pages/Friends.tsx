// @ts-nocheck
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { ChevronLeft, Plus, X, Check } from 'lucide-react'
import DarkLayout from '@/components/layout/DarkLayout'
import { supabase } from '@/lib/supabaseClient'
import { getAvatarById } from '@/lib/avatars'
import { computeStreakForUser } from '@/hooks/useStreak'

/** Badge flamme Figma avec numéro de streak */
function StreakBadge({ count }: { count: number }) {
  return (
    <div className="relative w-[32px] h-[40px] shrink-0" style={{ overflow: 'visible' }}>
      <img
        src="/assets/flame-badge.svg"
        alt=""
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ filter: 'blur(7px)', opacity: 0.25, transform: 'scale(1.35)', transformOrigin: 'center center' }}
      />
      <img
        src="/assets/flame-badge.svg"
        alt=""
        className="absolute inset-0 w-full h-full"
      />
      <img
        src="/assets/flame-badge-inner.svg"
        alt=""
        className="absolute"
        style={{ top: '40%', left: '25%', width: '50%', height: '50%', opacity: 0.85 }}
      />
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
      <div className="w-[48px] h-[48px] rounded-full overflow-hidden shrink-0 bg-[#3d4149]">
        {avatar ? (
          <img src={avatar.src} alt={avatar.label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#3d4149]" />
        )}
      </div>

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

      <div className="shrink-0 ml-[8px]">
        <StreakBadge count={friend.streak ?? 0} />
      </div>
    </button>
  )
}

/** Carte demande d'ami reçue — boutons accepter/refuser */
function FriendRequestCard({ request, onAccept, onReject }: {
  request: any
  onAccept: (id: string) => void
  onReject: (id: string) => void
}) {
  const avatar = getAvatarById(request.avatar_id)
  const [acting, setActing] = useState(false)

  return (
    <div className="w-full bg-[#1b1d1f] rounded-[12px] flex items-center px-[12px] py-[12px]">
      <div className="w-[48px] h-[48px] rounded-full overflow-hidden shrink-0 bg-[#3d4149]">
        {avatar ? (
          <img src={avatar.src} alt={avatar.label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#3d4149]" />
        )}
      </div>

      <div className="ml-[12px] flex-1 min-w-0">
        <p className="font-serif text-[18px] leading-[22px] truncate">
          <span className="text-tx-3">@</span>
          <span className="text-bg-1">{request.username || request.display_name}</span>
        </p>
        <p className="font-sans text-[12px] text-tx-3 mt-[2px]">Demande d'ami</p>
      </div>

      <div className="flex items-center gap-[8px] shrink-0 ml-[8px]">
        {/* Accepter */}
        <button
          onClick={() => { setActing(true); onAccept(request.friendship_id) }}
          disabled={acting}
          aria-label="Accepter la demande"
          className="w-[40px] h-[40px] rounded-full bg-[#ffee8c] flex items-center justify-center active:scale-95 transition-transform"
        >
          <Check size={18} className="text-[#1b1d1f]" strokeWidth={2.5} />
        </button>
        {/* Refuser */}
        <button
          onClick={() => { setActing(true); onReject(request.friendship_id) }}
          disabled={acting}
          aria-label="Refuser la demande"
          className="w-[40px] h-[40px] rounded-full bg-[#3d4149] flex items-center justify-center active:scale-95 transition-transform"
        >
          <X size={18} className="text-tx-3" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

/** Popup centré pour ajouter un ami */
function AddFriendPopup({ onClose, currentUserId }: { onClose: () => void; currentUserId: string }) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    setError('')
    setSuccess('')
    setResults([])
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_id')
        .ilike('username', `%${query.trim()}%`)
        .neq('id', currentUserId)
        .limit(5)

      if (err) throw err
      if (data && data.length > 0) {
        // Pour chaque résultat, vérifier s'il existe déjà une relation
        const enriched = await Promise.all(data.map(async (user) => {
          const { data: existing } = await supabase
            .from('friendships')
            .select('id, status, requester_id')
            .or(
              `and(requester_id.eq.${currentUserId},addressee_id.eq.${user.id}),and(requester_id.eq.${user.id},addressee_id.eq.${currentUserId})`
            )
            .limit(1)

          const friendship = existing?.[0]
          return {
            ...user,
            friendshipStatus: friendship?.status || null,
            isRequester: friendship?.requester_id === currentUserId,
          }
        }))
        setResults(enriched)
      } else {
        setError('Aucun utilisateur trouvé')
      }
    } catch (e) {
      setError('Aucun utilisateur trouvé')
    } finally {
      setSearching(false)
    }
  }

  const handleAdd = async (friendId: string) => {
    try {
      // Vérifier s'il y a une demande inverse (l'autre nous a déjà envoyé une demande)
      const { data: inverse } = await supabase
        .from('friendships')
        .select('id, status')
        .eq('requester_id', friendId)
        .eq('addressee_id', currentUserId)
        .eq('status', 'pending')
        .limit(1)

      if (inverse && inverse.length > 0) {
        // Auto-accepter : l'autre nous avait déjà envoyé une demande
        await supabase
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('id', inverse[0].id)

        setSuccess('Vous êtes maintenant amis !')
        setTimeout(() => onClose(), 1200)
        return
      }

      // Vérifier s'il existe déjà une relation
      const { data: existing } = await supabase
        .from('friendships')
        .select('id, status')
        .or(
          `and(requester_id.eq.${currentUserId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${currentUserId})`
        )
        .limit(1)

      if (existing && existing.length > 0) {
        const rel = existing[0]
        if (rel.status === 'accepted') {
          setError('Vous êtes déjà amis !')
        } else {
          setError('Demande déjà envoyée')
        }
        return
      }

      // Envoyer la demande
      const { error: insertErr } = await supabase.from('friendships').insert({
        requester_id: currentUserId,
        addressee_id: friendId,
        status: 'pending',
      })

      if (insertErr) throw insertErr
      setSuccess('Demande envoyée !')

      // Mettre à jour le statut dans les résultats
      setResults((prev) =>
        prev.map((r) =>
          r.id === friendId
            ? { ...r, friendshipStatus: 'pending', isRequester: true }
            : r
        )
      )
    } catch (e) {
      setError("Erreur lors de l'envoi")
    }
  }

  /** Label du bouton selon le statut de la relation */
  const getButtonState = (user: any) => {
    if (user.friendshipStatus === 'accepted') {
      return { label: 'Amis', disabled: true, className: 'bg-[#3d4149] text-tx-3 cursor-default' }
    }
    if (user.friendshipStatus === 'pending' && user.isRequester) {
      return { label: 'Envoyée', disabled: true, className: 'bg-[#3d4149] text-tx-3 cursor-default' }
    }
    if (user.friendshipStatus === 'pending' && !user.isRequester) {
      return { label: 'Accepter', disabled: false, className: 'bg-[#ffee8c] text-[#1b1d1f]' }
    }
    return { label: 'Ajouter', disabled: false, className: 'bg-[#ffee8c] text-[#1b1d1f]' }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-[24px]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-[#1b1d1f] rounded-[24px] w-full max-w-[354px] p-[24px] flex flex-col gap-[16px]">
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

        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setError(''); setSuccess('') }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Rechercher un identifiant"
          className="bg-[#3d4149] border border-tx-3 rounded-[8px] p-[16px] w-full text-[16px] text-bg-1 placeholder-tx-3 outline-none focus:border-[#ffee8c]/60 transition-colors font-sans"
        />

        {results.length > 0 && (
          <div className="flex flex-col gap-[8px] max-h-[200px] overflow-y-auto">
            {results.map((user) => {
              const av = getAvatarById(user.avatar_id)
              const btn = getButtonState(user)
              return (
                <div key={user.id} className="flex items-center gap-[12px] bg-[#3d4149] rounded-[12px] p-[10px]">
                  <div className="w-[32px] h-[32px] rounded-full overflow-hidden bg-[#1b1d1f] shrink-0">
                    {av && <img src={av.src} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <span className="font-sans text-[14px] text-bg-1 flex-1">@{user.username}</span>
                  <button
                    onClick={() => !btn.disabled && handleAdd(user.id)}
                    disabled={btn.disabled}
                    className={`px-[12px] py-[6px] rounded-[8px] font-sans font-semibold text-[12px] ${btn.className}`}
                  >
                    {btn.label}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {error && <p className="font-sans text-[14px] text-tx-3 text-center">{error}</p>}
        {success && <p className="font-sans text-[14px] text-[#ffee8c] text-center">{success}</p>}

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
          {searching ? 'Recherche...' : 'Rechercher'}
        </button>
      </div>
    </div>
  )
}

/** Page liste d'amis — données réelles depuis Supabase */
export default function Friends() {
  const navigate = useNavigate()
  const [showAddPopup, setShowAddPopup] = useState(false)
  const [friends, setFriends] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  const fetchAll = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      setCurrentUserId(user.id)

      console.log('[Friends] user.id =', user.id)

      // Fetch amis acceptés + demandes reçues + demandes envoyées
      const [acceptedRes, pendingRes, sentRes] = await Promise.all([
        supabase
          .from('friendships')
          .select('requester_id, addressee_id')
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .eq('status', 'accepted'),
        supabase
          .from('friendships')
          .select('id, requester_id, created_at')
          .eq('addressee_id', user.id)
          .eq('status', 'pending'),
        supabase
          .from('friendships')
          .select('id, addressee_id, created_at')
          .eq('requester_id', user.id)
          .eq('status', 'pending'),
      ])

      console.log('[Friends] acceptedRes:', acceptedRes.data)
      console.log('[Friends] pendingRes:', pendingRes.data)
      console.log('[Friends] sentRes:', sentRes.data)
      console.log('[Friends] errors:', acceptedRes.error, pendingRes.error, sentRes.error)

      // --- Demandes en attente ---
      const pendingFriendships = pendingRes.data || []
      if (pendingFriendships.length > 0) {
        const requesterIds = pendingFriendships.map((f) => f.requester_id)
        const { data: requesterProfiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_id')
          .in('id', requesterIds)

        const enrichedPending = pendingFriendships.map((f) => {
          const profile = requesterProfiles?.find((p) => p.id === f.requester_id)
          return {
            ...profile,
            friendship_id: f.id,
            created_at: f.created_at,
          }
        }).filter((p) => p.id)

        setPendingRequests(enrichedPending)
      } else {
        setPendingRequests([])
      }

      // --- Demandes envoyées ---
      // Exclure les demandes croisées (déjà visibles dans "Demandes reçues")
      const receivedRequesterIds = new Set(pendingFriendships.map((f) => f.requester_id))
      const sentFriendships = (sentRes.data || []).filter(
        (f) => !receivedRequesterIds.has(f.addressee_id)
      )
      if (sentFriendships.length > 0) {
        const addresseeIds = sentFriendships.map((f) => f.addressee_id)
        const { data: addresseeProfiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_id')
          .in('id', addresseeIds)

        const enrichedSent = sentFriendships.map((f) => {
          const profile = addresseeProfiles?.find((p) => p.id === f.addressee_id)
          return {
            ...profile,
            friendship_id: f.id,
            created_at: f.created_at,
          }
        }).filter((p) => p.id)

        setSentRequests(enrichedSent)
      } else {
        setSentRequests([])
      }

      // --- Amis acceptés ---
      const friendships = acceptedRes.data || []
      if (friendships.length === 0) {
        setFriends([])
        setLoading(false)
        return
      }

      const friendIds = friendships.map((f) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      )

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_id')
        .in('id', friendIds)

      if (profiles) {
        const enriched = await Promise.all(profiles.map(async (profile) => {
          const twoHoursAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
          const { data: recent } = await supabase
            .from('completed_workouts')
            .select('completed_at')
            .eq('user_id', profile.id)
            .gte('completed_at', twoHoursAgo)
            .limit(1)

          const isActive = recent && recent.length > 0

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
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  /** Accepter une demande d'ami */
  const handleAccept = async (friendshipId: string) => {
    try {
      // Trouver le requester de cette demande
      const request = pendingRequests.find((r) => r.friendship_id === friendshipId)

      // Accepter la demande
      await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)

      // Supprimer la demande croisée si on en avait envoyé une de notre côté
      if (request?.id) {
        // request.id = le profil user_id du requester de la demande reçue
        await supabase
          .from('friendships')
          .delete()
          .eq('requester_id', currentUserId)
          .eq('addressee_id', request.id)
          .eq('status', 'pending')
      }

      // Rafraîchir les données
      fetchAll()
    } catch (e) {
      console.error('Erreur accept:', e)
    }
  }

  /** Refuser (supprimer) une demande d'ami */
  const handleReject = async (friendshipId: string) => {
    try {
      await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)

      setPendingRequests((prev) => prev.filter((r) => r.friendship_id !== friendshipId))
    } catch (e) {
      console.error('Erreur reject:', e)
    }
  }

  /** Annuler une demande envoyée */
  const handleCancelSent = async (friendshipId: string) => {
    try {
      await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)

      setSentRequests((prev) => prev.filter((r) => r.friendship_id !== friendshipId))
    } catch (e) {
      console.error('Erreur cancel:', e)
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

      {/* Demandes d'amis en attente */}
      {pendingRequests.length > 0 && (
        <div className="px-[16px] mt-[24px]">
          <div className="flex items-center gap-[8px] mb-[12px]">
            <h2 className="font-serif font-bold text-[16px] text-bg-1">
              Demandes d'amis
            </h2>
            <span className="bg-[#ffee8c] text-[#1b1d1f] font-sans font-bold text-[11px] rounded-full w-[20px] h-[20px] flex items-center justify-center">
              {pendingRequests.length}
            </span>
          </div>
          <div className="flex flex-col gap-[8px]">
            {pendingRequests.map((req) => (
              <FriendRequestCard
                key={req.friendship_id}
                request={req}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}

      {/* Demandes envoyées (en attente de réponse) */}
      {sentRequests.length > 0 && (
        <div className="px-[16px] mt-[24px]">
          <div className="flex items-center gap-[8px] mb-[12px]">
            <h2 className="font-serif font-bold text-[16px] text-tx-3">
              Demandes envoyées
            </h2>
            <span className="bg-[#3d4149] text-tx-3 font-sans font-bold text-[11px] rounded-full w-[20px] h-[20px] flex items-center justify-center">
              {sentRequests.length}
            </span>
          </div>
          <div className="flex flex-col gap-[8px]">
            {sentRequests.map((req) => {
              const avatar = getAvatarById(req.avatar_id)
              return (
                <div key={req.friendship_id} className="w-full bg-[#1b1d1f] rounded-[12px] flex items-center px-[12px] py-[12px]">
                  <div className="w-[40px] h-[40px] rounded-full overflow-hidden shrink-0 bg-[#3d4149]">
                    {avatar ? (
                      <img src={avatar.src} alt={avatar.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#3d4149]" />
                    )}
                  </div>
                  <div className="ml-[12px] flex-1 min-w-0">
                    <p className="font-serif text-[16px] leading-[20px] truncate">
                      <span className="text-tx-3">@</span>
                      <span className="text-bg-1">{req.username || req.display_name}</span>
                    </p>
                    <p className="font-sans text-[11px] text-tx-3 mt-[2px]">En attente de réponse</p>
                  </div>
                  <button
                    onClick={() => handleCancelSent(req.friendship_id)}
                    aria-label="Annuler la demande"
                    className="shrink-0 ml-[8px] w-[36px] h-[36px] rounded-full bg-[#3d4149] flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <X size={14} className="text-tx-3" strokeWidth={2.5} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Liste des amis */}
      <div className="px-[16px] mt-[24px] flex flex-col gap-[12px]">
        {(pendingRequests.length > 0 || sentRequests.length > 0) && friends.length > 0 && (
          <h2 className="font-serif font-bold text-[16px] text-bg-1">
            Mes amis
          </h2>
        )}
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
    </DarkLayout>

      {showAddPopup && createPortal(
        <AddFriendPopup
          onClose={() => { setShowAddPopup(false); fetchAll() }}
          currentUserId={currentUserId}
        />,
        document.body
      )}
    </>
  )
}
