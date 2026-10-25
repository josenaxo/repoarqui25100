// Datos del colegio y su personalizacion (logo, color, bienvenida)
import { ErrorDominio, CODIGOS } from "./errores.mjs";
import { esTextoNoVacio, validarTexto, validarEnlace } from "./validaciones.mjs";
import { esEspecialidadOficial } from "./especialidades.mjs";

const LARGOS_TEXTO = { nombre: 120, descripcion: 1000, ubicacion: 120, bienvenida: 200 };
const COLOR_HEX = /^#[0-9A-Fa-f]{6}$/;
const MAX_ESPECIALIDADES = 20;
const LARGO_ESPECIALIDAD = 80;

export function validarConfigColegio(datos) {
  if (!esTextoNoVacio(datos?.nombre)) {
    throw new ErrorDominio(CODIGOS.VALIDACION, "nombre es obligatorio");
  }
  const config = {};
  for (const [campo, largo] of Object.entries(LARGOS_TEXTO)) {
    if (datos[campo] !== undefined) config[campo] = validarTexto(campo, datos[campo], largo);
  }
  if (datos.sitioWeb !== undefined) config.sitioWeb = validarEnlace("sitioWeb", datos.sitioWeb, 200);
  // el logo puede ser ruta interna (/logos/colegio.svg) o url http(s)
  if (datos.logo !== undefined) config.logo = validarEnlace("logo", datos.logo, 300, { permitirRuta: true });
  if (datos.colorPrincipal !== undefined) {
    if (typeof datos.colorPrincipal !== "string" || !COLOR_HEX.test(datos.colorPrincipal)) {
      throw new ErrorDominio(CODIGOS.VALIDACION, "colorPrincipal debe tener el formato #RRGGBB");
    }
    config.colorPrincipal = datos.colorPrincipal;
  }
  if (datos.especialidades !== undefined) {
    if (!Array.isArray(datos.especialidades) || datos.especialidades.length > MAX_ESPECIALIDADES) {
      throw new ErrorDominio(CODIGOS.VALIDACION, `especialidades debe ser una lista de hasta ${MAX_ESPECIALIDADES} textos`);
    }
    const lista = datos.especialidades.map((e) => validarTexto("especialidades", e, LARGO_ESPECIALIDAD));
    const noOficial = lista.find((e) => !esEspecialidadOficial(e));
    if (noOficial !== undefined) {
      throw new ErrorDominio(CODIGOS.VALIDACION, `"${noOficial}" no es una especialidad aprobada por el Mineduc`);
    }
    config.especialidades = [...new Set(lista)];
  }
  return config;
}
