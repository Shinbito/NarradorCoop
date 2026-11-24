/* Lista los archivos que necesita el juego para funcionar (sin pruebas, documentos ni herramientas).
   La usan el service worker (archivos.json, para jugar sin conexión) y la app móvil (copiar a www/).
   Uso: node herramientas/lista-archivos.js  → escribe archivos.json */
const fs = require("fs");
const path = require("path");
const raiz = path.resolve(__dirname, "..");
const INCLUIR = ["index.html", "manifest.webmanifest", "sw.js", "css", "js", "vendor", "fuentes", "iconos", "assets/sprites", "assets/iso"];
const FUERA = /(^|\/)(originales|\.gitignore|README|LICENSE-three\.txt$)/;
function recorrer(rel, out) {
  const abs = path.join(raiz, rel);
  if (!fs.existsSync(abs)) return;
  const st = fs.statSync(abs);
  if (st.isDirectory()) for (const n of fs.readdirSync(abs).sort()) recorrer(path.posix.join(rel, n), out);
  else if (!FUERA.test(rel)) out.push(rel);
}
function lista() {
  const out = [];
  for (const r of INCLUIR) recorrer(r, out);
  return out;
}
if (require.main === module) {
  const l = lista();
  fs.writeFileSync(path.join(raiz, "archivos.json"), JSON.stringify(l, null, 1) + "\n");
  console.log(l.length + " archivos en archivos.json");
}
module.exports = { lista, raiz };
