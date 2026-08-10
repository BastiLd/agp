'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))
      router.push(`/?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timer)
  }, [query, selectedTags, router])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for profitable web app ideas..."
          className="w-full px-6 py-4 pl-14 pr-4 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md text-white placeholder:text-ocean-200 focus:ring-2 focus:ring-ocean-400 focus:border-ocean-400 transition-all duration-300 text-lg shadow-lg hover:shadow-xl focus:shadow-2xl"
        />
        <svg
          className="absolute left-6 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ocean-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      {selectedTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white/10 backdrop-blur-sm border border-white/20 text-white"
            >
              {tag}
              <button
                onClick={() => toggleTag(tag)}
                className="ml-2 text-ocean-200 hover:text-white transition-colors"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

