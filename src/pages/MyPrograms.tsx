import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderPlus } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { fetchUserPrograms } from '@/lib/myPrograms'
import DarkLayout from '@/components/layout/DarkLayout'
import StickyPageHeader from '@/components/layout/StickyPageHeader'
import MyProgramCard from '@/components/features/MyProgramCard'
import type { UserProgram } from '@/types'

/** Hub des programmes persos de l'utilisateur — route `/my-programs` (light). */
export default function MyPrograms() {
  const navigate = useNavigate()
  const [programs, setPrograms] = useState<UserProgram[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        setLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const data = await fetchUserPrograms(user.id)
        if (active) setPrograms(data)
      } catch (err) {
        console.error('Erreur chargement programmes persos:', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const isEmpty = !loading && programs.length === 0

  return (
    <DarkLayout noSafeAreaTop hideTabBar className="pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
      <StickyPageHeader
        variant="dark"
        title="Mon programme"
        onBack={() => navigate('/programs')}
      />

      <div className="px-4 pt-2">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[88px] bg-[#1c1c1e] rounded-16 animate-pulse" />
            ))}
          </div>
        ) : isEmpty ? (
          <EmptyState onCreate={() => navigate('/my-programs/new')} />
        ) : (
          <div className="flex flex-col gap-4">
            {/* CTA création — toujours en tête de liste. Pas de glow : il baverait
             *  derrière le header sticky et créerait une scission disgracieuse. */}
            <button
              type="button"
              onClick={() => navigate('/my-programs/new')}
              className="w-full flex items-center justify-center gap-3 bg-pr-1 text-tx-1 font-sans font-semibold text-base p-4 rounded-12 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <Plus size={18} />
              <span>Nouveau programme</span>
            </button>

            {programs.map((program) => (
              <MyProgramCard
                key={program.id}
                program={program}
                onClick={() => navigate(`/my-programs/${program.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </DarkLayout>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center text-center pt-16 px-6">
      <div className="w-20 h-20 rounded-[28px] bg-pr-1 flex items-center justify-center mb-6">
        <FolderPlus size={36} className="text-tx-1" />
      </div>
      <h2 className="font-serif font-bold text-2xl text-bg-1 tracking-tight mb-2">
        Crée tes séances sur mesure
      </h2>
      <p className="font-sans text-base text-tx-3 leading-6 mb-8 max-w-[300px]">
        Construis tes propres programmes et compose chaque séance avec les exercices du
        catalogue.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="w-full max-w-[320px] flex items-center justify-center gap-3 bg-pr-1 text-tx-1 font-sans font-semibold text-base p-4 rounded-12 cursor-pointer active:scale-[0.98] transition-transform shadow-[0px_0px_20px_0px_rgba(255,238,140,0.3)]"
      >
        <Plus size={18} />
        <span>Créer mon premier programme</span>
      </button>
    </div>
  )
}
