const FS_COL_PACIENTES = "pacientes"
const FS_COL_HISTORIAL = "historial"
const FS_COL_TERAPEUTAS = "terapeutas"

function fsUser() {
  return auth.currentUser?.uid || null
}

function fsPath(uid) {
  return fsUser() ? `${FS_COL_PACIENTES}/${uid}` : null
}

async function fsCargarPacientes() {
  const uid = fsUser()
  if (!uid) return null
  try {
    const doc = await db.collection(FS_COL_PACIENTES).doc(uid).get()
    if (doc.exists) {
      const data = doc.data()
      return data.pacientes || []
    }
    return []
  } catch (e) {
    console.warn("Firestore error cargando pacientes:", e.message)
    return null
  }
}

async function fsCargarPacientesDe(uid) {
  if (!uid) return null
  try {
    const doc = await db.collection(FS_COL_PACIENTES).doc(uid).get()
    if (doc.exists) return doc.data().pacientes || []
    return []
  } catch (e) {
    console.warn("Firestore error cargando pacientes de", uid, ":", e.message)
    return null
  }
}

async function fsGuardarPacientes(pacientes) {
  const uid = fsUser()
  if (!uid) return false
  try {
    await db.collection(FS_COL_PACIENTES).doc(uid).set({ pacientes, updatedAt: new Date().toISOString() })
    return true
  } catch (e) {
    console.warn("Firestore error guardando pacientes:", e.message)
    return false
  }
}

async function fsCargarHistorial() {
  const uid = fsUser()
  if (!uid) return null
  try {
    const doc = await db.collection(FS_COL_HISTORIAL).doc(uid).get()
    if (doc.exists) {
      return doc.data().historial || {}
    }
    return {}
  } catch (e) {
    console.warn("Firestore error cargando historial:", e.message)
    return null
  }
}

async function fsGuardarHistorial(historial) {
  const uid = fsUser()
  if (!uid) return false
  try {
    await db.collection(FS_COL_HISTORIAL).doc(uid).set({ historial, updatedAt: new Date().toISOString() })
    return true
  } catch (e) {
    console.warn("Firestore error guardando historial:", e.message)
    return false
  }
}

async function fsCargarTerapeuta() {
  const uid = fsUser()
  if (!uid) return null
  try {
    const doc = await db.collection(FS_COL_TERAPEUTAS).doc(uid).get()
    console.log("fsCargarTerapeuta: existe =", doc.exists, "data =", doc.exists ? !!doc.data().passwordUpdatedAt : "null")
    return doc.exists ? doc.data() : null
  } catch (e) {
    console.warn("Firestore error cargando terapeuta:", e.message)
    return null
  }
}

const FS_COL_CODIGOS = "active_codes"

async function fsGuardarCodigoActivo(code, data) {
  try {
    await db.collection(FS_COL_CODIGOS).doc(code).set({
      code,
      terapeutaId: data.terapeutaId,
      sesionId: data.sesionId,
      pacienteId: data.pacienteId,
      pacienteNombre: data.pacienteNombre,
      habilitada: data.habilitada,
      cartas: data.cartas || [],
      updatedAt: new Date().toISOString(),
    })
    return true
  } catch (e) {
    console.warn("Firestore error guardando codigo activo:", e.message)
    return false
  }
}

async function fsEliminarCodigoActivo(code) {
  try {
    await db.collection(FS_COL_CODIGOS).doc(code).delete()
    return true
  } catch (e) {
    console.warn("Firestore error eliminando codigo activo:", e.message)
    return false
  }
}

async function fsBuscarCodigoActivo(code) {
  try {
    const doc = await db.collection(FS_COL_CODIGOS).doc(code).get()
    if (doc.exists) return doc.data()
    return null
  } catch (e) {
    console.warn("Firestore error buscando codigo activo:", e.message)
    return null
  }
}

async function fsMarcarClaveActualizada() {
  const uid = fsUser()
  if (!uid) return false
  try {
    console.log("fsMarcarClaveActualizada: uid =", uid)
    await db.collection(FS_COL_TERAPEUTAS).doc(uid).set({
      passwordUpdatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true })
    console.log("fsMarcarClaveActualizada: OK")
    return true
  } catch (e) {
    console.warn("Firestore error marcando clave:", e.message)
    return false
  }
}
