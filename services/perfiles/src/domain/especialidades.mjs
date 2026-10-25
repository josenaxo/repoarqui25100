// Especialidades oficiales de la Formacion Diferenciada Tecnico-Profesional del Mineduc (listado de 3° medio TP):
// 15 sectores, 35 especialidades y 17 menciones. Las Bases Curriculares son del Decreto 452 de 2013, y despues
// se sumo Mecanica de Mantenimiento de Aeronaves.
// Un colegio no puede inventar especialidades, asi que solo se aceptan las de esta lista.
// El frontend tiene una copia en frontend/src/lib/especialidades.ts, si cambia hay que cambiar las dos
export const SECTORES = [
  {
    sector: "Administración",
    especialidades: [{ nombre: "Administración", menciones: ["Logística", "Recursos Humanos"] }, { nombre: "Contabilidad" }],
  },
  { sector: "Agropecuario", especialidades: [{ nombre: "Agropecuaria", menciones: ["Agricultura", "Pecuaria", "Vitivinícola"] }] },
  {
    sector: "Alimentación",
    especialidades: [
      { nombre: "Elaboración Industrial de Alimentos" },
      { nombre: "Gastronomía", menciones: ["Cocina", "Pastelería y Repostería"] },
    ],
  },
  { sector: "Confección", especialidades: [{ nombre: "Vestuario y Confección Textil" }] },
  {
    sector: "Construcción",
    especialidades: [
      { nombre: "Construcción", menciones: ["Edificación", "Obras Viales e Infraestructura", "Terminaciones de la Construcción"] },
      { nombre: "Instalaciones Sanitarias" },
      { nombre: "Montaje Industrial" },
      { nombre: "Refrigeración y Climatización" },
    ],
  },
  { sector: "Electricidad", especialidades: [{ nombre: "Electricidad" }, { nombre: "Electrónica" }] },
  { sector: "Gráfico", especialidades: [{ nombre: "Dibujo Técnico" }, { nombre: "Gráfica" }] },
  { sector: "Hotelería y Turismo", especialidades: [{ nombre: "Servicios de Hotelería" }, { nombre: "Servicios de Turismo" }] },
  { sector: "Maderero", especialidades: [{ nombre: "Forestal" }, { nombre: "Muebles y Terminaciones en Madera" }] },
  {
    sector: "Marítimo",
    especialidades: [
      { nombre: "Acuicultura" },
      { nombre: "Operaciones Portuarias" },
      { nombre: "Pesquería" },
      { nombre: "Tripulación de Naves Mercantes y Especiales" },
    ],
  },
  {
    sector: "Metalmecánica",
    especialidades: [
      { nombre: "Construcciones Metálicas" },
      { nombre: "Mecánica Automotriz" },
      { nombre: "Mecánica de Mantenimiento de Aeronaves" },
      { nombre: "Mecánica Industrial", menciones: ["Mantenimiento Electromecánico", "Máquinas-Herramientas", "Matricería"] },
    ],
  },
  {
    sector: "Minero",
    especialidades: [{ nombre: "Asistencia en Geología" }, { nombre: "Explotación Minera" }, { nombre: "Metalúrgica Extractiva" }],
  },
  {
    sector: "Química e Industria",
    especialidades: [{ nombre: "Química Industrial", menciones: ["Laboratorio Químico", "Planta Química"] }],
  },
  {
    sector: "Salud y Educación",
    especialidades: [{ nombre: "Atención de Enfermería", menciones: ["Adulto Mayor", "Enfermería"] }, { nombre: "Atención de Párvulos" }],
  },
  {
    sector: "Tecnología y Comunicaciones",
    especialidades: [{ nombre: "Conectividad y Redes" }, { nombre: "Programación" }, { nombre: "Telecomunicaciones" }],
  },
];

// Lo que se guarda: la especialidad sola (en 3° medio aun no hay mencion) o con su mencion,
// por ejemplo "Administración - Mención Logística"
export const ESPECIALIDADES_OFICIALES = SECTORES.flatMap(({ especialidades }) =>
  especialidades.flatMap(({ nombre, menciones = [] }) => [nombre, ...menciones.map((m) => `${nombre} - Mención ${m}`)]),
);

const oficiales = new Set(ESPECIALIDADES_OFICIALES);

export const esEspecialidadOficial = (texto) => oficiales.has(texto);
