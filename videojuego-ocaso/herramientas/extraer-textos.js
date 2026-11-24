/* Extrae textos candidatos (en castellano) de js/*.js e index.html para armar los diccionarios de idioma.
   Uso: node herramientas/extraer-textos.js [salida.json] [--faltan en|pt]
   - Recorre las cadenas "…", '…' y `…` (las plantillas se parten en sus trozos fijos: ${…} → {}),
     quita las etiquetas HTML y se queda con los trozos que parecen texto para el jugador.
   - Con --faltan en|pt, solo lista los que el diccionario de ese idioma aún no traduce (exacto o patrón).
   Escribe un JSON { texto: [archivo, veces] } ordenado por archivo. */
const fs = require("fs");
const path = require("path");
const raiz = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const salida = args.find((a) => !a.startsWith("--") && !/^(en|pt)$/.test(a));
const fi = args.indexOf("--faltan");
const faltan = fi >= 0 ? args[fi + 1] : null;
const NO_JS = new Set(["idioma.js", "idioma-en.js", "idioma-pt.js", "iconos.js"]);

/* trozos de cadena de un archivo JS (tokenizador simple: comentarios, cadenas, plantillas anidadas, regex) */
function cadenas(src) {
  const out = [];
  let i = 0,
    prev = "";
  const n = src.length;
  function plantilla() {
    // i está justo después de la ` de apertura
    let s = "";
    while (i < n) {
      const c = src[i];
      if (c === "\\") {
        s += src[i + 1];
        i += 2;
        continue;
      }
      if (c === "`") {
        i++;
        break;
      }
      if (c === "$" && src[i + 1] === "{") {
        s += "{}";
        i += 2;
        codigo(1);
        continue;
      }
      s += c;
      i++;
    }
    out.push(s);
  }
  function codigo(prof) {
    while (i < n) {
      const c = src[i];
      if (c === "/" && src[i + 1] === "/") {
        while (i < n && src[i] !== "\n") i++;
        continue;
      }
      if (c === "/" && src[i + 1] === "*") {
        const e = src.indexOf("*/", i + 2);
        i = e < 0 ? n : e + 2;
        continue;
      }
      if (c === '"' || c === "'") {
        let s = "";
        i++;
        while (i < n && src[i] !== c) {
          if (src[i] === "\\") {
            const d = src[i + 1];
            s += d === "n" ? "\n" : d === "u" ? String.fromCharCode(parseInt(src.substr(i + 2, 4), 16)) : d;
            i += d === "u" ? 6 : 2;
            continue;
          }
          s += src[i++];
        }
        i++;
        out.push(s);
        prev = "x";
        continue;
      }
      if (c === "`") {
        i++;
        plantilla();
        prev = "x";
        continue;
      }
      if (c === "/" && /[(,=:[!&|?{};+\-*%<>~^]$|^$|return$|typeof$/.test(prev)) {
        // literal de expresión regular
        i++;
        let cls = false;
        while (i < n) {
          const d = src[i];
          if (d === "\\") {
            i += 2;
            continue;
          }
          if (d === "[") cls = true;
          else if (d === "]") cls = false;
          else if (d === "/" && !cls) break;
          else if (d === "\n") break;
          i++;
        }
        i++;
        while (/[a-z]/.test(src[i] || "")) i++;
        prev = "x";
        continue;
      }
      if (c === "{") prof++;
      if (c === "}") {
        prof--;
        if (prof === 0) {
          i++;
          return;
        }
      }
      if (!/\s/.test(c)) {
        if (/[A-Za-z0-9_$]/.test(c)) {
          let w = "";
          while (i < n && /[A-Za-z0-9_$]/.test(src[i])) w += src[i++];
          prev = w;
          continue;
        }
        prev = c;
      }
      i++;
    }
  }
  codigo(1e9);
  return out;
}
/* trozos de texto visibles de una cadena (sin etiquetas) */
function trozos(s) {
  const r = [];
  const sinTags = s.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ");
  /* atributos legibles */
  for (const m of sinTags.matchAll(/\b(?:title|aria-label|placeholder|alt)="([^"]*)"/g)) r.push(m[1]);
  for (const p of sinTags.split(/<[^>]*>/)) r.push(p);
  return r
    .map((t) => t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim())
    .filter(esTexto);
}
function esTexto(t) {
  if (t.length < 2) return false;
  if (!/[a-záéíóúñü]{2}/i.test(t)) return false;
  if (/^[a-z][a-zA-Z0-9]*$/.test(t) && !/[áéíóúñ]/.test(t) && t.length < 4) return false;
  if (/^[\w.-]+\.(js|png|json|css|html|mp3|ogg|webp|svg)$/.test(t)) return false;
  if (/^(#|rgba?\(|hsla?\(|\d+px|https?:|data:)/.test(t)) return false;
  if (/[=;]|=>|&&|\|\||\(\)/.test(t) && !/\s[a-záéíóúñ]+\s/.test(t)) return false;
  if (/^[a-z0-9_:\-]+$/.test(t) && !/[áéíóúñ]/.test(t)) {
    // una palabra en minúscula sin acento: probablemente una clave, salvo palabras castellanas comunes
    return /^(oro|comida|madera|hierro|paz|guerra|si|no|todas?|todos?|ninguno|nada|ver|salir)$/.test(t);
  }
  if (/^[A-Z_0-9]+$/.test(t)) return false;
  if (!/\s/.test(t) && /\./.test(t) && /^[\w.:-]+$/.test(t)) return false; // filas de sprites («..rrk..») y claves («tab.cmb»)
  if (/^\w+:\w+$/.test(t)) return false; // «hab:fuegoGriego»
  if (/:not\(|^[.#][a-z][\w-]*[ .:>[]|^\[data-|^[a-z]+\[/.test(t)) return false; // selectores CSS
  if (/^[a-z]+[A-Z]\w*$/.test(t)) return false; // camelCase
  if (/^[\w-]+(\s[\w-]+)*$/.test(t) && /^(ifz|onl|b-|s-|cam|btn|card|zb|ico)/.test(t)) return false;
  return true;
}
const res = new Map();
function anota(t, f) {
  const e = res.get(t);
  if (e) e[1]++;
  else res.set(t, [f, 1]);
}
const dir = path.join(raiz, "js");
for (const f of fs.readdirSync(dir).sort()) {
  if (!f.endsWith(".js") || NO_JS.has(f)) continue;
  for (const s of cadenas(fs.readFileSync(path.join(dir, f), "utf8"))) for (const t of trozos(s)) anota(t, f);
}
for (const t of trozos(fs.readFileSync(path.join(raiz, "index.html"), "utf8").replace(/<script[\s\S]*?<\/script>/g, ""))) anota(t, "index.html");

let lista = [...res.entries()];
if (faltan) {
  global.window = global;
  global.IDIOMA_DIC = {};
  try {
    require(path.join(raiz, "js", "idioma-" + faltan + ".js"));
  } catch (e) {
    console.error(e.message);
  }
  const d = (global.IDIOMA_DIC || {})[faltan] || { exact: {}, patrones: [] };
  const ex = Object.assign({}, d.exact || {});
  for (const k of d.iguales || []) ex[k] = k;
  const pa = d.patrones || [];
  const n = (t) => t.replace(/\d+(?:[.,]\d+)*/g, "#");
  lista = lista.filter(([t]) => !(t in ex) && !(n(t) in ex) && !pa.some(([re]) => re.test(t)));
}
const obj = {};
for (const [t, v] of lista) obj[t] = v;
const txt = JSON.stringify(obj, null, 0).replace(/\],"/g, '],\n"');
if (salida) fs.writeFileSync(salida, txt + "\n");
else process.stdout.write(txt + "\n");
console.error(lista.length + " textos");
