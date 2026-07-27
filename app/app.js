const STORAGE_ROL = "mosaico.rol"
const STORAGE_CLAVE = "mosaico.clave"
const STORAGE_PACIENTES = "mosaico.pacientes"
const STORAGE_PACIENTE_HIST = "mosaico.paciente.hist"
const STORAGE_PACIENTE_SESION = "mosaico.paciente.sesionActiva"

// ============== FIREBASE ==============

const firebaseConfig = {
  apiKey: "AIzaSyBulfXhv0OiNLWZAqgAoZhnJns1jRHD640",
  authDomain: "mosaico-app-ab4c7.firebaseapp.com",
  projectId: "mosaico-app-ab4c7",
  storageBucket: "mosaico-app-ab4c7.firebasestorage.app",
  messagingSenderId: "311609208275",
  appId: "1:311609208275:web:fca3f3ddfefbb010f9d326"
}

firebase.initializeApp(firebaseConfig)
const auth = firebase.auth()
const db = firebase.firestore()

const state = {
  rol: null,
  clave: null,
  mazos: {},
  mazoActivo: null,
  pacientes: [],
  vistaT: "lista",
  pacienteId: null,
  sesionId: null,
  sync: "offline", // "syncing" | "synced" | "offline"
}

function $(sel, root = document) {
  if (sel.startsWith("#") && root === document) return document.getElementById(sel.slice(1)) || root.querySelector(sel)
  return root.querySelector(sel)
}
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel))

// ============== INIT ==============

function abrirModal(imgEl) {
  const modal = document.getElementById("img-modal")
  const content = document.getElementById("img-modal-content")
  if (!modal || !content || !imgEl) return
  content.src = imgEl.src
  modal.hidden = false
  modal.style.display = "flex"
}

function cerrarModal() {
  const modal = document.getElementById("img-modal")
  if (modal) { modal.hidden = true; modal.style.display = "none" }
}

function initModal() {
  const modal = document.getElementById("img-modal")
  const content = document.getElementById("img-modal-content")
  if (!modal || !content) return
  modal.style.display = "none"
  modal.addEventListener("click", cerrarModal)
  content.addEventListener("click", (e) => e.stopPropagation())
  const close = modal.querySelector(".img-modal-close")
  if (close) close.addEventListener("click", (e) => { e.stopPropagation(); cerrarModal() })
}

window.onerror = function(msg, url, line) {
  const e = document.createElement("div")
  e.style.cssText = "position:fixed;bottom:0;left:0;right:0;background:#b3261e;color:#fff;padding:0.5rem;font-size:0.8rem;z-index:9999"
  e.textContent = `Error: ${msg} (${url}:${line})`
  document.body.appendChild(e)
}

async function init() {
  initModal()
  montarTopbar()
  await cargarMazos()
  cargarPacientes()
  const rolGuardado = localStorage.getItem(STORAGE_ROL)
  if (rolGuardado === "paciente") {
    state.rol = "paciente"
    renderApp()
    return
  }
  if (rolGuardado === "terapeuta") {
    state.rol = "terapeuta"
    state.clave = localStorage.getItem(STORAGE_CLAVE)
    const user = await resolverAuth()
    if (user) {
      state.clave = user.uid
      localStorage.setItem(STORAGE_CLAVE, user.uid)
      await sincronizarDesdeFirestore()
      cargarHistorialFirestore()
      renderApp()
    } else {
      localStorage.removeItem(STORAGE_ROL)
      localStorage.removeItem(STORAGE_CLAVE)
      state.rol = null
      renderLogin()
    }
    return
  }
  renderLogin()
}

