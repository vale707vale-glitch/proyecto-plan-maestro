# MOSAICO — Documento Maestro

> Consolidado: Julio 2026. Unifica PROJECT_STATE.md, CONTINUA.md, USO_TERAPEUTA.md, COMO_ENTRAR.md, GUIA_FIREBASE_NETLIFY.md, DAR_ACCESO_TERAPEUTA.md, PLAN_MAESTRO.md, PLAN_DE_TRABAJO.md, DISTRIBUCION_Y_VENTAS.md.

---

## 1. Que es MOSAICO?

MOSAICO es una herramienta clinica de **cartografia terapeutica**. No es un juego: es un recurso para sesiones de terapia que usa 13 mazos de cartas con preguntas, tareas y consignas para profundizar en distintas areas del paciente (emociones, historia personal, creencias, relaciones, etc.).

El terapeuta selecciona cartas segun el momento de la sesion. El paciente puede ver las cartas asignadas y, si el terapeuta lo permite, robar cartas al azar.

---

## 2. Estado actual del proyecto

**Fase multi-dispositivo: COMPLETADA.** Paciente entra desde su propio celular con codigo de 4 letras.

### Que funciona
- Login terapeuta con email + password y cambio obligatorio de contrasena temporal
- Vista paciente: pedir codigo de sesion / robar carta / historial
- Acceso multi-dispositivo: paciente desde su celular ingresa codigo generado por terapeuta
- Verificacion en tiempo real del toggle: paciente checkea Firestore antes de robar y al volver a la pestana
- Si terapeuta deshabilita el codigo, el paciente no puede robar mas pero conserva su historial
- Cartas asignadas por terapeuta se sincronizan al historial del paciente via `active_codes`
- Lista de pacientes (terapeuta): CRUD, filtro por nombre, eliminar paciente con todas sus sesiones
- Sesion activa: codigo visible, toggle, selector de mazo, grid de cartas, robar aleatorio, preview clinico, asignar carta, notas
- Eliminar sesion individual (terapeuta): desde la vista del paciente o desde el historial de sesion
- Indice Maestro: 13 mazos colapsables, ficha clinica completa
- Ficha clinica: imagen, codigo, pregunta, objetivo, profundizacion, observacion, intervenciones, tarea
- Modal de imagen: click en cualquier carta -> overlay full-size
- Historial del paciente con autoguardado de notas, borrar item, exportar JSON, vaciar
- Historial local del paciente accesible sin codigo (solo lectura + edicion de notas, no permite robar cartas)
- Manual clinico completo

### Mazos (13)
Numerados 1-13, cada uno con 60 cartas (30 el 13). Prefijos:
1=P-, 2=E-, 3=H-, 4=C-, 5=S-, 6=R-, 7=B-, 8=D-, 9=RE-, 10=F-, 11=M-, 12=DT-, 13=T-

### Login con Firebase Auth
- **Terapeuta**: email + password via Firebase Auth. Usuarios creados desde Firebase Console.
- **Paciente**: sin cuenta. Entra con codigo de 4 letras + auth anonimo para leer Firestore.
- Auth anonimo debe estar habilitado en Firebase Console > Authentication > Sign-in methods.
- Contrasena temporal: al primer ingreso, la app obliga a cambiarla. Guarda `passwordUpdatedAt` en `terapeutas/{uid}`.

### Persistencia con Firestore
- `pacientes/{uid}` - array de pacientes y sesiones del terapeuta (solo el terapeuta lee/escribe)
- `historial/{uid}` - historial de cartas del paciente (solo el terapeuta lee/escribe)
- `terapeutas/{uid}` - datos del terapeuta, incluyendo `passwordUpdatedAt` (solo el terapeuta)
- `active_codes/{code}` - codigos activos con cartas asignadas (terapeuta escribe, cualquier autenticado lee)
- localStorage como cache offline para el mismo navegador

### Resumen de roles
| Que hace | Terapeuta | Paciente |
|---|---|---|
| Crear pacientes y sesiones | ✅ | ❌ |
| Asignar cartas | ✅ | ❌ |
| Ver ficha clinica completa | ✅ | ❌ |
| Ver pregunta + tarea | ✅ | ✅ |
| Robar carta al azar | ✅ | Solo si el terapeuta lo habilita |
| Escribir notas personales | ✅ (en cada carta) | ✅ (en su historial) |
| Ver historial completo | ✅ (de todos) | ✅ (solo el suyo) |
| Acceder al manual clinico | ✅ | ❌ |

