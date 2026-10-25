// GET /colegios (patron 6): lista para el selector de colegio del estudiante
import { exigirActor } from "./comunes.mjs";

export async function listarColegios({ repositorio }, { actor }) {
  exigirActor(actor);
  return repositorio.listarColegios();
}
