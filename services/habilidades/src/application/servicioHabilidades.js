import { randomUUID } from 'node:crypto'
import { declarar, decidirValidacion } from '../domain/HabilidadEstudiante.js'

export function crearServicioHabilidades(repositorio, eventos) {
  return {
    async declarar(actor, datos) {
      if (actor.rol !== 'estudiante') throw Object.assign(new Error('solo un estudiante puede declarar habilidades'), { statusCode: 403 })
      return repositorio.crear(declarar({ ...datos, estudianteId: actor.id }))
    },
    async listarPropias(actor) {
      if (actor.rol !== 'estudiante') throw Object.assign(new Error('acceso denegado'), { statusCode: 403 })
      return repositorio.listarEstudiante(actor.id)
    },
    async listarPendientes(actor) {
      if (actor.rol !== 'colegio') throw Object.assign(new Error('solo el colegio puede revisar'), { statusCode: 403 })
      return repositorio.listarPendientes(actor.id)
    },
    async revisar(actor, estudianteId, habilidadId, decision) {
      if (actor.rol !== 'colegio') throw Object.assign(new Error('solo el colegio puede revisar'), { statusCode: 403 })
      const habilidad = await repositorio.obtener(estudianteId, habilidadId)
      if (!habilidad) throw Object.assign(new Error('habilidad no encontrada'), { statusCode: 404 })
      if (habilidad.colegioId !== actor.id) throw Object.assign(new Error('el estudiante pertenece a otro colegio'), { statusCode: 403 })
      const guardada = await repositorio.guardar(decidirValidacion(habilidad, decision.estado, decision.comentario))
      if (guardada.estado === 'validada') {
        await eventos.publicar({
          tipo: 'HabilidadValidada', version: 1, id: randomUUID(), fecha: new Date().toISOString(),
          destinatarioId: estudianteId,
          datos: { estudianteId, habilidadId, nombre: guardada.nombre, colegioId: actor.id },
        })
      }
      return guardada
    },
  }
}
