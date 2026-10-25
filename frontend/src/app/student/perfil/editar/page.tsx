'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { usePageTitle } from '@/lib/usePageTitle'
import {
  obtenerPerfil, actualizarPerfil, listarColegios, obtenerConfigColegio, mensajeDeError,
  type ColegioResumen,
} from '@/lib/api/perfiles'
import { SelectorEspecialidad } from '@/components/ui/SelectorEspecialidad'

// los mismos largos que valida el servicio perfiles
const LARGOS = { nombre: 60, apellido: 60, titular: 120, bio: 1000, telefono: 20, ubicacion: 80 }

const clasesCampo = 'w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-3 py-2 text-sm outline-none transition-colors'

export default function EditarPerfilStudentPage() {
  usePageTitle('Editar perfil')
  const router              = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [error,   setError]     = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)

  const [colegios, setColegios]             = useState<ColegioResumen[]>([])
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const [avisoEspecialidad, setAvisoEspecialidad] = useState('')
  const [form, setForm] = useState({
    nombre: '', apellido: '', titular: '', bio: '',
    especialidad: '', anio: '' as number | '', telefono: '', ubicacion: '',
    colegioId: '',
  })

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    Promise.all([obtenerPerfil(), listarColegios()])
      .then(([p, lista]) => {
        setColegios(lista)
        setForm({
          nombre:       p.nombre ?? '',
          apellido:     p.apellido ?? '',
          titular:      p.titular ?? '',
          bio:          p.bio ?? '',
          especialidad: p.especialidad ?? '',
          anio:         p.anio ?? '',
          telefono:     p.telefono ?? '',
          ubicacion:    p.ubicacion ?? '',
          colegioId:    p.colegioId ?? '',
        })
      })
      .catch(err => setError(mensajeDeError(err, 'No se pudo cargar tu perfil.')))
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  // la especialidad se elige de las que imparte el colegio, que son oficiales del Mineduc
  useEffect(() => {
    if (!form.colegioId) { setEspecialidades([]); return }
    obtenerConfigColegio(form.colegioId)
      .then(c => {
        const lista = c.especialidades ?? []
        setEspecialidades(lista)
        // una especialidad guardada antes que el colegio no imparte (o escrita a mano) se quita
        setForm(prev => {
          if (!prev.especialidad || lista.includes(prev.especialidad)) return prev
          setAvisoEspecialidad(`"${prev.especialidad}" no está entre las especialidades de tu colegio. Elige una de la lista.`)
          return { ...prev, especialidad: '' }
        })
      })
      .catch(() => setEspecialidades([]))
  }, [form.colegioId])

  const set = (field: keyof typeof form, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const cambiarColegio = (colegioId: string) => {
    setAvisoEspecialidad('')
    setForm(prev => ({ ...prev, colegioId, especialidad: '' }))
  }

  // solo las que imparte el colegio; el selector las agrupa por sector como el listado del Mineduc
  const opcionesEspecialidad = especialidades

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const { anio, ...resto } = form
      await actualizarPerfil({ ...resto, ...(anio === '' ? {} : { anio }) })
      setSuccess(true)
      setTimeout(() => router.push('/student/perfil'), 1200)
    } catch (err: any) {
      setError(mensajeDeError(err, 'Error al guardar los cambios.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="card h-96 animate-pulse" />
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">arrow_back</span>
        </button>
        <div>
          <h1 className="font-headline text-2xl font-bold text-on-surface">Editar perfil</h1>
          <p className="text-sm text-on-surface-variant">Actualiza tu información personal</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="font-semibold text-on-surface mb-4">Información básica</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nombre" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Nombre</label>
              <input
                id="nombre"
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                className={clasesCampo}
                placeholder="Nombre"
                maxLength={LARGOS.nombre}
                required
              />
            </div>
            <div>
              <label htmlFor="apellido" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Apellido</label>
              <input
                id="apellido"
                value={form.apellido}
                onChange={e => set('apellido', e.target.value)}
                className={clasesCampo}
                placeholder="Apellido"
                maxLength={LARGOS.apellido}
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="titular" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide block">Titular / Headline</label>
              <span id="titular-count" className="text-[11px] text-on-surface-variant tabular-nums">{form.titular.length}/{LARGOS.titular}</span>
            </div>
            <input
              id="titular"
              value={form.titular}
              onChange={e => set('titular', e.target.value)}
              aria-describedby="titular-count"
              className={clasesCampo}
              placeholder="Ej: Desarrollador Full Stack · Especialidad Informática"
              maxLength={LARGOS.titular}
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="bio" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide block">Biografía</label>
              <span id="bio-count" className="text-[11px] text-on-surface-variant tabular-nums">{form.bio.length}/{LARGOS.bio}</span>
            </div>
            <textarea
              id="bio"
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              rows={3}
              aria-describedby="bio-count"
              className={`${clasesCampo} resize-none`}
              placeholder="Cuéntale a las empresas sobre ti..."
              maxLength={LARGOS.bio}
            />
          </div>
        </div>

        {/* School Link */}
        <div className="card p-6">
          <h2 className="font-semibold text-on-surface mb-1">Mi institución educativa</h2>
          <p className="text-xs text-on-surface-variant mb-4">
            Vincularte a tu colegio permite que vean tus habilidades y puedan validarlas.
          </p>
          <div>
            <label htmlFor="colegioId" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
              Colegio
            </label>
            <select
              id="colegioId"
              value={form.colegioId}
              onChange={e => cambiarColegio(e.target.value)}
              className={`${clasesCampo} py-2.5`}
            >
              <option value="">— Sin colegio vinculado —</option>
              {colegios.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Academic Info */}
        <div className="card p-6 overflow-visible relative z-20">
          <h2 className="font-semibold text-on-surface mb-4">Información académica</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="especialidad" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Especialidad</label>
              <SelectorEspecialidad
                id="especialidad"
                valor={form.especialidad}
                permitidas={opcionesEspecialidad}
                onElegir={esp => { setAvisoEspecialidad(''); set('especialidad', esp) }}
                placeholder="Elige tu especialidad..."
                disabled={opcionesEspecialidad.length === 0}
              />
              {form.especialidad && (
                <button type="button" onClick={() => set('especialidad', '')} className="text-[11px] font-semibold text-primary hover:underline mt-1">
                  Quitar especialidad
                </button>
              )}
              {opcionesEspecialidad.length === 0 && (
                <p id="especialidad-hint" className="text-[11px] text-on-surface-variant mt-1">
                  {form.colegioId ? 'Tu colegio todavía no configura sus especialidades.' : 'Elige primero tu colegio.'}
                </p>
              )}
              {avisoEspecialidad && (
                <p className="text-[11px] text-error mt-1">{avisoEspecialidad}</p>
              )}
            </div>
            <div>
              <label htmlFor="anio" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Año</label>
              <select
                id="anio"
                value={form.anio}
                onChange={e => set('anio', e.target.value === '' ? '' : Number(e.target.value))}
                className={clasesCampo}
              >
                <option value="">Seleccionar...</option>
                {[1,2,3,4].map(y => <option key={y} value={y}>{y}° año</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="card p-6">
          <h2 className="font-semibold text-on-surface mb-4">Contacto y ubicación</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="telefono" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Teléfono</label>
              <input
                id="telefono"
                type="tel"
                value={form.telefono}
                onChange={e => set('telefono', e.target.value)}
                aria-describedby="telefono-hint"
                className={clasesCampo}
                placeholder="+56 9 1234 5678"
                maxLength={LARGOS.telefono}
                pattern="^\+?[0-9\s-]{6,20}$"
                title="Solo números, espacios, guiones y '+' al inicio"
              />
              <p id="telefono-hint" className="text-[11px] text-on-surface-variant mt-1">Solo números, espacios, guiones y &quot;+&quot; al inicio.</p>
            </div>
            <div>
              <label htmlFor="ubicacion" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Ubicación</label>
              <input
                id="ubicacion"
                value={form.ubicacion}
                onChange={e => set('ubicacion', e.target.value)}
                className={clasesCampo}
                placeholder="Santiago, Chile"
                maxLength={LARGOS.ubicacion}
              />
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2 p-3 bg-error-container/30 border border-error/20 rounded-lg">
            <span className="material-symbols-outlined text-error text-[18px]" aria-hidden="true">error</span>
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {success && (
          <div role="status" aria-live="polite" className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <span className="material-symbols-outlined text-green-600 text-[18px]" aria-hidden="true">check_circle</span>
            <p className="text-sm text-green-700">¡Perfil actualizado! Redirigiendo...</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg editorial-gradient text-on-primary text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </main>
  )
}
