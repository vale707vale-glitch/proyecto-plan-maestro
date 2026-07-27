# Proyecto MOSAICO — Plan de Trabajo

## Estado actual (2026-07-24)
- [x] Mazo 1 (La Puerta): 60 cartas + JSON + imagenes full/thumb
- [x] Mazos 2-13: contenido clínico en HTMLs
- [x] Parser universal: 3 templates (Tailwind, Terracota, Purple) → 13 JSONs, 750 cartas
- [x] Estandarización de imágenes: todas renombradas a PREFIX-NN.jpg, PNGs convertidos a JPEG
- [x] Limpieza: archivos R-* intrusos eliminados, Nueva carpeta/ borrada, nested imagenes/ eliminado
- [x] Optimización de imágenes (Pillow): Mazos 2, 4-13 completados (~40% reducción)
- [x] Copia a app: 13/13 mazos con imágenes en assets/img/ (750 imágenes)

## Decisiones tomadas

### 2026-07-24
- Producto: dos versiones de venta (mazo individual + mosaico completo)
- Formato: PWA con Service Worker (offline, instalable, vendible directo)
- Optimización de imágenes obligatoria (800x1200 / 1200x800, JPEG 82, thumbs)
- **Notas del terapeuta: LOCALES con IndexedDB** (sin backend, sin nube)
- **Login del terapeuta: PIN de 4-6 dígitos** (hash, no plain text)
- **Selección manual de carta** (buscar por código o navegar) + mantener "robar al azar"
- Privacidad: advertir al terapeuta que respalde; ofrecer exportar/importar JSON

### Producto: dos versiones de venta
1. **Mazo individual** (PWA standalone, un mazo por descarga)
2. **Mosaico completo** (PWA que une los 13 mazos, navegación transversal)

Ambas versiones comparten el mismo motor de UI y la misma fuente de contenido (JSON por mazo). La diferencia es el dataset que cargan.

### Formato de entrega: PWA
- Funciona en Android, iOS y desktop.
- Se "instala" en el celular sin tienda (Add to Home Screen).
- Permite venta directa sin intermediarios (transferencia, MercadoPago, Stripe).
- Service Worker para uso offline y cache de imágenes.
- Opción futura: convertir a APK con Bubblewrap/PWABuilder para Play Store.

### Optimización de imágenes (OBLIGATORIA para viabilidad)
**Problema actual:** Mazo 1 pesa 189 MB (60 cartas, ~3.2 MB promedio). Extrapolado a 750 cartas = ~2.4 GB. Inviables para celular.

**Plan de normalización:**

| Estado | Resolución | Peso objetivo | Uso |
|---|---|---|---|
| Original (actual) | Variable, alta | 700 KB - 4.8 MB | Solo backup en `_original/` |
| Full optimizado | Vertical 800×1200 / Horizontal 1200×800 | 150-250 KB | Vista de carta en app |
| Thumbnail | 300×450 / 450×300 | 20-40 KB | Listados, carga inicial |

- Formato: JPEG calidad 82 (visualmente idéntico, ~80% menos peso).
- Detectar orientación por imagen (vertical/horizontal) y asignar tamaño correspondiente.
- 750 cartas full + thumbs = **~150-180 MB total** (manejable para PWA con lazy-load).

### Arquitectura confirmada

```
mosaico/
├── tienda/                       (landings de venta)
│   ├── mazo-individual/
│   └── mosaico-completo/
├── mazos/
│   ├── mazo-1-la-puerta/         (PWA standalone, vende 1 mazo)
│   │   ├── index.html
│   │   ├── manifest.json
│   │   ├── sw.js
│   │   ├── mazo-1-la-puerta.json
│   │   └── imagenes/
│   │       ├── full/P-01.jpg ... P-60.jpg
│   │       ├── thumb/P-01.jpg ... P-60.jpg
│   │       └── _original/        (backup de originales sin tocar)
│   ├── mazo-2-emociones/
│   └── ... (13 mazos)
└── mosaico-completo/             (PWA que une los 13 mazos)
    ├── index.html
    ├── manifest.json
    ├── sw.js
    ├── mazos/                    (referencias a los 13 JSON)
    └── imagenes/                 (referencias cruzadas)
```

## Arquitectura de la app

### Stack
- Frontend: PWA (HTML + Tailwind + JS vanilla o framework ligero)
- Backend: NO (decisión 2026-07-24, notas locales)
- Almacenamiento local:
  - **IndexedDB** para notas clínicas (pacientes, sesiones, notas)
  - **Cache Storage / Service Worker** para imágenes de cartas y JSON
  - **LocalStorage** solo para PIN hash + preferencias UI

### Roles y visibilidad

| Elemento | Terapeuta | Paciente |
|---|---|---|
| Pregunta central | ✅ | ✅ |
| Objetivo clínico | ✅ | ❌ |
| Profundización | ✅ | ❌ |
| Observación clínica | ✅ | ❌ |
| Intervenciones | ✅ | ❌ |
| Tarea terapéutica | ✅ | ✅ |
| Historial de sesiones | ✅ (todos) | ✅ (propio) |
| Manual clínico | ✅ | ❌ |
| Cartas del terapeuta | ✅ | ❌ |

