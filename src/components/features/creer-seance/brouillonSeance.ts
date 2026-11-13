import { SLOT_ORDER } from '@/types'
import type { WorkoutCategory } from '@/types'
import type { DraftExercise } from '@/lib/myPrograms'
import type { SlotMap } from './useEditeurSeance'

/**
 * Séance commencée puis gardée pour plus tard (planches F6 / F7). Rangée sur le téléphone seulement
 * (localStorage, une par compte), jamais en base : « Créer une séance » la repropose tant qu'elle n'est
 * ni enregistrée, ni annulée, ni remplacée par une nouvelle séance.
 */
export interface Brouillon {
  name: string
  category: WorkoutCategory
  imageUrl: string | null
  slots: SlotMap
  freeExos: DraftExercise[]
}

const cle = (userId: string) => `grint-seance-gardee:${userId}`

export const nbExercices = (b: Brouillon) => SLOT_ORDER.filter((s) => b.slots[s]).length + b.freeExos.length

/** Rien à garder : ni nom, ni image, ni exercice (la séance se ferme sans rien demander). */
export const estVide = (b: Brouillon) => !b.name.trim() && !b.imageUrl && nbExercices(b) === 0

export function lireBrouillon(userId: string | null): Brouillon | null {
  if (!userId) return null
  try {
    const brut = localStorage.getItem(cle(userId))
    if (!brut) return null
    const b = JSON.parse(brut) as Brouillon
    if (!b || typeof b !== 'object' || !b.slots || !Array.isArray(b.freeExos)) return null
    return estVide(b) ? null : b
  } catch {
    return null
  }
}

export function garderBrouillon(userId: string | null, b: Brouillon) {
  if (!userId) return
  try {
    localStorage.setItem(cle(userId), JSON.stringify(b))
  } catch {
    /* stockage indisponible (navigation privée) : la séance ne sera pas reproposée */
  }
}

export function oublierBrouillon(userId: string | null) {
  if (!userId) return
  try {
    localStorage.removeItem(cle(userId))
  } catch {
    /* rien à faire */
  }
}
