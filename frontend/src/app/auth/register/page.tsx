'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, PasswordInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CeibboLogoMark } from '@/components/ui/CeibboLogoMark'
import { useAuthStore } from '@/store/auth.store'
import { registrarPerfil } from '@/lib/api/perfiles'
import { registrar, confirmarRegistro, reenviarCodigo } from '@/lib/cognito'
import { cn } from '@/lib/utils'
import { usePageTitle } from '@/lib/usePageTitle'

type Role = 'STUDENT' | 'EMPRESA' | 'COLEGIO'

const roleRedirect: Record<Role, string> = {
  STUDENT: '/student/inicio',
  EMPRESA: '/empresa/inicio',
  COLEGIO: '/colegio/inicio',
}

const roles = [
  {
    key:         'STUDENT' as Role,
    label:       'Estudiante',
    description: 'Construye tu perfil y conecta con empresas',
    icon:        'school',
    color:       'from-blue-500 to-indigo-600',
  },
  {
    key:         'EMPRESA' as Role,
    label:       'Empresa',
    description: 'Descubre y contrata talento técnico',
    icon:        'business',
    color:       'from-violet-500 to-purple-700',
  },
  {
    key:         'COLEGIO' as Role,
    label:       'Colegio',
    description: 'Gestiona y valida a tus estudiantes',
    icon:        'account_balance',
    color:       'from-emerald-500 to-teal-700',
  },
]

const schema = z.object({
  email:        z.string().email('Email inválido'),
  password:     z.string().min(8, 'Mínimo 8 caracteres'),
  // los mismos largos que valida perfiles, para que no falle despues de confirmar el correo
  firstName:    z.string().trim().min(1, 'Obligatorio').max(60, 'Máximo 60 caracteres'),
  lastName:     z.string().trim().min(1, 'Obligatorio').max(60, 'Máximo 60 caracteres'),
  // el select manda '' si no se elige nada, y con coerce eso era 0 y bloqueaba el formulario
  year:         z.union([z.literal(''), z.coerce.number().int().min(1).max(7)]).optional(),
})
type FormValues = z.infer<typeof schema>

// los errores de la API traen { mensaje } y los de cognito.ts ya vienen en espanol
function mensajeDeError(err: any): string {
  if (err?.isAxiosError) return err.response?.data?.mensaje ?? 'No se pudo guardar tu perfil. Intenta de nuevo.'
  return err?.message ?? 'No se pudo terminar el registro. Intenta de nuevo.'
}

export default function RegisterPageWrapper() {
  usePageTitle('Crear cuenta')
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <RegisterPage />
    </Suspense>
  )
}

function RegisterPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const initialRole  = (searchParams.get('role') as Role) ?? null

  const [step, setStep]               = useState<'role' | 'form'>(initialRole ? 'form' : 'role')
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole ?? 'STUDENT')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  // datos del formulario mientras se espera el codigo del correo
  const [pendiente, setPendiente]     = useState<FormValues | null>(null)
  const [confirmado, setConfirmado]   = useState(false)
  const [codigo, setCodigo]           = useState('')
  const [aviso, setAviso]             = useState('')

  const login         = useAuthStore(s => s.login)
  const refreshTokens = useAuthStore(s => s.refreshTokens)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const selectedRoleData = roles.find(r => r.key === selectedRole)!

  // con el correo confirmado: entra, crea el perfil y renueva la sesion
  // para que el token traiga el grupo estudiante que le puso perfiles
  const terminarRegistro = async (datos: FormValues) => {
    await login({ email: datos.email, password: datos.password })
    await registrarPerfil({
      nombre:       datos.firstName,
      apellido:     datos.lastName,
      anio:         typeof datos.year === 'number' ? datos.year : undefined,
    }).catch((err: any) => {
      // 409 = el perfil ya estaba creado de un intento anterior
      if (err?.response?.status !== 409) throw err
    })
    await refreshTokens()
    router.push(roleRedirect.STUDENT)
  }

  // paso 1: crea la cuenta en Cognito, que manda un codigo al correo
  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    setError('')
    setAviso('')
    try {
      const datos  = { ...data, email: data.email.trim().toLowerCase() }
      const estado = await registrar(datos.email, datos.password)
      setPendiente(datos)
      if (estado === 'sin-confirmar') setAviso('Ya habías empezado el registro. Te enviamos un código nuevo.')
      if (estado === 'confirmada') {
        setConfirmado(true)
        await terminarRegistro(datos)
      }
    } catch (err: any) {
      setError(mensajeDeError(err))
    } finally {
      setLoading(false)
    }
  }

  // paso 2: confirma el codigo y termina el registro
  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendiente) return

    setLoading(true)
    setError('')
    setAviso('')
    try {
      // si fallo despues de confirmar, al reintentar no se confirma de nuevo
      if (!confirmado) {
        await confirmarRegistro(pendiente.email, codigo)
        setConfirmado(true)
      }
      await terminarRegistro(pendiente)
    } catch (err: any) {
      setError(mensajeDeError(err))
    } finally {
      setLoading(false)
    }
  }

  const reenviar = async () => {
    if (!pendiente) return
    setError('')
    setAviso('')
    try {
      await reenviarCodigo(pendiente.email)
      setAviso('Te enviamos un código nuevo.')
    } catch (err: any) {
      setError(err?.message)
    }
  }

  const alerta = error && (
    <div role="alert" className="flex items-center gap-2 bg-error-container rounded-xl px-4 py-3 text-sm">
      <span className="material-symbols-outlined text-[18px] text-error shrink-0" aria-hidden="true">error</span>
      <span className="text-on-error-container">{error}</span>
    </div>
  )

  return (
    <main className="min-h-screen bg-surface flex">

      {/* ── Panel izquierdo ─────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[45%] editorial-gradient flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-on-primary/5" />
        <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-on-primary/5" />

        <Link href="/public/landing" className="flex items-center gap-3">
          <CeibboLogoMark className="w-11 h-11" />
          <span className="text-3xl font-black text-on-primary tracking-tighter font-headline">Ceibbo</span>
        </Link>

        <div>
          <h2 className="text-4xl font-extrabold text-on-primary font-headline leading-tight mb-6">
            El ecosistema de<br />talento técnico.
          </h2>
          <div className="space-y-5 mt-8">
            {roles.map(role => (
              <div key={role.key} className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shrink-0 shadow-md`}>
                  <span className="material-symbols-outlined text-white text-[20px] icon-filled">{role.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-on-primary text-sm">{role.label}</p>
                  <p className="text-on-primary/60 text-xs">{role.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-on-primary/40 text-xs">© {new Date().getFullYear()} Ceibbo</p>
      </div>

      {/* ── Panel derecho ───────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">

          <Link href="/public/landing" className="lg:hidden block text-2xl font-black text-primary tracking-tighter font-headline mb-8">
            Ceibbo
          </Link>

          {/* PASO 1: Elegir rol */}
          {step === 'role' ? (
            <>
              <div className="mb-10">
                <h1 className="text-3xl font-extrabold text-on-surface font-headline mb-2">
                  ¿Cómo quieres registrarte?
                </h1>
                <p className="text-on-surface-variant">
                  Elige el tipo de cuenta que mejor te describe
                </p>
              </div>

              <div className="space-y-4">
                {roles.map(role => (
                  <button
                    key={role.key}
                    onClick={() => { setSelectedRole(role.key); setStep('form') }}
                    className="w-full flex items-center gap-5 p-5 rounded-2xl border-2 border-outline-variant/20 hover:border-primary/40 bg-surface-container-lowest hover:bg-surface-container-low transition-all group text-left"
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                      <span className="material-symbols-outlined text-white text-[28px] icon-filled">{role.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-headline font-bold text-on-surface text-lg group-hover:text-primary transition-colors">{role.label}</p>
                      <p className="text-sm text-on-surface-variant mt-0.5">{role.description}</p>
                    </div>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">chevron_right</span>
                  </button>
                ))}
              </div>

              <p className="text-center text-sm text-on-surface-variant mt-8">
                ¿Ya tienes cuenta?{' '}
                <Link href="/auth/login" className="text-primary font-semibold hover:underline">Inicia sesión</Link>
              </p>
            </>
          ) : (
            /* PASO 2: Formulario */
            <>
              <div className="mb-8">
                <button
                  onClick={() => { setStep('role'); setError('') }}
                  className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-6 group"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform" aria-hidden="true">arrow_back</span>
                  Cambiar tipo de cuenta
                </button>

                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedRoleData.color} flex items-center justify-center shadow-md`}>
                    <span className="material-symbols-outlined text-white text-[22px] icon-filled">{selectedRoleData.icon}</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold text-on-surface font-headline">
                      Crear cuenta {selectedRoleData.label}
                    </h1>
                    <p className="text-sm text-on-surface-variant">Completa tus datos para registrarte</p>
                  </div>
                </div>
              </div>

              {/* Colegios y empresas no se registran solos: no hay rol admin que los verifique */}
              {selectedRole !== 'STUDENT' ? (
                <div className="rounded-xl bg-surface-container-low px-4 py-4 text-sm text-on-surface-variant">
                  Las cuentas de {selectedRole === 'EMPRESA' ? 'empresa' : 'colegio'} las crea el equipo de Ceibbo, para
                  verificar que sean reales. Si ya tienes una,{' '}
                  <Link href="/auth/login" className="text-primary font-semibold hover:underline">inicia sesión</Link>.
                </div>
              ) : pendiente ? (
                /* PASO 3: Codigo del correo */
                <form onSubmit={confirmar} className="space-y-5">
                  {/* ya confirmado solo queda reintentar crear el perfil */}
                  {!confirmado && (
                    <>
                      <p className="text-sm text-on-surface-variant">
                        Te enviamos un código a <span className="font-semibold text-on-surface">{pendiente.email}</span>.
                        Escríbelo para confirmar tu correo.
                      </p>

                      <Input
                        label="Código *"
                        placeholder="123456"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={codigo}
                        onChange={e => setCodigo(e.target.value)}
                      />
                    </>
                  )}

                  {alerta}
                  {aviso && <p className="text-sm text-on-surface-variant">{aviso}</p>}

                  <Button type="submit" fullWidth loading={loading} size="lg" disabled={!confirmado && !codigo.trim()}>
                    {confirmado ? 'Reintentar' : 'Confirmar y entrar'}
                  </Button>

                  {!confirmado && (
                    <button type="button" onClick={reenviar} className="w-full text-sm text-primary font-semibold hover:underline">
                      No me llegó el código, enviarlo de nuevo
                    </button>
                  )}
                </form>
              ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                {selectedRole === 'STUDENT' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Nombre *"
                        placeholder="Matías"
                        error={errors.firstName?.message}
                        {...register('firstName')}
                      />
                      <Input
                        label="Apellido *"
                        placeholder="Arancibia"
                        error={errors.lastName?.message}
                        {...register('lastName')}
                      />
                    </div>
                    {/* la especialidad se elige al editar el perfil, de la lista que configura cada colegio */}
                    <div>
                      <label htmlFor="reg-year" className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5 block">
                        Año cursado
                      </label>
                      <select
                        id="reg-year"
                        className="w-full bg-surface-container-low border border-outline-variant/30 focus:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                        {...register('year')}
                      >
                        <option value="">Seleccionar...</option>
                        {[1, 2, 3, 4].map(y => (
                          <option key={y} value={y}>{y}° año</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <Input
                  label="Email *"
                  type="email"
                  placeholder="tu@email.com"
                  icon="mail"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <PasswordInput
                  label="Contraseña *"
                  placeholder="Mínimo 8 caracteres"
                  error={errors.password?.message}
                  {...register('password')}
                />

                {alerta}

                <Button type="submit" fullWidth loading={loading} size="lg">
                  Crear cuenta como {selectedRoleData.label}
                </Button>

                <p className="text-[11px] text-on-surface-variant text-center">
                  Al crear una cuenta aceptas nuestros Términos de uso y Política de privacidad.
                </p>
              </form>
              )}

              <p className="text-center text-sm text-on-surface-variant mt-6">
                ¿Ya tienes cuenta?{' '}
                <Link href="/auth/login" className="text-primary font-semibold hover:underline">Inicia sesión</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
