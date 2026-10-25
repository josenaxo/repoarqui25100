// PUT /colegios/{id}/config (patron 5): solo lo puede hacer el usuario de ese colegio
import { ErrorDominio, CODIGOS } from "../domain/errores.mjs";
import { validarConfigColegio } from "../domain/ConfigColegio.mjs";
import { exigirDuenoColegio } from "./comunes.mjs";

export async function actualizarConfigColegio({ repositorio }, { actor, colegioId, datos }) {
  await exigirDuenoColegio(repositorio, actor, colegioId);
  const config = validarConfigColegio(datos);
  const actualizado = await repositorio.actualizarConfigColegio(colegioId, config);
  if (!actualizado) {
    throw new ErrorDominio(CODIGOS.NO_ENCONTRADO, "Colegio no encontrado");
  }
  return { id: colegioId, ...config };
}
