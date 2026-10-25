'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ReadinessScore } from '@/components/ui/ReadinessScore'
import { SkillPill } from '@/components/ui/SkillPill'
import { Button } from '@/components/ui/Button'
import { ProfileImageEditor } from '@/components/shared/ProfileImageEditor'
import { StoryViewerModal, type StoryItem } from '@/components/shared/StoryViewerModal'
import { FollowListModal } from '@/components/ui/FollowListModal'
import { api } from '@/lib/api-client'
import { useAuthStore } from '@/store/auth.store'
import { calculateReadinessScore, timeAgo, mediaUrl } from '@/lib/utils'
import { usePageTitle } from '@/lib/usePageTitle'
import { obtenerPerfilConColegio, aStudentProfile, mensajeDeError, type ConfigColegio } from '@/lib/api/perfiles'
import type { StudentProfile, Publication, Application } from '@/types'

function getTrafficLight(score: number) {
  if (score < 40) return {
    color: 'bg-red-500',
    halo: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]',
    bg: 'bg-red-50 border-red-200 text-red-900',
    title: 'No postulable aún',
    msg: 'Las empresas aún no pueden encontrarte. Completa tu perfil para aparecer en los resultados.',
    btn: null,
  }
  if (score < 80) return {
    color: 'bg-amber-500',
    halo: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]',
    bg: 'bg-amber-50 border-amber-200 text-amber-900',
    title: 'Casi listo',
    msg: 'Vas bien. Te falta poco para que las empresas puedan encontrarte con toda tu información.',
    btn: null,
  }
  return {
    color: 'bg-green-500',
    halo: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]',
    bg: 'bg-green-50 border-green-200 text-green-900',
    title: 'Listo para postular',
    msg: '¡Tu perfil está completo! Ahora las empresas pueden encontrarte. Revisá las ofertas disponibles.',
    btn: { text: 'Ver ofertas', href: '/student/oportunidades' },
  }
}

