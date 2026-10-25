// Pruebas unitarias del caso de uso: usan un repositorio falso, sin AWS.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { verificarSalud } from '../src/application/verificarSalud.mjs'
import { comprobarPuerto } from '../src/ports/comprobarPuerto.mjs'
import { METODOS_REPOSITORIO_SALUD } from '../src/ports/RepositorioSalud.mjs'

// Doble de prueba: cumple el puerto y responde lo que le indiquemos.
function repositorioFalso(responde) {
  return { ping: async () => responde }
}

test('si la base de datos responde, el estado es ok', async () => {
  const resultado = await verificarSalud({ repositorio: repositorioFalso(true) })
  assert.equal(resultado.estado, 'ok')
  assert.equal(resultado.baseDatos, true)
})

test('si la base de datos no responde, el estado es degradado', async () => {
  const resultado = await verificarSalud({ repositorio: repositorioFalso(false) })
  assert.equal(resultado.estado, 'degradado')
  assert.equal(resultado.baseDatos, false)
})

test('la fecha viene en formato ISO 8601', async () => {
  const resultado = await verificarSalud({ repositorio: repositorioFalso(true) })
  assert.equal(new Date(resultado.fecha).toISOString(), resultado.fecha)
})

test('el repositorio falso cumple el puerto RepositorioSalud', () => {
  assert.doesNotThrow(() =>
    comprobarPuerto('RepositorioSalud', repositorioFalso(true), METODOS_REPOSITORIO_SALUD),
  )
})

test('comprobarPuerto avisa si falta un método', () => {
  assert.throws(
    () => comprobarPuerto('RepositorioSalud', {}, METODOS_REPOSITORIO_SALUD),
    /faltan los métodos ping/,
  )
})