### Datos clave
- Servir local: `python -m http.server 8765` desde `app/`
- Version JS: app.js?v=30, CSS: styles.css?v=25
- SW: mosaico-v13
- Codigos de sesion: 4 chars de "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
- Storage local: `mosaico.rol`, `mosaico.clave`, `mosaico.pacientes`, `mosaico.paciente.hist`, `mosaico.paciente.sesionActiva`
- Firebase: mosaico-app-ab4c7 (Spark plan)
- Auth anonimo: HABILITADO en Firebase Console

---

## 3. Estructura del proyecto

```
proyecto plan maestro/
├── DOCUMENTO_MAESTRO.md          <- Este archivo
├── app/                          <- PWA completa (HTML+CSS+JS+SW+manifest)
│   ├── index.html                <- templates + markup
│   ├── app.js                    <- toda la logica (~1850 lineas)
│   ├── firebase-service.js       <- CRUD contra Firestore
│   ├── styles.css                <- estilos (~600 lineas)
│   ├── service-worker.js         <- SW v13
│   ├── COMO_ENTRAR.md            <- (archivo original, reemplazado por este doc)
│   ├── data/                     <- 13 archivos JSON con cartas
│   └── assets/img/1/ a 13/       <- imagenes optimizadas por mazo
├── manual/                       <- manual clinico (10 HTMLs, 7 capitulos, 105 dinamicas, anexos)
├── indice maestro/               <- HTML con indices clinicos (12 de 13 mazos)
├── 1 la puerta inicio de sesion/ <- contenido fuente del mazo 1
├── 2 emociones/ a 13 cartas.../  <- contenido fuente de mazos 2-13
├── parsear_todos_mazos.py        <- parser universal HTML -> JSON
├── estandarizar_imagenes.py      <- renombrado masivo y limpieza
├── optimizar_imagenes.py         <- optimizacion con Pillow
├── favicon.ico
└── .gitignore
```

---

## 4. Como entrar a la app

### Requisitos
- Python 3
- Navegador moderno (Chrome, Edge, Firefox)

### Pasos para correr local
```powershell
cd "C:\Users\roros\OneDrive\Desktop\juegos\proyecto plan maestro\app"
python -m http.server 8765
```
Abrir: `http://localhost:8765/index.html`

### Produccion
- URL: https://cartaterapia.netlify.app
- Deploy automatico desde GitHub a Netlify (publish directory: `app`)

---

## 5. Flujo de uso del terapeuta

1. **Entrar** con email + contrasena (la que dio el administrador). Primer ingreso: obliga a cambiar contrasena temporal.
2. **Crear paciente**: click "+ Nuevo", escribir nombre y Enter.
3. **Crear sesion**: click en el paciente → "+ Nueva sesion" → se genera fecha + codigo de 4 caracteres.
4. **Asignar carta**: seleccionar mazo, click en una carta desde la grilla, click "Asignar carta a sesion". Aparece la ficha clinica completa (objetivo, profundizacion, intervenciones, tarea).
5. **Habilitar paciente**: toggle "Permitir al paciente robar" para que pueda robar al azar desde su dispositivo.
6. **Dar el codigo** al paciente para que entre desde su celular.
7. **Durante la sesion**: asignar cartas desde la compu, aparecen automaticamente en el historial del paciente.
8. **Finalizar**: deshabilitar el toggle. El paciente conserva su historial pero no puede robar mas.

### Cambiar contrasena
Click en "Cambiar clave" en la barra superior. Minimo 6 caracteres.

---

## 6. Flujo del paciente

1. Click "Entrar como paciente"
2. Ingresar el codigo de 4 letras que dio el terapeuta
3. Si esta habilitado: elegir mazo y tocar "Robar carta"
4. Las cartas que el terapeuta asigna aparecen en su historial
5. Puede escribir notas sobre cada carta y exportar su historial a JSON

### Cuando pierde acceso
- Si el terapeuta deshabilita el toggle: no puede robar mas, pero ve su historial
- Si cierra la app y vuelve: si el codigo sigue activo, puede seguir robando
- Si la sesion es deshabilitada, ve "Esperando habilitacion"

---

## 7. Los 13 mazos

