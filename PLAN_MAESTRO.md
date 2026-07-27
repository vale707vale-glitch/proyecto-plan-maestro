# Proyecto MOSAICO — Plan Maestro

Documento único de referencia. Cubre contenido, app, distribución y ventas.

---

## 1. Estado actual (al 2026-07-24)

### Contenido clínico
- [x] Mazo 1 "La Puerta" — completo, 60 cartas (P-01 a P-60)
- [x] Mazo 2 "Emociones" — 60 cartas (E-01 a E-60)
- [x] Mazo 3 "Historia Personal" — 60 cartas (H-01 a H-60)
- [x] Mazo 4 "Creencias" — 60 cartas (C-01 a C-60)
- [x] Mazo 5 "Sombras" — 60 cartas (S-01 a S-60)
- [x] Mazo 6 "Relaciones" — 60 cartas (R-01 a R-60)
- [x] Mazo 7 "El Cuerpo Habla" — 60 cartas (B-01 a B-60)
- [x] Mazo 8 "Decisiones" — 60 cartas (D-01 a D-60)
- [x] Mazo 9 "Recursos" — 60 cartas (RE-01 a RE-60)
- [x] Mazo 10 "Futuro" — 60 cartas (F-01 a F-60)
- [x] Mazo 11 "Metáforas" — 60 cartas (M-01 a M-60)
- [x] Mazo 12 "Desafíos Terapéuticos" — 60 cartas (DT-01 a DT-60)
- [x] Mazo 13 "Cartas del Terapeuta" — 30 cartas (T-01 a T-30)
- [ ] Capítulos 11-12 del manual clínico — pendientes

### Imágenes
- [x] Mazo 1: 60 imágenes optimizadas
- [x] Mazo 2: 60 imágenes optimizadas
- [x] Mazo 3: 60 imágenes optimizadas
- [x] Mazo 4: 60 imágenes optimizadas
- [x] Mazo 5: 60 imágenes optimizadas
- [x] Mazo 6: 60 imágenes optimizadas
- [x] Mazo 7: 60 imágenes optimizadas
- [x] Mazo 8: 60 imágenes optimizadas
- [x] Mazo 9: 60 imágenes optimizadas
- [x] Mazo 10: 60 imágenes optimizadas
- [x] Mazo 11: 60 imágenes optimizadas
- [x] Mazo 12: 60 imágenes optimizadas
- [x] Mazo 13: 30 imágenes optimizadas

### App
- [x] Migrar HTML del mazo 1 a JSON estructurado → `parsear_a_json.py` + `mazo-1-la-puerta.json` (60 cartas, 7 campos).
- [x] Renombrar imágenes del Mazo 1 por código de carta (P-01.jpg ... P-60.jpg) — script `renombrar.py` + backup.
- [x] **Parser universal** `parsear_todos_mazos.py` — detecta 3 templates HTML, genera JSONs de los 13 mazos (750 cartas total).
- [x] **Estandarización de imágenes** `estandarizar_imagenes.py` — renombra todas a PREFIX-NN.jpg, convierte PNGs, elimina duplicados y basura.
- [x] **Optimización de imágenes** aplicada a Mazos 2, 4-13 (~40% reducción de peso).
- [x] Frontend mínimo viable: `app/index.html` + `app.js` + `styles.css`. Login con dos roles, robar carta, buscador por código, ficha clínica completa.
- [x] `app.js` actualizado para cargar los 13 mazos dinámicamente.
- [ ] Sistema de licencias (Cloudflare Worker).
- [ ] Versión pública "carta del día".
- [ ] PWA completa (manifest + service worker).
- [ ] Publicación (Cloudflare Pages).

---

## 2. Arquitectura del producto

### Vista paciente (mobile-first)
- Botón "Robar carta" (mazo entero o filtrado por categoría)
- Muestra: imagen + código (P-01) + pregunta central + tarea terapéutica
- Tarea: marcar como hecha + reflexión breve
- Historial propio de cartas trabajadas
- Exportar tarea a PDF

### Vista terapeuta (PC/tablet)
- Buscador por código (P-01) → ficha clínica completa
- Selección de paciente + cartas usadas en sesión + notas
- Manual clínico embebido
- Acceso exclusivo al Mazo 13 (Cartas del Terapeuta)
- Historial agregado de todos sus pacientes

### Roles y visibilidad

| Elemento | Terapeuta | Paciente |
|---|---|---|
| Pregunta central | sí | sí |
| Objetivo clínico | sí | no |
| Profundización | sí | no |
| Observación clínica | sí | no |
| Intervenciones | sí | no |
| Tarea terapéutica | sí | sí |
| Historial de sesiones | todos | propio |
| Manual clínico | sí | no |
| Cartas del terapeuta (Mazo 13) | sí | no |

