# Servicio habilidades

Implementa CU-03/CU-08 con escritura condicional para evitar duplicados y publicación del evento `HabilidadValidada` en SQS.

```powershell
npm.cmd test
npm.cmd run typecheck
npx.cmd serverless deploy --stage rol2
```

Rutas: `POST /habilidades`, `GET /habilidades/me`, `GET /habilidades/pendientes` y `PATCH /habilidades/{estudianteId}/{habilidadId}`.
