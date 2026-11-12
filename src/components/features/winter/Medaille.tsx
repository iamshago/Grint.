import { cn } from '@/lib/utils'
import { FACE_MEDAILLE, MEDAILLES_SVG } from './medaillesSvg'
import './medailles.css'

export type ModeleMedaille = 'camp' | 'palier8' | 'mipente' | 'palier16' | 'sommet'

interface MedailleProps {
  modele: ModeleMedaille
  etat: 'gagnee' | 'verrouillee'
  /** « nouveau » : le reflet passe sur la face (médaille qui vient d'être gagnée). */
  anim?: 'aucune' | 'nouveau'
  taille: number
  className?: string
}

/** Médaille Grint (G-Medaille, relief plat) : le rendu de la maquette, à l'identique. */
export default function Medaille({ modele, etat, anim = 'aucune', taille, className }: MedailleProps) {
  let html = MEDAILLES_SVG[`${modele}-${etat}`] ?? ''
  if (anim === 'nouveau' && etat === 'gagnee') {
    html = html.replace(FACE_MEDAILLE, FACE_MEDAILLE.replace('class=""', 'class="gm-nouveau"'))
  }
  return (
    <span
      className={cn('relative block shrink-0', className)}
      style={{ width: taille, height: taille }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

/** Médailles de la série Winter, dans l'ordre de « À gagner », avec le seuil de points de chacune. */
export const SERIE_WINTER: Array<{ modele: ModeleMedaille; seuil: number }> = [
  { modele: 'camp', seuil: 0 },
  { modele: 'palier8', seuil: 8 },
  { modele: 'mipente', seuil: 12 },
  { modele: 'palier16', seuil: 16 },
  { modele: 'sommet', seuil: 24 },
]
