import { useState, type ReactNode } from 'react'
import { motion, useMotionValue, animate, type PanInfo } from 'framer-motion'
import { Trash2 } from 'lucide-react'

const REVEAL = 88

interface SwipeableDeleteRowProps {
  children: ReactNode
  /** Appelé au tap sur la poubelle révélée. */
  onDelete: () => void
  ariaLabel?: string
}

/**
 * Ligne « swipe vers la gauche → poubelle ». Glisser la carte révèle un bouton
 * de suppression rouge derrière ; tap dessus déclenche onDelete. Le tap simple
 * sur la carte (sans drag) reste actif pour ouvrir la séance.
 */
export default function SwipeableDeleteRow({ children, onDelete, ariaLabel }: SwipeableDeleteRowProps) {
  const x = useMotionValue(0)
  const [open, setOpen] = useState(false)

  function handleDragEnd(_: unknown, info: PanInfo) {
    const shouldOpen = info.offset.x < -REVEAL / 2 || info.velocity.x < -400
    animate(x, shouldOpen ? -REVEAL : 0, { type: 'spring', stiffness: 500, damping: 40 })
    setOpen(shouldOpen)
  }

  return (
    <div className="relative">
      {/* Arrière-plan poubelle — révélé au swipe. */}
      <div className="absolute inset-0 rounded-16 bg-[#e8413a] flex items-center justify-end pr-5">
        <button
          type="button"
          onClick={onDelete}
          aria-label={ariaLabel ?? 'Supprimer'}
          tabIndex={open ? 0 : -1}
          className="w-12 h-12 flex items-center justify-center active:scale-90 transition-transform"
        >
          <Trash2 size={22} className="text-white" />
        </button>
      </div>

      {/* Carte au premier plan — draggable horizontalement. */}
      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: -REVEAL, right: 0 }}
        dragElastic={0.06}
        onDragEnd={handleDragEnd}
        className="relative rounded-16"
      >
        {children}
      </motion.div>
    </div>
  )
}
