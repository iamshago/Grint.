import { supabase } from './supabaseClient'

/**
 * « Ta photo » (feuille d'images, planches F3 / G1) : la photo choisie par l'utilisateur
 * est réduite (1200 px de large au plus, JPEG) puis envoyée dans le bucket Storage
 * `workout-covers`, dans un dossier à son nom. Renvoie l'URL publique, rangée telle
 * quelle dans `image_url` comme une image de la galerie.
 *
 * Le bucket et ses règles sont dans supabase/migrations/20261112_workout_covers_bucket.sql
 * (pas encore appliquée). Tant qu'il n'existe pas, `photosDisponibles()` répond non et la
 * feuille d'images n'affiche pas « Ta photo ».
 */
const BUCKET = 'workout-covers'
const LARGEUR_MAX = 1200

async function reduire(fichier: File): Promise<Blob> {
  const bitmap = await createImageBitmap(fichier)
  const echelle = Math.min(1, LARGEUR_MAX / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * echelle)
  canvas.height = Math.round(bitmap.height * echelle)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((ok, ko) =>
    canvas.toBlob((b) => (b ? ok(b) : ko(new Error('Image illisible'))), 'image/jpeg', 0.82),
  )
}

export async function uploadWorkoutCover(fichier: File): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non connecté')
  const image = await reduire(fichier)
  const chemin = `${user.id}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(chemin, image, { contentType: 'image/jpeg', upsert: false })
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(chemin).data.publicUrl
}

let dispo: Promise<boolean> | null = null

/**
 * Le bucket `workout-covers` existe-t-il ? (lecture du bucket, permise par la migration ;
 * sans elle, « Bucket not found »). Réponse gardée pour la session ; un non est redemandé
 * à l'ouverture suivante, pour que « Ta photo » apparaisse dès la migration appliquée.
 */
export function photosDisponibles(): Promise<boolean> {
  if (!dispo) {
    dispo = Promise.resolve()
      .then(() => supabase.storage.getBucket(BUCKET))
      .then(({ data, error }) => Boolean(data) && !error)
      .catch(() => false)
      .then((ok) => {
        if (!ok) dispo = null
        return ok
      })
  }
  return dispo
}
