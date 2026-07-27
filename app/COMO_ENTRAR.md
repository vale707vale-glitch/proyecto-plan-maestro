# MOSAICO - Como entrar a la app

App web local, sin build, sin instalaciones.

## Requisitos

- Python 3 (cualquier version reciente). Si no lo tenes, bajalo de python.org.
- Un navegador moderno (Chrome, Edge, Firefox).

## Pasos exactos para que funcione

Estos son los pasos que andan. Si algo falla, ir a "Problemas comunes" al final.

### 1. Abrir PowerShell

Click derecho en el menu inicio -> "Terminal" o "Windows PowerShell".

### 2. Parar cualquier servidor anterior

Si ya corriste `python -m http.server` antes y te quedo abierto, abrilo y hace `Ctrl+C` para matarlo. Si no estas seguro, ignora este paso y segui.

### 3. Ir a la carpeta de la app

Pegar exactamente:

```
cd "C:\Users\roros\OneDrive\Desktop\Nueva carpeta\proyecto plan maestro\app"
```

La terminal tiene que terminar mostrando:

```
PS C:\Users\roros\OneDrive\Desktop\Nueva carpeta\proyecto plan maestro\app>
```

### 4. Levantar el servidor

```
python -m http.server 8765
```

La terminal tiene que responder:

```
Serving HTTP on :: port 8765 (http://[::]:8765/) ...
```

**Si dice "OSError: [WinError 10048]"** el puerto 8765 esta ocupado. Probar con otro:

```
python -m http.server 9001
```

Y usar ese puerto en el paso 5.

**No cerrar la terminal.** El servidor queda corriendo ahi.

### 5. Abrir en el navegador

La URL **tiene que incluir el archivo**, no solo localhost:

```
http://localhost:8765/index.html
```

(si usaste otro puerto, reemplazar 8765 por el que hayas puesto)

Deberia aparecer el login: un cuadro blanco con dos botones.

## Como usar la app

### Como paciente

1. Click en **"Entrar como paciente"**.
2. Elegi un mazo del selector (por ahora solo "La Puerta").
3. Toca **"Robar carta"**.
4. La carta muestra: imagen + codigo (P-01, etc.) + pregunta + tarea. El codigo aparece arriba de la imagen y abajo, para anotar o dictar al terapeuta.

### Como terapeuta

1. En el campo de clave escribir: **`MOSAICO-DEMO-0001`**
2. Click en **"Entrar como terapeuta"**.
3. Podes:
   - Escribir un codigo en el buscador (ej. `P-01`) y ver la ficha clinica completa.
   - Elegir un mazo y tocar **"Robar"** para sacar una carta al azar; el buscador se completa solo y aparece la ficha abajo.

### Cerrar sesion

Boton **"Cerrar sesion"** arriba a la derecha. Vuelve al login y limpia la sesion guardada.

## Para parar el servidor

`Ctrl+C` en la terminal donde esta corriendo.

## Estructura de la carpeta

```
app/
├── index.html       (la pagina que se abre en el navegador)
├── app.js           (logica)
├── styles.css       (estilos, mobile-first)
├── COMO_ENTRAR.md   (este archivo)
├── data/
│   └── mazo-1-la-puerta.json
└── assets/
    └── img/
        └── la-puerta/   (60 imagenes P-01.jpg ... P-60.jpg)
```

## Problemas comunes

### "Veo un listado de carpetas en vez del login"

El servidor esta corriendo desde otra carpeta. Volver al paso 2, parar el servidor (`Ctrl+C`), y repetir desde el paso 3 asegurandose de que la terminal termine en `...\app>`.

### "404 - File not found"

El servidor no encuentra `index.html`. Verificar que la URL sea `http://localhost:8000/index.html` (con el `/index.html` al final). Si sigue sin funcionar, ver "puerto ocupado" abajo.

### "No se pudo cargar el contenido"

El navegador no esta accediendo por servidor, sino abriendo el archivo directo (file://). Eso bloquea el `fetch` al JSON. La pantalla de login anda pero "Robar carta" falla. Volver al paso 3 y abrir la app con la URL `http://localhost:8000/index.html`, no haciendo doble click en el archivo.

### "OSError: [WinError 10048] Only one usage of each socket address..."

El puerto 8000 esta ocupado por otra instancia de Python o por otro programa. Solucion: usar otro puerto.

```
python -m http.server 8001
```

Y abrir `http://localhost:8001/index.html`.

Para ver que esta ocupando el puerto 8000:

```
netstat -ano | findstr :8000
```

Mata el proceso con el PID que aparece (ultimo numero):

```
taskkill /PID <numero> /F
```

### Veo el login pero al robar carta no aparece la imagen

Las imagenes no estan en `app/assets/img/la-puerta/`. Copiar los archivos P-01.jpg ... P-60.jpg desde `1 la puerta inicio de sesion/imagenes/` a esa carpeta. La app no rompe si no estan, simplemente muestra un cuadro gris en lugar de la imagen.

## Proximos pasos

- Optimizar imagenes (JPEG 1024px o WebP, pendiente decision comercial).
- Cuando esten los JSON de los mazos 2-13, copiarlos a `app/data/`. La app los levanta sola.
- Reemplazar la clave hardcodeada por un Cloudflare Worker para validar licencias reales.