function resolverAuth() {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

const MAZOS = [
  { id: "la-puerta",          archivo: "mazo-la-puerta.json" },
  { id: "emociones",          archivo: "mazo-emociones.json" },
  { id: "historia-personal",  archivo: "mazo-historia-personal.json" },
  { id: "creencias",          archivo: "mazo-creencias.json" },
  { id: "sombras",            archivo: "mazo-sombras.json" },
  { id: "relaciones",         archivo: "mazo-relaciones.json" },
  { id: "el-cuerpo-habla",    archivo: "mazo-el-cuerpo-habla.json" },
  { id: "decisiones",         archivo: "mazo-decisiones.json" },
  { id: "recursos",           archivo: "mazo-recursos.json" },
  { id: "futuro",             archivo: "mazo-futuro.json" },
  { id: "metaforas",          archivo: "mazo-metaforas.json" },
  { id: "desafios-terapeuticos", archivo: "mazo-desafios-terapeuticos.json" },
  { id: "cartas-del-terapeuta",  archivo: "mazo-cartas-del-terapeuta.json" },
]

function setSync(status) {
  state.sync = status
  const dot = document.getElementById("sync-dot")
  if (!dot) return
  dot.className = "sync-dot sync-dot--" + status
  dot.title = status === "syncing" ? "Guardando..." : status === "synced" ? "Sincronizado" : "Sin conexion"
}

async function sincronizarDesdeFirestore() {
  if (!fsUser()) return
  setSync("syncing")
  try {
    const data = await fsCargarPacientes()
    if (data) {
      state.pacientes = data
      localStorage.setItem(STORAGE_PACIENTES, JSON.stringify(data))
    }
    setSync("synced")
  } catch (e) {
    console.warn("Firestore sync error:", e.message)
    setSync("offline")
  }
}

async function cargarMazos() {
  for (const m of MAZOS) {
    try {
      const res = await fetch("data/" + m.archivo)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const mazo = await res.json()
      state.mazos[mazo.id] = mazo
    } catch (err) {
      console.error(`Error cargando ${m.id}:`, err.message)
    }
  }
  if (!Object.keys(state.mazos).length) {
    renderError("No se pudo cargar ningun mazo. Recarga la pagina.")
    return
  }
  state.mazoActivo = Object.values(state.mazos)[0]?.id ?? null
}

function montarTopbar() {
  $("#logout-btn")?.addEventListener("click", () => {
    if (state.rol === "paciente") {
      setSesionActivaPaciente(null)
      localStorage.removeItem(STORAGE_ROL)
      state.rol = null
      resetVistaT()
      renderApp()
    } else if (state.rol === "terapeuta") {
      localStorage.removeItem(STORAGE_ROL)
      localStorage.removeItem(STORAGE_CLAVE)
      state.rol = null
      state.clave = null
      resetVistaT()
      auth.signOut().catch(() => {})
      renderApp()
    }
  })

  $("#btn-back")?.addEventListener("click", () => {
    if (state.vistaT === "indice") {
      state.vistaT = "lista"
    } else if (state.vistaT === "paciente" || state.vistaT === "sesion") {
      state.vistaT = "lista"
      state.pacienteId = null
      state.sesionId = null
    } else if (state.vistaT === "historial") {
      state.sesionId = null
      state.vistaT = "paciente"
    } else if (state.vistaT === "manual") {
      state.vistaT = "lista"
      renderTerapeuta()
      return
    }
    renderTerapeuta()
  })
}

function resetVistaT() {
  state.vistaT = "lista"
  state.pacienteId = null
  state.sesionId = null
}

// ============== RENDER ==============

function renderApp() {
  const app = $("#app")
  app.innerHTML = ""

  const indicator = $("#rol-indicator")
  const logoutBtn = $("#logout-btn")
  const indiceBtn = $("#btn-indice")
  const manualBtn = $("#btn-manual")
  // version debug
  const brandName = $(".brand-name")
  if (brandName && !brandName.dataset.versionSet) {
    brandName.dataset.versionSet = "1"
    const ver = document.createElement("sup")
    ver.style.cssText = "font-size:0.55rem;opacity:0.6;margin-left:0.2rem"
    ver.textContent = "v6"
    brandName.after(ver)
  }
  const syncDot = document.getElementById("sync-dot")
  if (state.rol === "terapeuta") {
    indicator.hidden = false
    indicator.textContent = "Terapeuta"
    logoutBtn.hidden = false
    indiceBtn.hidden = false
    if (manualBtn) manualBtn.hidden = false
    if (syncDot) syncDot.hidden = false
  } else if (state.rol === "paciente") {
    indicator.hidden = false
    indicator.textContent = "Paciente"
    logoutBtn.hidden = false
    indiceBtn.hidden = true
    if (manualBtn) manualBtn.hidden = true
    if (syncDot) syncDot.hidden = true
  } else {
    indicator.hidden = true
    logoutBtn.hidden = true
    indiceBtn.hidden = true
    if (manualBtn) manualBtn.hidden = true
    if (syncDot) syncDot.hidden = true
  }

  indiceBtn?.addEventListener("click", () => {
    state.vistaT = "indice"
    renderTerapeuta()
  })
  manualBtn?.addEventListener("click", () => {
    state.vistaT = "manual"
    renderTerapeuta()
  })

  if (!state.rol) {
    renderLogin()
  } else if (state.rol === "paciente") {
    renderPaciente()
  } else if (state.rol === "terapeuta") {
    renderTerapeuta()
  }
}

function renderError(msg) {
  $("#app").innerHTML = `<p class="error">${msg}</p>`
}

// ============== LOGIN ==============

function renderLogin() {
  const tpl = $("#tpl-login")
  $("#app").appendChild(tpl.content.cloneNode(true))

  const form = $("#login-form")
  const error = $("#login-error")

  $("#login-paciente").addEventListener("click", () => {
    state.rol = "paciente"
    localStorage.setItem(STORAGE_ROL, "paciente")
    renderApp()
  })

  form.addEventListener("submit", (e) => {
    e.preventDefault()
    const email = form.email.value.trim()
    const password = form.password.value.trim()
    if (!email || !password) {
      error.textContent = "Completa email y contraseña."
      error.hidden = false
      return
    }
    const btn = form.querySelector("button[type=submit]")
    btn.disabled = true
    btn.textContent = "Ingresando..."
    auth.signInWithEmailAndPassword(email, password)
      .then(async (cred) => {
        state.rol = "terapeuta"
        state.clave = cred.user.uid
        localStorage.setItem(STORAGE_ROL, "terapeuta")
        localStorage.setItem(STORAGE_CLAVE, cred.user.uid)
        await sincronizarDesdeFirestore()
        cargarHistorialFirestore()
        renderApp()
      })
      .catch((err) => {
        if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
          error.textContent = "Email o contraseña incorrectos."
        } else {
          error.textContent = "Error de conexión: " + err.message
        }
        error.hidden = false
      })
      .finally(() => {
        btn.disabled = false
        btn.textContent = "Entrar como terapeuta"
      })
  })
}

// ============== PACIENTE ==============

// Estado del paciente
const pacienteState = {
  sesionActivaId: null, // sesionId al que esta vinculado el dispositivo
  sesionActiva: null,   // objeto sesion resuelto (paciente + sesion)
  esperandoCodigo: false,
}

function getSesionActivaPaciente() {
  if (pacienteState.sesionActiva) return pacienteState.sesionActiva
  const id = localStorage.getItem(STORAGE_PACIENTE_SESION)
  if (!id) return null
  for (const p of state.pacientes) {
    const s = p.sesiones.find(x => x.id === id)
    if (s) {
      pacienteState.sesionActiva = { paciente: p, sesion: s }
      pacienteState.sesionActivaId = id
      return pacienteState.sesionActiva
    }
  }
  // La sesion ya no existe: limpiar
  localStorage.removeItem(STORAGE_PACIENTE_SESION)
  return null
}

function setSesionActivaPaciente(sesionId) {
  if (sesionId) {
    localStorage.setItem(STORAGE_PACIENTE_SESION, sesionId)
  } else {
    localStorage.removeItem(STORAGE_PACIENTE_SESION)
  }
  pacienteState.sesionActivaId = sesionId
  pacienteState.sesionActiva = null
}

function getHistorial() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_PACIENTE_HIST))
    if (Array.isArray(raw)) {
      const legacy = { _legacy: raw }
      guardarHistorial(legacy)
      return legacy
    }
    return raw || {}
  } catch {
    return {}
  }
}

function cargarHistorialFirestore() {
  if (!fsUser()) return
  setSync("syncing")
  fsCargarHistorial().then((data) => {
    if (data && Object.keys(data).length > Object.keys(getHistorial()).length) {
      localStorage.setItem(STORAGE_PACIENTE_HIST, JSON.stringify(data))
      const sesionId = pacienteState.sesionActivaId
      if (sesionId && document.getElementById("ph-lista")) renderHistorialPaciente()
    }
    setSync("synced")
  }).catch(() => setSync("offline"))
}

function getHistorialDeSesion(sesionId) {
  const h = getHistorial()
  return h[sesionId] || []
}

function guardarHistorial(h) {
  localStorage.setItem(STORAGE_PACIENTE_HIST, JSON.stringify(h))
  setSync("syncing")
  fsGuardarHistorial(h).then(() => setSync("synced")).catch(() => setSync("offline"))
}

