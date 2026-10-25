// Revisa que el adaptador tenga todos los metodos del puerto.
// Asi si falta uno falla al arrancar y no en medio de un request.
export function comprobarPuerto(nombrePuerto, implementacion, metodos) {
  const faltantes = metodos.filter((metodo) => typeof implementacion?.[metodo] !== "function");
  if (faltantes.length > 0) {
    throw new Error(`${nombrePuerto}: faltan los métodos ${faltantes.join(", ")}`);
  }
  return implementacion;
}
