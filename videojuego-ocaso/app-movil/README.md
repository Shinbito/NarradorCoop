# App móvil de Ocaso del Imperio

El juego se empaqueta con [Capacitor](https://capacitorjs.com) (licencia MIT).

## Android (APK) con GitHub
El flujo `.github/workflows/apk-ocaso.yml` compila el APK en cada push que toque `videojuego-ocaso/`
(o a mano desde la pestaña *Actions* → *APK Ocaso* → *Run workflow*). El APK queda:
- en la página de *Releases* del repositorio, como **«Ocaso del Imperio (Android)»** (`ocaso.apk`), para
  descargarlo directamente desde el móvil;
- como *artifact* de la ejecución.

Instalar: abre el enlace del APK en el móvil, permite «instalar apps de origen desconocido» para el navegador
y ábrelo. Es una compilación *debug* firmada con la clave de depuración: válida para instalar a mano, no para
Google Play.

## Android en local
```bash
cd videojuego-ocaso/app-movil
npm install
npm run android          # copia el juego, crea android/ y pone los iconos
cd android && ./gradlew assembleDebug   # APK en app/build/outputs/apk/debug/
```
Requiere Java 17 y el SDK de Android.

## iPhone
Una app de iPhone solo se compila en macOS con Xcode y, para instalarla, hace falta una cuenta de desarrollador
de Apple (o TestFlight). Alternativa sin Mac: abrir el juego publicado con HTTPS en Safari → Compartir →
«Añadir a pantalla de inicio» (app web instalable, funciona sin conexión).
En un Mac: `npm install && npm run copiar-web && npx cap add ios && npx cap open ios`.