function renderPaciente() {
  const activa = getSesionActivaPaciente()
  if (activa) {
    renderPacienteSesion(activa)
    return
  }
  renderPacientePedirCodigo()
}

function renderPacientePedirCodigo() {
  $("#app").innerHTML = ""
  const wrap = document.createElement("section")
  wrap.className = "tpl-section"
  wrap.innerHTML = `
    <header class="tpl-section-head">
      <h2>Acceso del paciente</h2>
    </header>
    <p class="muted">Ingresa el codigo de 4 caracteres que te dio tu terapeuta.</p>
    <form id="form-codigo" class="nuevo-paciente-form" style="margin-top:1rem">
      <input id="input-codigo" type="text" maxlength="4" placeholder="ABCD" autocomplete="off" required style="text-transform:uppercase;letter-spacing:0.5rem;font-size:1.4rem;text-align:center;width:8rem" />
      <button type="submit" class="btn-primary">Entrar</button>
    </form>
    <p id="codigo-error" class="error" hidden></p>
  `
  $("#app").appendChild(wrap)

  const form = $("#form-codigo")
  const input = $("#input-codigo")
  const error = $("#codigo-error")
  input.addEventListener("input", () => {
    input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
  })
  form.addEventListener("submit", (e) => {
    e.preventDefault()
    const code = input.value.trim().toUpperCase()
    if (code.length !== 4) { error.textContent = "El codigo tiene 4 caracteres."; error.hidden = false; return }
    const found = buscarSesionPorCodigo(code)
    if (!found) { error.textContent = "Codigo no encontrado. Verifica con tu terapeuta."; error.hidden = false; return }
    setSesionActivaPaciente(found.sesion.id)
    renderApp()
  })
}

function renderPacienteSesion(activa) {
  const tpl = $("#tpl-paciente")
  $("#app").appendChild(tpl.content.cloneNode(true))

  const header = document.createElement("div")
  header.className = "paciente-sesion-info"
  header.innerHTML = `
    <span class="muted">Sesion con <strong>${escapeHtml(activa.paciente.nombre)}</strong></span>
    <button id="btn-desvincular-top" class="btn-ghost" style="font-size:0.8rem">Desvincular</button>
  `
  $("#app").insertBefore(header, $("#app").firstChild)
  $("#btn-desvincular-top").addEventListener("click", () => {
    if (!confirm("Desvincular de esta sesion? Tu historial local se conserva.")) return
    setSesionActivaPaciente(null)
    renderApp()
  })

  const select = $("#select-mazo")
  popularSelectMazos(select)
  select.value = state.mazoActivo ?? ""
  select.addEventListener("change", () => { state.mazoActivo = select.value })

  const notasInput = document.getElementById("carta-notas")
  if (notasInput) {
    notasInput.addEventListener("input", () => {
      if (!pacienteState.sesionActivaId) return
      const historial = getHistorial()
      const arr = historial[pacienteState.sesionActivaId] || []
      const idx = arr.findIndex(h => h.id === state._pacCartaId)
      if (idx !== -1) {
        arr[idx].notas = notasInput.value
        historial[pacienteState.sesionActivaId] = arr
        guardarHistorial(historial)
      }
    })
  }

  if (activa.sesion.habilitada) {
    $("#btn-robar").addEventListener("click", () => robarCartaPaciente())
  } else {
    const btn = $("#btn-robar")
    btn.disabled = true
    btn.textContent = "Robo deshabilitado por el terapeuta"
    btn.style.opacity = "0.5"
  }
  renderHistorialPaciente()
}

function robarCartaPaciente() {
  const select = document.getElementById("select-mazo")
  const mazoId = select?.value || state.mazoActivo || Object.keys(state.mazos)[0]
  if (mazoId) state.mazoActivo = mazoId
  const mazo = state.mazos[state.mazoActivo]
  if (!mazo || !mazo.cartas.length) return

  const carta = mazo.cartas[Math.floor(Math.random() * mazo.cartas.length)]
  state._pacCartaId = null
  renderCartaPaciente(carta)
}

function renderCartaPaciente(carta) {
  const mazo = state.mazos[state.mazoActivo]
  if (!mazo) return

  const emptyEl = document.getElementById("empty-state")
  if (emptyEl) emptyEl.hidden = true

  const area = document.getElementById("carta-area")
  if (!area) return
  area.hidden = false

  const img = document.getElementById("carta-imagen")
  if (img) {
    img.src = `assets/img/${mazo.numero}/${carta.codigo}.jpg`
    img.alt = carta.codigo
    img.onload = () => { img.style.display = "block" }
    img.onerror = () => { img.style.display = "none" }
    img.onclick = () => abrirModal(img)
    img.style.display = "block"
  }

  const setText = (id, val) => {
    const el = document.getElementById(id)
    if (el) el.textContent = val ?? ""
  }
  setText("carta-codigo-overlay", carta.codigo)
  setText("carta-codigo", carta.codigo)
  setText("carta-pregunta", carta.pregunta)
  setText("carta-tarea", carta.tarea)

  const historial = getHistorial()
  const sesionId = pacienteState.sesionActivaId
  if (!sesionId) return // sin sesion no se guarda nada
  const arr = historial[sesionId] || []
  const existing = arr.find(h => h.id === state._pacCartaId)

  const notasInput = document.getElementById("carta-notas")
  if (!existing) {
    const entry = {
      id: idGen(),
      codigo: carta.codigo,
      mazoId: state.mazoActivo,
      timestamp: new Date().toISOString(),
      notas: "",
    }
    arr.unshift(entry)
    historial[sesionId] = arr
    guardarHistorial(historial)
    state._pacCartaId = entry.id
    if (notasInput) notasInput.value = ""

    // Tambien guardar en la sesion del terapeuta (si esta en el mismo navegador)
    const activa = getSesionActivaPaciente()
    if (activa && !activa.sesion.cartas.some(c => c.codigo === carta.codigo)) {
      activa.sesion.cartas.push({
        codigo: carta.codigo,
        mazoId: state.mazoActivo,
        notas: "",
        asignadaEn: new Date().toISOString(),
        desdePaciente: true,
      })
      guardarPacientes()
    }
  } else {
    state._pacCartaId = existing.id
    if (notasInput) notasInput.value = existing.notas || ""
  }

  renderHistorialPaciente()
}

