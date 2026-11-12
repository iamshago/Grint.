import { useEffect, useRef, useState } from 'react'
import { fetchWorkoutImages } from '@/lib/myPrograms'
import { uploadWorkoutCover } from '@/lib/workoutCoverUpload'
import { IconeAppareil, IconeCoche, IconeX } from '@/components/features/creer-seance/icones'
import '@/components/features/creer-seance/creer-seance.css'
import type { ImageLibraryCategory, WorkoutImage } from '@/types'

interface ImagePickerSheetProps {
  open: boolean
  onClose: () => void
  /** Catégorie de la séance — filtre la galerie (generic en complément). */
  category?: ImageLibraryCategory
  onSelect: (url: string) => void
}

/**
 * Feuille de choix d'image de couverture (workout_image_library) — planches F3 / G1.
 * Posée dans la page (absolute, plein cadre). « Ta photo » en premier, puis la galerie
 * de la catégorie en grille 3 colonnes ; les vignettes entrent en cascade.
 * Au toucher : la coche apparaît, la feuille redescend et l'image remplit le haut de la page.
 */
export default function ImagePickerSheet({ open, onClose, category, onSelect }: ImagePickerSheetProps) {
  const [images, setImages] = useState<WorkoutImage[]>([])
  const [choisie, setChoisie] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const fichierRef = useRef<HTMLInputElement>(null)
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Galerie chargée d'avance (et à chaque changement de catégorie) : les vignettes
  // existent déjà quand la feuille monte, pour que leur entrée en cascade se voie.
  useEffect(() => {
    let active = true
    fetchWorkoutImages(category)
      .then((imgs) => active && setImages(imgs))
      .catch((e) => console.error(e))
    return () => {
      active = false
    }
  }, [category])

  useEffect(() => {
    if (!open) return
    setChoisie(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => () => {
    if (minuteur.current) clearTimeout(minuteur.current)
  }, [])

  function choisir(img: WorkoutImage) {
    setChoisie(img.id)
    minuteur.current = setTimeout(() => {
      onSelect(img.image_url)
      onClose()
    }, 380)
  }

  async function envoyerPhoto(fichier: File | undefined) {
    if (!fichier || envoi) return
    try {
      setEnvoi(true)
      const url = await uploadWorkoutCover(fichier)
      onSelect(url)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setEnvoi(false)
      if (fichierRef.current) fichierRef.current.value = ''
    }
  }

  const cls = open ? 'ip-ouvert' : ''

  return (
    <div aria-hidden={!open} style={{ position: 'absolute', inset: 0, zIndex: 200, overflow: 'hidden', pointerEvents: 'none', fontFamily: 'Figtree, Inter, system-ui, sans-serif', lineHeight: 1.5 }}>
      <button
        type="button"
        className={`ip-voile ${cls}`}
        onClick={onClose}
        aria-label="Fermer"
        tabIndex={open ? 0 : -1}
        style={{ position: 'absolute', inset: 0, border: 0, padding: 0, background: 'rgba(0,0,0,0.5)' }}
      />
      <div
        className={`ip-picker ${cls}`}
        role="dialog"
        aria-modal="true"
        aria-label="Choisir une image"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: '#1c1c1e', borderRadius: '24px 24px 0 0', paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))', pointerEvents: open ? 'auto' : 'none' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 9999, background: '#3d4149' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px' }}>
          <h3 style={{ margin: 0, fontFamily: "'PT Serif', Georgia, serif", fontWeight: 700, fontSize: 20, lineHeight: '28px', color: '#f1f4fb' }}>Choisir une image</h3>
          <button type="button" onClick={onClose} aria-label="Fermer" style={{ border: 0, background: '#3d4149', borderRadius: 9999, padding: 8, display: 'flex', cursor: 'pointer' }}>
            <IconeX taille={18} trait="#f1f4fb" />
          </button>
        </div>
        <div style={{ padding: '0 20px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
          <button
            type="button"
            className="ip-tuile ip-touche"
            onClick={() => fichierRef.current?.click()}
            style={{ aspectRatio: '1', border: 0, borderRadius: 12, background: 'rgba(255,238,140,0.1)', boxShadow: 'inset 0 0 0 1.5px rgba(255,238,140,0.6)', color: '#ffee8c', fontFamily: 'inherit', fontWeight: 600, fontSize: 12, lineHeight: 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, transitionDelay: '.1s' }}
          >
            <IconeAppareil taille={26} trait="#ffee8c" epaisseur={1.8} />
            Ta photo
          </button>
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              className="ip-tuile ip-touche"
              onClick={() => choisir(img)}
              aria-label={img.label ?? 'Image'}
              style={{ position: 'relative', aspectRatio: '1', border: 0, padding: 0, borderRadius: 12, overflow: 'hidden', background: '#3d4149', transitionDelay: `${(0.14 + i * 0.035).toFixed(3)}s` }}
            >
              <img src={img.image_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              {choisie === img.id && (
                <span style={{ position: 'absolute', inset: 0, borderRadius: 12, boxShadow: 'inset 0 0 0 2px #ffee8c', background: 'rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="ip-pop" style={{ width: 32, height: 32, borderRadius: 9999, background: '#ffee8c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconeCoche taille={18} trait="#1b1d1f" epaisseur={3} />
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
        <input
          ref={fichierRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => envoyerPhoto(e.target.files?.[0])}
        />
      </div>
    </div>
  )
}
