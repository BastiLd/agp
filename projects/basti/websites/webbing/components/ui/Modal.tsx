'use client'

import { useEffect } from 'react'
import Image from 'next/image'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  title: string
}

export function Modal({ isOpen, onClose, imageUrl, title }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-7xl w-full h-full p-4 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full hover:bg-white transition-all duration-200 transform hover:scale-110 shadow-lg"
          aria-label="Close modal"
        >
          <svg
            className="w-6 h-6 text-gray-900"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Image Container */}
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative max-w-full max-h-full">
            <Image
              src={imageUrl}
              alt={title}
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* Title */}
        <div className="absolute bottom-4 left-4 right-4 text-center">
          <h3 className="text-white text-lg font-semibold bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">
            {title}
          </h3>
        </div>
      </div>
    </div>
  )
}