function renderHistorialPaciente() {
  const sesionId = pacienteState.sesionActivaId
  const historial = sesionId ? getHistorialDeSesion(sesionId) : []
  const container = document.getElementById("ph-lista")
  const section = document.getElementById("ph-historial")
  const actions = document.getElementById("ph-acciones")
  if (!container || !section) return

  if (!historial.length) {
    section.hidden = true
    if (actions) actions.hidden = true
    return
  }
  section.hidden = false
  if (actions) actions.hidden = false
  container.innerHTML = ""

  for (const h of historial) {
    const mazo = Object.values(state.mazos).find(m => m.id === h.mazoId)
    const item = document.createElement("div")
    item.className = "ph-item"
    const origen = h.desdeTerapeuta ? "asignada" : "robada"
    item.innerHTML = `
      <div class="ph-item-main">
        <span class="ph-item-codigo">${escapeHtml(h.codigo)}</span>
        <span class="ph-item-mazo">${mazo ? escapeHtml(mazo.nombre) : ""}</span>
        <span class="ph-item-origen ph-item-origen--${origen}">${origen}</span>
      </div>
      <span class="ph-item-fecha">${formatearFecha(h.timestamp)}</span>
      <button class="ph-item-borrar" data-id="${h.id}" aria-label="Borrar">&times;</button>
    `
    item.querySelector(".ph-item-main").addEventListener("click", () => {
      const mazo = state.mazos[h.mazoId]
      if (!mazo) return
      const carta = mazo.cartas.find(c => c.codigo === h.codigo)
      if (!carta) return
      state._pacCartaId = h.id
      state.mazoActivo = h.mazoId
      const select = document.getElementById("select-mazo")
      if (select) select.value = h.mazoId
      renderCartaPaciente(carta)
    })
    item.querySelector(".ph-item-borrar").addEventListener("click", (e) => {
      e.stopPropagation()
      if (!confirm(`Borrar la entrada de ${h.codigo}?`)) return
      const hist = getHistorial()
      hist[sesionId] = (hist[sesionId] || []).filter(x => x.id !== h.id)
      guardarHistorial(hist)
      if (state._pacCartaId === h.id) state._pacCartaId = null
      renderHistorialPaciente()
    })
    container.appendChild(item)
  }

  const btnExport = document.getElementById("btn-ph-export")
  if (btnExport && !btnExport.dataset.bound) {
    btnExport.dataset.bound = "1"
    btnExport.addEventListener("click", exportarHistorial)
  }
  const btnVaciar = document.getElementById("btn-ph-vaciar")
  if (btnVaciar && !btnVaciar.dataset.bound) {
    btnVaciar.dataset.bound = "1"
    btnVaciar.addEventListener("click", () => {
      if (!confirm("Borrar todo tu historial y notas? Esta accion no se puede deshacer.")) return
      const hist = getHistorial()
      hist[sesionId] = []
      guardarHistorial(hist)
      state._pacCartaId = null
      renderHistorialPaciente()
    })
  }
}

