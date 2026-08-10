'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const searchParams = useSearchParams()

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    return `/?${params.toString()}`
  }

  if (totalPages <= 1) return null

  return (
    <nav className="flex items-center justify-center gap-2 mt-8">
      {currentPage > 1 && (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
        >
          Previous
        </Link>
      )}

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(
            (page) =>
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
          )
          .map((page, index, array) => {
            const prevPage = array[index - 1]
            const showEllipsis = prevPage && page - prevPage > 1

            return (
              <div key={page} className="flex items-center gap-1">
                {showEllipsis && <span className="px-2 text-white">...</span>}
                <Link
                  href={createPageUrl(page)}
                  className={`px-4 py-2 rounded-full border transition-all duration-200 ${
                    page === currentPage
                      ? 'bg-ocean-500 text-white border-ocean-500 shadow-lg'
                      : 'border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/30'
                  }`}
                >
                  {page}
                </Link>
              </div>
            )
          })}
      </div>

      {currentPage < totalPages && (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/30 transition-all duration-200"
        >
          Next
        </Link>
      )}
    </nav>
  )
}

