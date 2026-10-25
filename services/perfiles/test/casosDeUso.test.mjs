// Tests de los casos de uso con dobles en memoria (sin aws ni docker)
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { registrarPerfil } from "../src/application/registrarPerfil.mjs";
import { obtenerPerfil } from "../src/application/obtenerPerfil.mjs";
import { actualizarPerfil } from "../src/application/actualizarPerfil.mjs";
import { obtenerConfigColegio } from "../src/application/obtenerConfigColegio.mjs";
import { actualizarConfigColegio } from "../src/application/actualizarConfigColegio.mjs";
import { listarColegios } from "../src/application/listarColegios.mjs";
import { listarEstudiantesColegio } from "../src/application/listarEstudiantesColegio.mjs";
import { comprobarPuerto } from "../src/ports/comprobarPuerto.mjs";
import { METODOS_REPOSITORIO_PERFILES } from "../src/ports/RepositorioPerfiles.mjs";
import { METODOS_SERVICIO_IDENTIDAD } from "../src/ports/ServicioIdentidad.mjs";
import { CODIGOS } from "../src/domain/errores.mjs";
import { crearRepositorioEnMemoria, crearIdentidadFalsa } from "./dobles/enMemoria.mjs";

const conCodigo = (codigo) => (error) => error.codigo === codigo;

// usuarios del token
const nuevo = { id: "u1", username: "u1", grupos: [] };
const estudiante = { id: "u1", username: "u1", grupos: ["estudiante"] };
const colegio = { id: "col-1", username: "col-1", grupos: ["colegio"] };

// cada test parte con datos nuevos para que no se afecten entre ellos
function escenario() {
  const repositorio = crearRepositorioEnMemoria({
    colegios: [
      { id: "school-1", nombre: "ITM", colorPrincipal: "#0F4C5C", especialidades: ["Programación", "Electricidad"] },
      { id: "school-2", nombre: "Liceo B", especialidades: ["Contabilidad"] },
    ],
    perfiles: [{ userId: "col-1", tipo: "colegio", colegioId: "school-1" }],
  });
  const identidad = crearIdentidadFalsa();
  return { repositorio, identidad, deps: { repositorio, identidad } };
}

function escenarioConEstudiante() {
  const datos = escenario();
  return registrarPerfil(datos.deps, { actor: nuevo, datos: { nombre: "Ana", apellido: "Paz", colegioId: "school-1" } }).then(() => datos);
}

describe("puertos", () => {
  it("los dobles cumplen los puertos", () => {
    const { repositorio, identidad } = escenario();
    assert.doesNotThrow(() => comprobarPuerto("RepositorioPerfiles", repositorio, METODOS_REPOSITORIO_PERFILES));
    assert.doesNotThrow(() => comprobarPuerto("ServicioIdentidad", identidad, METODOS_SERVICIO_IDENTIDAD));
  });

  it("avisa si a un adaptador le faltan metodos", () => {
    assert.throws(() => comprobarPuerto("RepositorioPerfiles", {}, METODOS_REPOSITORIO_PERFILES), /faltan/);
  });
});

