// Tests del dominio: reglas del perfil y de la config del colegio, sin aws ni base de datos
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { crearPerfilEstudiante, aplicarCambios, validarCambios } from "../src/domain/Perfil.mjs";
import { validarConfigColegio } from "../src/domain/ConfigColegio.mjs";
import { SECTORES, ESPECIALIDADES_OFICIALES } from "../src/domain/especialidades.mjs";
import { CODIGOS } from "../src/domain/errores.mjs";

const conCodigo = (codigo) => (error) => error.codigo === codigo;

const estudiante = { userId: "u1", tipo: "estudiante", nombre: "Ana", apellido: "Paz", readinessScore: 50 };
const empresa = { userId: "u9", tipo: "empresa", nombre: "TechCorp" };

describe("Perfil", () => {
  it("crea un estudiante con score 0 aunque manden otro tipo o score", () => {
    const perfil = crearPerfilEstudiante({
      userId: "u1",
      datos: { nombre: " Ana ", apellido: "Paz", tipo: "colegio", readinessScore: 99 },
    });
    assert.equal(perfil.tipo, "estudiante");
    assert.equal(perfil.readinessScore, 0);
    assert.equal(perfil.nombre, "Ana");
  });

  it("exige nombre y apellido de tipo texto", () => {
    assert.throws(() => crearPerfilEstudiante({ userId: "u1", datos: { apellido: "Paz" } }), conCodigo(CODIGOS.VALIDACION));
    assert.throws(() => crearPerfilEstudiante({ userId: "u1", datos: { nombre: 5, apellido: "Paz" } }), conCodigo(CODIGOS.VALIDACION));
    assert.throws(() => crearPerfilEstudiante({ userId: "u1", datos: null }), conCodigo(CODIGOS.VALIDACION));
  });

  it("guarda el email solo si viene", () => {
    const sinEmail = crearPerfilEstudiante({ userId: "u1", datos: { nombre: "Ana", apellido: "Paz" } });
    const conEmail = crearPerfilEstudiante({ userId: "u1", email: "ana@x.cl", datos: { nombre: "Ana", apellido: "Paz" } });
    assert.equal("email" in sinEmail, false);
    assert.equal(conEmail.email, "ana@x.cl");
  });

  it("no deja editar readinessScore, profileViews, tipo ni userId", () => {
    const cambios = validarCambios("estudiante", { readinessScore: 100, profileViews: 9, tipo: "colegio", userId: "otro", bio: "Hola" });
    assert.deepEqual(cambios, { bio: "Hola" });
  });

  it("ignora claves heredadas como constructor, toString o __proto__", () => {
    // se usa JSON.parse porque asi llega el body real y "__proto__" queda como clave propia
    const body = JSON.parse('{ "constructor": "x", "toString": "x", "__proto__": { "a": 1 } }');
    assert.deepEqual(validarCambios("estudiante", body), {});
  });

  it("no deja vaciar los campos obligatorios", () => {
    assert.throws(() => aplicarCambios(estudiante, { nombre: "   " }), conCodigo(CODIGOS.VALIDACION));
    assert.throws(() => aplicarCambios(empresa, { nombre: "" }), conCodigo(CODIGOS.VALIDACION));
  });

  it("el anio tiene que ser un entero entre 1 y 7", () => {
    assert.equal(aplicarCambios(estudiante, { anio: 4 }).anio, 4);
    assert.throws(() => aplicarCambios(estudiante, { anio: "4" }), conCodigo(CODIGOS.VALIDACION));
    assert.throws(() => aplicarCambios(estudiante, { anio: 8 }), conCodigo(CODIGOS.VALIDACION));
  });

  it("el sitio web solo acepta http o https", () => {
    assert.equal(aplicarCambios(empresa, { sitioWeb: "https://techcorp.cl" }).sitioWeb, "https://techcorp.cl");
    assert.equal(aplicarCambios(empresa, { sitioWeb: "" }).sitioWeb, "");
    assert.throws(() => aplicarCambios(empresa, { sitioWeb: "javascript:alert(1)" }), conCodigo(CODIGOS.VALIDACION));
  });

  it("respeta el largo maximo del contrato", () => {
    assert.throws(() => aplicarCambios(empresa, { nombre: "x".repeat(61) }), conCodigo(CODIGOS.VALIDACION));
    assert.equal(aplicarCambios(empresa, { nombre: "x".repeat(60) }).nombre.length, 60);
  });

  it("rechaza datos que no son un objeto", () => {
    assert.throws(() => validarCambios("estudiante", [1, 2]), conCodigo(CODIGOS.VALIDACION));
    assert.throws(() => validarCambios("estudiante", "texto"), conCodigo(CODIGOS.VALIDACION));
  });

  it("un perfil de colegio no tiene campos editables", () => {
    assert.deepEqual(validarCambios("colegio", { nombre: "X" }), {});
  });
});

