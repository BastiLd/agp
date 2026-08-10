'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from './Badge'
import { TagPill } from './TagPill'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Modal } from './Modal'

interface IdeaCardProps {
  idea: {
    id: string
    title: string
    slug: string
    short_desc: string
    screenshot_url?: string | null
    tags?: string[] | null
    monthly_revenue_estimate?: number | null
    monthly_users_estimate?: number | null
    is_free_preview?: boolean
  }
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const tags = Array.isArray(idea.tags) ? idea.tags : []
  const [imageLoaded, setImageLoaded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <Link
      href={`/idea/${idea.slug}`}
      className="group block bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden card-hover animate-fade-in-up shadow-xl hover:shadow-2xl hover:border-white/20 transition-all duration-300"
    >
      {/* Screenshot as main element - large and prominent */}
      <div 
        className="relative w-full h-56 sm:h-64 bg-gray-100 overflow-hidden cursor-pointer"
        onClick={(e) => {
          e.preventDefault()
          if (idea.screenshot_url) setModalOpen(true)
        }}
      >
        {idea.screenshot_url ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-ocean-50 to-ocean-100 animate-pulse" />
            )}
            <Image
              src={idea.screenshot_url}
              alt={idea.title}
              fill
              className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ocean-50 to-ocean-100">
            <div className="text-gray-400 text-sm">No screenshot</div>
          </div>
        )}
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300" />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {idea.is_free_preview && (
            <Badge variant="info" className="shadow-lg">
              Free Preview
            </Badge>
          )}
        </div>
        
        {/* Hover overlay with quick info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="text-white text-sm font-medium line-clamp-1">
            {idea.title}
          </div>
        </div>
      </div>
      
      {/* Card Content */}
      <div className="p-4 sm:p-5">
        <h3 className="text-base sm:text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-ocean-200 transition-colors drop-shadow">
          {idea.title}
        </h3>
        <p className="text-xs sm:text-sm text-ocean-100 mb-3 sm:mb-4 line-clamp-2">
          {idea.short_desc}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 3).map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-ocean-200/70 px-2 py-1">+{tags.length - 3}</span>
          )}
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-ocean-200 pt-3 border-t border-white/10">
          {idea.monthly_revenue_estimate && (
            <span className="font-medium">
              {formatCurrency(idea.monthly_revenue_estimate)}/mo
            </span>
          )}
          {idea.monthly_users_estimate && (
            <span>{formatNumber(idea.monthly_users_estimate)} users</span>
          )}
        </div>
      </div>
      
      {/* Screenshot Modal */}
      {idea.screenshot_url && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          imageUrl={idea.screenshot_url}
          title={idea.title}
        />
      )}
    </Link>
  )
}
