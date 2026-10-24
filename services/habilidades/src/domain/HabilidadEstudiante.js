export function normalizarHabilidad(nombre) {
  return nombre.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
}

export function declarar(datos) {
  if (!datos.nombre?.trim()) throw new Error('nombre es obligatorio')
  if (!datos.estudianteId || !datos.colegioId) throw new Error('estudianteId y colegioId son obligatorios')
  const fecha = new Date().toISOString()
  return {
    id: normalizarHabilidad(datos.nombre),
    nombre: datos.nombre.trim(),
    estudianteId: datos.estudianteId,
    colegioId: datos.colegioId,
    estado: 'declarada',
    creadaEn: fecha,
  }
}

export function decidirValidacion(habilidad, estado, comentario = '') {
  if (!['validada', 'rechazada'].includes(estado)) throw new Error('estado inválido')
  if (habilidad.estado !== 'declarada') throw Object.assign(new Error('la habilidad ya fue revisada'), { statusCode: 409 })
  return { ...habilidad, estado, comentario, revisadaEn: new Date().toISOString() }
}
