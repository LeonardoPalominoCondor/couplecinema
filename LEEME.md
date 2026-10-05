# Cine en pareja 🎟️

PWA (se instala en el celular desde el navegador). Costo: **$0** con los planes gratuitos de Firebase y TMDB.

## 1. Requisitos
- Node.js 18+ (nodejs.org)
- Cuenta de Google

## 2. TMDB (catálogo, cartelera y plataformas)
1. Crea cuenta en https://www.themoviedb.org
2. Configuración > API > solicita una API Key (uso personal).
3. Copia la "API Key (v3 auth)".

## 3. Firebase (login con Google + base de datos)
1. https://console.firebase.google.com > Agregar proyecto (puedes desactivar Analytics).
2. **Authentication** > Comenzar > Método de acceso > activa **Google**.
3. **Firestore Database** > Crear base de datos > modo producción.
4. En la pestaña **Reglas** pega el contenido de `firestore.rules` y publica.
5. Configuración del proyecto > Tus apps > **Web (</>)** > registra la app y copia los valores de configuración.

## 4. Variables de entorno
Copia `.env.example` a `.env` y rellena los valores de Firebase y TMDB.

## 5. Probar en tu computadora
```
npm install
npm run dev
```
Abre la URL que aparece. Con `--host` también puedes abrirla desde tu celular (misma red wifi).

## 6. Publicarla gratis (para usarla en el celular)
Opción Firebase Hosting:
```
npm install -g firebase-tools
firebase login
firebase init hosting     # carpeta pública: dist | SPA: sí
npm run build
firebase deploy
```
Luego en Authentication > Configuración > Dominios autorizados verifica que esté tu dominio `*.web.app`.
Usa ese mismo dominio como `VITE_FIREBASE_AUTH_DOMAIN` para que el login funcione bien en móviles.

## 7. Instalar en el celular
Abre la URL en Chrome (Android) o Safari (iPhone) > menú > "Añadir a pantalla de inicio".

## 8. Primer uso
1. Entran los dos con Google y crean su perfil (avatar + usuario).
2. Uno toca "Crear nuestro espacio" y le pasa el código de 6 letras al otro.
3. El otro lo escribe en "Ya tengo un código".

## Privacidad ("solo para nosotros")
Las reglas de Firestore solo dejan leer/escribir la lista a los 2 miembros del espacio.
Cuando ya estén los dos unidos, nadie más puede entrar (el espacio admite máximo 2 personas).

## Estructura
- `src/App.jsx` login, perfil, pareja, navegación
- `src/screens.jsx` pantallas (Inicio, Buscar, Descubrir, Lista, Logros, Perfil, Ficha)
- `src/tmdb.js` API de películas, moods y plataformas
- `src/db.js` guardado en Firestore
- `src/achievements.js` lista de logros (agrega los tuyos aquí)
