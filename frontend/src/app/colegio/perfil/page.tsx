'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { usePageTitle } from '@/lib/usePageTitle'
import {
  obtenerPerfil, obtenerConfigColegio, listarEstudiantesColegio, mensajeDeError,
  type ConfigColegio, type EstudiantesColegio,
} from '@/lib/api/perfiles'

export default function ColegioPerfilPage() {
  const { isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const [school, setSchool]         = useState<ConfigColegio | null>(null)
  usePageTitle(school?.nombre ?? 'Perfil del colegio')
  const [listado, setListado]       = useState<EstudiantesColegio>({ total: 0, scorePromedio: 0, estudiantes: [] })
  const [loading, setLoading]       = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    // el usuario colegio guarda en su perfil el id del colegio que administra
    obtenerPerfil()
      .then(async p => {
        if (!p.colegioId) throw new Error('sin colegio')
        const [config, estudiantes] = await Promise.all([
          obtenerConfigColegio(p.colegioId),
          listarEstudiantesColegio(p.colegioId).catch(() => ({ total: 0, scorePromedio: 0, estudiantes: [] })),
        ])
        setSchool(config)
        setListado(estudiantes)
      })
      .catch(err => setErrorCarga(mensajeDeError(err, 'No se pudo cargar el perfil del colegio.')))
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="card h-64 animate-pulse mb-6" />
        <div className="card h-48 animate-pulse" />
      </main>
    )
  }

  if (!school) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-[64px] text-outline">school</span>
          <h2 className="font-headline text-xl font-bold text-on-surface mt-4">Perfil no encontrado</h2>
          <p className="text-on-surface-variant text-sm mt-2">{errorCarga || 'Inicia sesión como colegio para ver el perfil.'}</p>
        </div>
      </main>
    )
  }

  const especialidades = school.especialidades ?? []
  // el color lo elige el colegio; perfiles valida que sea #RRGGBB, asi no se puede meter otro css
  const colorFondo = school.colorPrincipal ? { background: school.colorPrincipal } : undefined

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      {/* Cover + Header */}
      <div className="card mb-6">
        <div className="h-48 editorial-gradient relative overflow-hidden" style={colorFondo}>
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <span className="material-symbols-outlined text-on-primary icon-filled" style={{ fontSize: '200px' }}>school</span>
          </div>
        </div>
        <div className="px-8 pb-8">
          <div className="flex items-end justify-between -mt-12 mb-6 flex-wrap gap-4">
            <div className="w-24 h-24 rounded-2xl editorial-gradient border-4 border-surface-container-lowest shadow-editorial flex items-center justify-center overflow-hidden" style={colorFondo}>
              {school.logo
                ? <img src={school.logo} className="w-full h-full object-cover" alt={school.nombre} />
                : <span className="material-symbols-outlined text-on-primary text-[44px] icon-filled">school</span>
              }
            </div>
            <div className="flex gap-3">
              <Link href="/colegio/perfil/editar">
                <Button icon="edit" size="sm">Editar perfil</Button>
              </Link>
              <Button
                variant="danger"
                icon="logout"
                size="sm"
                onClick={() => { logout(); router.push('/auth/login') }}
              >
                Cerrar sesión
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="font-headline text-3xl font-bold text-on-surface">{school.nombre}</h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary bg-primary-fixed px-2.5 py-1 rounded-full">
              <span className="material-symbols-outlined text-[11px] icon-filled">verified</span>
              Institución verificada
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-on-surface-variant mb-4 flex-wrap">
            {school.ubicacion && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">location_on</span>
                {school.ubicacion}
              </span>
            )}
            {school.sitioWeb && (
              <>
                <span>·</span>
                <a href={school.sitioWeb} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[15px]">link</span>
                  {school.sitioWeb}
                </a>
              </>
            )}
          </div>

          {school.bienvenida && (
            <p className="text-sm font-semibold text-on-surface mb-2">{school.bienvenida}</p>
          )}

          {school.descripcion && (
            <p className="text-sm text-on-surface leading-relaxed max-w-3xl">{school.descripcion}</p>
          )}

          {especialidades.length > 0 && (
            <div className="mt-6">
              <p className="text-[11px] font-black uppercase tracking-widest text-outline mb-3">Especialidades</p>
              <div className="flex flex-wrap gap-2">
                {especialidades.map(spec => (
                  <span key={spec} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-fixed text-primary border border-primary/15">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { value: listado.total, label: 'Estudiantes', icon: 'group' },
          { value: especialidades.length, label: 'Especialidades', icon: 'book' },
          { value: listado.scorePromedio, label: 'Score promedio', icon: 'trending_up' },
        ].map(({ value, label, icon }) => (
          <div key={label} className="card p-5 text-center">
            <span className="material-symbols-outlined text-primary text-[24px] icon-filled">{icon}</span>
            <p className="text-2xl font-extrabold text-on-surface font-headline mt-2">{value}</p>
            <p className="text-xs font-semibold text-on-surface-variant">{label}</p>
          </div>
        ))}
      </div>

      {/* Students list preview */}
      <div className="card p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-xl font-bold text-on-surface">Estudiantes destacados</h2>
          <a href="/colegio/estudiantes" className="text-sm font-semibold text-primary hover:underline">Ver todos</a>
        </div>

        {listado.estudiantes.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <span className="material-symbols-outlined text-[48px] text-outline">person_add</span>
            <p className="mt-3 text-sm font-semibold text-outline">Todavía no hay estudiantes registrados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listado.estudiantes.slice(0, 6).map(s => (
              <div key={s.userId} className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center shrink-0">
                  <span className="font-bold text-primary">{s.nombre?.[0]}{s.apellido?.[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface text-sm">{s.nombre} {s.apellido}</p>
                  <p className="text-xs text-on-surface-variant truncate">
                    {[s.especialidad, s.anio ? `${s.anio}° año` : null].filter(Boolean).join(' · ') || 'Sin especialidad'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary text-lg font-headline">{s.readinessScore ?? 0}</p>
                  <p className="text-[10px] text-outline">Score</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
