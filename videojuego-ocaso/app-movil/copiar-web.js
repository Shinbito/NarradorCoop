/* Copia el juego (solo lo necesario, según herramientas/lista-archivos.js) a app-movil/www para Capacitor. */
const fs = require("fs");
const path = require("path");
const { lista, raiz } = require("../herramientas/lista-archivos.js");
const www = path.join(__dirname, "www");
fs.rmSync(www, { recursive: true, force: true });
const l = lista();
for (const rel of l) {
  const d = path.join(www, rel);
  fs.mkdirSync(path.dirname(d), { recursive: true });
  fs.copyFileSync(path.join(raiz, rel), d);
}
fs.writeFileSync(path.join(www, "archivos.json"), JSON.stringify(l));
console.log(`copiados ${l.length} archivos a www/`);
