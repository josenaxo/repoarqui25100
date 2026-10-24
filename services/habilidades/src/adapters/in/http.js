import { crearServicioHabilidades } from '../../application/servicioHabilidades.js'
import { repositorioHabilidadesDynamo } from '../out/dynamoRepositorioHabilidades.js'
import { publicadorEventosSqs } from '../out/sqsPublicadorEventos.js'

const servicio = crearServicioHabilidades(repositorioHabilidadesDynamo, publicadorEventosSqs)

function actor(event) {
  const claims = event.requestContext?.authorizer?.jwt?.claims ?? {}
  const grupos = String(claims['cognito:groups'] ?? '').replace(/[\[\]"]/g, '').split(',').filter(Boolean)
  return { id: claims.sub, rol: grupos[0] }
}
const response = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

export async function handler(event) {
  try {
    const usuario = actor(event)
    const body = event.body ? JSON.parse(event.body) : {}
    switch (event.routeKey) {
      case 'POST /habilidades': return response(201, await servicio.declarar(usuario, body))
      case 'GET /habilidades/me': return response(200, await servicio.listarPropias(usuario))
      case 'GET /habilidades/pendientes': return response(200, await servicio.listarPendientes(usuario))
      case 'PATCH /habilidades/{estudianteId}/{habilidadId}':
        return response(200, await servicio.revisar(usuario, event.pathParameters.estudianteId, event.pathParameters.habilidadId, body))
      default: return response(404, { mensaje: 'ruta no encontrada' })
    }
  } catch (error) {
    return response(error.statusCode ?? 400, { mensaje: error.message })
  }
}
