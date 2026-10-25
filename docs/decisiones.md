# Registro de decisiones (Ceibbo)

Formato de cada entrada: contexto · decisión · alternativas · consecuencias · fuentes.

## D-01 · Git Flow simple, sin pull request obligatorio  (19-10-2026 · aprobada)

**Contexto:** el equipo trabaja de forma asíncrona y en horarios distintos, con 10 días hasta el Certamen 3. El repositorio es privado y en el plan gratuito de GitHub no se pueden proteger ramas.

**Decisión:**
- Ramas `main` (lo que ve el profesor), `develop` (integración y rama por defecto) y `feature/<ID>-<descripcion>` de 1–2 días.
- El autor integra su rama en `develop` con `git merge --no-ff` y `Closes #N` en el mensaje.
- Solo el Rol 1 integra `develop` en `main`, en los releases.
- La revisión es obligatoria, pero se hace después del merge, como comentario en el commit, dentro de 24 horas.

**Alternativas consideradas:**
- Git Flow completo con ramas `release/*`: demasiado pesado para 3 personas y 10 días.
- Pull request obligatorio: agrega esperas entre horarios distintos y GitHub no puede forzarlo en el plan gratuito.
- Trunk-based (todo en una rama): no separa lo que ve el profesor de lo que está en desarrollo.

**Consecuencias:** menos esperas. El riesgo de romper `develop` se mitiga con pruebas en local antes de integrar, ramas cortas, carpetas separadas por servicio y `git revert` el mismo día.

**Fuentes:** Driessen, V. (2010). *A successful Git branching model*. Atlassian. *Gitflow workflow*.


## D-02 · Servicios en JavaScript (ESM) con node:test

**Fecha:** 24 de octubre de 2026 · **Responsable:** Rol 1

**Contexto.** El plan (B1-03, anexo A.2) proponía la plantilla en TypeScript con Vitest. Cuando se hizo la plantilla, los servicios `perfiles` (Rol 3) y `habilidades` (Rol 2) ya estaban escritos en JavaScript con módulos ES y probados con `node --test`.

**Decisión.** La plantilla `health` y todos los servicios se escriben en JavaScript con módulos ES (archivos `.mjs`) y se prueban con el test runner incluido en Node 22 (`node --test`).

**Alternativas.**
- TypeScript con Vitest, como decía el plan: da tipos y detecta errores antes, pero obligaba a reescribir dos servicios ya avanzados y a configurar la compilación.
- Mezclar lenguajes según el servicio: rompe el propósito de la plantilla, que todos sigan la misma estructura.

**Consecuencias.**
- Los tres servicios comparten estructura, extensión y forma de probar.
- No hay paso de compilación ni dependencias extra para las pruebas.
- Se pierde la verificación de tipos; se compensa con pruebas unitarias del caso de uso y validación de datos en el dominio.

**Fuentes.** Documentación de Node.js 22: `node:test` y módulos ECMAScript.
