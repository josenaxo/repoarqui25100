// Prueba de integracion: el adaptador real de health contra dynamo local (docker)
// antes hay que levantarlo con npm run local:up desde la raiz del repo
import { test } from 'node:test'
import assert from 'node:assert/strict'

// siempre contra local, nunca contra aws. Las credenciales son de mentira porque
// dynamo local no las revisa, asi no hace falta tener las del learner lab
process.env.DYNAMO_ENDPOINT ??= 'http://localhost:8000'
process.env.AWS_REGION ??= 'us-east-1'
process.env.AWS_ACCESS_KEY_ID ??= 'local'
process.env.AWS_SECRET_ACCESS_KEY ??= 'local'
const TABLA_LOCAL = process.env.TABLE_NAME ?? 'ceibbo-app-local'

// el adaptador lee DYNAMO_ENDPOINT al cargarse, por eso se importa despues de ponerlo
const { repositorioSaludDynamo } = await import('../../src/adapters/out/dynamoRepositorioSalud.mjs')
const { verificarSalud } = await import('../../src/application/verificarSalud.mjs')

test('con la tabla local, ping responde true', async () => {
  process.env.TABLE_NAME = TABLA_LOCAL
  assert.equal(await repositorioSaludDynamo.ping(), true)
})

test('con una tabla que no existe, ping responde false y deja el error en el log', async (t) => {
  process.env.TABLE_NAME = 'tabla-que-no-existe'
  const log = t.mock.method(console, 'error', () => {})
  assert.equal(await repositorioSaludDynamo.ping(), false)
  assert.equal(log.mock.callCount(), 1)
})

test('el caso de uso con el adaptador real responde estado ok', async () => {
  process.env.TABLE_NAME = TABLA_LOCAL
  const resultado = await verificarSalud({ repositorio: repositorioSaludDynamo })
  assert.equal(resultado.estado, 'ok')
  assert.equal(resultado.baseDatos, true)
})
