// CU-02 - PUT /perfiles/me (patron 3): edita los campos permitidos del perfil
import { ErrorDominio, CODIGOS } from "../domain/errores.mjs";
import { validarCambios } from "../domain/Perfil.mjs";
import { exigirActor, exigirColegioExistente, exigirEspecialidadDelColegio } from "./comunes.mjs";

export async function actualizarPerfil({ repositorio }, { actor, cambios }) {
  exigirActor(actor);
  const existente = await repositorio.obtenerPerfil(actor.id);
  if (!existente) {
    throw new ErrorDominio(CODIGOS.NO_ENCONTRADO, "Perfil no encontrado");
  }
  const campos = validarCambios(existente.tipo, cambios);
  if (campos.colegioId && campos.colegioId !== existente.colegioId) {
    await exigirColegioExistente(repositorio, campos.colegioId);
  }
  if (campos.especialidad) {
    const colegioId = campos.colegioId !== undefined ? campos.colegioId : existente.colegioId;
    await exigirEspecialidadDelColegio(repositorio, colegioId, campos.especialidad);
  }
  if (Object.keys(campos).length === 0) return existente;

  // solo se escriben los campos validados, asi no se pisa el readinessScore si otro proceso lo cambia (fase 2)
  const actualizado = await repositorio.actualizarPerfil(actor.id, campos);
  if (!actualizado) {
    throw new ErrorDominio(CODIGOS.NO_ENCONTRADO, "Perfil no encontrado");
  }
  return actualizado;
}
