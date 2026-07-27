# CONTINUA AQUI

## Prioridad 1: ~~Debuggear modo paciente~~ RESUELTO
Causa raiz: en `robarCartaPaciente()` faltaba resetear `state._pacCartaId = null` antes de llamar `renderCartaPaciente()`. Sin ese reset, el `find` encontraba la carta previa y se saltaba la rama que renderiza la nueva carta. Fix aplicado.

## Prioridad 2: ~~Modal imagen~~ RESUELTO
Fix: `abrirModal()` ahora setea `modal.style.display = "flex"` ademas del `hidden = false`. `initModal()` setea `display: none` al inicio para evitar flashes.

## Prioridad 3: ~~Service Worker~~ RESUELTO
Fix: bump a `mosaico-v8` (despues de un intento fallido con v7), paths de `PRECACHE` y `CRITICAL` corregidos (sin `/` inicial, matching contra `endsWith`), `skipWaiting` movido al install event antes del `waitUntil`, `service-worker.js` agregado a CRITICAL para que vaya por network-first tambien. Despues bump a `mosaico-v9` (filter pacientes blindado) y `mosaico-v10` (sesion habilitada con codigo).

## Mejoras de historial del paciente (julio 2026)
- Boton x por item para borrar entrada individual con confirmacion
- Boton "Exportar mi historial" descarga JSON con todos los datos
- Boton "Vaciar historial" con doble confirmacion
- Decision: Opcion A (paciente anonimo, notas locales, sin backend)

## Sesion habilitada con codigo (julio 2026)
- Cada sesion del terapeuta tiene un codigo de 4 caracteres (visible en la vista de sesion) y un toggle de habilitacion.
- El paciente debe ingresar el codigo para poder robar cartas.
- Solo puede robar mientras la sesion este habilitada.
- El historial del paciente se indexa por sesionId (migrado desde array global a objeto con buckets por sesionId).
- Las cartas que el paciente roba tambien se reflejan en `sesion.cartas` del terapeuta (con flag `desdePaciente: true`).
- El paciente puede desvincularse con un boton arriba.
- Si la sesion es deshabilitada, el paciente ve "Esperando habilitacion" hasta que el terapeuta la reactive.

## Bug reciente (julio 2026)
- Filter pacientes: null addEventListener en SW cacheado (v8). RESUELTO: blindado con `if (filterInput)` en `app.js:533`.

## Proximo pendiente
- Decidir UX del "modo libre" (paciente sin codigo): actualmente siempre pide codigo, quizas permitir robar sin sesion habilitada para uso de diario personal.
- Como ve el paciente las cartas que el terapeuta le asigna? Hoy no las ve. Opciones: A) pasivo (aparecen en su historial sin aviso), B) activo (notificacion en pantalla). Decidir e implementar.
- Sistema de login multi-usuario: reemplazar clave unica por JSON de usuarios (usuario + contrasena), uno por terapeuta
- Subir a Vercel/Netlify para acceso publico via link
- Si el indice funciona, integrar con manual clinico
- Soporte offline completo (verificar que la primera carga precargue todo)
- Testing en celular real

## Tips
- Servir con: `cd app && python -m http.server 8080`
- Probar en incognito (evitar SW cacheado)
- Para forzar refresh: DevTools > Application > Service Workers > Unregister, o hard refresh (Ctrl+Shift+R)
- Para propagar cambios: editar archivos, bumpear `?v=N` en `index.html`, bumpear `CACHE` en `service-worker.js`
