# PROYECTO MOSAICO - Estado del Proyecto
Ultima actualizacion: Julio 2026

> **Firebase migration: COMPLETADA.** Auth (email/password) + Firestore sync.
> Proximo paso: deploy a Netlify para acceso publico via link.

## Para iniciar nuevo chat
Deci: "Soy el usuario del Proyecto MOSAICO. Lee PROJECT_STATE.md y CONTINUA.md para continuar."

---

## Estructura
- `app/` - PWA completa (HTML+CSS+JS+SW+manifest)
- `app/index.html` - templates + markup
- `app/app.js` - toda la logica (~1500 lineas)
- `app/firebase-service.js` - CRUD contra Firestore (colecciones pacientes, historial)
- `app/styles.css` - estilos (~600 lineas)
- `app/service-worker.js` - SW v13 (network-first para JS/CSS/HTML/SW)
- `app/data/` - 13 archivos JSON con cartas
- `app/assets/img/1/` a `13/` - imagenes optimizadas
- `manual/` - manual clinico completo (10 HTMLs, 7 capitulos, 105 dinamicas, anexos)
- `indice maestro/` - HTML con indices clinicos (12 de 13 mazos)

## Mazos (13)
Numerados 1-13, cada uno con 60 cartas (30 el 13). Prefijos:
1=P-, 2=E-, 3=H-, 4=C-, 5=S-, 6=R-, 7=B-, 8=D-, 9=RE-, 10=F-, 11=M-, 12=DT-, 13=T-

## Login con Firebase Auth
- Login reemplazado: email + password via Firebase Auth
- Usuarios terapeutas se crean desde Firebase Console > Authentication > Users
- Paciente sigue entrando sin cuenta (solo codigo de sesion)
- No hay mas clave unica MOSAICO-DEMO-0001
- Sesion de Firebase persiste entre recargas (auth state restaurado automaticamente)

## Persistencia con Firestore
- **Firestore primario**, localStorage como cache offline:
  - Coleccion `pacientes`: doc por uid del terapeuta con array de pacientes y sesiones
  - Coleccion `historial`: doc por uid con el historial del paciente
  - Al cargar: sincroniza desde Firestore (espera a que datos lleguen)
  - Al guardar: escribe a localStorage + Firestore
- Indicador visual de sync en la topbar (punto verde = sincronizado, amarillo = guardando, rojo = sin conexion)

## Que funciona
- Login con email + password (Firebase Auth)
- Vista paciente: pedir codigo de sesion / esperar habilitacion / robar carta
- Lista de pacientes (terapeuta): CRUD, filtro por nombre
- Vista paciente: ver sesiones, crear sesion (con codigo automatico)
- Sesion activa: codigo visible, toggle de habilitacion, selector de mazo, grid de cartas, robar aleatorio, preview clinico, asignar carta, notas por carta, notas de sesion
- Historial de sesion (read-only)
- Indice Maestro: mazos colapsables, codigo + objetivo, ficha clinica completa
- Ficha clinica: imagen, codigo, pregunta, objetivo, profundizacion, observacion, intervenciones, tarea
- Modal de imagen: click en cualquier carta -> overlay full-size
- Service Worker con network-first para JS/CSS/HTML/SW, cache para data e imagenes
- Historial del paciente con autoguardado de notas, borrar item individual (x)
- Boton "Exportar mi historial" descarga JSON
- Boton "Vaciar historial" con doble confirmacion
- Sync con Firestore con indicador visual en topbar
- Manual clinico completo con boton "Volver a MOSAICO" en todos los HTMLs

## Sesion habilitada (modelo local, mismo dispositivo)
- Toggle de habilitacion + codigo de 4 caracteres por sesion
- Paciente ingresa codigo, espera habilitacion, roba cuando esta habilitado
- Las cartas robadas quedan en historial local + sesion del terapeuta

## Privacidad del paciente
Opcion A: paciente anonimo, notas locales, sin backend. Exportar a JSON es la unica via de compartir.

## Pendiente (ordenado por prioridad)

### Alta
- ~~Migrar localStorage a Firebase Auth + Firestore~~ COMPLETADO
- **Deploy a Netlify** para acceso publico (servir carpeta `app/`)
- **Firestore rules de produccion** (ya aplicadas en consola)

### Media
- Sistema de registro de terapeutas controlado por admin (UI en la app)
- Modo libre (paciente sin codigo de sesion)
- Soporte offline completo (primera carga precachea todo)
- Testing en celular real

### Baja
- Manual clinico: integrar indice maestro dentro de la app (hoy abre en nueva pestana)

## Datos clave
- Servir local: `python -m http.server 8080` desde la raiz del proyecto
- Version JS: app.js?v=15, CSS: styles.css?v=15
- SW: mosaico-v13
- Codigos de sesion: 4 chars de "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
- Storage local: `mosaico.rol`, `mosaico.clave`, `mosaico.pacientes`, `mosaico.paciente.hist`, `mosaico.paciente.sesionActiva`
- Firebase: mosaico-app-ab4c7 (Spark plan)

## Notas operativas
- Para cambiar version: bumpear `?v=N` en index.html y `CACHE` en service-worker.js
- Probar en incognito evita SW cacheado
- Unregister + hard refresh (Ctrl+Shift+R) forza recarga limpia
