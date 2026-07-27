const CACHE = "mosaico-v15"

const PRECACHE = [
  "./",
  "manifest.json",
  "firebase-service.js",
  "logo.png",
  "data/mazo-la-puerta.json",
  "data/mazo-emociones.json",
  "data/mazo-historia-personal.json",
  "data/mazo-creencias.json",
  "data/mazo-sombras.json",
  "data/mazo-relaciones.json",
  "data/mazo-el-cuerpo-habla.json",
  "data/mazo-decisiones.json",
  "data/mazo-recursos.json",
  "data/mazo-futuro.json",
  "data/mazo-metaforas.json",
  "data/mazo-desafios-terapeuticos.json",
  "data/mazo-cartas-del-terapeuta.json",
]

const CRITICAL = ["index.html", "styles.css", "app.js", "service-worker.js", "firebase-service.js"]

self.addEventListener("install", (e) => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE))
  )
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url)
  if (e.request.method !== "GET") return

  if (CRITICAL.some((p) => url.pathname.endsWith(p) || url.pathname === "/" + p)) {
    e.respondWith(networkFirst(e.request))
    return
  }

  if (url.pathname.includes("/assets/img/")) {
    e.respondWith(cacheFirstThenNetwork(e.request))
    return
  }

  if (PRECACHE.some((p) => url.pathname.endsWith(p.replace("./", "")) || url.pathname === p)) {
    e.respondWith(cacheFirst(e.request))
    return
  }

  e.respondWith(networkFirst(e.request))
})

async function cacheFirst(req) {
  const hit = await caches.match(req)
  return hit || fetchAndCache(req)
}

async function networkFirst(req) {
  try {
    return await fetchAndCache(req)
  } catch {
    const hit = await caches.match(req)
    return hit || new Response("Offline", { status: 503 })
  }
}

async function cacheFirstThenNetwork(req) {
  const hit = await caches.match(req)
  if (hit) {
    fetchAndCache(req).catch(() => {})
    return hit
  }
  return fetchAndCache(req)
}

async function fetchAndCache(req) {
  const res = await fetch(req)
  if (res.ok) {
    const clone = res.clone()
    caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {})
  }
  return res
}
