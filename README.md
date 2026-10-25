# Ceibbo

> La red profesional para talento técnico-profesional. Conecta estudiantes, colegios y empresas.

---

## Descripción general

**Ceibbo** es una plataforma web inspirada en LinkedIn, diseñada específicamente para el ecosistema de colegios técnico-profesionales chilenos. Permite que estudiantes construyan una identidad profesional temprana, muestren sus habilidades y proyectos, reciban validaciones institucionales y postulen a oportunidades laborales.

---

## Objetivo de la plataforma

Democratizar el acceso al empleo técnico conectando tres actores clave:

1. **Estudiantes** — Construyen perfil profesional, registran habilidades, suben evidencias de proyectos, postulan a prácticas y trabajos.
2. **Empresas** — Buscan talento técnico por especialidad y habilidades, publican ofertas, contactan directamente a candidatos.
3. **Colegio** — Valida competencias, gestiona estudiantes, publica contenido institucional, carga estudiantes masivamente.

---

## Stack tecnológico

### Frontend
| Tecnología | Versión | Rol |
|---|---|---|
| Next.js | 14 | Framework React con App Router |
| React | 18 | UI library |
| TypeScript | 5 | Tipado estático |
| Tailwind CSS | 3 | Sistema de diseño utilitario |
| Zustand | 4 | Estado global (auth) |
| React Hook Form | 7 | Formularios |
| Zod | 3 | Validación de esquemas |
| Axios | 1 | Cliente HTTP con interceptores JWT |

### Backend
| Tecnología | Versión | Rol |
|---|---|---|
| NestJS | 10 | Framework Node.js modular |
| TypeScript | 5 | Tipado estático |
| PostgreSQL | 15+ | Base de datos relacional |
| TypeORM | 0.3 | ORM para entidades y migraciones |
| Passport + JWT | — | Autenticación con access + refresh tokens |
| Swagger / OpenAPI | 7 | Documentación automática de la API |
| bcrypt | 5 | Hash de contraseñas |
| class-validator | 0.14 | Validación de DTOs |

---

## Estructura del proyecto

```
red-talento-tp/
├── frontend/                          # Next.js App
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout
│   │   │   ├── page.tsx               # Redirect a landing
│   │   │   ├── public/landing/        # Landing page pública
│   │   │   ├── auth/
│   │   │   │   ├── login/             # Inicio de sesión
│   │   │   │   └── register/          # Crear cuenta
│   │   │   ├── student/               # Módulo estudiante
│   │   │   │   ├── layout.tsx         # Layout con StudentNav
│   │   │   │   ├── inicio/            # Dashboard estudiante
│   │   │   │   ├── perfil/            # Perfil profesional
│   │   │   │   ├── habilidades/       # Gestión de skills
│   │   │   │   ├── oportunidades/     # Explorar ofertas + match
│   │   │   │   ├── postulaciones/     # Mis postulaciones + pipeline
│   │   │   │   └── mensajes/          # Chat interno
│   │   │   ├── empresa/               # Módulo empresa
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── inicio/            # Dashboard empresa
│   │   │   │   ├── perfil/            # Perfil empresa
│   │   │   │   ├── ofertas/           # Gestión de ofertas
│   │   │   │   ├── buscar-estudiantes/# Búsqueda con filtros
│   │   │   │   ├── postulantes/       # Lista de candidatos
│   │   │   │   └── mensajes/
│   │   │   └── colegio/               # Módulo colegio
│   │   │       ├── layout.tsx
│   │   │       ├── inicio/            # Dashboard colegio
│   │   │       ├── perfil/
│   │   │       ├── estudiantes/       # Tabla de gestión
│   │   │       ├── validaciones/      # Validar habilidades
│   │   │       ├── publicaciones/     # Feed institucional
│   │   │       ├── mensajes/
│   │   │       └── carga-masiva/      # Import CSV/XLSX
│   │   ├── components/
│   │   │   ├── ui/                    # Átomos reutilizables
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Avatar.tsx
│   │   │   │   ├── ReadinessScore.tsx # SVG ring + breakdown
│   │   │   │   └── SkillPill.tsx
│   │   │   ├── layout/                # Navegaciones por rol
│   │   │   │   ├── StudentNav.tsx
│   │   │   │   ├── EmpresaNav.tsx
│   │   │   │   └── ColegioNav.tsx
│   │   │   └── shared/                # Tarjetas compuestas
│   │   │       ├── OpportunityCard.tsx
│   │   │       └── PublicationCard.tsx
│   │   ├── lib/
│   │   │   ├── api-client.ts          # Axios + JWT interceptors
│   │   │   ├── mock-data.ts           # Datos mock realistas
│   │   │   └── utils.ts               # cn(), scores, formatters
│   │   ├── store/
│   │   │   └── auth.store.ts          # Zustand persist store
│   │   ├── types/
│   │   │   └── index.ts               # 25+ interfaces TypeScript
│   │   └── styles/
│   │       └── globals.css            # Design system CSS
│   ├── tailwind.config.ts             # Tokens del design system
│   ├── next.config.ts
│   └── package.json
│
└── backend/                           # NestJS API
    ├── src/
    │   ├── main.ts                    # Bootstrap + Swagger
    │   ├── app.module.ts              # Root module
    │   ├── config/
    │   │   ├── app.config.ts
    │   │   └── database.config.ts
    │   ├── auth/                      # JWT + Roles
    │   │   ├── auth.module.ts
    │   │   ├── auth.service.ts
    │   │   ├── auth.controller.ts
    │   │   ├── dto/auth.dto.ts
    │   │   ├── strategies/            # jwt + jwt-refresh
    │   │   ├── guards/                # JwtAuthGuard + RolesGuard
    │   │   └── decorators/            # @CurrentUser, @Roles, @Public
    │   ├── users/                     # User entity base
    │   ├── students/                  # StudentProfile + evidencias
    │   ├── companies/                 # CompanyProfile
    │   ├── schools/                   # SchoolProfile
    │   ├── skills/                    # Skills + validaciones
    │   ├── opportunities/             # Ofertas + match score
    │   ├── applications/              # Postulaciones
    │   ├── messages/                  # Mensajería interna
    │   └── publications/              # Feed + historias
    ├── tsconfig.json
    └── package.json
```

