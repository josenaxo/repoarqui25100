// CU-01 - POST /perfiles (patron 1): crea el perfil de estudiante y lo agrega al grupo estudiante
import { ErrorDominio, CODIGOS } from "../domain/errores.mjs";
import { crearPerfilEstudiante } from "../domain/Perfil.mjs";
import { exigirActor, tieneGrupo, exigirColegioExistente, exigirEspecialidadDelColegio } from "./comunes.mjs";

export async function registrarPerfil({ repositorio, identidad }, { actor, datos }) {
  exigirActor(actor);
  // colegios y empresas no se registran solos, esos perfiles los crea el equipo (no hay rol admin)
  if (tieneGrupo(actor, "colegio") || tieneGrupo(actor, "empresa")) {
    throw new ErrorDominio(CODIGOS.PROHIBIDO, "El registro público es solo para estudiantes");
  }
  const perfil = crearPerfilEstudiante({ userId: actor.id, email: actor.email, datos });
  if (perfil.colegioId) await exigirColegioExistente(repositorio, perfil.colegioId);
  await exigirEspecialidadDelColegio(repositorio, perfil.colegioId, perfil.especialidad);

  // cognito y dynamo son sistemas distintos, no hay transaccion entre los dos.
  // los dos pasos son idempotentes, si algo falla a medio camino se puede reintentar sin problema
  await identidad.agregarAGrupo(actor.username, "estudiante");
  const creado = await repositorio.crearPerfil(perfil);
  if (!creado) {
    throw new ErrorDominio(CODIGOS.CONFLICTO, "El usuario ya tiene perfil");
  }
  return perfil;
}
