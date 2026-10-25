'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input, PasswordInput } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { CeibboLogoMark } from '@/components/ui/CeibboLogoMark'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import { usePageTitle } from '@/lib/usePageTitle'

type Role = 'STUDENT' | 'EMPRESA' | 'COLEGIO'

const schema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormValues = z.infer<typeof schema>

const roleRedirect: Record<Role, string> = {
  STUDENT: '/student/inicio',
  EMPRESA: '/empresa/inicio',
  COLEGIO: '/colegio/inicio',
}

const roles = [
  {
    key:         'STUDENT' as Role,
    label:       'Estudiante',
    description: 'Accede a tu perfil, habilidades y oportunidades',
    icon:        'school',
    color:       'from-blue-500 to-indigo-600',
  },
  {
    key:         'EMPRESA' as Role,
    label:       'Empresa',
    description: 'Gestiona ofertas y encuentra el talento técnico',
    icon:        'business',
    color:       'from-violet-500 to-purple-700',
  },
  {
    key:         'COLEGIO' as Role,
    label:       'Colegio',
    description: 'Administra estudiantes y validaciones',
    icon:        'account_balance',
    color:       'from-emerald-500 to-teal-700',
  },
]

export default function LoginPage() {
  usePageTitle('Iniciar sesión')
  const router = useRouter()
  const login  = useAuthStore(s => s.login)

  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const selectRole = (role: typeof roles[0]) => {
    setSelectedRole(role.key)
    setError('')
  }

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    setError('')
    try {
      await login({ email: data.email, password: data.password })
      const role = useAuthStore.getState().user?.role as Role
      router.push(roleRedirect[role] ?? '/student/inicio')
    } catch (err: any) {
      setError(err?.message ?? 'Credenciales incorrectas. Verificá tu email y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  const selectedRoleData = roles.find(r => r.key === selectedRole)

  return (
    <main className="min-h-screen bg-surface flex">

      {/* ── Panel izquierdo ────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[45%] editorial-gradient flex-col justify-between p-16 relative overflow-hidden">
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-on-primary/5" />
        <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-on-primary/5" />

        <Link href="/public/landing" className="flex items-center gap-3">
          <CeibboLogoMark className="w-11 h-11" />
          <span className="text-3xl font-black text-on-primary tracking-tighter font-headline">Ceibbo</span>
        </Link>

        <div>
          <h2 className="text-4xl font-extrabold text-on-primary font-headline leading-tight mb-6">
            Tu carrera técnica<br />empieza con tu perfil.
          </h2>
          <p className="text-on-primary/70 text-lg leading-relaxed max-w-sm">
            Conectamos estudiantes técnicos, colegios y empresas en una sola plataforma.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6">
            {[
              { value: '50', label: 'Estudiantes activos' },
              { value: '10', label: 'Empresas conectadas' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-on-primary/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-extrabold text-on-primary font-headline">{value}</div>
                <div className="text-xs font-semibold text-on-primary/60 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-on-primary/40 text-xs">© {new Date().getFullYear()} Ceibbo</p>
      </div>

      {/* ── Panel derecho ──────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          <Link href="/public/landing" className="lg:hidden block text-2xl font-black text-primary tracking-tighter font-headline mb-8">
            Ceibbo
          </Link>

          {/* ── PASO 1: Seleccionar rol ────────────────────────────── */}
          {!selectedRole ? (
            <>
              <div className="mb-10">
                <h1 className="text-3xl font-extrabold text-on-surface font-headline mb-2">
                  ¿Cómo quieres ingresar?
                </h1>
                <p className="text-on-surface-variant">
                  Selecciona tu tipo de cuenta para continuar
                </p>
              </div>

              <div className="space-y-4">
                {roles.map((role) => (
                  <button
                    key={role.key}
                    onClick={() => selectRole(role)}
                    className="w-full flex items-center gap-5 p-5 rounded-2xl border-2 border-outline-variant/20 hover:border-primary/40 bg-surface-container-lowest hover:bg-surface-container-low transition-all group text-left"
                  >
                    <span className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                      <span className="material-symbols-outlined text-white text-[28px] icon-filled">
                        {role.icon}
                      </span>
                    </span>
                    <span className="flex-1 block">
                      <span className="font-headline font-bold text-on-surface text-lg group-hover:text-primary transition-colors block">
                        {role.label}
                      </span>
                      <span className="text-sm text-on-surface-variant mt-0.5 block">{role.description}</span>
                    </span>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">
                      chevron_right
                    </span>
                  </button>
                ))}
              </div>

              <p className="text-center text-sm text-on-surface-variant mt-8">
                ¿No tienes cuenta?{' '}
                <Link href="/auth/register" className="text-primary font-semibold hover:underline">
                  Regístrate aquí
                </Link>
              </p>
            </>
          ) : (
            /* ── PASO 2: Formulario de login ──────────────────────── */
            <>
              {/* Header con rol seleccionado */}
              <div className="mb-8">
                <button
                  onClick={() => { setSelectedRole(null); setError('') }}
                  className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors mb-6 group"
                >
                  <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform" aria-hidden="true">arrow_back</span>
                  Cambiar tipo de cuenta
                </button>

                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedRoleData!.color} flex items-center justify-center shadow-md`}>
                    <span className="material-symbols-outlined text-white text-[22px] icon-filled">
                      {selectedRoleData!.icon}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold text-on-surface font-headline">
                      Ingreso {selectedRoleData!.label}
                    </h1>
                    <p className="text-sm text-on-surface-variant">
                      Inicia sesión con tus credenciales
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                  label="Email"
                  type="email"
                  placeholder="tu@email.com"
                  icon="mail"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <PasswordInput
                  label="Contraseña"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />

                {error && (
                  <div role="alert" className="flex items-center gap-2 bg-error-container rounded-xl px-4 py-3 text-sm">
                    <span className="material-symbols-outlined text-[18px] text-error shrink-0" aria-hidden="true">error</span>
                    <span className="text-on-error-container">{error}</span>
                  </div>
                )}

                <Button type="submit" fullWidth loading={loading} size="lg">
                  Iniciar sesión como {selectedRoleData!.label}
                </Button>
              </form>

              <p className="text-center text-sm text-on-surface-variant mt-6">
                ¿No tienes cuenta?{' '}
                <Link href="/auth/register" className="text-primary font-semibold hover:underline">
                  Regístrate aquí
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