export default function StudentPerfilPage() {
  const { isAuthenticated, user, logout } = useAuthStore()
  const router = useRouter()
  const [student,      setStudent]      = useState<StudentProfile | null>(null)
  const [colegio,      setColegio]      = useState<ConfigColegio | null>(null)
  const [errorCarga,   setErrorCarga]   = useState('')
  usePageTitle(student ? `${student.firstName} ${student.lastName}` : 'Mi perfil')
  const [publications, setPublications] = useState<Publication[]>([])
  const [highlights,   setHighlights]   = useState<Publication[]>([])
  const [followerCount,  setFollowerCount]  = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [storyViewer, setStoryViewer]   = useState<{ stories: StoryItem[]; index: number } | null>(null)
  const [followModal,  setFollowModal]  = useState<'followers' | 'following' | null>(null)
  const [shareCopied,  setShareCopied]  = useState(false)
  const [acceptedApps, setAcceptedApps] = useState<Application[]>([])

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    Promise.all([
      obtenerPerfilConColegio().catch(err => {
        setErrorCarga(mensajeDeError(err, 'No se pudo cargar tu perfil. Intenta de nuevo.'))
        return null
      }),
      api.get<Publication[]>('/publications/mine?story=false').catch(() => []),
      user?.id ? api.get<Publication[]>(`/publications/pinned/${user.id}`).catch(() => []) : Promise.resolve([]),
      user?.id ? api.get<{ followers: number; following: number }>(`/follows/counts/${user.id}`).catch(() => ({ followers: 0, following: 0 })) : Promise.resolve({ followers: 0, following: 0 }),
    ]).then(([s, pubs, pins, counts]) => {
      setStudent(s ? aStudentProfile(s.perfil, s.colegio) : null)
      setColegio(s?.colegio ?? null)
      setPublications(pubs)
      setHighlights((pins as Publication[]).filter(p => p.isStory))
      setFollowerCount((counts as { followers: number; following: number }).followers)
      setFollowingCount((counts as { followers: number; following: number }).following)
    }).finally(() => setLoading(false))

    api.get<Application[]>('/applications/mine')
      .then(data => {
        const accepted = data.filter(a => a.status === 'ACEPTADO')
        setAcceptedApps(accepted)
      })
      .catch(() => {})
  }, [isAuthenticated, user?.id])

  const openHighlight = (index: number) => {
    const stories: StoryItem[] = highlights.map(h => ({
      id: h.id,
      authorId: h.authorId,
      authorName: h.authorName ?? user?.email ?? 'Yo',
      authorAvatar: h.authorAvatar,
      imageUrl: h.imageUrl,
      content: h.content,
      createdAt: h.createdAt,
      isPinned: h.isPinned,
    }))
    setStoryViewer({ stories, index })
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  const handleHighlightChange = (storyId: string, pinned: boolean) => {
    if (!pinned) {
      // Remove from highlights list if un-pinned
      setHighlights(prev => prev.filter(h => h.id !== storyId))
    }
  }

  const handleHideExperience = async (appId: string) => {
    try {
      await api.patch(`/applications/${appId}/hide-from-profile`, {})
      setAcceptedApps(prev => prev.filter(a => a.id !== appId))
    } catch {
      // silencioso
    }
  }

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="card h-64 animate-pulse mb-6" />
        <div className="card h-48 animate-pulse mb-6" />
        <div className="card h-32 animate-pulse" />
      </main>
    )
  }

  if (!student) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-[64px] text-outline">person_off</span>
          <h2 className="font-headline text-xl font-bold text-on-surface mt-4">Perfil no encontrado</h2>
          <p className="text-on-surface-variant text-sm mt-2">{errorCarga || 'Inicia sesión para ver tu perfil.'}</p>
        </div>
      </main>
    )
  }

  const fullName      = `${student.firstName} ${student.lastName}`
  const breakdown     = calculateReadinessScore(student)
  const technicalSkills = student.skills.filter(s => s.category === 'TECNICA')
  const softSkills      = student.skills.filter(s => s.category === 'BLANDA')
  const trafficLight    = getTrafficLight(student.readinessScore)

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

      {/* Traffic Light Banner */}
      <div className={`mb-6 p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center gap-4 ${trafficLight.bg}`}>
        <div className="shrink-0 flex items-center justify-center p-2 bg-white/50 rounded-full border border-white/40">
          <div className={`w-6 h-6 rounded-full ${trafficLight.color} ${trafficLight.halo} animate-pulse`} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base mb-1">{trafficLight.title}</h3>
          <p className="text-sm opacity-90 leading-relaxed">{trafficLight.msg}</p>
        </div>
        {trafficLight.btn && (
          <Link href={trafficLight.btn.href}
            className="mt-3 sm:mt-0 shrink-0 px-5 py-2.5 bg-white text-green-800 font-bold text-sm rounded-xl shadow-sm hover:bg-green-50 hover:shadow transition-all border border-green-200 flex items-center gap-2">
            {trafficLight.btn.text}
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        )}
      </div>

      {/* Profile Header */}
      <div className="card mb-6 overflow-visible">
        <ProfileImageEditor
          currentAvatar={student.avatar}
          currentCover={student.coverImage}
          fullName={fullName}
        />

        <div className="px-4 sm:px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-2 mb-6">
            <div className="h-8 sm:h-12" />
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button variant="secondary" icon={shareCopied ? 'check' : 'share'} size="sm" onClick={handleShare}>
                {shareCopied ? '¡Copiado!' : 'Compartir'}
              </Button>
              <Link href="/cv">
                <Button variant="secondary" icon="download" size="sm">Exportar CV</Button>
              </Link>
              <Link href="/student/perfil/editar">
                <Button icon="edit" size="sm">Editar perfil</Button>
              </Link>
              <Button
                variant="danger"
                icon="logout"
                size="sm"
                onClick={() => { logout(); router.push('/auth/login') }}
              >
                Cerrar sesión
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h1 className="text-3xl font-bold font-headline text-on-surface">{fullName}</h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary bg-primary-fixed px-2.5 py-1 rounded-full">
                  <span className="material-symbols-outlined text-[11px] icon-filled">verified</span>
                  Verificado
                </span>
              </div>
              <p className="text-on-surface-variant font-semibold mb-1">{student.headline}</p>
              {/* el color lo elige el colegio en su configuracion */}
              {student.schoolName && (
                <div
                  className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700"
                  style={colegio?.colorPrincipal ? { color: colegio.colorPrincipal, borderColor: colegio.colorPrincipal, backgroundColor: `${colegio.colorPrincipal}14` } : undefined}
                >
                  <span className="material-symbols-outlined text-[14px] icon-filled">verified</span>
                  <span className="text-xs font-bold">Avalado por {student.schoolName}</span>
                </div>
              )}
              {colegio?.bienvenida && (
                <p className="mt-2 text-xs text-on-surface-variant">{colegio.bienvenida}</p>
              )}
              <p className="text-sm text-outline flex items-center gap-1.5 flex-wrap">
                {student.location && (
                  <>
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {student.location}
                    <span className="mx-1">·</span>
                  </>
                )}
                <span className="material-symbols-outlined text-[14px]">school</span>
                {[student.schoolName, student.specialty || null, student.year ? `${student.year}° año` : null].filter(Boolean).join(' · ')}
              </p>

              {student.bio && (
                <p className="mt-5 text-sm text-on-surface leading-relaxed max-w-2xl">{student.bio}</p>
              )}

              <div className="flex items-center gap-4 mt-4">
                {student.githubUrl && (
                  <a href={student.githubUrl}
                    className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[16px]">code</span>
                    GitHub
                  </a>
                )}
                {student.linkedinUrl && (
                  <a href={student.linkedinUrl}
                    className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[16px]">link</span>
                    LinkedIn
                  </a>
                )}
              </div>

              <div className="flex items-center gap-6 mt-6 pt-6 border-t border-outline-variant/15 flex-wrap">
                {/* Static stats */}
                {[
                  { icon: 'visibility',  value: student.profileViews ?? 0,      label: 'Vistas del perfil' },
                  { icon: 'psychology',  value: student.skills.length,           label: 'Habilidades' },
                  { icon: 'folder_open', value: student.evidences?.length ?? 0,  label: 'Evidencias' },
                ].map(({ icon, value, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
                    <div>
                      <span className="font-black text-on-surface text-lg leading-none block">{value}</span>
                      <span className="text-[10px] text-outline">{label}</span>
                    </div>
                  </div>
                ))}
                {/* Clickable follow stats */}
                {([
                  { icon: 'group',        value: followerCount,  label: 'Seguidores', mode: 'followers' as const },
                  { icon: 'person_check', value: followingCount, label: 'Siguiendo',  mode: 'following' as const },
                ] as const).map(({ icon, value, label, mode }) => (
                  <button
                    key={label}
                    onClick={() => setFollowModal(mode)}
                    className="flex items-center gap-2 hover:opacity-70 transition-opacity group"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">{icon}</span>
                    <div className="text-left">
                      <span className="font-black text-on-surface text-lg leading-none block group-hover:text-primary transition-colors">{value}</span>
                      <span className="text-[10px] text-outline underline-offset-2 group-hover:underline">{label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface-container-low rounded-xl p-5">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-outline mb-4">
                Índice de empleabilidad
              </h3>
              <ReadinessScore
                score={student.readinessScore}
                breakdown={breakdown}
                size="lg"
                showBreakdown
                showTips
              />
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="card p-5 sm:p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-xl font-bold text-on-surface">Habilidades técnicas</h2>
          <Link href="/student/habilidades">
            <Button variant="ghost" icon="add" size="sm">Agregar</Button>
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          {technicalSkills.length > 0
            ? technicalSkills.map(skill => <SkillPill key={skill.id} skill={skill} showLevel />)
            : <p className="text-sm text-outline">No agregaste habilidades técnicas aún.</p>
          }
        </div>

        {softSkills.length > 0 && (
          <>
            <h3 className="font-semibold text-sm text-on-surface-variant uppercase tracking-wider mb-4">
              Habilidades blandas
            </h3>
            <div className="flex flex-wrap gap-2">
              {softSkills.map(skill => <SkillPill key={skill.id} skill={skill} />)}
            </div>
          </>
        )}
      </div>

      {/* Validaciones pendientes */}
      {student.skills.some(s => s.validationStatus === 'PENDIENTE') && (
        <div className="card p-6 mb-6 border-l-4 border-amber-400">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-[20px] icon-filled">pending_actions</span>
              <h2 className="font-headline font-bold text-on-surface">Validaciones pendientes</h2>
              <span className="bg-amber-100 text-amber-700 text-[11px] font-black px-2 py-0.5 rounded-full">
                {student.skills.filter(s => s.validationStatus === 'PENDIENTE').length}
              </span>
            </div>
            <Link href="/student/habilidades">
              <Button variant="ghost" size="sm" icon="arrow_forward">Ver todas</Button>
            </Link>
          </div>
          <p className="text-sm text-on-surface-variant mb-4">
            Tu colegio tiene estas habilidades pendientes de validación:
          </p>
          <div className="flex flex-wrap gap-2">
            {student.skills
              .filter(s => s.validationStatus === 'PENDIENTE')
              .map(skill => (
                <span key={skill.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[13px] text-amber-500">hourglass_empty</span>
                  {skill.name}
                </span>
              ))
            }
          </div>
        </div>
      )}

      {/* Aceptaciones en oportunidades */}
      {acceptedApps.length > 0 && (
        <section className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-primary text-[20px] icon-filled">work</span>
            <h2 className="font-headline text-xl font-bold text-on-surface">Experiencia en empresas</h2>
          </div>
          <div className="space-y-4">
            {acceptedApps.map(app => (
              <div key={app.id} className="relative flex items-start gap-4 p-5 rounded-2xl border border-outline-variant/25 bg-surface-container-low/40 hover:bg-surface-container-low transition-colors group">
                {/* Logo empresa */}
                <div className="w-11 h-11 rounded-xl bg-primary-container flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">business</span>
                </div>

                {/* Contenido principal */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline font-bold text-on-surface text-base leading-snug">
                    {app.opportunity?.title ?? 'Oportunidad'}
                  </h3>
                  <p className="text-sm text-on-surface-variant font-medium mt-0.5">
                    {app.opportunity?.company?.name ?? ''}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {app.opportunity?.type && (
                      <span className="text-[11px] font-medium text-outline capitalize">
                        {app.opportunity.type.charAt(0) + app.opportunity.type.slice(1).toLowerCase()}
                      </span>
                    )}
                    {app.opportunity?.type && <span className="text-[11px] text-outline-variant">·</span>}
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Aceptado
                    </span>
                  </div>
                </div>

                {/* Botón eliminar */}
                <button
                  onClick={() => handleHideExperience(app.id)}
                  className="shrink-0 p-1.5 rounded-lg text-outline hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100"
                  title="Eliminar de mi perfil"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Highlighted Stories */}
      <div className="card p-5 sm:p-8 mb-6">
        <h2 className="font-headline text-xl font-bold text-on-surface mb-5">Historias destacadas</h2>
        <div className="flex items-start gap-5 overflow-x-auto pb-2 no-scrollbar">
          {/* "Tú" — botón de agregar historia */}
          <div className="flex-none flex flex-col items-center gap-2 w-[72px]">
            <div className="relative w-16 h-16 rounded-full bg-surface-container border-2 border-dashed border-outline-variant/50 flex items-center justify-center overflow-hidden">
              {student.avatar
                ? <img src={mediaUrl(student.avatar)} alt="" className="w-full h-full object-cover opacity-60" />
                : <span className="material-symbols-outlined text-[22px] text-outline">person</span>
              }
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-white">
                <span className="material-symbols-outlined text-[10px] text-on-primary">add</span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-outline text-center">Tú</span>
          </div>

          {highlights.length === 0 ? (
            <div className="flex-1 flex items-center min-h-[72px] pl-2">
              <p className="text-sm text-outline">No hay historias destacadas aún.</p>
            </div>
          ) : (
            highlights.map((h, idx) => (
              <button
                key={h.id}
                onClick={() => openHighlight(idx)}
                className="flex-none flex flex-col items-center gap-2 w-[72px] hover:scale-105 transition-transform"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary bg-surface-container-low ring-2 ring-primary/30">
                  {h.imageUrl ? (
                    <img src={mediaUrl(h.imageUrl)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <span className="material-symbols-outlined text-primary text-[24px]">auto_stories</span>
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-on-surface text-center truncate w-full">
                  {h.title ?? 'Historia'}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Story viewer modal */}
      {storyViewer && (
        <StoryViewerModal
          stories={storyViewer.stories}
          initialIndex={storyViewer.index}
          onClose={() => setStoryViewer(null)}
          onDelete={storyId => setHighlights(prev => prev.filter(h => h.id !== storyId))}
          onHighlight={handleHighlightChange}
        />
      )}

      {/* Followers / Following modal */}
      {followModal && user?.id && (
        <FollowListModal
          userId={user.id}
          mode={followModal}
          onClose={() => setFollowModal(null)}
        />
      )}

      {/* Portfolio */}
      <div className="card p-5 sm:p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-xl font-bold text-on-surface">Portafolio</h2>
          <Link href="/student/portafolio">
            <Button variant="ghost" icon="add" size="sm">Agregar evidencia</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {student.evidences?.length > 0
            ? student.evidences.map(ev => (
                <div key={ev.id} className="group rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors overflow-hidden cursor-pointer">
                  <div className="aspect-video bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center overflow-hidden">
                    {ev.imageUrl
                      ? <img src={mediaUrl(ev.imageUrl)} className="w-full h-full object-cover" alt={ev.title} />
                      : <span className="material-symbols-outlined text-[40px] text-outline icon-filled">
                          {ev.type === 'PROYECTO' ? 'code' : ev.type === 'CERTIFICADO' ? 'workspace_premium' : 'image'}
                        </span>
                    }
                  </div>
                  <div className="p-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-outline mb-1 block">
                      {ev.type.charAt(0) + ev.type.slice(1).toLowerCase()}
                    </span>
                    <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors leading-tight">
                      {ev.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{ev.description}</p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {ev.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            : (
                <div className="md:col-span-3 flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-outline-variant/30">
                  <span className="material-symbols-outlined text-[48px] text-outline">folder_open</span>
                  <p className="mt-3 text-sm font-semibold text-outline">Agrega tus primeras evidencias</p>
                  <p className="text-xs text-outline mt-1">Proyectos, certificados, fotos de trabajo...</p>
                </div>
              )
          }
        </div>
      </div>

      {/* My Publications — always visible */}
      <div className="card p-5 sm:p-8 mb-6">
        <h2 className="font-headline text-xl font-bold text-on-surface mb-6">Publicaciones</h2>
        {publications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-outline-variant/30">
            <span className="material-symbols-outlined text-[48px] text-outline">feed</span>
            <p className="mt-3 text-sm font-semibold text-outline">Sin publicaciones aún</p>
            <p className="text-xs text-outline mt-1">Lo que publiques en el muro aparecerá aquí</p>
          </div>
        ) : (
          <div className="space-y-4">
            {publications.map(pub => (
              <div key={pub.id} className="flex gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                {pub.imageUrl && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-surface-container">
                    <img src={mediaUrl(pub.imageUrl)} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {pub.title && <h4 className="font-bold text-on-surface text-sm mb-1">{pub.title}</h4>}
                  {pub.content && (
                    <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">{pub.content}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-outline">
                    <span>{timeAgo(pub.createdAt)}</span>
                    <span>·</span>
                    <span>{pub.likes} me gusta</span>
                    <span>·</span>
                    <span>{pub.views} vistas</span>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm('¿Eliminar esta publicación?')) return
                    try {
                      await api.delete(`/publications/${pub.id}`)
                      setPublications(prev => prev.filter(p => p.id !== pub.id))
                    } catch { /* silencioso */ }
                  }}
                  className="shrink-0 p-1.5 text-outline hover:text-error hover:bg-error/5 rounded-md transition-colors self-start"
                  title="Eliminar"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
