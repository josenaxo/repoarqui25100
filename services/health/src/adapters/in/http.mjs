// Adaptador de entrada: traduce la petición HTTP de API Gateway al caso de uso
// y el resultado del caso de uso a una respuesta HTTP.
import { verificarSalud } from '../../application/verificarSalud.mjs'
import { repositorioSaludDynamo } from '../out/dynamoRepositorioSalud.mjs'

export async function handler(event) {
  const resultado = await verificarSalud({ repositorio: repositorioSaludDynamo })

  // En /health/privado, el autorizador JWT ya validó el token y deja sus datos aquí.
  const claims = event?.requestContext?.authorizer?.jwt?.claims
  if (claims) {
    resultado.usuario = { id: claims.sub, grupos: claims['cognito:groups'] ?? null }
  }

  return {
    statusCode: resultado.baseDatos ? 200 : 503,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(resultado),
  }
}