---

## Instalación

### Requisitos previos
- Node.js >= 18
- npm >= 9
- PostgreSQL >= 14

### 1. Clonar / descomprimir el proyecto

```bash
cd red-talento-tp
```

### 2. Instalar dependencias del frontend

```bash
cd frontend
npm install
```

### 3. Instalar dependencias del backend

```bash
cd ../backend
npm install
```

---

## Variables de entorno

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Backend — `backend/.env`

```env
# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=red_talento_tp

# JWT
JWT_SECRET=cambia-esto-en-produccion-secret-largo
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=cambia-esto-refresh-secret-largo
JWT_REFRESH_EXPIRES=7d
```

---

## Base de datos

```sql
-- Crear base de datos en PostgreSQL
CREATE DATABASE red_talento_tp;
```

El backend usa `synchronize: true` en desarrollo, por lo que las tablas se crean automáticamente al iniciar.

---

## Probar en local (DynamoDB en Docker)

Permite probar los servicios contra una base DynamoDB local, sin gastar el Learner Lab ni necesitar credenciales de AWS.

**Requisitos:** Docker Desktop abierto y Node.js 22.

```bash
npm install              # solo la primera vez, en la raíz del repo
npm run local:up         # levanta DynamoDB Local, crea la tabla y carga datos de prueba
npm run local:verificar  # comprueba la configuración del colegio y los estudiantes
npm run local:down       # apaga el contenedor (los datos se borran: es en memoria)
```

- DynamoDB Local queda en `http://localhost:8000`, con la tabla `ceibbo-app-local`.
- El esquema (`PK`, `SK` y el índice `GSI1`) es el mismo que `infra/shared`. Si cambia uno, hay que cambiar el otro (`scripts/local/crear-tabla.mjs`).
- Los datos de prueba están en `scripts/local/seed.mjs` y usan los mismos nombres e IDs que `frontend/src/lib/mock-data.ts`.

Para que un servicio use la base local, define estas variables. DynamoDB Local exige credenciales, pero no tienen que ser reales:

```bash
DYNAMO_ENDPOINT=http://localhost:8000
TABLE_NAME=ceibbo-app-local
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
```

---

## Cómo ejecutar

### Frontend (desarrollo)

```bash
cd frontend
npm run dev
# → http://localhost:3000
```

### Backend (desarrollo)

```bash
cd backend
npm run start:dev
# → http://localhost:3001/api
# → Swagger: http://localhost:3001/api/docs
```

### Cuentas demo (frontend)

Sin backend conectado, el login demo funciona con estos correos:

| Rol | Email | Contraseña |
|---|---|---|
| Estudiante | matias@colegio.cl | demo123 |
| Empresa | rrhh@techcorp.cl | demo123 |
| Colegio | admin@itm.cl | demo123 |

---

## Arquitectura general

```
Browser
  └── Next.js (App Router)
        ├── Páginas por rol (student / empresa / colegio)
        ├── Layouts con navegación glassmorphism
        ├── Componentes UI reutilizables (Tailwind)
        └── Zustand store (auth)
              │
              │  HTTP / REST
              ▼
         NestJS API (:3001)
              ├── JwtAuthGuard (Passport)
              ├── RolesGuard
              ├── ValidationPipe (class-validator)
              └── Módulos: auth, students, companies,
                  schools, skills, opportunities,
                  applications, messages, publications
                        │
                        │  TypeORM
                        ▼
                   PostgreSQL
```

---

## Sistema de diseño — Ultramarine Editorial

