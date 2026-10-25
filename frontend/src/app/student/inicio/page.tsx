'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { ReadinessScore } from '@/components/ui/ReadinessScore'
import { SkillList } from '@/components/ui/SkillPill'
import { FeedSection } from '@/components/shared/FeedSection'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { calculateReadinessScore } from '@/lib/utils'
import type { StudentProfile, Opportunity } from '@/types'
import { usePageTitle } from '@/lib/usePageTitle'
import { obtenerPerfilConColegio, aStudentProfile } from '@/lib/api/perfiles'

export default function StudentInicioPage() {
  usePageTitle('Inicio')
  const { user, isAuthenticated } = useAuthStore()
  const [profile, setProfile]           = useState<StudentProfile | null>(null)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      Promise.all([
        obtenerPerfilConColegio().then(r => aStudentProfile(r.perfil, r.colegio)).catch(() => null),
        api.get<{ data: Opportunity[] } | Opportunity[]>('/opportunities/for-me').catch(() => ({ data: [] })),
      ]).then(([p, oppsRes]) => {
        setProfile(p)
        const oppsArr = Array.isArray(oppsRes) ? oppsRes : (oppsRes as any)?.data ?? []
        setOpportunities(oppsArr.slice(0, 2))
      }).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const breakdown = profile ? calculateReadinessScore(profile) : null

  if (loading) {
    return (
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <aside className="md:col-span-3">
            <div className="card h-64 animate-pulse" />
          </aside>
          <div className="md:col-span-6">
            <div className="card h-32 animate-pulse mb-6" />
            <div className="card h-48 animate-pulse" />
          </div>
          <aside className="md:col-span-3">
            <div className="card h-48 animate-pulse" />
          </aside>
        </div>
      </main>
    )
  }

  const fullName  = profile ? `${profile.firstName} ${profile.lastName}` : (user?.email ?? 'Yo')
  const avatar    = profile?.avatar
  const headline  = profile?.headline ?? ''
  const specialty = profile?.specialty ?? ''
  const score     = profile?.readinessScore ?? 0
  const skills    = profile?.skills ?? []

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

        {/* ── Left Sidebar ────────────────────────────────────────────── */}
        <aside className="md:col-span-3 space-y-6 md:sticky md:top-24">

          <div className="card">
            <div className="h-20 editorial-gradient" />
            <div className="px-6 pb-6 -mt-10">
              <Avatar src={avatar} name={fullName} size="xl" shape="rounded"
                className="border-4 border-surface-container-lowest mb-4" />
              <h2 className="text-xl font-bold font-headline text-on-surface leading-tight">{fullName}</h2>
              <p className="text-on-surface-variant text-sm mt-0.5 mb-4">{headline}</p>
              <p className="text-xs font-semibold text-outline uppercase tracking-widest">{specialty}</p>

              <div className="space-y-3 pt-5 mt-5 border-t border-outline-variant/15">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Vistas del perfil</span>
                  <span className="font-bold text-primary">{profile?.profileViews ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant">Habilidades</span>
                  <span className="font-bold text-primary">{skills.length}</span>
                </div>
              </div>

              <Link href="/student/perfil"
                className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Editar mi perfil
              </Link>
            </div>
          </div>

          {breakdown && (
            <div className="card p-6">
              <h3 className="font-headline font-bold text-[11px] uppercase tracking-widest text-outline mb-5">
                Índice de empleabilidad
              </h3>
              <ReadinessScore score={score} breakdown={breakdown} size="md" showBreakdown />
              <Link href="/student/perfil"
                className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-md text-xs font-bold bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                Mejorar mi score
              </Link>
            </div>
          )}

          <div className="card p-6">
            <h3 className="font-headline font-bold text-[11px] uppercase tracking-widest text-outline mb-5">
              Próximos eventos
            </h3>
            <p className="text-xs text-outline">No hay eventos próximos.</p>
          </div>
        </aside>

        {/* ── Center Feed ─────────────────────────────────────────────── */}
        <div className="md:col-span-6">
          <FeedSection
            selfAvatar={avatar}
            selfName={fullName}
            selfLabel="Tú"
            postPlaceholder="¿Qué quieres compartir hoy?"
            skillTags={skills.map(s => s.name.toLowerCase())}
            postActions={[
              { icon: 'image',              label: 'Foto' },
              { icon: 'folder_open',        label: 'Evidencia' },
              { icon: 'workspace_premium',  label: 'Logro' },
            ]}
          />
        </div>

        {/* ── Right Sidebar ────────────────────────────────────────────── */}
        <aside className="md:col-span-3 space-y-6 md:sticky md:top-24">

          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-headline font-bold text-[11px] uppercase tracking-widest text-outline">
                Oportunidades
              </h3>
              <Link href="/student/oportunidades" className="text-[11px] font-bold text-primary hover:underline">
                Ver todas
              </Link>
            </div>
            {opportunities.length === 0 ? (
              <p className="text-xs text-outline">No hay oportunidades disponibles.</p>
            ) : (
              <div className="space-y-4">
                {opportunities.map((opp) => (
                  <div key={opp.id}
                    className="group cursor-pointer p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-[18px]">business</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                          {opp.title}
                        </h4>
                        <p className="text-xs text-on-surface-variant">{opp.company.name}</p>
                        {opp.matchScore && (
                          <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-primary">
                            {opp.matchScore}% match
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-headline font-bold text-[11px] uppercase tracking-widest text-outline">
                Mis habilidades
              </h3>
              <Link href="/student/habilidades" className="text-[11px] font-bold text-primary hover:underline">
                Gestionar
              </Link>
            </div>
            {skills.length === 0 ? (
              <p className="text-xs text-outline">Agrega tus primeras habilidades.</p>
            ) : (
              <SkillList skills={skills} maxVisible={6} />
            )}
          </div>

          <p className="text-[10px] text-outline text-center px-2 leading-relaxed">
            Ceibbo · Privacidad · Términos · Ayuda
          </p>
        </aside>
      </div>
    </main>
  )
}
