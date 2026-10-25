'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn, mediaUrl } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { CeibboLogoMark } from '@/components/ui/CeibboLogoMark'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api-client'
import { obtenerPerfil, nombreCompleto } from '@/lib/api/perfiles'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/student/inicio',        icon: 'home',                 label: 'Inicio' },
  { href: '/student/oportunidades', icon: 'work',                 label: 'Oportunidades' },
  { href: '/student/postulaciones', icon: 'assignment_turned_in', label: 'Postulaciones' },
  { href: '/student/mensajes',      icon: 'mail',                 label: 'Mensajes' },
]

interface UserSuggestion {
  userId: string
  role: string
  name: string
  avatar?: string
  extra?: string
}

const roleIcon: Record<string, string> = {
  STUDENT: 'school',
  EMPRESA: 'business',
  COLEGIO: 'account_balance',
}

// ── Search bar extracted so useSearchParams() is inside Suspense ──────────────
function NavSearchBar({ onSelectUser, mobile = false }: { onSelectUser: (userId: string) => void; mobile?: boolean }) {
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [searchValue,  setSearchValue]  = useState('')
  const [suggestions,  setSuggestions]  = useState<UserSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loadingSugg,  setLoadingSugg]  = useState(false)
  const suggDebounce  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // suppress unused warning — kept for potential future URL sync
  void searchParams

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (value: string) => {
    setSearchValue(value)

    if (suggDebounce.current) clearTimeout(suggDebounce.current)
    if (!value.trim()) { setSuggestions([]); setShowDropdown(false); return }
    suggDebounce.current = setTimeout(async () => {
      setLoadingSugg(true)
      try {
        const data = await api.get<UserSuggestion[]>(`/users/search?q=${encodeURIComponent(value.trim())}&limit=6`)
        setSuggestions(data.filter(r => r.userId !== user?.id))
        setShowDropdown(true)
      } catch { /* silencioso */ }
      finally { setLoadingSugg(false) }
    }, 300)
  }

  const handleSuggestionClick = (userId: string) => {
    setShowDropdown(false)
    setSearchValue('')
    setSuggestions([])
    onSelectUser(userId)
  }

  return (
    <div ref={wrapperRef} className={mobile ? 'relative w-full' : 'hidden lg:block relative w-64'}>
      <div className="flex items-center bg-surface-container-low border border-outline-variant/30 hover:border-primary/40 focus-within:border-primary/60 px-4 py-2 rounded-xl gap-3">
        <span className="material-symbols-outlined text-outline text-[20px]" aria-hidden="true">search</span>
        <input
          type="text"
          value={searchValue}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Buscar usuarios..."
          aria-label="Buscar usuarios"
          role="combobox"
          aria-expanded={showDropdown && suggestions.length > 0}
          aria-haspopup="listbox"
          aria-controls={mobile ? 'student-nav-search-listbox-mobile' : 'student-nav-search-listbox'}
          aria-autocomplete="list"
          className="bg-transparent border-none outline-none text-sm w-full placeholder:text-outline font-body text-on-surface focus-visible:ring-2 focus-visible:ring-primary rounded"
        />
        {loadingSugg && (
          <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" aria-hidden="true" />
        )}
        {searchValue && !loadingSugg && (
          <button
            type="button"
            onClick={() => { handleSearch(''); setSuggestions([]); setShowDropdown(false) }}
            className="text-outline hover:text-on-surface shrink-0"
            aria-label="Limpiar búsqueda"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          id={mobile ? 'student-nav-search-listbox-mobile' : 'student-nav-search-listbox'}
          role="listbox"
          aria-label="Resultados de búsqueda"
          className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant/20 rounded-xl shadow-elevated z-50 py-1 animate-fade-in"
        >
          {suggestions.map(s => (
            <button
              key={s.userId}
              type="button"
              role="option"
              aria-selected="false"
              onClick={() => handleSuggestionClick(s.userId)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-container transition-colors text-left"
            >
              <Avatar
                src={s.avatar ? mediaUrl(s.avatar) : undefined}
                name={s.name}
                size="sm"
                shape={s.role === 'COLEGIO' ? 'rounded' : 'circle'}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">{s.name}</p>
                {s.extra && <p className="text-[11px] text-outline truncate">{s.extra}</p>}
              </div>
              <span className="shrink-0 material-symbols-outlined text-[14px] text-primary icon-filled" aria-hidden="true">
                {roleIcon[s.role] ?? 'person'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Notification bell with live count ────────────────────────────────────────
function NavBell() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const load = () =>
      api.get<{ count: number }>('/notifications/unread-count')
        .then(r => setUnreadCount(r.count ?? 0))
        .catch(() => {})
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Link
      href="/student/notificaciones"
      className="relative p-2.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-primary-fixed/30"
      aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
    >
      <span className="material-symbols-outlined text-[22px]" aria-hidden="true">notifications</span>
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-error text-on-error text-[10px] font-black rounded-full flex items-center justify-center border-2 border-surface px-0.5" aria-hidden="true">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}

// ── Main nav ──────────────────────────────────────────────────────────────────
export function StudentNav() {
  const pathname    = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const [displayName, setDisplayName] = useState(user?.email?.split('@')[0] ?? 'Estudiante')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    obtenerPerfil()
      .then(p => {
        const nombre = nombreCompleto(p)
        if (nombre) setDisplayName(nombre)
      })
      .catch(() => {})
  }, [isAuthenticated])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close profile menu on Escape
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [menuOpen])

  // Close mobile panels on route change
  useEffect(() => {
    setMobileNavOpen(false)
    setMobileSearchOpen(false)
  }, [pathname])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    router.push('/auth/login')
  }

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 h-20 glass-nav border-b border-outline-variant/20 shadow-subtle">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-2 sm:gap-4">

        {/* Left: Logo + Search */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/student/inicio" className="flex items-center gap-3 group shrink-0">
            <CeibboLogoMark className="w-11 h-11" />
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-tight font-headline hidden sm:block">
              Ceibbo
            </span>
          </Link>
          <Suspense fallback={
            <div className="hidden lg:block w-64 h-10 rounded-xl bg-surface-container-low border border-outline-variant/30" />
          }>
            <NavSearchBar onSelectUser={(uid) => router.push('/student/ver/' + uid)} />
          </Suspense>
        </div>

        {/* Center: Nav links */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar" aria-label="Principal">
          {navItems.map(({ href, icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold tracking-wide transition-colors duration-150 whitespace-nowrap shrink-0',
                  active
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
                )}
              >
                <span className={cn('material-symbols-outlined text-[20px] shrink-0', active && 'icon-filled')} aria-hidden="true">
                  {icon}
                </span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right: Search icon (mobile) + Hamburger (mobile) + Bell + Profile */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => { setMobileSearchOpen(o => !o); setMobileNavOpen(false) }}
            className="lg:hidden p-2.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-primary-fixed/30"
            aria-label="Buscar"
            aria-expanded={mobileSearchOpen}
            aria-controls="student-mobile-search-panel"
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">search</span>
          </button>

          <button
            type="button"
            onClick={() => { setMobileNavOpen(o => !o); setMobileSearchOpen(false) }}
            className="lg:hidden p-2.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-primary-fixed/30"
            aria-label="Menú"
            aria-expanded={mobileNavOpen}
            aria-controls="student-mobile-nav-panel"
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{mobileNavOpen ? 'close' : 'menu'}</span>
          </button>

          <NavBell />

          <div className="h-8 w-px bg-outline-variant/30 hidden sm:block" />

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2.5 p-1 pr-3 rounded-full border border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container-low group"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`Menú de perfil, ${displayName}`}
            >
              <Avatar
                name={displayName}
                size="sm"
                shape="circle"
                className="ring-2 ring-transparent group-hover:ring-primary/40"
              />
              <div className="hidden lg:flex flex-col min-w-0">
                <span className="text-xs font-bold text-on-surface leading-tight truncate max-w-[100px]">
                  {displayName}
                </span>
                <span className="text-[10px] text-on-surface-variant font-medium">Estudiante</span>
              </div>
              <span className={cn('material-symbols-outlined text-[18px] text-on-surface-variant transition-transform hidden lg:block', menuOpen && 'rotate-180')} aria-hidden="true">
                expand_more
              </span>
            </button>

            {menuOpen && (
              <div role="menu" aria-label="Menú de perfil" className="absolute top-full right-0 mt-2 w-56 bg-surface border border-outline-variant/20 rounded-xl shadow-elevated z-50 py-1.5 animate-fade-in">
                <Link
                  href="/student/perfil"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant" aria-hidden="true">person</span>
                  Ver perfil
                </Link>
                <div className="h-px bg-outline-variant/20 my-1.5" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-error hover:bg-error/10 transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">logout</span>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search panel */}
      {mobileSearchOpen && (
        <div id="student-mobile-search-panel" className="lg:hidden absolute left-0 right-0 top-full border-t border-outline-variant/20 bg-surface px-4 py-3 shadow-elevated">
          <Suspense fallback={<div className="h-10 rounded-xl bg-surface-container-low" />}>
            <NavSearchBar mobile onSelectUser={(uid) => { setMobileSearchOpen(false); router.push('/student/ver/' + uid) }} />
          </Suspense>
        </div>
      )}

      {/* Mobile nav panel */}
      {mobileNavOpen && (
        <nav id="student-mobile-nav-panel" aria-label="Principal (móvil)" className="lg:hidden absolute left-0 right-0 top-full max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-outline-variant/20 bg-surface px-3 py-2 shadow-elevated">
          {navItems.map(({ href, icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors',
                  active
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
                )}
              >
                <span className={cn('material-symbols-outlined text-[20px]', active && 'icon-filled')} aria-hidden="true">
                  {icon}
                </span>
                {label}
              </Link>
            )
          })}
        </nav>
      )}
    </header>
    </>
  )
}