## Funcionalidades core

### 1. Exploración de cartas
- [ ] Navegación por los 13 mazos
- [ ] Filtros: por mazo, código, icono clínico, texto libre
- [ ] Vista detalle de cada carta (según rol)

### 2. Modo "robar carta" + selección manual
- [ ] Carta al azar del mazo completo
- [ ] Carta al azar de un mazo específico
- [ ] **Selección manual: buscador por código (P-01, E-05...) o por texto**
- [ ] **Navegación por mazo para elegir carta específica**
- [ ] Vista paciente: imagen + código + pregunta central + tarea
- [ ] El terapeuta busca por código en su panel y ve contenido clínico completo
- [ ] Animación de "voltear" o "revelar" la carta

### 3. Sesiones y archivado (LOCAL con IndexedDB)
- [ ] CRUD de pacientes (nombre, fecha de alta, notas generales)
- [ ] Terapeuta selecciona carta (manual o al azar) y la asigna a paciente
- [ ] Notas por carta trabajada (texto libre, fecha automática)
- [ ] Sesiones con fecha y lista de cartas trabajadas
- [ ] **PIN de terapeuta** (4-6 dígitos, hash) para acceder a notas
- [ ] **Exportar/importar JSON** para backup manual
- [ ] Recordatorio de backup si nunca exportó

### 4. Sistema de tareas
- [ ] Paciente ve tarea pendiente
- [ ] Marca como completada
- [ ] Escribe reflexión breve
- [ ] Exportar tarea a PDF

### 5. Historial
- [ ] Paciente ve su historial de cartas trabajadas
- [ ] Terapeuta ve historial de todos sus pacientes (filtrable por paciente)

## Funcionalidades extra (a evaluar)
- [ ] Tirada combinada de cartas
- [ ] Registro emocional del paciente con gráficos
- [ ] Diario del paciente
- [ ] Modo offline (Service Worker)
- [ ] Sugerencias con IA
- [ ] Versión pública sin login (carta del día)

## Modelo de venta (a definir precios)
| Producto | Contenido | Precio (definir) |
|---|---|---|
| Mazo individual | 1 mazo (~60 cartas) + PWA | $X |
| Mosaico completo | 13 mazos (~780 cartas) + PWA maestro | $Y |

**Canales de venta posibles:**
- Directo: transferencia/MercadoPago + envío de link de PWA
- Web propia: landing + pasarela de pago + acceso automático
- Play Store: APK generado desde PWA (Bubblewrap)

## Estructura del contenido
- `1 la puerta inicio de sesion/` — Mazo 1: P-01 a P-60 ✅
- `2 emociones/` — Mazo 2: E-01 a E-60
- `3 historia personal/` — Mazo 3: H-01 a H-60
- `4 creencias/` — Mazo 4: C-01 a C-60
- `5 sombras/` — Mazo 5: S-01 a S-60
- `6 relaciones/` — Mazo 6: R-01 a R-60
- `7 el cuerpo habla/` — Mazo 7: U-01 a U-60
- `8 decisiones/` — Mazo 8: D-01 a D-60
- `9 recursos/` — Mazo 9: RE-01 a RE-60
- `10 futuro/` — Mazo 10: F-01 a F-60
- `11 metáforas/` — Mazo 11: M-01 a M-60
- `12 desafíos terapéuticos/` — Mazo 12
- `13 cartas del terapeuta/` — Mazo 13: T-01 a T-60
- `manual/` — 10 capítulos del manual clínico
- `indice maestro/` — Índice de códigos

## Próximos pasos (orden sugerido)
1. ✅ ~~Crear script de optimización de imágenes (Python con Pillow)~~
2. ✅ ~~Probar optimización en Mazo 1 como piloto, validar peso y calidad~~
3. ✅ ~~Aplicar optimización a todos los mazos existentes~~
4. ✅ ~~Parsear HTML de mazos 2-13 a JSON (parser universal con 3 templates)~~
5. ✅ ~~Estandarizar nombres de imágenes y limpiar duplicados~~
6. ~~**Completar imágenes faltantes**~~ — RESUELTO. 13/13 mazos completos.
7. **Definir stack PWA definitivo** (vanilla vs framework ligero)
8. **Crear plantilla PWA base** (HTML + manifest + service worker)
9. **Migrar Mazo 1** a la plantilla PWA
10. **Diseñar schema IndexedDB** (pacientes, sesiones, notas)
11. **Implementar módulo de notas locales** (CRUD sobre IndexedDB)
12. **Implementar login con PIN** (hash, intentos limitados)
13. **Construir UI terapeuta** (pacientes, notas, selección manual de carta)
14. **Implementar selección manual de carta** (buscador + navegación)
15. Replicar plantilla para los 12 mazos restantes
16. **Construir PWA mosaico completo** (índice de los 13 mazos)
17. Diseñar landings de venta
18. **Documentar y agregar backup** (exportar/importar JSON)
19. Probar instalación y uso offline en celular real
