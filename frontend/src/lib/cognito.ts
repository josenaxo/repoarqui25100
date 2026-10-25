import { Amplify } from 'aws-amplify'
import { signIn, signOut, signUp, confirmSignUp, resendSignUpCode, fetchAuthSession } from 'aws-amplify/auth'
import type { UserRole } from '@/types'

// Los ids salen de los outputs de infra/shared (UserPoolId y UserPoolClientId)
const userPoolId       = process.env.NEXT_PUBLIC_USER_POOL_ID ?? ''
const userPoolClientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ?? ''

if (!userPoolId || !userPoolClientId) {
  console.error('Faltan NEXT_PUBLIC_USER_POOL_ID o NEXT_PUBLIC_USER_POOL_CLIENT_ID en frontend/.env.local')
}

Amplify.configure({ Auth: { Cognito: { userPoolId, userPoolClientId } } })

const rolPorGrupo: Record<string, UserRole> = {
  estudiante: 'STUDENT',
  empresa:    'EMPRESA',
  colegio:    'COLEGIO',
}

// el mismo mensaje en los dos, asi no se puede averiguar que correos tienen cuenta
const mensajePorError: Record<string, string> = {
  NotAuthorizedException: 'Email o contraseña incorrectos.',
  UserNotFoundException:  'Email o contraseña incorrectos.',
}

// errores del registro y del codigo que llega al correo
const mensajeRegistro: Record<string, string> = {
  UsernameExistsException:  'Ya existe una cuenta con ese correo. Inicia sesión.',
  InvalidPasswordException: 'La contraseña debe tener al menos 8 caracteres, con mayúscula, minúscula, número y símbolo.',
  CodeMismatchException:    'El código no es correcto.',
  ExpiredCodeException:     'El código venció. Pide uno nuevo.',
  LimitExceededException:   'Demasiados intentos. Espera unos minutos y vuelve a intentar.',
}

// pasos que devuelve Amplify cuando falta algo antes de entrar
const mensajePorPaso: Record<string, string> = {
  CONFIRM_SIGN_UP: 'Falta confirmar tu correo. Regístrate de nuevo con el mismo correo y contraseña y te enviamos otro código.',
  RESET_PASSWORD:  'Tienes que cambiar tu contraseña antes de entrar.',
  CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED: 'Tu contraseña es temporal y hay que cambiarla antes de entrar.',
}

const mensajeGenerico = 'No se pudo iniciar sesión. Intenta de nuevo.'

export interface SesionCognito {
  userId:      string
  role:        UserRole
  accessToken: string
}

// Lee la sesion guardada. Amplify renueva el token solo si ya vencio
export async function leerSesion(forzarRenovacion = false): Promise<SesionCognito | null> {
  const { tokens } = await fetchAuthSession({ forceRefresh: forzarRenovacion })
  if (!tokens?.accessToken) return null

  const payload = tokens.accessToken.payload
  const grupos  = (payload['cognito:groups'] as string[] | undefined) ?? []
  // sin grupo = recien registrado sin perfil, y el registro publico solo crea estudiantes
  const role = grupos.map(g => rolPorGrupo[g]).find(Boolean) ?? 'STUDENT'

  return { userId: payload.sub as string, role, accessToken: tokens.accessToken.toString() }
}

// Devuelve el paso en que quedo el inicio de sesion ('DONE' si entro)
async function entrar(email: string, password: string): Promise<string> {
  // si quedo una sesion abierta, Amplify no deja entrar de nuevo
  await signOut()
  const { nextStep } = await signIn({ username: email, password })
  return nextStep.signInStep
}

export async function iniciarSesion(email: string, password: string): Promise<SesionCognito> {
  let paso: string
  try {
    paso = await entrar(email, password)
  } catch (err: any) {
    throw new Error(mensajePorError[err?.name] ?? mensajeGenerico)
  }
  if (paso !== 'DONE') throw new Error(mensajePorPaso[paso] ?? mensajeGenerico)

  const sesion = await leerSesion().catch(() => null)
  if (!sesion) throw new Error(mensajeGenerico)
  return sesion
}

export async function cerrarSesion(): Promise<void> {
  await signOut()
}

// Crea la cuenta en Cognito, que manda un codigo al correo. Si el correo ya tenia cuenta
// se retoma el registro (por ejemplo, si cerro la pagina antes de poner el codigo)
export async function registrar(email: string, password: string): Promise<'nueva' | 'sin-confirmar' | 'confirmada'> {
  try {
    await signUp({ username: email, password, options: { userAttributes: { email } } })
    return 'nueva'
  } catch (err: any) {
    if (err?.name !== 'UsernameExistsException') {
      throw new Error(mensajeRegistro[err?.name] ?? 'No se pudo crear la cuenta. Intenta de nuevo.')
    }
  }
  // solo se retoma si sabe la clave, asi nadie termina el registro de una cuenta ajena.
  // Cognito revisa la clave antes de avisar que falta confirmar
  const paso = await entrar(email, password).catch(() => null)
  if (paso === 'DONE') return 'confirmada'
  if (paso === 'CONFIRM_SIGN_UP') {
    await reenviarCodigo(email)
    return 'sin-confirmar'
  }
  throw new Error(mensajeRegistro.UsernameExistsException)
}

export async function confirmarRegistro(email: string, codigo: string): Promise<void> {
  try {
    await confirmSignUp({ username: email, confirmationCode: codigo.trim() })
  } catch (err: any) {
    throw new Error(mensajeRegistro[err?.name] ?? 'No se pudo confirmar el correo. Intenta de nuevo.')
  }
}

export async function reenviarCodigo(email: string): Promise<void> {
  try {
    await resendSignUpCode({ username: email })
  } catch (err: any) {
    throw new Error(mensajeRegistro[err?.name] ?? 'No se pudo enviar el código. Intenta de nuevo.')
  }
}