### Stack técnico
- **Frontend:** HTML/CSS/JS plano o Vue sin build. Hosteado en Cloudflare Pages (gratis).
- **Imágenes:** Cloudflare R2 (gratis hasta 10 GB) o assets estáticos en Pages.
- **Datos clínicos:** un solo JSON maestro con los 13 mazos.
- **Backend de licencias:** Cloudflare Worker (gratis, 100k peticiones/día).
- **Base de datos de pacientes (futuro):** posponer. MVP usa `localStorage` por terapeuta. Migrar a Supabase o PocketBase si se necesita sync entre dispositivos.

---

## 3. Modelo de negocio

### Licencia por terapeuta
Cada terapeuta compra una licencia. La app es la misma para todos, el acceso se controla con una clave única.

### Precios sugeridos

| Producto | Precio | Notas |
|---|---|---|
| Licencia individual | 40-50 USD | Pago único, actualizaciones gratuitas 1 año |
| Licencia grupal (hasta 5 terapeutas) | 150 USD | Para clínicas o equipos |
| Actualización mayor | 15-25 USD | Nuevos mazos, features grandes, después del año 1 |
| Carta del día (web pública) | gratis | Embudo de venta |

### Validación de licencia

**Opción A (recomendada): Cloudflare Worker**

- Dominio propio: ~10 USD/año
- Worker con lista de claves válidas en texto plano
- La app, al abrirse por primera vez, pide la clave, la envía al Worker, este responde ok/no
- Si es ok, la app guarda en `localStorage` y nunca más vuelve a pedir
- Si alguien pasa su clave a otro, se desactiva desde el Worker y la app deja de funcionar
- **Costo:** ~10 USD/año. **Capacidad:** miles de terapeutas. **Control:** total.

**Opción B (no recomendada para venta): validación local**
- Cada build tiene hardcodeada una clave. Sin servidor. No se puede revocar.
- Útil solo para distribución gratuita o prototipos.

### Flujo de venta

1. Terapeuta compra (Hotmart, Gumroad, Mercado Pago o transferencia directa)
2. Se genera una clave: `MOSAICO-XXXX-YYYY`
3. Se envía por email: link de descarga + clave de activación
4. El terapeuta abre la app, ingresa la clave, valida 1 vez, la usa de por vida

### Términos legales
- Cada clave es personal e intransferible
- Si se detecta uso compartido, se desactiva sin reembolso
- Incluir esto en los términos al momento de la compra

---

## 4. Canales de distribución y venta

### Formas de entregar la app

| Forma | Costo | Ventaja | Desventaja |
|---|---|---|---|
| Web app (Cloudflare Pages) | 0 | Actualizaciones instantáneas, sin instalar, todo dispositivo | Requiere internet |
| PWA (misma web + manifest) | 0 | Se instala como app nativa, sin Play/App Store | Requiere internet |
| App nativa (.exe / .dmg) | horas de build | Uso offline | Engorroso de distribuir y actualizar |

**Recomendación:** web app con PWA. Cubre 95% de los casos.

### Canales de venta sin costo fijo

1. **Carta del día gratuita** en web pública. La gente la prueba, se enamora, compra la versión terapeuta.
2. **Instagram/TikTok del creador** mostrando una carta por día. Bio con link de venta.
3. **YouTube Shorts** explicando una técnica con una carta. Embudo natural hacia la licencia.
4. **Grupos de Facebook de psicólogos** (varios grandes en español). Presencia genuina, no spam.
5. **Marketplace** (Hotmart / Gumroad / Mercado Pago Digital) para cobrar automático y entregar clave. Comisión: 5-10% por venta.

### Costo total mensual

| Concepto | Costo |
|---|---|
| Dominio (.com, anual) | ~10 USD/año |
| Cloudflare Pages + Worker + R2 | 0 |
| Hotmart/Gumroad | % por venta |
| **Total fijo** | **< 1 USD/mes** |

---

## 5. Roadmap

### Fase 0 — Prototipo vendible (con mazo 1)
*Objetivo: validar que un terapeuta paga por esto antes de invertir meses en los otros mazos.*

1. Renombrar imágenes del mazo 1 por código (P-01.jpg, P-02.jpg, ...)
2. Optimizar imágenes: 1K (1024px) + WebP, ~200-400 KB cada una
3. Script para parsear el HTML del mazo 1 → JSON estructurado
4. Frontend mínimo: `index.html` con "Robar carta" + buscador por código
5. Landing page pública con "Carta del día" (atractor gratuito)
6. Cloudflare Worker para validar claves
7. Publicar en Hotmart o Gumroad
8. Empezar a publicar en redes (1 carta por día)

### Fase 1 — Mazo completo del terapeuta
*Objetivo: producto completo con los 13 mazos.*

9. Generar imágenes de mazos 2-13 (mismo proveedor que el mazo 1)
10. Escribir contenido clínico de mazos 2-13 (replicar estructura del mazo 1)
11. Completar capítulos 11-12 del manual
12. Actualizar el JSON maestro
13. Las licencias vendidas en Fase 0 reciben los mazos nuevos como actualización gratuita durante el primer año

### Fase 2 — Features adicionales
*Evaluar según demanda real, no por especulación.*

