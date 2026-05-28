import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import {
  createUserProgram,
  fetchUserProgram,
  softDeleteUserProgram,
  updateUserProgram,
} from '@/lib/myPrograms'
import LightLayout from '@/components/layout/LightLayout'
import StickyPageHeader from '@/components/layout/StickyPageHeader'
import ActionSheet from '@/components/ui/ActionSheet'

/** Création (`/my-programs/new`) et édition méta (`/my-programs/:id/edit`) d'un programme perso. */
export default function MyProgramEdit() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [focus, setFocus] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    let active = true
    async function load() {
      try {
        const program = await fetchUserProgram(id as string)
        if (!program) return navigate('/my-programs', { replace: true })
        if (active) {
          setName(program.name)
          setFocus(program.focus ?? '')
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id, isEdit, navigate])

  async function handleSave() {
    if (!name.trim()) {
      setError('Donne un nom à ton programme')
      return
    }
    try {
      setSaving(true)
      setError('')
      const cleanFocus = focus.trim() || null
      if (isEdit) {
        await updateUserProgram(id as string, { name: name.trim(), focus: cleanFocus })
        navigate(`/my-programs/${id}`)
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return
        const program = await createUserProgram(user.id, name.trim(), cleanFocus)
        navigate(`/my-programs/${program.id}`, { replace: true })
      }
    } catch (err) {
      console.error(err)
      setError("Échec de l'enregistrement. Réessaie.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      setConfirmDelete(false)
      await softDeleteUserProgram(id as string)
      navigate('/my-programs', { replace: true })
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <LightLayout noSafeAreaTop className="pb-tabbar">
      <StickyPageHeader
        variant="light"
        title={isEdit ? 'Modifier le programme' : 'Nouveau programme'}
        onBack={() => navigate(isEdit ? `/my-programs/${id}` : '/my-programs')}
      />

      {loading ? (
        <div className="px-4 flex flex-col gap-4">
          <div className="h-14 bg-surface rounded-12 animate-pulse" />
          <div className="h-14 bg-surface rounded-12 animate-pulse" />
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="program-name" className="font-sans font-semibold text-sm text-tx-1">
              Nom du programme
            </label>
            <input
              id="program-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError('')
              }}
              placeholder="Ex : Push Pull Legs perso"
              className="w-full bg-white rounded-12 px-4 py-4 font-sans text-base text-tx-1 placeholder-tx-3 focus:outline-none focus:ring-2 focus:ring-tx-1/10 shadow-[0px_0px_24px_0px_rgba(31,32,33,0.06)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="program-focus" className="font-sans font-semibold text-sm text-tx-1">
              Focus / objectif <span className="text-tx-3 font-normal">(optionnel)</span>
            </label>
            <input
              id="program-focus"
              type="text"
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="Ex : Force & volume haut du corps"
              className="w-full bg-white rounded-12 px-4 py-4 font-sans text-base text-tx-1 placeholder-tx-3 focus:outline-none focus:ring-2 focus:ring-tx-1/10 shadow-[0px_0px_24px_0px_rgba(31,32,33,0.06)]"
            />
          </div>

          {error && (
            <p className="font-sans text-sm text-[#e62d2d] -mt-2" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-3 bg-tx-1 text-pr-1 font-sans font-semibold text-base p-4 rounded-12 cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-60 shadow-[0px_0px_40px_0px_rgba(31,32,33,0.4)]"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer le programme'}
          </button>

          {isEdit && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 bg-[rgba(230,45,45,0.08)] text-[#e62d2d] font-sans font-semibold text-sm p-4 rounded-12 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <Trash2 size={16} />
              Supprimer ce programme
            </button>
          )}
        </div>
      )}

      <ActionSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        ariaLabel="Confirmer la suppression du programme"
        header={
          <div className="text-center pb-2">
            <p className="font-serif font-bold text-lg text-tx-1">Supprimer ce programme ?</p>
            <p className="font-sans text-sm text-tx-3 mt-1">
              Les séances de ce programme seront aussi supprimées.
            </p>
          </div>
        }
        actions={[
          { label: 'Supprimer', onClick: handleDelete, variant: 'destructive' },
          { label: 'Annuler', onClick: () => setConfirmDelete(false), variant: 'cancel' },
        ]}
      />
    </LightLayout>
  )
}
