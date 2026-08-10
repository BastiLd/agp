'use client'

import { cn } from '@/lib/utils'

interface TagPillProps {
  tag: string
  onClick?: () => void
  className?: string
}

export function TagPill({ tag, onClick, className }: TagPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
        'bg-white/10 backdrop-blur-sm border border-white/20 text-white',
        'transition-all duration-200 transform hover:scale-105 hover:bg-white/15',
        onClick ? 'cursor-pointer active:scale-95' : 'cursor-default',
        className
      )}
    >
      {tag}
    </button>
  )
}