- Sesiones y archivado por paciente
- Notas del terapeuta por carta usada
- Sistema de tareas completo (marcar, reflexionar, exportar)
- Registro emocional con gráficos
- Diario del paciente
- Tiradas combinadas (varias cartas a la vez)
- Sync entre dispositivos (Supabase/PocketBase)
- Sugerencias con IA

---

## 6. Próximos pasos inmediatos

En orden de prioridad:

1. ~~**Renombrar imágenes del mazo 1** — script bash/PowerShell con la tabla de mapeo~~ — COMPLETADO.
2. ~~**Convertir HTML del mazo 1 a JSON** — script de parsing~~ — COMPLETADO.
3. ~~**Frontend mínimo** — una sola página con "Robar carta" y buscador~~ — COMPLETADO.
4. ~~**Parser universal para mazos 2-13** — 3 templates detectados, 750 cartas en JSON~~ — COMPLETADO.
5. ~~**Estandarizar y optimizar imágenes** de mazos 2-13~~ — COMPLETADO (excepto Mazo 3 sin imágenes).
6. **Completar imágenes faltantes** — Mazo 3 (60 imágenes), Mazo 2 (4 faltantes), Mazo 9 (3 faltantes).
7. **PWA completa** — manifest + service worker + offline.
8. **Landing + carta del día pública** — para empezar a captar terapeutas.
9. **Cloudflare Worker** para validar claves de licencia reales.

---

## 7. Pendientes (al cerrar sesión 2026-07-24)

### Hecho desde la última sesión
- [x] Parser universal para 13 mazos (3 templates HTML detectados automáticamente) → 750 cartas en JSON
- [x] Estandarización de imágenes: renombrado masivo a PREFIX-NN.jpg, PNG→JPEG, limpieza de duplicados y carpetas basura
- [x] Optimización de imágenes aplicada a los 13 mazos (~40-78% reducción de peso)
- [x] 13/13 mazos con imágenes en `app/assets/img/` (750 imágenes, 0 faltantes)
- [x] `app.js` actualizado para cargar los 13 mazos dinámicamente

### Decisión pendiente del autor / trabajo futuro inmediato
- [ ] **PWA completa:** manifest.json, service worker con cache offline, splash screen, iconos.
- [ ] **Landing + carta del día pública** para captar terapeutas (atractor gratuito).
- [ ] **Cloudflare Worker** para validar claves de licencia reales.

### Listo para ejecutar cuando se desbloquee lo anterior
- [ ] **PWA completa:** manifest.json, service worker, iconos, splash screen.
- [ ] **Módulo de notas locales** con IndexedDB (CRUD pacientes, sesiones, notas por carta).
- [ ] **Login con PIN de terapeuta** (4-6 dígitos, hash, intentos limitados).
- [ ] **UI terapeuta completa** (panel de pacientes, selección manual de carta, historial).
- [ ] **Cloudflare Worker** para validar claves de licencia reales.
- [ ] **Landing + carta del día pública** para captar terapeutas (atractor gratuito).
- [ ] **Publicar** en Hotmart o Gumroad con flujo de venta automático.

### Trabajo futuro (Fase 1)
- [ ] Generar imágenes para mazos 2-13.
- [ ] Escribir contenido clínico de mazos 2-13 replicando la estructura del mazo 1 (60 cartas por mazo, no 20 como decía el plan original — el mazo 1 es la plantilla).
- [ ] Completar capítulos 11-12 del manual clínico.
- [ ] Cargar JSON de mazos 2-13 en `app/data/`. La app ya está preparada para cargarlos dinámicamente.

### Trabajo futuro (Fase 2, evaluar demanda)
- [ ] Sesiones y archivado por paciente.
- [ ] Notas del terapeuta por carta usada.
- [ ] Sistema de tareas completo (marcar, reflexionar, exportar PDF).
- [ ] Registro emocional con gráficos.
- [ ] Diario del paciente.
- [ ] Tiradas combinadas.
- [ ] Sync entre dispositivos (Supabase/PocketBase).
- [ ] Sugerencias con IA.

### Archivos del proyecto

**Documentación:**
- `PLAN_MAESTRO.md` — este documento.
- `PLAN_DE_TRABAJO.md` — plan de trabajo detallado.
- `app/COMO_ENTRAR.md` — instrucciones para correr la app localmente.

**Scripts:**
- `parsear_todos_mazos.py` — parser universal para 13 mazos (3 templates HTML).
- `estandarizar_imagenes.py` — renombrado masivo y limpieza de imágenes.
- `optimizar_imagenes.py` — optimización a full/ y thumb/ con Pillow.
- `1 la puerta inicio de sesion/parsear_a_json.py` — parser original del Mazo 1.
- `1 la puerta inicio de sesion/imagenes/renombrar.py` — script original de renombrado.

**App:**
- `app/index.html` — entrada de la app.
- `app/app.js` — lógica (carga de 13 mazos, robo de carta, búsqueda, login).
- `app/styles.css` — estilos.
- `app/data/mazo-*.json` — 13 JSONs con las 750 cartas.
- `app/assets/img/<mazo-id>/` — imágenes optimizadas por mazo (12/13 mazos).
