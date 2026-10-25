// Test de integracion: el adaptador de dynamo contra dynamo local (docker)
// antes hay que levantarlo con npm run local:up desde la raiz del repo
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { crearRepositorioDynamo } from "../../src/adapters/out/dynamoRepositorioPerfiles.mjs";
import { comprobarPuerto } from "../../src/ports/comprobarPuerto.mjs";
import { METODOS_REPOSITORIO_PERFILES } from "../../src/ports/RepositorioPerfiles.mjs";

// siempre contra local, nunca contra aws
const endpoint = process.env.DYNAMO_ENDPOINT ?? "http://localhost:8000";
const tableName = process.env.TABLE_NAME ?? "ceibbo-app-local";
const repositorio = crearRepositorioDynamo({ endpoint, tableName });

// cliente directo solo para preparar y limpiar los datos del test
const db = DynamoDBDocumentClient.from(new DynamoDBClient({
  endpoint,
  region: "us-east-1",
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
}));

// ids unicos para no chocar con el seed ni con otra corrida del test
const sufijo = Date.now().toString(36);
const userId = `test-${sufijo}`;
const colegioId = `col-test-${sufijo}`;
const otroColegio = `col-test2-${sufijo}`;

const ids = (lista) => lista.map((e) => e.userId);

describe("adaptador dynamo de perfiles", () => {
  before(async () => {
    await db.send(new PutCommand({
      TableName: tableName,
      Item: { PK: `SCHOOL#${colegioId}`, SK: "CONFIG", GSI1PK: "SCHOOLS", GSI1SK: `SCHOOL#${colegioId}`, nombre: "Colegio de prueba" },
    }));
  });

  after(async () => {
    await db.send(new DeleteCommand({ TableName: tableName, Key: { PK: `USER#${userId}`, SK: "PROFILE" } }));
    await db.send(new DeleteCommand({ TableName: tableName, Key: { PK: `SCHOOL#${colegioId}`, SK: "CONFIG" } }));
  });

  it("cumple el puerto", () => {
    assert.doesNotThrow(() => comprobarPuerto("RepositorioPerfiles", repositorio, METODOS_REPOSITORIO_PERFILES));
  });

  it("lee los datos del seed sin mostrar las claves", async () => {
    const colegio = await repositorio.obtenerConfigColegio("school-1");
    assert.equal(colegio.id, "school-1");
    assert.equal(colegio.nombre, "Instituto Técnico Metropolitano");
    const perfil = await repositorio.obtenerPerfil("usr-1");
    assert.equal(perfil.userId, "usr-1");
    assert.equal("PK" in perfil, false);
    assert.equal("GSI1PK" in perfil, false);
  });

  it("crea un perfil una sola vez", async () => {
    const perfil = { userId, tipo: "estudiante", nombre: "Test", apellido: "Uno", readinessScore: 0, profileViews: 0, colegioId };
    assert.equal(await repositorio.crearPerfil(perfil), true);
    assert.equal(await repositorio.crearPerfil(perfil), false);
  });

  it("el estudiante aparece en su colegio por GSI1", async () => {
    assert.deepEqual(ids(await repositorio.listarEstudiantesColegio(colegioId)), [userId]);
  });

  it("actualiza solo los campos enviados", async () => {
    const perfil = await repositorio.actualizarPerfil(userId, { bio: "hola" });
    assert.equal(perfil.bio, "hola");
    assert.equal(perfil.nombre, "Test");
    assert.equal(perfil.readinessScore, 0);
    assert.equal("PK" in perfil, false);
  });

  it("al cambiar de colegio se mueve en el indice, y sin colegio sale del indice", async () => {
    await repositorio.actualizarPerfil(userId, { colegioId: otroColegio });
    assert.deepEqual(ids(await repositorio.listarEstudiantesColegio(colegioId)), []);
    assert.deepEqual(ids(await repositorio.listarEstudiantesColegio(otroColegio)), [userId]);

    await repositorio.actualizarPerfil(userId, { colegioId: "" });
    assert.deepEqual(ids(await repositorio.listarEstudiantesColegio(otroColegio)), []);
  });

  it("actualizar un perfil que no existe da null", async () => {
    assert.equal(await repositorio.actualizarPerfil(`no-existe-${sufijo}`, { bio: "x" }), null);
  });

  it("editar la config mantiene el colegio en el listado", async () => {
    assert.equal(await repositorio.actualizarConfigColegio(colegioId, { nombre: "Nuevo", colorPrincipal: "#112233" }), true);
    const config = await repositorio.obtenerConfigColegio(colegioId);
    assert.deepEqual(config, { id: colegioId, nombre: "Nuevo", colorPrincipal: "#112233" });
    const colegios = await repositorio.listarColegios();
    assert.ok(colegios.some((c) => c.id === colegioId && c.nombre === "Nuevo"));
  });

  it("editar la config de un colegio que no existe da false", async () => {
    assert.equal(await repositorio.actualizarConfigColegio(`no-existe-${sufijo}`, { nombre: "X" }), false);
  });
});
