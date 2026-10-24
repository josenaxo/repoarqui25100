import test from 'node:test'
import assert from 'node:assert/strict'
import { crearServicioHabilidades } from '../src/application/servicioHabilidades.js'

function dobles() {
  const items = new Map()
  const publicados = []
  return {
    publicados,
    repo: {
      async crear(h) {
        const key = `${h.estudianteId}:${h.id}`
        if (items.has(key)) throw Object.assign(new Error('habilidad duplicada'), { statusCode: 409 })
        items.set(key, h); return h
      },
      async listarEstudiante(id) { return [...items.values()].filter((h) => h.estudianteId === id) },
      async listarPendientes(id) { return [...items.values()].filter((h) => h.colegioId === id && h.estado === 'declarada') },
      async obtener(e, h) { return items.get(`${e}:${h}`) ?? null },
      async guardar(h) { items.set(`${h.estudianteId}:${h.id}`, h); return h },
    },
    eventos: { async publicar(evento) { publicados.push(evento) } },
  }
}

test('la declaración duplicada responde conflicto', async () => {
  const d = dobles(); const servicio = crearServicioHabilidades(d.repo, d.eventos)
  const actor = { id: 'e1', rol: 'estudiante' }
  await servicio.declarar(actor, { nombre: 'Node.js', colegioId: 'c1' })
  await assert.rejects(() => servicio.declarar(actor, { nombre: 'Node.js', colegioId: 'c1' }), (error) => error.statusCode === 409)
})

test('el colegio dueño valida y publica HabilidadValidada', async () => {
  const d = dobles(); const servicio = crearServicioHabilidades(d.repo, d.eventos)
  const habilidad = await servicio.declarar({ id: 'e1', rol: 'estudiante' }, { nombre: 'Docker', colegioId: 'c1' })
  const resultado = await servicio.revisar({ id: 'c1', rol: 'colegio' }, 'e1', habilidad.id, { estado: 'validada' })
  assert.equal(resultado.estado, 'validada')
  assert.equal(d.publicados[0].tipo, 'HabilidadValidada')
})

test('otro colegio no puede validar', async () => {
  const d = dobles(); const servicio = crearServicioHabilidades(d.repo, d.eventos)
  const habilidad = await servicio.declarar({ id: 'e1', rol: 'estudiante' }, { nombre: 'AWS', colegioId: 'c1' })
  await assert.rejects(() => servicio.revisar({ id: 'c2', rol: 'colegio' }, 'e1', habilidad.id, { estado: 'validada' }), (error) => error.statusCode === 403)
})
