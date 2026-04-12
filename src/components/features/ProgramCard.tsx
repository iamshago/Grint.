import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import Badge from '@/components/ui/Badge'

interface ProgramCardProps {
  title: string
  difficulty?: string
  frequency?: string
  imageUrl?: string
  onClick?: () => void
  className?: string
}

/** Carte programme pour le scroll horizontal — Figma node 332:1459 */
export default function ProgramCard({
  title,
  difficulty,
  frequency,
  imageUrl,
  onClick,
  className,
}: ProgramCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative w-[248px] h-[224px] shrink-0 rounded-16 overflow-hidden cursor-pointer active:scale-95 transition-transform',
        className,
      )}
    >
      {/* Image de fond */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover rounded-16"
        />
      )}

      {/* Overlay gradient */}
      <div
        className="absolute inset-0 backdrop-blur-[8px]"
        style={{
          backgroundImage:
            'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.3) 100%), linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(31,32,33,0) 60%)',
        }}
      />

      {/* Contenu */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 gap-2">
        {difficulty && (
          <Badge variant="gold" className="self-start">
            {difficulty}
          </Badge>
        )}
        <h3 className="font-serif font-bold text-[32px] text-bg-1 tracking-tight leading-none">
          {title}
        </h3>
        {frequency && (
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-bg-1" />
            <span className="font-sans text-base text-bg-1">{frequency}</span>
          </div>
        )}
      </div>
    </div>
  )
}
