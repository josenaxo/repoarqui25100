# Servicio `perfiles`

Perfiles de estudiantes, empresas y colegios, y la configuración de cada colegio (logo, color principal y texto de bienvenida). Cubre CU-01 (registro), CU-02 (perfil) y la personalización por colegio.

- **Responsable:** Rol 3
- **Contrato:** [`contracts/api/perfiles.yaml`](../../contracts/api/perfiles.yaml)
- **Modelo de datos:** [`docs/datos/perfiles.md`](../../docs/datos/perfiles.md)

## Rutas

Todas exigen el access token de Cognito (`Authorization: Bearer <token>`).

| Ruta | Qué hace | Quién puede |
|---|---|---|
| `POST /perfiles` | Crea el perfil de estudiante y lo agrega al grupo `estudiante` | Usuario nuevo (no colegio ni empresa) |
| `GET /perfiles/me` | Devuelve el perfil del usuario | Cualquier usuario autenticado |
| `PUT /perfiles/me` | Edita los campos permitidos del perfil | Cualquier usuario autenticado |
| `GET /colegios` | Lista los colegios (selector del estudiante) | Cualquier usuario autenticado |
| `GET /colegios/{id}/config` | Datos y personalización de un colegio | Cualquier usuario autenticado |
| `PUT /colegios/{id}/config` | Edita la configuración del colegio | Solo el usuario de ese colegio |
| `GET /colegios/{id}/estudiantes` | Estudiantes del colegio, con total y score promedio | Solo el usuario de ese colegio |

Errores: 400 datos inválidos, 401 sin token, 403 sin permiso, 404 no existe, 409 el perfil ya existe.

## Estructura (arquitectura hexagonal)

```
src/domain/        reglas del negocio (Perfil, ConfigColegio), sin AWS
src/application/   un caso de uso por archivo
src/ports/         lo que necesitan los casos de uso (repositorio e identidad)
src/adapters/in/   handler HTTP de la Lambda
src/adapters/out/  DynamoDB y Cognito
test/              pruebas unitarias con dobles en memoria
test/integracion/  prueba del adaptador contra DynamoDB Local
```

## Probar en local

```bash
cd services/perfiles
npm install
npm test                    # pruebas unitarias, no necesita Docker ni AWS
```

Para la prueba de integración hay que levantar DynamoDB Local desde la raíz del repo:

```bash
npm run local:up            # en la raíz
cd services/perfiles
npm run test:integracion    # crea la tabla, carga el seed y prueba el adaptador
```

## Desplegar en la cuenta propia

Requisitos: sesión del Learner Lab activa (`aws sts get-caller-identity` funciona), `serverless login` hecho e `infra/shared` desplegado **en el mismo stage**.

```bash
cd services/perfiles
serverless deploy --stage rol3
```

Para probar una ruta con un token de prueba (`scripts/aws/token.sh`, tarea B1-17):

```bash
curl -H "Authorization: Bearer $TOKEN" <HttpApiUrl>/perfiles/me
```

## Decisiones y patrones

- **Arquitectura hexagonal:** los casos de uso reciben los puertos como parámetro, por eso se prueban sin AWS.
- **Lista blanca de campos:** cada tipo de perfil solo puede editar sus campos. `readinessScore` y `profileViews` no se editan.
- **Escrituras condicionales:** crear con `attribute_not_exists` (409 si ya existe) y editar con `attribute_exists` (404 si no existe).
- **Registro idempotente:** agregar al grupo y crear el perfil se pueden reintentar sin dejar datos inconsistentes.
- **Autorización por dueño:** para administrar un colegio se revisa el grupo del token y el `colegioId` del perfil.
- **Sin Scan:** las listas usan Query sobre el índice `GSI1`.
- **Se escriben solo los campos que cambian**, para no pisar el `readinessScore` si otro proceso lo actualiza.

## Pendiente para la fase 2

- Cache-Aside para la configuración del colegio y preferencias del usuario (F2-16).
- Cálculo del `readinessScore` a partir de eventos de otros servicios.
- Búsqueda de talento para empresas y dashboard combinado del colegio.
- Rol administrador para aprobar colegios y empresas (diseño de seguridad, F2-06).
- Probar el adaptador de Cognito al desplegar en `rol3`.
