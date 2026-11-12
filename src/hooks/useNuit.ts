import { useEffect, useState } from 'react'

/** La nuit commence à 18 h et finit à 7 h, heure du téléphone. */
export const NUIT_DEBUT = 18
export const NUIT_FIN = 7

/** Vrai de 18 h à 7 h (heure locale). */
export function estNuit(d: Date = new Date()): boolean {
  const h = d.getHours()
  return h >= NUIT_DEBUT || h < NUIT_FIN
}

/** Millisecondes jusqu'à la prochaine bascule (7 h ou 18 h, heure locale). */
function avantBascule(d: Date): number {
  const p = new Date(d.getTime())
  p.setMinutes(0, 0, 0)
  const h = d.getHours()
  if (h >= NUIT_DEBUT) {
    p.setDate(p.getDate() + 1)
    p.setHours(NUIT_FIN)
  } else if (h < NUIT_FIN) {
    p.setHours(NUIT_FIN)
  } else {
    p.setHours(NUIT_DEBUT)
  }
  return p.getTime() - d.getTime()
}

/**
 * Jour ou nuit, selon l'heure du téléphone. Si l'app reste ouverte au passage de 7 h
 * ou de 18 h, la valeur change toute seule (pas besoin de recharger).
 */
export function useNuit(): boolean {
  const [nuit, setNuit] = useState(() => estNuit())

  useEffect(() => {
    let minuteur: number | undefined
    const maj = () => {
      const maintenant = new Date()
      setNuit(estNuit(maintenant))
      window.clearTimeout(minuteur)
      minuteur = window.setTimeout(maj, avantBascule(maintenant) + 500)
    }
    maj()
    // Un téléphone en veille gèle les minuteurs : on revérifie au retour sur l'app.
    const auRetour = () => {
      if (document.visibilityState === 'visible') maj()
    }
    document.addEventListener('visibilitychange', auRetour)
    return () => {
      window.clearTimeout(minuteur)
      document.removeEventListener('visibilitychange', auRetour)
    }
  }, [])

  return nuit
}