El diseño sigue el sistema **"The Modern Authority"**:

- **Color principal:** `#0056D2` (Deep Blue)
- **Tipografía display:** Plus Jakarta Sans (headings, títulos)
- **Tipografía cuerpo:** Inter (body, labels)
- **Superficies:** jerarquía por tonos (`surface-container-lowest` → `surface-container-highest`)
- **Sin bordes de 1px:** separación solo por cambio tonal
- **Glassmorphism:** navegación con `backdrop-blur: 20px`
- **Sombras:** tintadas con azul profundo `rgba(0,24,71,0.08)`

---

## Módulos implementados

### Frontend
| Módulo | Páginas | Estado |
|---|---|---|
| Landing pública | 1 | ✅ Completo |
| Autenticación | Login, Register | ✅ Completo |
| Estudiante | Inicio, Perfil, Habilidades, Oportunidades, Postulaciones, Mensajes | ✅ Completo |
| Empresa | Inicio, Perfil, Ofertas, Buscar Talento, Postulantes, Mensajes | ✅ Completo |
| Colegio | Inicio, Perfil, Estudiantes, Validaciones, Publicaciones, Mensajes, Carga Masiva | ✅ Completo |

### Backend
| Módulo | Endpoints | Estado |
|---|---|---|
| Auth | register, login, refresh, me | ✅ Completo |
| Students | CRUD perfil, search, evidencias | ✅ Completo |
| Companies | CRUD perfil | ✅ Completo |
| Schools | CRUD perfil | ✅ Completo |
| Skills | agregar, eliminar, validar | ✅ Completo |
| Opportunities | CRUD + match score | ✅ Completo |
| Applications | postular, listar, cambiar estado | ✅ Completo |
| Messages | enviar, conversaciones, hilos | ✅ Completo |
| Publications | feed, historias, likes | ✅ Completo |
| Media | upload de imágenes (avatar, cover, evidencia, publicación) | ✅ Completo |
| Follows | seguir/dejar de seguir, conteos | ✅ Completo |

---

## Funcionalidades diferenciales

### Índice de Empleabilidad (Readiness Score)
Calcula un puntaje 0–100 basado en 4 dimensiones (25 pts c/u):
- Completitud del perfil
- Cantidad de habilidades
- Habilidades validadas por el colegio
- Evidencias de portafolio

### Match de Compatibilidad
Al listar oportunidades para un estudiante, el backend calcula automáticamente qué porcentaje de las habilidades requeridas posee el candidato.

### Validación Institucional
El colegio puede validar/rechazar habilidades de los estudiantes. Las habilidades validadas tienen badge visual diferenciado y aumentan el readiness score.

### Portafolio Visual
Sección de evidencias por tipo: proyectos, certificados, fotos, descripciones. Con galería en grid y tags.

---

## Estado actual del desarrollo

- ✅ Base técnica completa (frontend + backend)
- ✅ Sistema de autenticación con JWT + refresh tokens
- ✅ Todos los módulos con servicio, controlador y entidad
- ✅ Datos mock funcionales para desarrollo frontend
- ✅ Design system implementado fielmente desde mockups
- ✅ Rutas protegidas por rol
- ✅ Upload de archivos (Multer, almacenamiento local) para avatares, covers, evidencias y publicaciones
- ⏳ WebSockets para mensajería en tiempo real (próximo paso)
- ⏳ Tests unitarios e integración
- ⏳ Docker Compose para desarrollo local
- ⏳ CI/CD pipeline

---

## Próximos pasos

1. **WebSockets** — mensajería en tiempo real con `@nestjs/websockets`
2. **Notificaciones** — sistema de notificaciones in-app
3. **Carga masiva real** — parser CSV/XLSX en el backend con validación y reporte de errores
4. **Tests** — Jest para servicios, Supertest para e2e
5. **Docker Compose** — levantar PostgreSQL + backend + frontend con un solo comando
6. **Despliegue** — configuración para Vercel (frontend) + Railway/Render (backend)

---

## Decisiones técnicas

### Next.js App Router
Se eligió App Router sobre Pages Router para aprovechar Server Components, layouts anidados por rol, y mejor SEO. Cada rol tiene su propio layout con navegación dedicada.

### Zustand sobre Redux
Menor boilerplate, API más simple, y suficiente para el estado global de auth. Se usa `persist` middleware para mantener sesión entre recargas.

### TypeORM `synchronize: true` en desarrollo
Elimina la fricción inicial en desarrollo. En producción se usarán migraciones versionadas.

### Roles en JWT payload
El rol del usuario viaja en el JWT para que el `RolesGuard` no necesite consultar la base de datos en cada request.

### Mock data separada del store
`lib/mock-data.ts` funciona como capa de datos independiente que puede reemplazarse por calls reales a la API sin tocar los componentes.

---

## Autor

Desarrollado con ❤️ para el ecosistema de colegios técnico-profesionales de Chile.