function exportarHistorial() {
  const sesionId = pacienteState.sesionActivaId
  const historial = sesionId ? getHistorialDeSesion(sesionId) : []
  if (!historial.length) { alert("No hay historial para exportar."); return }
  const activa = getSesionActivaPaciente()
  const enriched = historial.map(h => {
    const mazo = state.mazos[h.mazoId]
    const carta = mazo?.cartas.find(c => c.codigo === h.codigo)
    return {
      codigo: h.codigo,
      mazo: mazo?.nombre || h.mazoId,
      fecha: h.timestamp,
      pregunta: carta?.pregunta || "",
      objetivo: carta?.objetivo || "",
      tarea: carta?.tarea || "",
      notas: h.notas || "",
    }
  })
  const payload = activa
    ? { sesion: activa.sesion.codigo, paciente: activa.paciente.nombre, cartas: enriched }
    : { cartas: enriched }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `mosaico-mi-historial-${new Date().toISOString().slice(0,10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function popularSelectMazos(select) {
  select.innerHTML = ""
  for (const mazo of Object.values(state.mazos)) {
    const opt = document.createElement("option")
    opt.value = mazo.id
    opt.textContent = `${mazo.nombre} (${mazo.cartas.length})`
    select.appendChild(opt)
  }
}

// ============== TERAPEUTA - PACIENTES ==============

function renderTerapeuta() {
  $("#app").innerHTML = ""

  if (state.vistaT === "lista") renderListaPacientes()
  else if (state.vistaT === "paciente") renderPacienteView()
  else if (state.vistaT === "sesion") renderSesionView()
  else if (state.vistaT === "historial") renderHistorialSesion()
  else if (state.vistaT === "indice") renderIndiceMaestro()
  else if (state.vistaT === "manual") renderManual()
}

// ---- helpers ----

function getPaciente() {
  return state.pacientes.find(p => p.id === state.pacienteId)
}

function getSesion() {
  const pac = getPaciente()
  return pac?.sesiones.find(s => s.id === state.sesionId)
}

function guardarPacientes() {
  localStorage.setItem(STORAGE_PACIENTES, JSON.stringify(state.pacientes))
  if (state.rol === "terapeuta") {
    setSync("syncing")
    fsGuardarPacientes(state.pacientes).then(() => setSync("synced")).catch(() => setSync("offline"))
  }
}

function cargarPacientes() {
  try {
    const raw = localStorage.getItem(STORAGE_PACIENTES)
    state.pacientes = raw ? JSON.parse(raw) : []
  } catch {
    state.pacientes = []
  }
  if (state.rol === "terapeuta") {
    fsCargarPacientes().then((data) => {
      if (data && data.length >= state.pacientes.length) {
        state.pacientes = data
        localStorage.setItem(STORAGE_PACIENTES, JSON.stringify(data))
        if (state.rol === "terapeuta" && (state.vistaT === "lista" || !state.vistaT)) {
          const app = $("#app")
          if (app && app.querySelector(".lista-pacientes")) renderListaPacientes()
        }
      }
    }).catch(() => {})
  }
}

function idGen() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }

function generarCodigoSesion() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // sin I, O, 0, 1
  const usados = new Set()
  for (const p of state.pacientes) {
    for (const s of p.sesiones) {
      if (s.codigo) usados.add(s.codigo)
    }
  }
  for (let i = 0; i < 50; i++) {
    let code = ""
    for (let j = 0; j < 4; j++) code += chars[Math.floor(Math.random() * chars.length)]
    if (!usados.has(code)) return code
  }
  return idGen().slice(-4).toUpperCase()
}

function buscarSesionPorCodigo(codigo) {
  const c = codigo.trim().toUpperCase()
  for (const p of state.pacientes) {
    for (const s of p.sesiones) {
      if (s.codigo === c) return { paciente: p, sesion: s }
    }
  }
  return null
}

function formatearFecha(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })
}

// ---- lista de pacientes ----

function renderListaPacientes() {
  $("#app").appendChild($("#tpl-pacientes-list").content.cloneNode(true))
  $("#btn-back").hidden = true

  $("#form-nuevo-paciente").addEventListener("submit", (e) => {
    e.preventDefault()
    const input = $("#input-nuevo-paciente")
    const nombre = input.value.trim()
    if (!nombre) return
    state.pacientes.push({
      id: idGen(),
      nombre,
      createdAt: new Date().toISOString(),
      sesiones: [],
    })
    guardarPacientes()
    input.value = ""
    renderListaPacientes()
  })

  const container = $("#lista-pacientes")
  let filtro = ""

  function renderPacientes() {
    container.innerHTML = ""
    const q = filtro.toLowerCase()
    const filtered = q ? state.pacientes.filter(p => p.nombre.toLowerCase().includes(q)) : state.pacientes
    for (const pac of filtered) {
      const card = document.createElement("div")
      card.className = "paciente-card"
      card.innerHTML = `
        <div class="paciente-card-info">
          <span class="paciente-card-nombre">${escapeHtml(pac.nombre)}</span>
          <span class="paciente-card-meta">${pac.sesiones.length} sesiones · creado ${formatearFecha(pac.createdAt)}</span>
        </div>
        <div class="paciente-card-acciones">
          <button class="btn-peligro" data-id="${pac.id}">Eliminar</button>
        </div>
      `
      card.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON") return
        state.pacienteId = pac.id
        state.vistaT = "paciente"
        renderTerapeuta()
      })
      card.querySelector(".btn-peligro").addEventListener("click", (e) => {
        e.stopPropagation()
        if (!confirm(`Eliminar a "${pac.nombre}" y todas sus sesiones?`)) return
        state.pacientes = state.pacientes.filter(p => p.id !== pac.id)
        guardarPacientes()
        renderPacientes()
      })
      container.appendChild(card)
    }
    if (!filtered.length) {
      container.innerHTML = '<div class="empty-state"><p>Sin resultados.</p></div>'
    }
  }

  const filterInput = $("#filter-pacientes")
  if (filterInput) {
    filterInput.addEventListener("input", () => {
      filtro = filterInput.value
      renderPacientes()
    })
  }

  renderPacientes()
}

// ---- vista de un paciente ----

function renderPacienteView() {
  const pac = getPaciente()
  if (!pac) { state.vistaT = "lista"; renderTerapeuta(); return }

  $("#app").appendChild($("#tpl-paciente-view").content.cloneNode(true))

  $("#pv-nombre").textContent = pac.nombre
  $("#pv-info").textContent = `${pac.sesiones.length} sesiones`

  $("#btn-back").hidden = false
  $("#btn-nueva-sesion").addEventListener("click", () => {
    pac.sesiones.push({
      id: idGen(),
      fecha: new Date().toISOString(),
      notas: "",
      cartas: [],
      codigo: generarCodigoSesion(),
      habilitada: false,
    })
    guardarPacientes()
    state.sesionId = pac.sesiones[pac.sesiones.length - 1].id
    state.vistaT = "sesion"
    renderTerapeuta()
  })

  const historial = $("#pv-historial")
  historial.innerHTML = ""

  if (pac.sesiones.length === 0) {
    $("#pv-empty").hidden = false
    return
  }

  // Mostrar de mas reciente a mas antigua
  const sesiones = [...pac.sesiones].reverse()
  for (const s of sesiones) {
    const card = document.createElement("div")
    card.className = "sesion-card"
    card.innerHTML = `
      <div>
        <div class="sesion-card-fecha">${formatearFecha(s.fecha)}</div>
        <div class="sesion-card-meta">${s.cartas.length} cartas · ${s.notas ? s.notas.slice(0, 60) + (s.notas.length > 60 ? "..." : "") : "sin notas"}</div>
      </div>
      <span class="muted" style="font-size:0.8rem">Ver &rarr;</span>
    `
    card.addEventListener("click", () => {
      state.sesionId = s.id
      state.vistaT = "historial"
      renderTerapeuta()
    })
    historial.appendChild(card)
  }
}

// ---- sesion activa ----

function renderSesionView() {
  const pac = getPaciente()
  const sesion = getSesion()
  if (!pac || !sesion) { state.vistaT = "paciente"; renderTerapeuta(); return }

  // Migracion: sesiones viejas sin codigo
  if (!sesion.codigo) {
    sesion.codigo = generarCodigoSesion()
    sesion.habilitada = false
    guardarPacientes()
  }
  if (typeof sesion.habilitada !== "boolean") {
    sesion.habilitada = false
    guardarPacientes()
  }

  $("#app").appendChild($("#tpl-sesion-view").content.cloneNode(true))

  $("#sv-paciente-nombre").textContent = pac.nombre
  $("#sv-fecha").textContent = formatearFecha(sesion.fecha)
  $("#btn-back").hidden = false
  $("#sv-notas-sesion").value = sesion.notas || ""

  // Panel de puerta del paciente
  const codigoEl = $("#sv-codigo-valor")
  const toggleBtn = $("#sv-habilitar-toggle")
  if (codigoEl) codigoEl.textContent = sesion.codigo
  if (toggleBtn) {
    const pintar = () => {
      toggleBtn.textContent = sesion.habilitada ? "Habilitado" : "Deshabilitado"
      toggleBtn.classList.toggle("habilitado", sesion.habilitada)
      toggleBtn.classList.toggle("deshabilitado", !sesion.habilitada)
    }
    pintar()
    toggleBtn.addEventListener("click", () => {
      sesion.habilitada = !sesion.habilitada
      guardarPacientes()
      pintar()
    })
  }

  // autoguardar notas de sesion
  $("#sv-notas-sesion").addEventListener("input", () => {
    sesion.notas = $("#sv-notas-sesion").value
    guardarPacientes()
  })

  $("#btn-cerrar-sesion").addEventListener("click", () => {
    state.sesionId = null
    state.vistaT = "paciente"
    renderTerapeuta()
  })

  // Selector de mazo
  const select = $("#sv-select-mazo")
  popularSelectMazos(select)
  select.value = state.mazoActivo ?? ""

  let mazoActual = state.mazoActivo

  // Seleccion de carta desde el browser
  const browser = $("#sv-card-browser")
  let cartaSeleccionada = null

  function poblarBrowser(mazoId) {
    const mazo = state.mazos[mazoId]
    if (!mazo) { browser.innerHTML = ""; return }
    browser.innerHTML = ""
    cartaSeleccionada = null
    for (const c of mazo.cartas) {
      const item = document.createElement("div")
      item.className = "sv-card-browser-item"
      item.textContent = c.codigo
      item.dataset.codigo = c.codigo
      item.addEventListener("click", () => {
        document.querySelectorAll(".sv-card-browser-item").forEach(el => el.classList.remove("seleccionada"))
        item.classList.add("seleccionada")
        cartaSeleccionada = c
        mostrarCartaEnSesion(c, mazoId)
      })
      browser.appendChild(item)
    }
  }

  select.addEventListener("change", () => {
    mazoActual = select.value
    state.mazoActivo = mazoActual
    $("#sv-carta-area").hidden = true
    poblarBrowser(mazoActual)
  })

  // Robo aleatorio
  $("#btn-sv-robar").addEventListener("click", () => {
    const mazo = state.mazos[mazoActual]
    if (!mazo || !mazo.cartas.length) return
    const carta = mazo.cartas[Math.floor(Math.random() * mazo.cartas.length)]
    cartaSeleccionada = carta
    document.querySelectorAll(".sv-card-browser-item").forEach(el => el.classList.remove("seleccionada"))
    const item = browser.querySelector(`[data-codigo="${carta.codigo}"]`)
    if (item) item.classList.add("seleccionada")
    mostrarCartaEnSesion(carta, mazoActual)
  })

  // Asignar carta
  $("#btn-sv-asignar").addEventListener("click", () => {
    if (!cartaSeleccionada) { alert("Selecciona una carta primero."); return }

    const codigoMostrado = cartaSeleccionada.codigo

    if (sesion.cartas.some(c => c.codigo === codigoMostrado)) {
      alert("Esta carta ya esta asignada en esta sesion.")
      return
    }

    const notas = $("#sv-notas-carta").value.trim()
    sesion.cartas.push({
      codigo: codigoMostrado,
      mazoId: mazoActual,
      notas: notas,
      asignadaEn: new Date().toISOString(),
    })
    guardarPacientes()

    // Propagar al historial del paciente para que lo vea
    try {
      const phist = JSON.parse(localStorage.getItem(STORAGE_PACIENTE_HIST)) || {}
      const hArr = phist[state.sesionId] || []
      if (!hArr.some(h => h.codigo === codigoMostrado && h.mazoId === mazoActual)) {
        hArr.unshift({
          id: idGen(),
          codigo: codigoMostrado,
          mazoId: mazoActual,
          timestamp: new Date().toISOString(),
          notas: notas,
          desdeTerapeuta: true,
        })
        phist[state.sesionId] = hArr
        localStorage.setItem(STORAGE_PACIENTE_HIST, JSON.stringify(phist))
      }
    } catch (_) {}

    $("#sv-notas-carta").value = ""
    $("#sv-carta-area").hidden = true
    cartaSeleccionada = null
    document.querySelectorAll(".sv-card-browser-item").forEach(el => el.classList.remove("seleccionada"))
    renderCartasAsignadas(sesion)
  })

  // Inicializar browser
  poblarBrowser(mazoActual)

  // Mostrar carta en el preview
  function mostrarCartaEnSesion(carta, mazoId) {
    const mazo = state.mazos[mazoId]
    if (!mazo) return

    const area = document.getElementById("sv-carta-area")
    if (!area) return
    area.hidden = false

    const img = document.getElementById("sv-carta-imagen")
    if (img) {
      img.src = `assets/img/${mazo.numero}/${carta.codigo}.jpg`
      img.alt = carta.codigo
      img.onload = () => { img.style.display = "block" }
      img.onerror = () => { img.style.display = "none" }
      img.style.display = "block"
      img.onclick = () => abrirModal(img)
    }

    const setText = (id, val) => {
      const el = document.getElementById(id)
      if (el) el.textContent = val ?? ""
    }
    setText("sv-carta-codigo-overlay", carta.codigo)
    setText("sv-carta-codigo", carta.codigo)
    setText("sv-carta-pregunta", carta.pregunta)
    setText("sv-carta-objetivo", carta.objetivo || "")
    setText("sv-carta-tarea", carta.tarea)
    poblarLista("sv-carta-profundizacion", carta.profundizacion)
    poblarLista("sv-carta-observacion", carta.observacion)
    poblarLista("sv-carta-intervenciones", carta.intervenciones)
    const notasCarta = document.getElementById("sv-notas-carta")
    if (notasCarta) { notasCarta.value = ""; notasCarta.focus() }
  }

  renderCartasAsignadas(sesion)
}

function renderCartasAsignadas(sesion) {
  const container = $("#sv-lista-cartas")
  const empty = $("#sv-no-cartas")
  if (!container) return

  container.innerHTML = ""

  if (!sesion.cartas.length) {
    empty.hidden = false
    return
  }
  empty.hidden = true

  for (const c of sesion.cartas) {
    const mazo = state.mazos[c.mazoId]
    const div = document.createElement("div")
    div.className = "sv-carta-asignada"
    div.innerHTML = `
      <div class="sv-carta-asignada-head">
        <span>${c.codigo}</span>
        <span class="mazo-label">${mazo?.nombre || c.mazoId}</span>
      </div>
      <textarea data-codigo="${c.codigo}" placeholder="Notas sobre esta carta...">${escapeHtml(c.notas || "")}</textarea>
      <div style="display:flex;justify-content:flex-end">
        <button class="btn-eliminar-carta" data-codigo="${c.codigo}">Quitar</button>
      </div>
    `

    const ta = div.querySelector("textarea")
    ta.addEventListener("input", () => {
      c.notas = ta.value
      guardarPacientes()
    })

    div.querySelector(".btn-eliminar-carta").addEventListener("click", () => {
      sesion.cartas = sesion.cartas.filter(x => x.codigo !== c.codigo)
      guardarPacientes()
      renderCartasAsignadas(sesion)
    })

    container.appendChild(div)
  }
}

// ---- manual ----

function renderManual() {
  const BASE = "../manual/"
  const abrir = (file, anchor) => {
    window.open(BASE + file + (anchor ? "#" + anchor : ""), "_blank")
  }

  const sec = (titulo, items) => {
    const s = document.createElement("div")
    s.className = "manual-sec"
    const h3 = document.createElement("h3")
    h3.className = "manual-sec-tit"
    h3.innerHTML = `<span class="manual-chevron">&#9662;</span> ${titulo}`
    h3.tabIndex = 0
    const toggle = () => {
      s.classList.toggle("collapsed")
      guardarEstadoManual()
    }
    h3.addEventListener("click", toggle)
    h3.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle() } })
    s.appendChild(h3)
    const list = document.createElement("div")
    list.className = "manual-items"
    for (const i of items) {
      const a = document.createElement("a")
      a.className = "manual-item" + (i.sub ? " manual-item--sub" : "")
      a.href = "#"
      a.textContent = i.label
      a.addEventListener("click", (e) => { e.preventDefault(); abrir(i.file, i.anchor) })
      list.appendChild(a)
    }
    s.appendChild(list)
    return s
  }

  function guardarEstadoManual() {
    const estados = []
    document.querySelectorAll(".manual-sec").forEach(el => {
      estados.push(el.classList.contains("collapsed") ? "0" : "1")
    })
    try { localStorage.setItem("mosaico_manual_colapso", estados.join("")) } catch {}
  }

  function restaurarEstadoManual() {
    try {
      const raw = localStorage.getItem("mosaico_manual_colapso")
      if (!raw) return
      const els = document.querySelectorAll(".manual-sec")
      for (let i = 0; i < els.length && i < raw.length; i++) {
        if (raw[i] === "0") els[i].classList.add("collapsed")
      }
    } catch {}
  }

  $("#app").innerHTML = ""
  const section = document.createElement("section")
  section.className = "tpl-section"
  section.innerHTML = `<header class="tpl-section-head"><h2>Manual Clinico</h2></header>`
  $("#app").appendChild(section)
  $("#btn-back").hidden = false

  const container = section

  const wrapper = document.createElement("div")
  wrapper.className = "manual-wrapper"

  wrapper.appendChild(sec("Front Matter", [
    { label: "Prologo y Sistema de Codificacion", file: "manual 1.html" },
    { label: "1.1 El Encuadre Terapeutico", file: "manual 1.html", sub: true },
    { label: "1.2 Preparacion del Espacio y del Terapeuta", file: "manual 1.html", sub: true },
  ]))

  wrapper.appendChild(sec("Seleccion e Integracion de Mazos", [
    { label: "Cap. 2 — Criterios de Seleccion de Mazos", file: "manual 2.html", anchor: "cap2" },
    { label: "2.1 Mapeo Sintomatico", file: "manual 2.html", anchor: "cap2-1", sub: true },
    { label: "2.2 La Puerta como Protocolo Estandar", file: "manual 2.html", anchor: "cap2-2", sub: true },
    { label: "2.3 Adaptacion por Modalidad Terapeutica", file: "manual 2.html", anchor: "cap2-3", sub: true },
    { label: "Cap. 3 — Integracion y Combinatoria", file: "manual 2.html", anchor: "cap3" },
    { label: "3.1 El Arte de Cruzar Mazos", file: "manual 2.html", anchor: "cap3-1", sub: true },
    { label: "3.2 Secuenciacion Logica", file: "manual 2.html", anchor: "cap3-2", sub: true },
  ]))

  wrapper.appendChild(sec("Tecnica Clinica Avanzada", [
    { label: "Cap. 4 — Profundizacion Clinica", file: "manual 3.html", anchor: "cap4" },
    { label: "4.1 De lo Superficial a lo Significativo", file: "manual 3.html", anchor: "cap4-1", sub: true },
    { label: "4.2 Lectura de lo No Dicho", file: "manual 3.html", anchor: "cap4-2", sub: true },
    { label: "4.3 Adaptacion segun Escuela Terapeutica", file: "manual 3.html", anchor: "cap4-3", sub: true },
    { label: "Cap. 5 — Gestion de la Resistencia", file: "manual 3.html", anchor: "cap5" },
    { label: "5.1 Tipologia de Resistencias", file: "manual 3.html", anchor: "cap5-1", sub: true },
    { label: "5.2 Intervenciones para Respuestas Dificiles", file: "manual 3.html", anchor: "cap5-2", sub: true },
    { label: "5.3 El Silencio y la Metafora", file: "manual 3.html", anchor: "cap5-3", sub: true },
  ]))

  wrapper.appendChild(sec("Sesion y Cierre", [
    { label: "Cap. 6 — Cierre de Sesion e Integracion", file: "manual 4.html", anchor: "cap6" },
    { label: "6.1 Como Aterrizar una Sesion Intensa", file: "manual 4.html", anchor: "cap6-1", sub: true },
    { label: "6.2 Sintesis Colaborativa", file: "manual 4.html", anchor: "cap6-2", sub: true },
    { label: "6.3 Diseno de Tareas Terapeuticas", file: "manual 4.html", anchor: "cap6-3", sub: true },
  ]))

  wrapper.appendChild(sec("Banco de Dinamicas Clinicas (105 dinamicas)", [
    { label: "Cat. A — Diagnostico y Evaluacion (din. 1-7)", file: "manual 4.html", anchor: "cat-a" },
    { label: "Cat. A — Diagnostico y Evaluacion (din. 29-35)", file: "manual 5.html" },
    { label: "Cat. A — Diagnostico y Evaluacion (din. 56-62)", file: "manual 6.html", anchor: "cat-a" },
    { label: "Cat. A — Diagnostico y Evaluacion (din. 81-85)", file: "manual 8.html", anchor: "cat-a" },
    { label: "Cat. B — Desbloqueo y Ruptura (din. 8-28)", file: "manual 4.html", anchor: "cat-b" },
    { label: "Cat. B — Desbloqueo y Ruptura (din. 36-43)", file: "manual 5.html" },
    { label: "Cat. B — Desbloqueo y Ruptura (din. 63-69)", file: "manual 7.html", anchor: "cat-b" },
    { label: "Cat. B — Desbloqueo y Ruptura (din. 86-92)", file: "manual 8.html", anchor: "cat-b" },
    { label: "Cat. C — Fortalecimiento de Recursos (din. 44-50)", file: "manual 5.html" },
    { label: "Cat. C — Fortalecimiento de Recursos (din. 70-75)", file: "manual 7.html", anchor: "cat-c" },
    { label: "Cat. C — Fortalecimiento de Recursos (din. 93-99)", file: "manual 8.html", anchor: "cat-c" },
    { label: "Cat. D — Cierre y Proyeccion (din. 52-55)", file: "manual 5.html", anchor: "cat-d" },
    { label: "Cat. D — Cierre y Proyeccion (din. 76-80)", file: "manual 7.html", anchor: "cat-d" },
    { label: "Cat. D — Cierre y Proyeccion (din. 100-105)", file: "manual 9.html", anchor: "cat-d" },
  ]))

  wrapper.appendChild(sec("Anexos", [
    { label: "Anexo A — Indice Maestro de Codigos", file: "manual 91.html", anchor: "anexo-a" },
    { label: "Anexo B — Plantillas de Registro de Sesion", file: "manual 91.html", anchor: "anexo-b" },
    { label: "Anexo C — Glosario de Terminos Clinicos", file: "manual 91.html", anchor: "anexo-c" },
    { label: "Palabras Finales y Colofon", file: "manual 91.html", anchor: "cierre" },
  ]))

  container.appendChild(wrapper)
  restaurarEstadoManual()
}

