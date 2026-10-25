import { api } from '@/lib/api-client'
import type { StudentProfile } from '@/types'

// Una funcion por ruta de contracts/api/perfiles.yaml, con el mismo nombre que su operationId

export type TipoPerfil = 'estudiante' | 'empresa' | 'colegio'

export interface Perfil {
  userId:          string
  tipo:            TipoPerfil
  nombre?:         string
  apellido?:       string
  titular?:        string
  bio?:            string
  especialidad?:   string
  anio?:           number
  telefono?:       string
  ubicacion?:      string
  colegioId?:      string
  readinessScore?: number
  profileViews?:   number
  // solo empresa
  descripcion?:    string
  industria?:      string
  tamanio?:        string
  sitioWeb?:       string
}

export type CambiosPerfil = Partial<Omit<Perfil, 'userId' | 'tipo' | 'readinessScore' | 'profileViews'>>

export interface ColegioResumen {
  id:     string
  nombre: string
  logo?:  string
}

export interface ConfigColegio {
  id:              string
  nombre:          string
  descripcion?:    string
  ubicacion?:      string
  sitioWeb?:       string
  especialidades?: string[]
  logo?:           string
  colorPrincipal?: string
  bienvenida?:     string
}

export type ConfigColegioEditable = Omit<ConfigColegio, 'id'>

export interface EstudiantesColegio {
  total:         number
  scorePromedio: number
  estudiantes:   Perfil[]
}

const colegio = (id: string) => `/colegios/${encodeURIComponent(id)}`

export const registrarPerfil = (datos: { nombre: string; apellido: string; anio?: number; colegioId?: string; especialidad?: string }) =>
  api.post<Perfil>('/perfiles', datos)

export const obtenerPerfil = () => api.get<Perfil>('/perfiles/me')

export const actualizarPerfil = (cambios: CambiosPerfil) => api.put<Perfil>('/perfiles/me', cambios)

export const listarColegios = () => api.get<ColegioResumen[]>('/colegios')

export const obtenerConfigColegio = (id: string) => api.get<ConfigColegio>(`${colegio(id)}/config`)

// la ruta reemplaza la configuracion completa, por eso se manda todo y no solo lo que cambio
export const actualizarConfigColegio = (id: string, config: ConfigColegioEditable) =>
  api.put<ConfigColegio>(`${colegio(id)}/config`, config)

export const listarEstudiantesColegio = (id: string) => api.get<EstudiantesColegio>(`${colegio(id)}/estudiantes`)

// los errores de la API traen { mensaje }
export function mensajeDeError(err: any, porDefecto: string): string {
  return err?.response?.data?.mensaje ?? porDefecto
}

export const nombreCompleto = (p: Pick<Perfil, 'nombre' | 'apellido'> | null | undefined) =>
  [p?.nombre, p?.apellido].filter(Boolean).join(' ')

// El perfil propio junto con la configuracion de su colegio (nombre, color, bienvenida)
export async function obtenerPerfilConColegio() {
  const perfil  = await obtenerPerfil()
  const colegio = perfil.colegioId ? await obtenerConfigColegio(perfil.colegioId).catch(() => null) : null
  return { perfil, colegio }
}

// Las pantallas antiguas usan la forma StudentProfile del backend NestJS, asi que se arma desde el perfil nuevo.
// Habilidades y evidencias son de otros servicios, por eso aca quedan vacias
export function aStudentProfile(p: Perfil, colegio?: ConfigColegio | null): StudentProfile {
  return {
    id:             p.userId,
    userId:         p.userId,
    user:           undefined as unknown as StudentProfile['user'],
    firstName:      p.nombre ?? '',
    lastName:       p.apellido ?? '',
    headline:       p.titular ?? '',
    bio:            p.bio ?? '',
    specialty:      p.especialidad ?? '',
    year:           p.anio ?? 0,
    phone:          p.telefono,
    location:       p.ubicacion,
    readinessScore: p.readinessScore ?? 0,
    profileViews:   p.profileViews ?? 0,
    schoolUserId:   p.colegioId,
    schoolName:     colegio?.nombre,
    skills:         [],
    evidences:      [],
    validations:    [],
    applications:   [],
    createdAt:      '',
    updatedAt:      '',
  }
}
