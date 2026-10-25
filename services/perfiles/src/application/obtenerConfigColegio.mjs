// GET /colegios/{id}/config (patron 4): datos del colegio y su personalizacion
import { ErrorDominio, CODIGOS } from "../domain/errores.mjs";
import { exigirActor } from "./comunes.mjs";

export async function obtenerConfigColegio({ repositorio }, { actor, colegioId }) {
  exigirActor(actor);
  const config = await repositorio.obtenerConfigColegio(colegioId);
  if (!config) {
    throw new ErrorDominio(CODIGOS.NO_ENCONTRADO, "Colegio no encontrado");
  }
  return config;
}