describe("ConfigColegio", () => {
  it("exige un nombre de tipo texto", () => {
    assert.throws(() => validarConfigColegio({}), conCodigo(CODIGOS.VALIDACION));
    assert.throws(() => validarConfigColegio({ nombre: 123 }), conCodigo(CODIGOS.VALIDACION));
  });

  it("el color tiene que ser #RRGGBB", () => {
    assert.equal(validarConfigColegio({ nombre: "ITM", colorPrincipal: "#0F4C5C" }).colorPrincipal, "#0F4C5C");
    assert.throws(() => validarConfigColegio({ nombre: "ITM", colorPrincipal: "rojo" }), conCodigo(CODIGOS.VALIDACION));
  });

  it("el logo acepta ruta interna o url, pero no //otro-sitio", () => {
    assert.equal(validarConfigColegio({ nombre: "ITM", logo: "/logos/colegio.svg" }).logo, "/logos/colegio.svg");
    assert.equal(validarConfigColegio({ nombre: "ITM", logo: "https://cdn.itm.cl/logo.png" }).logo, "https://cdn.itm.cl/logo.png");
    assert.throws(() => validarConfigColegio({ nombre: "ITM", logo: "//malo.com/x.png" }), conCodigo(CODIGOS.VALIDACION));
  });

  it("limita las especialidades a 20 textos", () => {
    assert.throws(() => validarConfigColegio({ nombre: "ITM", especialidades: Array(21).fill("Programación") }), conCodigo(CODIGOS.VALIDACION));
    assert.throws(() => validarConfigColegio({ nombre: "ITM", especialidades: ["Programación", 5] }), conCodigo(CODIGOS.VALIDACION));
  });

  it("solo acepta especialidades oficiales del Mineduc y quita las repetidas", () => {
    const config = validarConfigColegio({ nombre: "ITM", especialidades: ["Programación", "Gastronomía - Mención Cocina", "Programación"] });
    assert.deepEqual(config.especialidades, ["Programación", "Gastronomía - Mención Cocina"]);
    assert.throws(() => validarConfigColegio({ nombre: "ITM", especialidades: ["Redes y Telecomunicaciones"] }), conCodigo(CODIGOS.VALIDACION));
    // en 3° medio todavia no hay mencion, asi que la especialidad sola tambien vale
    assert.deepEqual(validarConfigColegio({ nombre: "ITM", especialidades: ["Gastronomía"] }).especialidades, ["Gastronomía"]);
    assert.throws(() => validarConfigColegio({ nombre: "ITM", especialidades: ["Gastronomía - Mención Panadería"] }), conCodigo(CODIGOS.VALIDACION));
  });

  it("limpia espacios y deja solo los campos conocidos", () => {
    const config = validarConfigColegio({ nombre: " ITM ", bienvenida: "Hola", otro: "x" });
    assert.deepEqual(config, { nombre: "ITM", bienvenida: "Hola" });
  });
});

describe("especialidades oficiales", () => {
  it("son las del listado TP del Mineduc: 15 sectores, 35 especialidades y 17 menciones", () => {
    const especialidades = SECTORES.flatMap((s) => s.especialidades);
    assert.equal(SECTORES.length, 15);
    assert.equal(especialidades.length, 35);
    assert.equal(especialidades.flatMap((e) => e.menciones ?? []).length, 17);
    // cada especialidad sola mas cada mencion
    assert.equal(ESPECIALIDADES_OFICIALES.length, 52);
  });

  it("el perfil solo acepta una especialidad oficial, o vacia para quitarla", () => {
    assert.equal(validarCambios("estudiante", { especialidad: "Programación" }).especialidad, "Programación");
    assert.equal(validarCambios("estudiante", { especialidad: "" }).especialidad, "");
    assert.throws(() => validarCambios("estudiante", { especialidad: "informatica" }), conCodigo(CODIGOS.VALIDACION));
  });
});
