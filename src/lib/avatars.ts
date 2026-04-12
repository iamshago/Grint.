/** Catalogue d'avatars de profil — images depuis le design Figma */

export interface Avatar {
  id: string
  src: string
  label: string
  category: 'hero' | 'cartoon' | 'real'
}

export const AVATARS: Avatar[] = [
  // --- Héros / Personnages stylisés ---
  { id: 'black-panther', src: '/assets/avatars/black-panther.png', label: 'Black Panther', category: 'hero' },
  { id: 'hulk', src: '/assets/avatars/hulk.png', label: 'Hulk', category: 'hero' },
  { id: 'superman', src: '/assets/avatars/superman.png', label: 'Superman', category: 'hero' },
  { id: 'boxer', src: '/assets/avatars/boxer.png', label: 'Boxeur', category: 'hero' },
  { id: 'cyborg', src: '/assets/avatars/cyborg.png', label: 'Cyborg', category: 'hero' },
  { id: 'adventurer', src: '/assets/avatars/adventurer.png', label: 'Aventurière', category: 'hero' },
  { id: 'fighter', src: '/assets/avatars/fighter.png', label: 'Combattante', category: 'hero' },
  { id: 'harley', src: '/assets/avatars/harley.png', label: 'Harley', category: 'hero' },
  { id: 'elastigirl', src: '/assets/avatars/elastigirl.png', label: 'Elastigirl', category: 'hero' },
  { id: 'frozone', src: '/assets/avatars/frozone.png', label: 'Frozone', category: 'hero' },
  { id: 'dash', src: '/assets/avatars/dash.png', label: 'Dash', category: 'hero' },
  { id: 'fierce-woman', src: '/assets/avatars/fierce-woman.png', label: 'Guerrière', category: 'hero' },

  // --- Dessins animés ---
  { id: 'rapunzel', src: '/assets/avatars/rapunzel.png', label: 'Rapunzel', category: 'cartoon' },
  { id: 'moana', src: '/assets/avatars/moana.png', label: 'Moana', category: 'cartoon' },
  { id: 'pocahontas', src: '/assets/avatars/pocahontas.png', label: 'Pocahontas', category: 'cartoon' },
  { id: 'winx-stella', src: '/assets/avatars/winx-stella.png', label: 'Stella', category: 'cartoon' },
  { id: 'winx-flora', src: '/assets/avatars/winx-flora.png', label: 'Flora', category: 'cartoon' },
  { id: 'winx-bloom', src: '/assets/avatars/winx-bloom.png', label: 'Bloom', category: 'cartoon' },

  // --- Réalistes ---
  { id: 'braids-girl', src: '/assets/avatars/braids-girl.png', label: 'Braids', category: 'real' },
  { id: 'blonde-girl', src: '/assets/avatars/blonde-girl.png', label: 'Blonde', category: 'real' },
  { id: 'sporty-girl', src: '/assets/avatars/sporty-girl.png', label: 'Sporty', category: 'real' },
  { id: 'glasses-guy', src: '/assets/avatars/glasses-guy.png', label: 'Glasses', category: 'real' },
  { id: 'wavy-guy', src: '/assets/avatars/wavy-guy.png', label: 'Wavy', category: 'real' },
  { id: 'yellow-top-girl', src: '/assets/avatars/yellow-top-girl.png', label: 'Yellow Top', category: 'real' },
  { id: 'hoodie-guy', src: '/assets/avatars/hoodie-guy.png', label: 'Hoodie', category: 'real' },
  { id: 'button-shirt-guy', src: '/assets/avatars/button-shirt-guy.png', label: 'Chemise', category: 'real' },
  { id: 'zip-girl', src: '/assets/avatars/zip-girl.png', label: 'Zip', category: 'real' },
  { id: 'muscle-tee-guy', src: '/assets/avatars/muscle-tee-guy.png', label: 'Muscle Tee', category: 'real' },
]

/** Retourne un avatar par son id */
export function getAvatarById(id: string): Avatar | undefined {
  return AVATARS.find((a) => a.id === id)
}

/** Retourne l'avatar par défaut (superman, comme le design Figma) */
export function getDefaultAvatar(): Avatar {
  return AVATARS.find((a) => a.id === 'superman') || AVATARS[0]
}