| # | Mazo | Area | Prefijo |
|---|------|------|---------|
| 1 | La Puerta | Inicio de sesion, primeras entrevistas | P- |
| 2 | Emociones | Identificacion y regulacion emocional | E- |
| 3 | Historia Personal | Narrativa, biografia, acontecimientos | H- |
| 4 | Creencias | Creencias centrales, esquemas | C- |
| 5 | Sombras | Aspectos evitados o negados | S- |
| 6 | Relaciones | Vinculos, patrones relacionales | R- |
| 7 | El Cuerpo Habla | Sensaciones, somatizacion | B- |
| 8 | Decisiones | Dilemas, toma de decisiones | D- |
| 9 | Recursos | Fortalezas, afrontamiento | RE- |
| 10 | Futuro | Proyeccion, planes, deseos | F- |
| 11 | Metaforas | Trabajo con lenguaje metaforico | M- |
| 12 | Desafios Terapeuticos | Estancamiento, resistencia | DT- |
| 13 | Cartas del Terapeuta | Intervenciones directas | T- |

Cada carta contiene: imagen, codigo, pregunta, objetivo, profundizacion, observacion, intervenciones, tarea.

---

## 8. Flujo multi-dispositivo (como funciona tecnicamente)

1. Terapeuta (autenticado email/password) crea paciente y sesion
2. Terapeuta habilita toggle -> guarda `active_codes/{codigo}` con `{terapeutaId, sesionId, pacienteId, pacienteNombre, cartas, habilitada}`
3. Terapeuta asigna cartas -> se actualiza `active_codes/{codigo}.cartas` via `actualizarCartasEnActivo()`
4. Paciente (otro dispositivo) abre app, click "Entrar como paciente"
5. Paciente ingresa codigo -> auth anonimo -> lee `active_codes/{codigo}` de Firestore
6. Si existe y esta habilitado, el paciente entra a la sesion con las cartas asignadas
7. Al cambiar de pestana o intentar robar, se verifica `active_codes/{codigo}` en Firestore
8. Si el terapeuta deshabilita el toggle, se borra el documento de `active_codes`

### Funciones clave en app.js
- `buscarSesionPorCodigo(code)` - busca en localStorage (mismo navegador)
- `buscarCodigoEnFirestore(code)` - busca en `active_codes/{code}` (entre dispositivos)
- `verificarSesionActiva()` - checkea Firestore al robar y al volver a la pestana
- `sincronizarCodigoActivo()` - guarda/borra `active_codes/{code}` al toggle
- `actualizarCartasEnActivo()` - actualiza `cartas` en `active_codes/{code}` al asignar carta
- `sincronizarCartasTerapeuta(activa)` - mergea cartas asignadas al historial local del paciente

---

## 9. Configuracion tecnica (Firebase + Netlify)

### Firebase - Authentication
1. https://console.firebase.google.com/project/mosaico-app-ab4c7/authentication/users
2. Sign-in method → Email/Password → Habilitar
3. Users → + Add user (email + password del terapeuta)
4. Auth anonimo: habilitado para pacientes