// ---- indice maestro ----

function renderIndiceMaestro() {
  $("#app").appendChild($("#tpl-indice-maestro").content.cloneNode(true))
  $("#btn-back").hidden = false

  const lista = $("#im-lista")
  // version marker for debugging
  const versionTag = document.createElement("div")
  versionTag.style.cssText = "font-size:0.7rem;color:var(--muted);margin-bottom:0.5rem"
  versionTag.textContent = "indice v3 — click en ▶ para expandir"
  lista.before(versionTag)
  const mazos = Object.values(state.mazos)

  // Mostrar la carta si se venia viendo una
  let mostrarCarta = null

  function mostrarCartaIndice(carta, mazoId) {
    mostrarCarta = { carta, mazoId }
    const mazo = state.mazos[mazoId]
    if (!mazo) return

    const img = document.getElementById("im-carta-imagen")
    if (img) {
      img.src = `assets/img/${mazo.numero}/${carta.codigo}.jpg`
      img.alt = carta.codigo
      img.onload = () => { img.style.display = "block" }
      img.onerror = () => { img.style.display = "none" }
      img.style.display = "block"
      img.onclick = () => abrirModal(img)
    }

    const setText = (id, val) => {
      const el = document.getElementById(id)
      if (el) el.textContent = val ?? ""
    }
    setText("im-carta-codigo-overlay", carta.codigo)
    setText("im-carta-codigo", carta.codigo)
    setText("im-carta-pregunta", carta.pregunta)
    setText("im-carta-objetivo", carta.objetivo || "")
    setText("im-carta-tarea", carta.tarea)
    poblarLista("im-carta-profundizacion", carta.profundizacion)
    poblarLista("im-carta-observacion", carta.observacion)
    poblarLista("im-carta-intervenciones", carta.intervenciones)

    const imLista = document.getElementById("im-lista")
    if (imLista) imLista.style.display = "none"
    const imCartaView = document.getElementById("im-carta-view")
    if (imCartaView) imCartaView.hidden = false
  }

  function volverAlIndice() {
    mostrarCarta = null
    document.getElementById("im-lista").style.display = "flex"
    document.getElementById("im-carta-view").hidden = true
  }

  $("#btn-im-volver").addEventListener("click", volverAlIndice)

  // Render por mazo
  for (const mazo of mazos) {
    const block = document.createElement("div")
    block.className = "im-mazo-block"

    const header = document.createElement("div")
    header.className = "im-mazo-header"
    header.textContent = `▶ Mazo ${mazo.numero} — ${mazo.nombre}`
    header.style.cursor = "pointer"
    block.appendChild(header)

    if (mazo.descripcion) {
      const desc = document.createElement("div")
      desc.className = "im-mazo-desc"
      desc.textContent = mazo.descripcion
      block.appendChild(desc)
    }

    const list = document.createElement("div")
    list.className = "im-card-list"
    list.style.display = "none"

    for (const carta of mazo.cartas) {
      const item = document.createElement("div")
      item.className = "im-card-item"

      const codigo = document.createElement("span")
      codigo.className = "im-card-item-codigo"
      codigo.textContent = carta.codigo
      item.appendChild(codigo)

      const objetivo = document.createElement("span")
      objetivo.className = "im-card-item-objetivo"
      objetivo.textContent = carta.objetivo || "(sin objetivo)"
      item.appendChild(objetivo)

      item.addEventListener("click", (e) => {
        e.stopPropagation()
        mostrarCartaIndice(carta, mazo.id)
      })
      list.appendChild(item)
    }

    header.addEventListener("click", () => {
      const isHidden = list.style.display === "none"
      list.style.display = isHidden ? "flex" : "none"
      header.textContent = `${isHidden ? "\u25BC" : "\u25B6"} Mazo ${mazo.numero} — ${mazo.nombre}`
    })

    block.appendChild(list)
    lista.appendChild(block)
  }
}