describe("registrarPerfil", () => {
  it("crea el perfil y agrega al usuario al grupo estudiante", async () => {
    const { deps, identidad } = escenario();
    const perfil = await registrarPerfil(deps, { actor: nuevo, datos: { nombre: "Ana", apellido: "Paz", colegioId: "school-1" } });
    assert.equal(perfil.tipo, "estudiante");
    assert.deepEqual(identidad.llamadas, [{ username: "u1", grupo: "estudiante" }]);
  });

  it("registrarse dos veces da conflicto y el grupo queda igual", async () => {
    const { deps, identidad } = await escenarioConEstudiante();
    await assert.rejects(registrarPerfil(deps, { actor: estudiante, datos: { nombre: "Ana", apellido: "Paz" } }), conCodigo(CODIGOS.CONFLICTO));
    assert.equal(identidad.llamadas.length, 2);
  });

  it("un colegio o una empresa no se pueden registrar", async () => {
    const { deps } = escenario();
    await assert.rejects(registrarPerfil(deps, { actor: colegio, datos: { nombre: "X", apellido: "Y" } }), conCodigo(CODIGOS.PROHIBIDO));
  });

  it("si el colegio no existe no crea nada ni agrega al grupo", async () => {
    const { deps, identidad } = escenario();
    await assert.rejects(
      registrarPerfil(deps, { actor: nuevo, datos: { nombre: "Ana", apellido: "Paz", colegioId: "no-existe" } }),
      conCodigo(CODIGOS.VALIDACION),
    );
    assert.equal(identidad.llamadas.length, 0);
  });

  it("sin usuario en el token no hace nada", async () => {
    const { deps } = escenario();
    await assert.rejects(registrarPerfil(deps, { actor: null, datos: {} }), conCodigo(CODIGOS.PROHIBIDO));
  });
});

describe("obtenerPerfil", () => {
  it("retorna el perfil del usuario del token", async () => {
    const { deps } = await escenarioConEstudiante();
    const perfil = await obtenerPerfil(deps, { actor: estudiante });
    assert.equal(perfil.nombre, "Ana");
  });

  it("da 404 a un usuario sin perfil aunque no tenga grupo", async () => {
    const { deps } = escenario();
    await assert.rejects(obtenerPerfil(deps, { actor: { id: "otro", grupos: [] } }), conCodigo(CODIGOS.NO_ENCONTRADO));
  });
});

describe("actualizarPerfil", () => {
  it("escribe solo los campos validos y no toca el readinessScore", async () => {
    const { deps, repositorio } = await escenarioConEstudiante();
    const perfil = await actualizarPerfil(deps, { actor: estudiante, cambios: { bio: "Hola", readinessScore: 100 } });
    assert.equal(perfil.bio, "Hola");
    assert.equal(perfil.readinessScore, 0);
    assert.deepEqual(repositorio.escrituras, [{ userId: "u1", campos: { bio: "Hola" } }]);
  });

  it("si no hay cambios validos no escribe nada", async () => {
    const { deps, repositorio } = await escenarioConEstudiante();
    await actualizarPerfil(deps, { actor: estudiante, cambios: { tipo: "colegio" } });
    assert.equal(repositorio.escrituras.length, 0);
  });

  it("no deja cambiarse a un colegio que no existe", async () => {
    const { deps } = await escenarioConEstudiante();
    await assert.rejects(actualizarPerfil(deps, { actor: estudiante, cambios: { colegioId: "no-existe" } }), conCodigo(CODIGOS.VALIDACION));
  });

  it("da 404 si el usuario no tiene perfil", async () => {
    const { deps } = escenario();
    await assert.rejects(actualizarPerfil(deps, { actor: { id: "otro", grupos: [] }, cambios: { bio: "x" } }), conCodigo(CODIGOS.NO_ENCONTRADO));
  });

  it("acepta una especialidad que imparte su colegio", async () => {
    const { deps } = await escenarioConEstudiante();
    const perfil = await actualizarPerfil(deps, { actor: estudiante, cambios: { especialidad: "Programación" } });
    assert.equal(perfil.especialidad, "Programación");
  });

  it("rechaza una especialidad oficial que su colegio no imparte", async () => {
    const { deps } = await escenarioConEstudiante();
    await assert.rejects(actualizarPerfil(deps, { actor: estudiante, cambios: { especialidad: "Contabilidad" } }), conCodigo(CODIGOS.VALIDACION));
  });

  it("al cambiar de colegio revisa la especialidad contra el colegio nuevo", async () => {
    const { deps } = await escenarioConEstudiante();
    const perfil = await actualizarPerfil(deps, { actor: estudiante, cambios: { colegioId: "school-2", especialidad: "Contabilidad" } });
    assert.equal(perfil.especialidad, "Contabilidad");
    await assert.rejects(
      actualizarPerfil(deps, { actor: estudiante, cambios: { colegioId: "school-1", especialidad: "Contabilidad" } }),
      conCodigo(CODIGOS.VALIDACION),
    );
  });

  it("sin colegio no se puede elegir especialidad", async () => {
    const { deps } = await escenarioConEstudiante();
    await assert.rejects(actualizarPerfil(deps, { actor: estudiante, cambios: { colegioId: "", especialidad: "Programación" } }), conCodigo(CODIGOS.VALIDACION));
  });
});

