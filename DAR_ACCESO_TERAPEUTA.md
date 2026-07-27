# Como dar acceso a un terapeuta

## 1. Crear usuario en Firebase

1. Ir a https://console.firebase.google.com/project/mosaico-app-ab4c7/authentication/users
2. Click **+ Add user**
3. Email: el del terapeuta
4. Contrasena: la que quieras (ej: `Mosaico2026`)
5. Click **Add user**

## 2. Enviar link de acceso

Mandar al terapeuta:

```
Link: https://cartaterapia.netlify.app
Email: [el que le creaste]
Contrasena: [la que le pusiste]
```

## 3. El terapeuta abre el link

- Funciona en PC, tablet o celular
- Chrome o Safari recomendados
- Desde el celular puede agregar a pantalla de inicio (Add to Home Screen) para usarla como app

## 4. Usar la app

- Al entrar: ingresa email + contrasena
- Crea pacientes desde el boton "+ Nuevo"
- Cada paciente puede tener una o mas sesiones
- En cada sesion: asigna cartas (al azar o buscando por codigo), escribe notas, habilita el codigo para que el paciente se conecte
- Acceso completo a: indice maestro (13 mazos), manual clinico, historial de sesiones

## Notas

- El paciente NO necesita cuenta. Solo usa el codigo de 4 letras que el terapeuta le muestra en la sesion.
- No hay registro publico: solo vos podes crear terapeutas desde Firebase Console.
- Los datos se guardan en la nube (Firestore). Si el terapeuta cierra sesion y vuelve a entrar en cualquier dispositivo, sus pacientes y sesiones estan ahi.
