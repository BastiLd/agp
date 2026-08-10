'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Badge } from './Badge'

export function Header() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [isPro, setIsPro] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
        const { data: userData } = await supabase
          .from('users')
          .select('is_pro')
          .eq('supabase_auth_id', user.id)
          .single()

        setIsPro(userData?.is_pro || false)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getUser()
      } else {
        setIsPro(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsPro(false)
  }

  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`backdrop-blur-md transition-all duration-300 sticky top-0 z-50 ${
        scrolled ? 'bg-[#03045e]/90 shadow-lg border-b border-white/10' : 'bg-[#03045e]/70 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center group">
            <span className="text-2xl font-bold text-white group-hover:text-ocean-200 transition-colors drop-shadow">
              Webbin
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'text-white'
                  : 'text-ocean-100 hover:text-white'
              }`}
            >
              Browse
            </Link>
            <Link
              href="/pricing"
              className={`text-sm font-medium transition-colors ${
                pathname === '/pricing'
                  ? 'text-white'
                  : 'text-ocean-100 hover:text-white'
              }`}
            >
              Pricing
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    pathname === '/dashboard'
                      ? 'text-white'
                      : 'text-ocean-100 hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>
                {user.email === 'admin@webbin.com' && (
                  <Link
                    href="/admin"
                    className={`text-sm font-medium transition-colors ${
                      pathname === '/admin'
                        ? 'text-white'
                        : 'text-ocean-100 hover:text-white'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                {isPro && (
                  <Badge variant="success" className="hidden sm:inline-flex">
                    Pro
                  </Badge>
                )}
                <span className="text-sm text-ocean-50 hidden sm:inline">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-ocean-100 hover:text-white"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-ocean-100 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/waitlist"
                  className="px-4 py-2 bg-white text-gray-900 rounded-full hover:bg-ocean-50 transition-all duration-300 transform hover:scale-105 text-sm font-medium shadow-lg"
                >
                  Join Waitlist
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

