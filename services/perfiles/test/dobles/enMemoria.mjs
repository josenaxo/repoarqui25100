// Dobles para los tests: cumplen los mismos puertos que dynamo y cognito pero guardan todo en memoria
export function crearRepositorioEnMemoria({ perfiles = [], colegios = [] } = {}) {
  const tablaPerfiles = new Map(perfiles.map((p) => [p.userId, structuredClone(p)]));
  const tablaColegios = new Map(colegios.map((c) => [c.id, structuredClone(c)]));
  // se guardan las escrituras de perfiles para revisar en los tests que campos se escribieron
  const escrituras = [];

  return {
    escrituras,
    async obtenerPerfil(userId) {
      const perfil = tablaPerfiles.get(userId);
      return perfil ? structuredClone(perfil) : null;
    },
    async crearPerfil(perfil) {
      if (tablaPerfiles.has(perfil.userId)) return false;
      tablaPerfiles.set(perfil.userId, structuredClone(perfil));
      return true;
    },
    async actualizarPerfil(userId, campos) {
      escrituras.push({ userId, campos });
      const perfil = tablaPerfiles.get(userId);
      if (!perfil) return null;
      const actualizado = { ...perfil, ...campos };
      tablaPerfiles.set(userId, actualizado);
      return structuredClone(actualizado);
    },
    async obtenerConfigColegio(colegioId) {
      const colegio = tablaColegios.get(colegioId);
      return colegio ? structuredClone(colegio) : null;
    },
    async actualizarConfigColegio(colegioId, config) {
      if (!tablaColegios.has(colegioId)) return false;
      tablaColegios.set(colegioId, { id: colegioId, ...config });
      return true;
    },
    async listarColegios() {
      return [...tablaColegios.values()].map(({ id, nombre, logo }) => ({ id, nombre, logo }));
    },
    async listarEstudiantesColegio(colegioId) {
      return [...tablaPerfiles.values()]
        .filter((p) => p.tipo === "estudiante" && p.colegioId === colegioId)
        .map((p) => structuredClone(p));
    },
  };
}

export function crearIdentidadFalsa() {
  const llamadas = [];
  return {
    llamadas,
    async agregarAGrupo(username, grupo) {
      llamadas.push({ username, grupo });
    },
  };
}
