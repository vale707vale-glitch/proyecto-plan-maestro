const FS_COL_PACIENTES = "pacientes"
const FS_COL_HISTORIAL = "historial"

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
