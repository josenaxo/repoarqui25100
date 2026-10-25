// Caso de uso: verificar la salud del servicio.
// No conoce AWS ni HTTP: solo usa el puerto RepositorioSalud que recibe como parámetro.
export async function verificarSalud({ repositorio }) {
  const baseDatos = await repositorio.ping()
  return {
    estado: baseDatos ? 'ok' : 'degradado',
    baseDatos,
    fecha: new Date().toISOString(),
  }
}