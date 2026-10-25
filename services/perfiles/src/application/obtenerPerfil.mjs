// CU-02 - GET /perfiles/me (patron 2): perfil del usuario del token
// sirve para cualquier usuario logeado: uno recien registrado no tiene grupo en el token todavia y tiene que recibir 404, no 403
import { ErrorDominio, CODIGOS } from "../domain/errores.mjs";
import { exigirActor } from "./comunes.mjs";

export async function obtenerPerfil({ repositorio }, { actor }) {
  exigirActor(actor);
  const perfil = await repositorio.obtenerPerfil(actor.id);
  if (!perfil) {
    throw new ErrorDominio(CODIGOS.NO_ENCONTRADO, "Perfil no encontrado");
  }
  return perfil;
}
