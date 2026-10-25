// GET /colegios/{id}/estudiantes (patron 7): solo el usuario de ese colegio
// el total y el promedio se sacan del resultado, son pocos (los de un solo colegio)
import { exigirDuenoColegio } from "./comunes.mjs";

export async function listarEstudiantesColegio({ repositorio }, { actor, colegioId }) {
  await exigirDuenoColegio(repositorio, actor, colegioId);
  const estudiantes = await repositorio.listarEstudiantesColegio(colegioId);
  const total = estudiantes.length;
  const suma = estudiantes.reduce((acumulado, e) => acumulado + (Number(e.readinessScore) || 0), 0);
  return {
    total,
    scorePromedio: total === 0 ? 0 : Math.round(suma / total),
    estudiantes,
  };
}