describe("config del colegio", () => {
  it("cualquier usuario logeado puede verla", async () => {
    const { deps } = escenario();
    const config = await obtenerConfigColegio(deps, { actor: estudiante, colegioId: "school-1" });
    assert.equal(config.colorPrincipal, "#0F4C5C");
  });

  it("da 404 si el colegio no existe", async () => {
    const { deps } = escenario();
    await assert.rejects(obtenerConfigColegio(deps, { actor: estudiante, colegioId: "no-existe" }), conCodigo(CODIGOS.NO_ENCONTRADO));
  });

  it("el colegio puede editar la suya", async () => {
    const { deps } = escenario();
    const config = await actualizarConfigColegio(deps, { actor: colegio, colegioId: "school-1", datos: { nombre: "ITM", colorPrincipal: "#AA0000" } });
    assert.deepEqual(config, { id: "school-1", nombre: "ITM", colorPrincipal: "#AA0000" });
  });

  it("un colegio no puede editar otro colegio", async () => {
    const { deps } = escenario();
    await assert.rejects(actualizarConfigColegio(deps, { actor: colegio, colegioId: "school-2", datos: { nombre: "X" } }), conCodigo(CODIGOS.PROHIBIDO));
  });

  it("un estudiante no puede editarla", async () => {
    const { deps } = escenario();
    await assert.rejects(actualizarConfigColegio(deps, { actor: estudiante, colegioId: "school-1", datos: { nombre: "X" } }), conCodigo(CODIGOS.PROHIBIDO));
  });

  it("tener el grupo colegio no basta si el perfil no es de ese colegio", async () => {
    const { deps } = escenario();
    const falso = { id: "falso", grupos: ["colegio"] };
    await assert.rejects(actualizarConfigColegio(deps, { actor: falso, colegioId: "school-1", datos: { nombre: "X" } }), conCodigo(CODIGOS.PROHIBIDO));
  });
});

describe("listados", () => {
  it("lista los colegios para el selector", async () => {
    const { deps } = escenario();
    const colegios = await listarColegios(deps, { actor: estudiante });
    assert.deepEqual(colegios.map((c) => c.id), ["school-1", "school-2"]);
  });

  it("lista los estudiantes del colegio con total y promedio", async () => {
    const { deps, repositorio } = await escenarioConEstudiante();
    await repositorio.crearPerfil({ userId: "u2", tipo: "estudiante", colegioId: "school-1", readinessScore: 70 });
    await repositorio.actualizarPerfil("u1", { readinessScore: 81 });
    const resultado = await listarEstudiantesColegio(deps, { actor: colegio, colegioId: "school-1" });
    assert.equal(resultado.total, 2);
    assert.equal(resultado.scorePromedio, 76);
  });

  it("sin estudiantes el promedio es 0", async () => {
    const { deps } = escenario();
    const resultado = await listarEstudiantesColegio(deps, { actor: colegio, colegioId: "school-1" });
    assert.deepEqual(resultado, { total: 0, scorePromedio: 0, estudiantes: [] });
  });

  it("un estudiante no puede ver la lista", async () => {
    const { deps } = escenario();
    await assert.rejects(listarEstudiantesColegio(deps, { actor: estudiante, colegioId: "school-1" }), conCodigo(CODIGOS.PROHIBIDO));
  });
});
