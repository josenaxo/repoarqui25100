// Validaciones que usan varios casos de uso.
// actor = usuario del token { id, username, grupos, email? }, lo arma el adaptador de entrada
import { ErrorDominio, CODIGOS } from "../domain/errores.mjs";

export function exigirActor(actor) {
  if (!actor?.id) {
    throw new ErrorDominio(CODIGOS.PROHIBIDO, "Usuario no identificado");
  }
}

export function tieneGrupo(actor, grupo) {
  return (actor?.grupos ?? []).includes(grupo);
}

// Solo el usuario de ese mismo colegio: se revisa el grupo del token y el colegioId de su perfil.
// Va antes de ver si el colegio existe, asi otro colegio recibe 403 y no sabe si existe o no
export async function exigirDuenoColegio(repositorio, actor, colegioId) {
  exigirActor(actor);
  if (!tieneGrupo(actor, "colegio")) {
    throw new ErrorDominio(CODIGOS.PROHIBIDO, "Solo un colegio puede hacer esta acción");
  }
  const perfil = await repositorio.obtenerPerfil(actor.id);
  if (perfil?.tipo !== "colegio" || perfil.colegioId !== colegioId) {
    throw new ErrorDominio(CODIGOS.PROHIBIDO, "No puedes administrar otro colegio");
  }
}

export async function exigirColegioExistente(repositorio, colegioId) {
  const colegio = await repositorio.obtenerConfigColegio(colegioId);
  if (!colegio) {
    throw new ErrorDominio(CODIGOS.VALIDACION, "El colegio indicado no existe");
  }
  return colegio;
}

// La especialidad del estudiante tiene que ser una de las que imparte su colegio
export async function exigirEspecialidadDelColegio(repositorio, colegioId, especialidad) {
  if (!especialidad) return;
  if (!colegioId) {
    throw new ErrorDominio(CODIGOS.VALIDACION, "Elige tu colegio antes que tu especialidad");
  }
  const colegio = await exigirColegioExistente(repositorio, colegioId);
  if (!(colegio.especialidades ?? []).includes(especialidad)) {
    throw new ErrorDominio(CODIGOS.VALIDACION, "Tu colegio no imparte esa especialidad");
  }
}
