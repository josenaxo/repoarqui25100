'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { usePageTitle } from '@/lib/usePageTitle'
import {
  obtenerPerfil, obtenerConfigColegio, actualizarConfigColegio, mensajeDeError,
  type ConfigColegio,
} from '@/lib/api/perfiles'
import { ESPECIALIDADES_OFICIALES } from '@/lib/especialidades'
import { SelectorEspecialidad } from '@/components/ui/SelectorEspecialidad'

// los mismos limites que valida el servicio perfiles
const LARGOS = { nombre: 120, descripcion: 1000, ubicacion: 120, sitioWeb: 200, bienvenida: 200 }
const MAX_ESPECIALIDADES = 20
const COLOR_POR_DEFECTO = '#0F4C5C'

const clasesCampo = 'w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-3 py-2 text-sm outline-none transition-colors'

export default function EditarPerfilColegioPage() {
  usePageTitle('Editar perfil del colegio')
  const router              = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [colegioId, setColegioId] = useState('')
  // la ruta PUT reemplaza la configuracion completa, por eso se guarda lo que no se edita aca (el logo)
  const [original, setOriginal]   = useState<ConfigColegio | null>(null)
  const [form, setForm] = useState({
    nombre: '', descripcion: '', ubicacion: '', sitioWeb: '',
    colorPrincipal: COLOR_POR_DEFECTO, bienvenida: '',
  })
  // solo las oficiales del Mineduc, marcadas con casillas
  const [especialidades, setEspecialidades] = useState<string[]>([])

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    obtenerPerfil()
      .then(async p => {
        if (!p.colegioId) throw new Error('sin colegio')
        const c = await obtenerConfigColegio(p.colegioId)
        setColegioId(p.colegioId)
        setOriginal(c)
        setForm({
          nombre:         c.nombre ?? '',
          descripcion:    c.descripcion ?? '',
          ubicacion:      c.ubicacion ?? '',
          sitioWeb:       c.sitioWeb ?? '',
          colorPrincipal: c.colorPrincipal ?? COLOR_POR_DEFECTO,
          bienvenida:     c.bienvenida ?? '',
        })
        // si quedo guardada alguna que no es oficial (de antes de esta regla) se descarta al editar
        setEspecialidades((c.especialidades ?? []).filter(e => ESPECIALIDADES_OFICIALES.includes(e)))
      })
      .catch(err => setError(mensajeDeError(err, 'No se pudo cargar la configuración del colegio.')))
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const set = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const alternarEspecialidad = (esp: string) => {
    setError(null)
    if (especialidades.includes(esp)) {
      setEspecialidades(especialidades.filter(e => e !== esp))
    } else if (especialidades.length >= MAX_ESPECIALIDADES) {
      setError(`Puedes marcar hasta ${MAX_ESPECIALIDADES} especialidades.`)
    } else {
      setEspecialidades([...especialidades, esp])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await actualizarConfigColegio(colegioId, {
        ...(original?.logo ? { logo: original.logo } : {}),
        nombre:         form.nombre,
        descripcion:    form.descripcion,
        ubicacion:      form.ubicacion,
        bienvenida:     form.bienvenida,
        colorPrincipal: form.colorPrincipal.toUpperCase(),
        especialidades,
        ...(form.sitioWeb.trim() ? { sitioWeb: form.sitioWeb.trim() } : {}),
      })
      setSuccess(true)
      setTimeout(() => router.push('/colegio/perfil'), 1200)
    } catch (err: any) {
      setError(mensajeDeError(err, 'Error al guardar los cambios.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="card h-64 animate-pulse" />
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
          <h1 className="font-headline text-2xl font-bold text-on-surface">Editar perfil del colegio</h1>
          <p className="text-sm text-on-surface-variant">Actualiza la información de tu institución</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="font-semibold text-on-surface mb-4">Información de la institución</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="school-name" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Nombre del colegio</label>
              <input
                id="school-name"
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                required
                aria-required="true"
                maxLength={LARGOS.nombre}
                className={clasesCampo}
                placeholder="Nombre del colegio"
              />
            </div>
            <div>
              <label htmlFor="school-description" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Descripción</label>
              <textarea
                id="school-description"
                value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                rows={4}
                maxLength={LARGOS.descripcion}
                className={`${clasesCampo} resize-none`}
                placeholder="¿Qué hace especial a tu institución?"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="school-location" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Ubicación</label>
                <input
                  id="school-location"
                  value={form.ubicacion}
                  onChange={e => set('ubicacion', e.target.value)}
                  maxLength={LARGOS.ubicacion}
                  className={clasesCampo}
                  placeholder="Ciudad, País"
                />
              </div>
              <div>
                <label htmlFor="school-website" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Sitio web</label>
                <input
                  id="school-website"
                  type="url"
                  value={form.sitioWeb}
                  onChange={e => set('sitioWeb', e.target.value)}
                  maxLength={LARGOS.sitioWeb}
                  className={clasesCampo}
                  placeholder="https://micolegio.cl"
                />
              </div>
            </div>
          </div>
        </div>

        <fieldset className="card p-6 overflow-visible relative z-20">
          <legend className="sr-only">Especialidades que imparte el colegio</legend>
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <h2 className="font-semibold text-on-surface">Especialidades</h2>
            <span className="text-xs text-on-surface-variant tabular-nums">{especialidades.length}/{MAX_ESPECIALIDADES}</span>
          </div>
          <p className="text-xs text-on-surface-variant mb-4">
            Agrega las que imparte tu colegio desde el listado oficial del Mineduc. Tus estudiantes eligen la suya de estas.
          </p>

          <label htmlFor="school-specialty-add" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
            Agregar especialidad
          </label>
          <SelectorEspecialidad
            id="school-specialty-add"
            onElegir={alternarEspecialidad}
            excluir={especialidades}
            disabled={especialidades.length >= MAX_ESPECIALIDADES}
          />

          {especialidades.length === 0 ? (
            <p className="text-xs text-on-surface-variant mt-3">Todavía no agregas especialidades.</p>
          ) : (
            <ul className="flex flex-wrap gap-2 mt-4" aria-label="Especialidades agregadas">
              {especialidades.map(esp => (
                <li key={esp} className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full text-xs font-semibold bg-primary-fixed text-primary border border-primary/15">
                  {esp}
                  <button
                    type="button"
                    onClick={() => alternarEspecialidad(esp)}
                    aria-label={`Quitar ${esp}`}
                    className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-primary/10"
                  >
                    <span className="material-symbols-outlined text-[14px]" aria-hidden="true">close</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <div className="card p-6">
          <h2 className="font-semibold text-on-surface mb-1">Personalización</h2>
          <p className="text-xs text-on-surface-variant mb-4">Tus estudiantes ven este color y este mensaje en su perfil.</p>
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-start">
            <div>
              <label htmlFor="school-color" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Color</label>
              <input
                id="school-color"
                type="color"
                value={form.colorPrincipal}
                onChange={e => set('colorPrincipal', e.target.value)}
                className="h-10 w-20 rounded-lg border border-outline-variant/30 bg-surface-container-low cursor-pointer"
              />
            </div>
            <div>
              <label htmlFor="school-welcome" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">Mensaje de bienvenida</label>
              <input
                id="school-welcome"
                value={form.bienvenida}
                onChange={e => set('bienvenida', e.target.value)}
                maxLength={LARGOS.bienvenida}
                className={clasesCampo}
                placeholder="Bienvenidos a la red de nuestro colegio"
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
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving || !colegioId}
            className="px-6 py-2.5 rounded-lg editorial-gradient text-on-primary text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </main>
  )
}
