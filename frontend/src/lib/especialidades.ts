// Copia de services/perfiles/src/domain/especialidades.mjs para armar los selectores.
// La que manda es la del servicio (es la que valida), si cambia hay que cambiar las dos.
// Especialidades TP oficiales del Mineduc (3° y 4° medio): 15 sectores, 35 especialidades y 17 menciones
export interface SectorTP {
  sector: string
  especialidades: { nombre: string; menciones?: string[] }[]
}

export const SECTORES: SectorTP[] = [
  {
    sector: 'Administración',
    especialidades: [{ nombre: 'Administración', menciones: ['Logística', 'Recursos Humanos'] }, { nombre: 'Contabilidad' }],
  },
  { sector: 'Agropecuario', especialidades: [{ nombre: 'Agropecuaria', menciones: ['Agricultura', 'Pecuaria', 'Vitivinícola'] }] },
  {
    sector: 'Alimentación',
    especialidades: [
      { nombre: 'Elaboración Industrial de Alimentos' },
      { nombre: 'Gastronomía', menciones: ['Cocina', 'Pastelería y Repostería'] },
    ],
  },
  { sector: 'Confección', especialidades: [{ nombre: 'Vestuario y Confección Textil' }] },
  {
    sector: 'Construcción',
    especialidades: [
      { nombre: 'Construcción', menciones: ['Edificación', 'Obras Viales e Infraestructura', 'Terminaciones de la Construcción'] },
      { nombre: 'Instalaciones Sanitarias' },
      { nombre: 'Montaje Industrial' },
      { nombre: 'Refrigeración y Climatización' },
    ],
  },
  { sector: 'Electricidad', especialidades: [{ nombre: 'Electricidad' }, { nombre: 'Electrónica' }] },
  { sector: 'Gráfico', especialidades: [{ nombre: 'Dibujo Técnico' }, { nombre: 'Gráfica' }] },
  { sector: 'Hotelería y Turismo', especialidades: [{ nombre: 'Servicios de Hotelería' }, { nombre: 'Servicios de Turismo' }] },
  { sector: 'Maderero', especialidades: [{ nombre: 'Forestal' }, { nombre: 'Muebles y Terminaciones en Madera' }] },
  {
    sector: 'Marítimo',
    especialidades: [
      { nombre: 'Acuicultura' },
      { nombre: 'Operaciones Portuarias' },
      { nombre: 'Pesquería' },
      { nombre: 'Tripulación de Naves Mercantes y Especiales' },
    ],
  },
  {
    sector: 'Metalmecánica',
    especialidades: [
      { nombre: 'Construcciones Metálicas' },
      { nombre: 'Mecánica Automotriz' },
      { nombre: 'Mecánica de Mantenimiento de Aeronaves' },
      { nombre: 'Mecánica Industrial', menciones: ['Mantenimiento Electromecánico', 'Máquinas-Herramientas', 'Matricería'] },
    ],
  },
  {
    sector: 'Minero',
    especialidades: [{ nombre: 'Asistencia en Geología' }, { nombre: 'Explotación Minera' }, { nombre: 'Metalúrgica Extractiva' }],
  },
  {
    sector: 'Química e Industria',
    especialidades: [{ nombre: 'Química Industrial', menciones: ['Laboratorio Químico', 'Planta Química'] }],
  },
  {
    sector: 'Salud y Educación',
    especialidades: [{ nombre: 'Atención de Enfermería', menciones: ['Adulto Mayor', 'Enfermería'] }, { nombre: 'Atención de Párvulos' }],
  },
  {
    sector: 'Tecnología y Comunicaciones',
    especialidades: [{ nombre: 'Conectividad y Redes' }, { nombre: 'Programación' }, { nombre: 'Telecomunicaciones' }],
  },
]

// Las opciones de cada sector tal como se guardan: la especialidad sola o con su mencion
export const opcionesDelSector = (s: SectorTP): string[] =>
  s.especialidades.flatMap(({ nombre, menciones = [] }) => [nombre, ...menciones.map(m => `${nombre} - Mención ${m}`)])

export const ESPECIALIDADES_OFICIALES = SECTORES.flatMap(opcionesDelSector)

// El sector de una especialidad guardada, para agrupar las opciones del estudiante
export const sectorDe = (especialidad: string) =>
  SECTORES.find(s => opcionesDelSector(s).includes(especialidad))?.sector
