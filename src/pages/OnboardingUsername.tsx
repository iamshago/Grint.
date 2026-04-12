// @ts-nocheck
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Check, X } from 'lucide-react'
import LightLayout from '@/components/layout/LightLayout'

export default function OnboardingUsername() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const checkAvailability = (username: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!username.trim() || username.trim().length < 3) {
      setAvailable(null)
      setError(username.trim().length > 0 ? 'Minimum 3 caractères' : '')
      return
    }
    if (username.length > 20) {
      setAvailable(null)
      setError('Maximum 20 caractères')
      return
    }
    setChecking(true)
    setError('')
    debounceRef.current = setTimeout(async () => {
      try {
        const { data, error: err } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', username.trim())
          .limit(1)

        if (err) {
          setAvailable(true)
        } else if (data && data.length > 0) {
          setAvailable(false)
        } else {
          setAvailable(true)
        }
      } catch {
        setAvailable(true)
      } finally {
        setChecking(false)
      }
    }, 500)
  }

  const handleChange = (newVal: string) => {
    const cleaned = newVal.toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (cleaned.length > 20) return
    setValue(cleaned)
    checkAvailability(cleaned)
  }

  const handleSubmit = async () => {
    if (!available || value.trim().length < 3 || saving) return
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const displayName = user.user_metadata?.full_name || user.user_metadata?.name || 'Athlète'

      await supabase.from('profiles').upsert({
        id: user.id,
        username: value.trim(),
        display_name: displayName,
      }, { onConflict: 'id' })

      localStorage.setItem('username', `@${value.trim()}`)
      localStorage.setItem('userName', displayName)
      // Recharger pour que App.tsx re-vérifie hasUsername
      window.location.href = '/home'
    } catch (err) {
      setError('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const isValid = available === true && value.trim().length >= 3 && !checking && !saving

  return (
    <LightLayout hideTabBar className="flex flex-col px-6">
      {/* Contenu centré verticalement */}
      <div className="flex-1 flex flex-col justify-center -mt-16">
        {/* Logo */}
        <p className="font-serif font-bold italic text-[28px] text-tx-1 tracking-[-0.84px] mb-2">
          grint.
        </p>

        {/* Titre */}
        <h1 className="font-serif font-bold text-[32px] text-tx-1 tracking-[-0.96px] mb-2">
          Choisis ton pseudo
        </h1>

        {/* Sous-titre */}
        <p className="font-sans text-[16px] text-tx-3 mb-8">
          Un identifiant unique visible par tes amis.
        </p>

        {/* Input */}
        <div className="mb-4">
          <div
            className="flex items-center bg-surface rounded-[16px] overflow-hidden transition-colors border-2"
            style={{
              borderColor: available === false ? '#e62d2d' : available === true ? '#22c55e' : 'transparent',
            }}
          >
            <span className="pl-4 font-sans text-[16px] text-tx-3 select-none">@</span>
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="ton_pseudo"
              maxLength={20}
              autoFocus
              className="bg-transparent px-2 py-4 w-full text-[16px] text-tx-1 placeholder-tx-3 outline-none font-sans"
            />
            <div className="pr-4 shrink-0">
              {checking && (
                <div className="w-5 h-5 border-2 border-tx-3 border-t-transparent rounded-full animate-spin" />
              )}
              {!checking && available === true && (
                <Check size={20} className="text-[#22c55e]" />
              )}
              {!checking && available === false && (
                <X size={20} className="text-[#e62d2d]" />
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-6 mb-6">
          {error && <p className="font-sans text-[14px] text-[#e62d2d]">{error}</p>}
          {!checking && available === false && !error && (
            <p className="font-sans text-[14px] text-[#e62d2d]">Ce pseudo est déjà pris</p>
          )}
          {!checking && available === true && value.trim().length >= 3 && (
            <p className="font-sans text-[14px] text-[#22c55e]">Disponible !</p>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full p-4 rounded-[12px] font-sans font-semibold text-[16px] transition-all active:scale-[0.98]"
          style={{
            backgroundColor: isValid ? '#1b1d1f' : '#e6e8ed',
            color: isValid ? '#ffee8c' : '#9ca3b0',
            cursor: isValid ? 'pointer' : 'default',
          }}
        >
          {saving ? 'Enregistrement...' : 'Continuer'}
        </button>
      </div>
    </LightLayout>
  )
}
