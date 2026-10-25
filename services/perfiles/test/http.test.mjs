// Tests del handler http con dobles en memoria: rutas, codigos http y lectura del token
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { crearHandler } from "../src/adapters/in/http.mjs";
import { crearRepositorioEnMemoria, crearIdentidadFalsa } from "./dobles/enMemoria.mjs";

// arma un evento como el que manda el HTTP API con el autorizador JWT
function evento(routeKey, { claims, body, id, base64 = false } = {}) {
  const texto = body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body);
  return {
    routeKey,
    pathParameters: id ? { id } : undefined,
    body: texto && base64 ? Buffer.from(texto).toString("base64") : texto,
    isBase64Encoded: base64,
    requestContext: claims ? { authorizer: { jwt: { claims } } } : {},
  };
}

const claimsNuevo = { sub: "u1", username: "u1" };
const claimsColegio = { sub: "col-1", username: "col-1", "cognito:groups": "[colegio]" };

function preparar() {
  const repositorio = crearRepositorioEnMemoria({
    colegios: [{ id: "school-1", nombre: "ITM" }],
    perfiles: [{ userId: "col-1", tipo: "colegio", colegioId: "school-1" }],
  });
  const identidad = crearIdentidadFalsa();
  return { handler: crearHandler({ repositorio, identidad }), repositorio, identidad };
}

const cuerpo = (res) => JSON.parse(res.body);

describe("handler http", () => {
  it("flujo de registro: 404 sin perfil, 201 al crear, 200 al leer, 409 al repetir", async () => {
    const { handler } = preparar();
    assert.equal((await handler(evento("GET /perfiles/me", { claims: claimsNuevo }))).statusCode, 404);

    const creado = await handler(evento("POST /perfiles", { claims: claimsNuevo, body: { nombre: "Ana", apellido: "Paz" } }));
    assert.equal(creado.statusCode, 201);
    assert.equal(cuerpo(creado).tipo, "estudiante");

    const leido = await handler(evento("GET /perfiles/me", { claims: claimsNuevo }));
    assert.equal(leido.statusCode, 200);
    assert.equal(cuerpo(leido).nombre, "Ana");

    const repetido = await handler(evento("POST /perfiles", { claims: claimsNuevo, body: { nombre: "Ana", apellido: "Paz" } }));
    assert.equal(repetido.statusCode, 409);
  });

  it("400 si el body no es JSON o no pasa la validacion", async () => {
    const { handler } = preparar();
    assert.equal((await handler(evento("POST /perfiles", { claims: claimsNuevo, body: "{malo" }))).statusCode, 400);
    assert.equal((await handler(evento("POST /perfiles", { claims: claimsNuevo, body: { nombre: "Ana" } }))).statusCode, 400);
  });

  it("lee el body en base64", async () => {
    const { handler } = preparar();
    const res = await handler(evento("POST /perfiles", { claims: claimsNuevo, body: { nombre: "Ana", apellido: "Paz" }, base64: true }));
    assert.equal(res.statusCode, 201);
  });

  it("lee los grupos del token aunque vengan como texto", async () => {
    const { handler } = preparar();
    const res = await handler(evento("GET /colegios/{id}/estudiantes", { claims: claimsColegio, id: "school-1" }));
    assert.equal(res.statusCode, 200);
    assert.deepEqual(cuerpo(res), { total: 0, scorePromedio: 0, estudiantes: [] });
  });

  it("403 si un estudiante intenta editar la config del colegio", async () => {
    const { handler } = preparar();
    const claims = { sub: "u1", "cognito:groups": "[estudiante]" };
    const res = await handler(evento("PUT /colegios/{id}/config", { claims, id: "school-1", body: { nombre: "X" } }));
    assert.equal(res.statusCode, 403);
  });

  it("el colegio edita su config y se ve el color nuevo", async () => {
    const { handler } = preparar();
    const editado = await handler(evento("PUT /colegios/{id}/config", { claims: claimsColegio, id: "school-1", body: { nombre: "ITM", colorPrincipal: "#AA0000" } }));
    assert.equal(editado.statusCode, 200);
    const leido = await handler(evento("GET /colegios/{id}/config", { claims: claimsNuevo, id: "school-1" }));
    assert.equal(cuerpo(leido).colorPrincipal, "#AA0000");
  });

  it("403 si no hay usuario en el token", async () => {
    const { handler } = preparar();
    assert.equal((await handler(evento("GET /colegios"))).statusCode, 403);
  });

  it("404 si la ruta no existe", async () => {
    const { handler } = preparar();
    assert.equal((await handler(evento("DELETE /perfiles/me", { claims: claimsNuevo }))).statusCode, 404);
  });

  it("500 sin detalles si algo falla por dentro", async (t) => {
    const { repositorio, identidad } = preparar();
    repositorio.obtenerPerfil = async () => { throw new Error("se cayo dynamo: detalle interno"); };
    const handler = crearHandler({ repositorio, identidad });
    t.mock.method(console, "error", () => {});
    const res = await handler(evento("GET /perfiles/me", { claims: claimsNuevo }));
    assert.equal(res.statusCode, 500);
    assert.deepEqual(cuerpo(res), { mensaje: "Error interno" });
  });
});
