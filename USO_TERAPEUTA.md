# MOSAICO — Guia de uso para el terapeuta

## Acceso
- Entrar en https://cartaterapia.netlify.app
- Email + contrasena que te dio el administrador

## Pacientes y sesiones

### Crear un paciente
- Click **"+ Nuevo"**
- Escribir nombre y enter

### Crear una sesion
- Click en el paciente → **"+ Nueva sesion"**
- Se genera automaticamente: fecha, codigo de 4 caracteres, estado "deshabilitado"

### Asignar cartas al paciente (sesion activa)
- Seleccionar un **mazo**
- Elegir carta: click en el codigo de la carta desde la grilla
- Si queres al azar: click **"Robar"**
- Aparece la ficha clinica completa (objetivo, profundizacion, intervenciones, tarea)
- Escribir notas si queres
- Click **"Asignar carta a sesion"**
- La carta aparece en "Cartas asignadas en esta sesion"

## El paciente

### El paciente se conecta con un codigo
El paciente **no necesita cuenta**, solo un codigo:

1. En la sesion activa, arriba ves **"Codigo para el paciente"** (4 caracteres, ej: `ABCD`)
2. El paciente abre la app en su celular → **"Entrar como paciente"**
3. Ingresa el codigo de 4 letras
4. Ya esta conectado a su sesion

### Que ve el paciente cuando entra
- Su **historial**: todas las cartas que le asignaste
- Puede tocar cualquier carta para ver la pregunta y la tarea
- Puede escribir **notas personales** sobre cada carta
- Puede **exportar** su historial a JSON o **vaciar**lo

### Control del robo de cartas
- El toggle **"Permitir al paciente robar"** controla si el paciente puede robar cartas al azar
- **Deshabilitado** (gris): el paciente solo ve lo que le asignaste, no puede robar
- **Habilitado** (verde): el paciente puede ademas robar cartas al azar del mazo que elija
- Cambiarlo en cualquier momento, el paciente lo ve al recargar

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

## Manual clinico
- Click en **"Manual"** en la barra superior
- Navegar por capitulos
- Cada archivo tiene un boton **"Volver a MOSAICO"** para regresar a la app

## Indice Maestro
- Click en **"Indice"** en la barra superior
- Click en el nombre del mazo para expandir
- Click en el codigo de cualquier carta para ver su ficha clinica completa

## Sincronizacion
- Los datos se guardan automaticamente en la nube
- El punto en la barra superior indica:
  - 🔵 Verde: sincronizado
  - 🟡 Amarillo: guardando
  - 🔴 Rojo: sin conexion
- Podes cerrar sesion y volver a entrar en cualquier dispositivo