// ---- historial de sesion (read-only) ----

function renderHistorialSesion() {
  const pac = getPaciente()
  const sesion = getSesion()
  if (!pac || !sesion) { state.vistaT = "paciente"; renderTerapeuta(); return }

  $("#app").appendChild($("#tpl-historial-sesion").content.cloneNode(true))

  $("#hs-paciente-nombre").textContent = pac.nombre
  $("#hs-fecha").textContent = formatearFecha(sesion.fecha)

  $("#btn-back").hidden = false

  // notas de sesion
  const notasBloque = $("#hs-notas-sesion")
  if (sesion.notas) {
    notasBloque.textContent = sesion.notas
  } else {
    notasBloque.innerHTML = '<span class="muted">Sin notas registradas.</span>'
  }

  // cartas
  const container = $("#hs-lista-cartas")
  container.innerHTML = ""

  if (!sesion.cartas.length) {
    container.innerHTML = '<div class="empty-state"><p>No se asignaron cartas en esta sesion.</p></div>'
    return
  }

  for (const c of sesion.cartas) {
    const mazo = state.mazos[c.mazoId]
    const div = document.createElement("div")
    div.className = "sv-carta-asignada"
    div.innerHTML = `
      <div class="sv-carta-asignada-head">
        <span>${c.codigo}</span>
        <span class="mazo-label">${mazo?.nombre || c.mazoId}</span>
      </div>
      ${c.notas ? `<div style="font-size:0.9rem;white-space:pre-wrap">${escapeHtml(c.notas)}</div>` : '<span class="muted" style="font-size:0.85rem">Sin notas</span>'}
    `
    container.appendChild(div)
  }
}

// ============== HELPERS ==============

function poblarLista(id, items) {
  const el = document.getElementById(id)
  if (!el) return
  if (!items || !items.length) { el.hidden = true; return }
  el.hidden = false
  let ul = el.querySelector("ul")
  if (!ul) { ul = document.createElement("ul"); el.appendChild(ul) }
  ul.innerHTML = items.map(i => `<li>${escapeHtml(i)}</li>`).join("")
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

document.addEventListener("DOMContentLoaded", init)