### Firebase - Firestore Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pacientes/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /historial/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /terapeutas/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /active_codes/{code} {
      allow get: if request.auth != null;
      allow create, update, delete: if request.auth != null && request.auth.token.firebase.sign_in_provider == "password";
    }
  }
}
```

### Deploy a Netlify
- Connectar repo GitHub a Netlify
- Publish directory: `app`
- Build command: vacio
- URL asignada: https://cartaterapia.netlify.app

### Bumpeo de versiones
- `index.html`: `styles.css?v=N` y `app.js?v=N`
- `service-worker.js`: `CACHE = "mosaico-vN"`
- `app.js`: version tag `ver.textContent = "vN"`
- Probar siempre en incognito para evitar SW cacheado

---

## 10. Como dar acceso a un terapeuta

1. **Pedir mail** al terapeuta (cualquier direccion a la que tenga acceso)
2. **Crear usuario** en Firebase Console → Authentication → Users → + Add user
   - Email: el que te dio
   - Password: una inventada (ej: `Mosaico2026`)
3. **Enviar link** al terapeuta:
   ```
   Link: https://cartaterapia.netlify.app
   Email: [su email]
   Contrasena: [la que le pusiste]
   ```
4. El terapeuta **cambia la contrasena obligatoriamente** al primer ingreso (minimo 6 caracteres). Despues de eso, vos ya no sabes su contrasena.

Notas:
- El paciente NO necesita cuenta. Solo el codigo de 4 letras.
- No hay registro publico: solo vos podes crear terapeutas desde Firebase Console.

---

## 11. Modelo de negocio (a definir)

### Licencia por terapeuta
Cada terapeuta compra una licencia. La app es la misma para todos, el acceso se controla con credenciales de Firebase.

### Precios sugeridos
| Producto | Precio | Notas |
|---|---|---|
| Licencia individual | 40-50 USD | Pago unico, actualizaciones gratuitas 1 ano |
| Licencia grupal (hasta 5 terapeutas) | 150 USD | Para clinicas o equipos |
| Actualizacion mayor | 15-25 USD | Nuevos mazos, features grandes, despues del ano 1 |
| Carta del dia (web publica) | gratis | Embudo de venta |

### Flujo de venta propuesto
1. Terapeuta compra (Hotmart, Gumroad, Mercado Pago o transferencia)
2. Se crea su usuario en Firebase Console con email + password
3. Se le envia link de la app + credenciales
4. El terapeuta entra, cambia contrasena, usa la app

### Consideraciones legales
- Cada clave es personal e intransferible
- Incluir terminos al momento de la compra

---

## 12. Notas tecnicas recientes / Para continuar con IA

> Para iniciar nuevo chat con IA: "Soy el usuario del Proyecto MOSAICO. Lee DOCUMENTO_MAESTRO.md para continuar."

### Bugs resueltos (julio 2026)
- **Modo paciente**: faltaba resetear `state._pacCartaId = null` en `robarCartaPaciente()` antes de `renderCartaPaciente()`
- **Modal imagen**: `abrirModal()` ahora setea `modal.style.display = "flex"` ademas de `hidden = false`. `initModal()` setea `display: none` al inicio.
- **Service Worker**: bump a v8 (paths corregidos sin `/` inicial, `skipWaiting` movido a install event), v9 (filter pacientes blindado), v10 (sesion habilitada con codigo)
- **Filter pacientes**: null addEventListener en SW cacheado (v8) -> blindado con `if (filterInput)` en app.js:533

### Mejoras de historial del paciente
- Boton x por item para borrar entrada individual con confirmacion
- Boton "Exportar mi historial" descarga JSON con todos los datos
- Boton "Vaciar historial" con doble confirmacion
- Decision: Opcion A (paciente anonimo, notas locales, sin backend)

### Sesion habilitada con codigo
- Cada sesion del terapeuta tiene un codigo de 4 caracteres (visible en vista de sesion) y toggle de habilitacion
- El paciente debe ingresar el codigo para poder robar cartas
- Solo puede robar mientras la sesion este habilitada
- Historial del paciente indexado por sesionId (migrado desde array global a objeto con buckets por sesionId)
- Cartas que el paciente roba se reflejan en `sesion.cartas` del terapeuta (con flag `desdePaciente: true`)
- El paciente puede desvincularse con un boton arriba

### Sesion multi-dispositivo (28 Julio 2026)
- Paciente entra desde su propio celular con codigo de 4 letras, sin cuenta
- Auth anonimo de Firebase para que paciente pueda leer Firestore
- Nueva coleccion `active_codes/{code}`: terapeuta escribe al habilitar, paciente lee al ingresar codigo
- `buscarCodigoEnFirestore()`: busca el codigo en Firestore cuando no esta en localStorage
- `verificarSesionActiva()`: cada vez que el paciente intenta robar o vuelve a la pestana, checkea Firestore
- Cartas asignadas por terapeuta se guardan en `active_codes/{code}.cartas`
- `actualizarCartasEnActivo()`: actualiza las cartas en Firestore cada vez que el terapeuta asigna una carta

### Tips operativos
- Servir local: `cd app && python -m http.server 8765`
- Probar en incognito (evitar SW cacheado)
- Forzar refresh: DevTools > Application > Service Workers > Unregister, o Ctrl+Shift+R
- Propagar cambios: bumpear `?v=N` en index.html, bumpear `CACHE` en service-worker.js
- Multi-dispositivo local: pestana normal como terapeuta, ventana incognito como paciente

---

## 13. Pendientes

### Alta
- ~~Migrar localStorage a Firebase Auth + Firestore~~ COMPLETADO
- ~~Deploy a Netlify~~ COMPLETADO (cartaterapia.netlify.app)
- **Dominio propio** — comprar dominio (ej: cartaterapia.com) y conectarlo a Netlify
- **Personalizar branding** — cambiar titulo, logo, colores
- **Sistema de registro de terapeutas integrado** — UI para crear usuarios sin Firebase Console
- Decidir UX del "modo libre" (paciente sin codigo)

### Media
- Modo libre (paciente sin codigo de sesion)
- Soporte offline completo (primera carga precachea todo)
- Testing en celular real

### Baja
- Manual clinico: integrar indice maestro dentro de la app (hoy abre en nueva pestana)
- Sistema de licencias
- Completar capitulos 11-12 del manual clinico
