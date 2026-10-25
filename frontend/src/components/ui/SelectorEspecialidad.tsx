'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { SECTORES, opcionesDelSector } from '@/lib/especialidades'

// Selector con buscador que se abre siempre hacia abajo (el select nativo lo pone donde quiere el navegador).
// Muestra las especialidades oficiales agrupadas por sector, solo las de `permitidas` si viene
interface Props {
  id: string
  onElegir: (especialidad: string) => void
  permitidas?: string[]
  excluir?: string[]
  valor?: string
  placeholder?: string
  disabled?: boolean
}

const quitarTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function SelectorEspecialidad({ id, onElegir, permitidas, excluir = [], valor, placeholder = 'Buscar especialidad...', disabled }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto]     = useState('')
  const [activa, setActiva]   = useState(0)
  const contenedor = useRef<HTMLDivElement>(null)
  const lista = useRef<HTMLUListElement>(null)
  const idLista = useId()

  const grupos = useMemo(() => {
    const busqueda = quitarTildes(texto.trim())
    return SECTORES
      .map(s => ({
        sector: s.sector,
        opciones: opcionesDelSector(s).filter(o =>
          (!permitidas || permitidas.includes(o)) &&
          !excluir.includes(o) &&
          (!busqueda || quitarTildes(o).includes(busqueda) || quitarTildes(s.sector).includes(busqueda))),
      }))
      .filter(g => g.opciones.length > 0)
  }, [texto, permitidas, excluir])

  const planas = grupos.flatMap(g => g.opciones)

  // cerrar al hacer clic afuera
  useEffect(() => {
    const cerrar = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  // la opcion activa siempre a la vista al moverse con el teclado
  useEffect(() => {
    lista.current?.querySelector(`[data-indice="${activa}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [activa])

  const elegir = (o: string) => {
    onElegir(o)
    setTexto('')
    setAbierto(false)
  }

  const teclas = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAbierto(true); setActiva(i => Math.min(i + 1, planas.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiva(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && abierto && planas[activa]) { e.preventDefault(); elegir(planas[activa]) }
    else if (e.key === 'Escape') setAbierto(false)
  }

  let indice = -1
  return (
    <div ref={contenedor} className="relative">
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none" aria-hidden="true">search</span>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={abierto}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={abierto && planas[activa] ? `${idLista}-${activa}` : undefined}
          autoComplete="off"
          disabled={disabled}
          value={abierto ? texto : (valor ?? '')}
          placeholder={valor || placeholder}
          onFocus={() => { setAbierto(true); setActiva(0) }}
          onChange={e => { setTexto(e.target.value); setAbierto(true); setActiva(0) }}
          onKeyDown={teclas}
          className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary rounded-lg pl-9 pr-9 py-2.5 text-sm outline-none transition-colors disabled:opacity-60"
        />
        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[20px] text-outline pointer-events-none" aria-hidden="true">
          {abierto ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {abierto && !disabled && (
        <ul
          id={idLista}
          ref={lista}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-30 max-h-64 overflow-y-auto rounded-lg border border-outline-variant/30 bg-surface-container-lowest shadow-lg py-1"
        >
          {grupos.length === 0 && (
            <li className="px-3 py-2 text-sm text-on-surface-variant">No hay especialidades que coincidan.</li>
          )}
          {grupos.map(g => (
            <li key={g.sector} role="presentation">
              <p className="px-3 pt-2 pb-1 text-[11px] font-black uppercase tracking-widest text-outline">{g.sector}</p>
              <ul role="group" aria-label={g.sector}>
                {g.opciones.map(o => {
                  indice++
                  const i = indice
                  return (
                    <li
                      key={o}
                      id={`${idLista}-${i}`}
                      data-indice={i}
                      role="option"
                      aria-selected={i === activa}
                      onMouseDown={e => { e.preventDefault(); elegir(o) }}
                      onMouseEnter={() => setActiva(i)}
                      className={`px-5 py-1.5 text-sm cursor-pointer ${i === activa ? 'bg-primary-fixed text-primary' : 'text-on-surface'}`}
                    >
                      {o}
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
