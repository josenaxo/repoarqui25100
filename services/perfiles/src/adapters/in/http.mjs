// Adaptador de entrada: la lambda que recibe los requests del HTTP API (payload v2)
// arma el actor desde el token, llama al caso de uso y pasa los errores del dominio a codigos http
import { CODIGOS } from "../../domain/errores.mjs";
import { registrarPerfil } from "../../application/registrarPerfil.mjs";
import { obtenerPerfil } from "../../application/obtenerPerfil.mjs";
import { actualizarPerfil } from "../../application/actualizarPerfil.mjs";
import { obtenerConfigColegio } from "../../application/obtenerConfigColegio.mjs";
import { actualizarConfigColegio } from "../../application/actualizarConfigColegio.mjs";
import { listarColegios } from "../../application/listarColegios.mjs";
import { listarEstudiantesColegio } from "../../application/listarEstudiantesColegio.mjs";
import { comprobarPuerto } from "../../ports/comprobarPuerto.mjs";
import { METODOS_REPOSITORIO_PERFILES } from "../../ports/RepositorioPerfiles.mjs";
import { METODOS_SERVICIO_IDENTIDAD } from "../../ports/ServicioIdentidad.mjs";
import { crearRepositorioDynamo } from "../out/dynamoRepositorioPerfiles.mjs";
import { crearServicioIdentidadCognito } from "../out/cognitoServicioIdentidad.mjs";

const ESTADO_POR_CODIGO = {
  [CODIGOS.VALIDACION]: 400,
  [CODIGOS.PROHIBIDO]: 403,
  [CODIGOS.NO_ENCONTRADO]: 404,
  [CODIGOS.CONFLICTO]: 409,
};

function respuesta(statusCode, cuerpo) {
  return { statusCode, headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo) };
}

// el HTTP API manda los arrays del token como texto, ej. "[colegio]" o "[a b]"
function leerGrupos(valor) {
  if (Array.isArray(valor)) return valor;
  if (typeof valor !== "string") return [];
  return valor.replace(/[[\]"]/g, "").split(/[\s,]+/).filter(Boolean);
}

// el usuario sale de los claims que ya valido el autorizador JWT, no del body
function leerActor(event) {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  if (!claims?.sub) return null;
  return {
    id: claims.sub,
    username: claims.username ?? claims["cognito:username"] ?? claims.sub,
    email: claims.email,
    grupos: leerGrupos(claims["cognito:groups"]),
  };
}

class BodyInvalido extends Error {}

function leerBody(event) {
  if (!event.body) return {};
  const texto = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  try {
    return JSON.parse(texto);
  } catch {
    throw new BodyInvalido();
  }
}

// una entrada por ruta del contrato: [codigo http si sale bien, funcion que llama al caso de uso]
const RUTAS = {
  "POST /perfiles": [201, (deps, req) => registrarPerfil(deps, { actor: req.actor, datos: req.body })],
  "GET /perfiles/me": [200, (deps, req) => obtenerPerfil(deps, { actor: req.actor })],
  "PUT /perfiles/me": [200, (deps, req) => actualizarPerfil(deps, { actor: req.actor, cambios: req.body })],
  "GET /colegios": [200, (deps, req) => listarColegios(deps, { actor: req.actor })],
  "GET /colegios/{id}/config": [200, (deps, req) => obtenerConfigColegio(deps, { actor: req.actor, colegioId: req.id })],
  "PUT /colegios/{id}/config": [200, (deps, req) => actualizarConfigColegio(deps, { actor: req.actor, colegioId: req.id, datos: req.body })],
  "GET /colegios/{id}/estudiantes": [200, (deps, req) => listarEstudiantesColegio(deps, { actor: req.actor, colegioId: req.id })],
};

export function crearHandler(dependencias) {
  return async function manejar(event) {
    const ruta = RUTAS[event.routeKey];
    if (!ruta) return respuesta(404, { mensaje: "Ruta no encontrada" });
    const [estadoOk, ejecutar] = ruta;
    try {
      const req = { actor: leerActor(event), body: leerBody(event), id: event.pathParameters?.id };
      return respuesta(estadoOk, await ejecutar(dependencias, req));
    } catch (error) {
      if (error instanceof BodyInvalido) return respuesta(400, { mensaje: "El cuerpo no es un JSON válido" });
      const estado = ESTADO_POR_CODIGO[error.codigo];
      if (estado) return respuesta(estado, { mensaje: error.message });
      // error inesperado: se registra completo en los logs pero al usuario no se le muestran detalles
      console.error(JSON.stringify({ nivel: "error", ruta: event.routeKey, mensaje: error.message, stack: error.stack }));
      return respuesta(500, { mensaje: "Error interno" });
    }
  };
}

// dependencias reales: se crean en la primera invocacion y se reutilizan mientras la lambda siga caliente
let manejador;
export async function handler(event) {
  manejador ??= crearHandler({
    repositorio: comprobarPuerto("RepositorioPerfiles", crearRepositorioDynamo(), METODOS_REPOSITORIO_PERFILES),
    identidad: comprobarPuerto("ServicioIdentidad", crearServicioIdentidadCognito(), METODOS_SERVICIO_IDENTIDAD),
  });
  return manejador(event);
}
