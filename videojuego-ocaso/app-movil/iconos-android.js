/* Pone los iconos del juego (iconos/icono-*.png) como icono de la app de Android tras `npx cap add android`. */
const fs = require("fs");
const path = require("path");
const res = path.join(__dirname, "android", "app", "src", "main", "res");
const ico = path.join(__dirname, "..", "iconos");
const tam = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
if (!fs.existsSync(res)) {
  console.log("no hay proyecto android todavía");
  process.exit(0);
}
for (const [d, s] of Object.entries(tam)) {
  const dir = path.join(res, "mipmap-" + d);
  fs.mkdirSync(dir, { recursive: true });
  for (const n of ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"])
    fs.copyFileSync(path.join(ico, `icono-${s}.png`), path.join(dir, n));
}
/* sin icono adaptativo (evita que Android recorte el pixel art) */
fs.rmSync(path.join(res, "mipmap-anydpi-v26"), { recursive: true, force: true });
console.log("iconos de Android colocados");
