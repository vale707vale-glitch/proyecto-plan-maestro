# Proyecto MOSAICO — Distribución y Ventas

## Modelo de licencia por terapeuta

Cada terapeuta compra una licencia. La app es la misma para todos, el acceso se controla con una clave única que vos generás.

---

## Opciones de validación

### Opción A (recomendada): Validación única con servidor mínimo

**Cómo funciona:**
- Comprás un dominio barato (ej. mosaicocartas.com, ~10 USD/año)
- Creás un Worker gratis en Cloudflare (0 USD, 100k peticiones/día)
- El Worker tiene una lista de claves válidas en texto plano
- La app, al abrirse por primera vez, pide la clave, la envía al Worker, este responde "ok" o "no"
- Si es ok, la app guarda en localStorage y nunca más vuelve a pedir
- Si alguien pasa su clave a otro, vos desde el Worker la desactivás y la app deja de funcionar

**Costo:** ~10 USD/año (solo el dominio)
**Capacidad:** miles de terapeutas sin problema
**Control:** total — desactivás claves al instante

### Opción B: Sin servidor (validación local)

- Cada build de la app tiene hardcodeada una clave
- Validación 100% offline
- No podés revocar una clave una vez distribuida

**No recomendada para venta.** Útil solo para distribución gratuita o prototipos.

---

## Flujo de venta

1. Terapeuta compra (transferencia, MercadoPago, etc.)
2. Le generás una clave: `MOSAICO-XXXX-YYYY`
3. Le enviás por email:
   - Link de descarga de la app
   - Su clave de activación
4. Él abre la app, ingresa la clave, valida 1 vez y la usa de por vida

---

## Formas de distribuir la app

### Web app (recomendada)
- Hosteás la app en Cloudflare Pages (gratis) o Vercel (gratis)
- El terapeuta accede desde cualquier dispositivo desde el navegador
- Le ponés la clave al inicio y listo
- **Ventaja**: actualizaciones instantáneas, no instala nada, compatible celular/PC/tablet

### App "instalable" (PWA)
- Misma web app pero con un manifest.json y service worker
- El usuario la agrega a la pantalla de inicio como si fuera una app nativa
- Sin pasar por Google Play/App Store

### Aplicación nativa (electron / contenedor)
- Le das un .exe o .dmg descargable
- Más engorroso de distribuir y actualizar
- Solo recomendable si querés distribución sin internet

---

## Precio sugerido

Modelo típico para herramientas clínicas de este tipo:
- **Licencia individual (1 terapeuta):** 30-50 USD (pago único, actualizaciones incluidas por 1 año)
- **Licencia grupal (hasta 5 terapeutas):** 100-150 USD
- **Actualización mayor (nuevos mazos, features grandes):** 15-25 USD

---

## Consideraciones legales

- Cada clave es personal e intransferible
- Si detectás uso compartido, desactivás la clave sin reembolso
- Incluí esto en los términos al momento de la compra
