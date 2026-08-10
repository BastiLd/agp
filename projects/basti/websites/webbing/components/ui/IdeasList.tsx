'use client'

import { useEffect, useState, useRef } from 'react'
import { IdeaCard } from './IdeaCard'
import { Pagination } from './Pagination'

interface Idea {
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

interface IdeasListProps {
  initialIdeas: Idea[]
  pagination: {
    page: number
    totalPages: number
    total: number
  }
}

export function IdeasList({ initialIdeas, pagination }: IdeasListProps) {
  const [ideas, setIdeas] = useState(initialIdeas)
  const [hasSearched, setHasSearched] = useState(false)
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set())
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  useEffect(() => {
    // Check if user has searched before
    const searched = localStorage.getItem('webbin_searched')
    if (!searched) {
      // First search - mark first 5 as free preview
      setIdeas((prev) =>
        prev.map((idea, index) => ({
          ...idea,
          is_free_preview: index < 5,
        }))
      )
      localStorage.setItem('webbin_searched', 'true')
      setHasSearched(true)
    } else {
      setHasSearched(true)
    }
  }, [])

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardId = entry.target.getAttribute('data-card-id')
            if (cardId) {
              setVisibleCards((prev) => new Set(prev).add(cardId))
            }
          }
        })
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [ideas])

  if (ideas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-ocean-200">No ideas found. Try a different search.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-12">
        {ideas.map((idea, index) => {
          const isVisible = visibleCards.has(idea.id)
          return (
            <div
              key={idea.id}
              ref={(el) => {
                if (el) cardRefs.current.set(idea.id, el)
              }}
              data-card-id={idea.id}
              className={`transition-all duration-500 ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 0.05}s` }}
            >
              <IdeaCard idea={idea} />
            </div>
          )
        })}
      </div>
      <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} />
    </>
  )
}

