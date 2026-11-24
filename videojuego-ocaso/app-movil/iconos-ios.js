/* Pone el icono del juego (1024×1024) en el proyecto iOS de Capacitor tras `npx cap add ios`. */
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset");
if (!fs.existsSync(dir)) {
  console.log("no hay proyecto ios todavía");
  process.exit(0);
}
const src = path.join(__dirname, "..", "iconos", "icono-1024.png");
const cont = JSON.parse(fs.readFileSync(path.join(dir, "Contents.json"), "utf8"));
for (const im of cont.images) {
  const f = im.filename || "AppIcon-512@2x.png";
  im.filename = f;
  fs.copyFileSync(src, path.join(dir, f));
}
fs.writeFileSync(path.join(dir, "Contents.json"), JSON.stringify(cont, null, 2));
console.log("icono de iOS colocado");
