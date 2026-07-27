# Guia Completa: Firebase + Netlify para MOSAICO

## 1. Firebase Console — Authentication

1. Ir a https://console.firebase.google.com
2. Seleccionar proyecto (o crear uno nuevo)
3. Menu izquierdo → **Authentication** → **Get started**
4. Pestaña **Sign-in method** → **Email/Password** → Habilitar → **Save**
5. Pestaña **Users** → **+ Add user**
   - Email: el del terapeuta que va a usar la app
   - Password: la que quieras
   - **Rol no se configura aca**, solo email+password
   - Click **Add user**

## 2. Firebase Console — Firestore Database

1. Menu izquierdo → **Firestore Database**
2. **Create database**
3. Modo: **Start in production mode**
4. Ubicacion: **us-central1**
5. Click **Create**
6. Pestaña **Rules** → pegar estas reglas:

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
  }
}
```

7. Click **Publish**

## 3. Firebase Console — Obtener Config

1. Engranaje ⚙️ al lado de "Project Overview" → **Project settings**
2. Seccion **General** → bajar a **Your apps**
3. Click en **</> Web** (icono)
4. Poner nombre "mosaico-app" → **Register app**
5. Copiar el objeto `firebaseConfig` que aparece

## 4. Codigo — Agregar Firebase

Esto ya esta hecho en app.js. Si empezaras de cero:

### a. Agregar SDKs en `index.html`

Antes de los scripts existentes, agregar:

```html
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"></script>
<script src="firebase-service.js"></script>
```

### b. Inicializar Firebase al inicio de `app.js`

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "...firebaseapp.com",
  projectId: "mosaico-app-ab4c7",
  storageBucket: "...firebasestorage.app",
  messagingSenderId: "123456",
  appId: "1:123:web:abc..."
}

firebase.initializeApp(firebaseConfig)
const auth = firebase.auth()
const db = firebase.firestore()
```

### c. Template de login en `index.html`

Reemplazar el formulario viejo (clave unica) por:

```html
<form id="login-form" class="login-form">
  <label>
    Email
    <input type="email" name="email" autocomplete="email" required />
  </label>
  <label>
    Contrasena
    <input type="password" name="password" autocomplete="current-password" required />
  </label>
  <div class="login-actions">
    <button type="submit" class="btn-primary">Entrar como terapeuta</button>
    <button type="button" id="login-paciente" class="btn-ghost">Entrar como paciente</button>
  </div>
  <p id="login-error" class="error" hidden></p>
</form>
```

### d. Funcion login en `app.js`

```javascript
auth.signInWithEmailAndPassword(email, password)
  .then((cred) => {
    state.rol = "terapeuta"
    state.clave = cred.user.uid
    localStorage.setItem("mosaico.rol", "terapeuta")
    localStorage.setItem("mosaico.clave", cred.user.uid)
    sincronizarDesdeFirestore()
    renderApp()
  })
  .catch((err) => {
    error.textContent = "Email o contrasena incorrectos."
    error.hidden = false
  })
```

### e. Archivo `firebase-service.js`

Contiene las funciones CRUD contra Firestore:

- `fsCargarPacientes()` — descarga pacientes del usuario autenticado
- `fsGuardarPacientes(pacientes)` — sube pacientes
- `fsCargarHistorial()` — descarga historial
- `fsGuardarHistorial(historial)` — sube historial

Cada una usa `auth.currentUser.uid` como key del documento.

### f. Estrategia de sync

- **Firestore es primario**, localStorage es cache
- Al iniciar sesion: carga desde Firestore y sobreescribe localStorage
- Al guardar: primero localStorage (instantaneo), luego Firestore (asincrono)
- Indicador visual: punto verde (ok), amarillo (guardando), rojo (sin conexion)

## 5. GitHub — Subir el proyecto

1. Crear `.gitignore`:

```
__pycache__/
*.pyc
Thumbs.db
.DS_Store
node_modules/
.env
[0-9]*/
```

El patron `[0-9]*/` ignora las carpetas de mazos (imagenes originales pesadas).

2. En terminal:

```bash
git init
git add .
git commit -m "init: MOSAICO con Firebase Auth + Firestore"
```

3. **GitHub Desktop:**
   - File → Add local repository → seleccionar carpeta del proyecto
   - Publish repository → NO marcar "Keep this code private" (necesario para Netlify gratis)
   - Click **Publish repository**

## 6. Netlify — Deploy

1. Ir a https://netlify.com
2. Log in with GitHub
3. **Add new site** → **Import from Git** → **GitHub**
4. Buscar y seleccionar el repositorio creado
5. Configurar:
   - **Branch:** `main` (o `master`)
   - **Publish directory:** `app` (eso es CLAVE)
   - **Build command:** vacio
6. Click **Deploy site**
7. Esperar 2-3 minutos
8. Abrir la URL que Netlify asigna (ej: `cartaterapia.netlify.app`)

## 7. Agregar usuarios terapeutas

Solo se crean desde Firebase Console:

1. Firebase Console → **Authentication** → **Users** → **+ Add user**
2. Poner email + password del terapeuta
3. El terapeuta accede con esos mismos datos desde la app

## 8. Mantenimiento — Bumpear versiones

Cuando cambies codigo, recordar:

- `index.html`: `styles.css?v=N` y `app.js?v=N`
- `service-worker.js`: `CACHE = "mosaico-vN"`
- `app.js`: version tag `ver.textContent = "vN"`

Probar siempre en **incognito** para evitar Service Worker cacheado.
