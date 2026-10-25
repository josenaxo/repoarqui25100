// Puerto del repositorio: lo que necesitan los casos de uso para leer y guardar perfiles.
// Lo implementa el adaptador de dynamo, y en los tests uno en memoria.
// En TS seria una interface, aca se deja documentado y se revisa con comprobarPuerto.
//
// obtenerPerfil(userId) -> perfil o null
// crearPerfil(perfil) -> true, o false si ya tenia perfil
// actualizarPerfil(userId, campos) -> perfil actualizado o null si no existe (escribe solo esos campos)
// obtenerConfigColegio(colegioId) -> config con su id, o null
// actualizarConfigColegio(colegioId, config) -> true, o false si el colegio no existe
// listarColegios() -> [{ id, nombre, logo }]
// listarEstudiantesColegio(colegioId) -> lista de perfiles
export const METODOS_REPOSITORIO_PERFILES = Object.freeze([
  "obtenerPerfil",
  "crearPerfil",
  "actualizarPerfil",
  "obtenerConfigColegio",
  "actualizarConfigColegio",
  "listarColegios",
  "listarEstudiantesColegio",
]);
