/* ---------- IDIOMA: traducción del juego (castellano → português / english) ----------
   El juego se escribe en castellano. Si OPC.v.idioma no es 'es', este archivo traduce lo que se ve:
   - los nodos de texto del documento y los atributos title / aria-label / placeholder / alt, al cargar y
     después con un MutationObserver (cada innerHTML nuevo se traduce antes de pintarse);
   - el texto dibujado en lienzos (fillText / strokeText / measureText, para que los anchos cuadren);
   - document.title y <html lang>.
   Guarda el castellano original de cada nodo y atributo (WeakMap): al volver a 'es' se restaura y al
   cambiar de idioma se traduce de nuevo desde el original. En 'es' no hace nada (ni observa).
   Diccionarios (js/idioma-en.js, js/idioma-pt.js, se cargan antes que este): IDIOMA_DIC.en = { exact, patrones }
   - exact: { "castellano": "traducción" } — frase entera (sin los espacios de los extremos).
       · «#» en la clave es una cifra cualquiera («Fuerza #» vale para «Fuerza 19»); en la traducción, cada «#»
         recibe las cifras en orden (o «#1», «#2»… para cambiar el orden).
       · «{}» en la clave es un trozo cualquiera (nombre, frase…): la clave pasa a ser un patrón. En la traducción,
         «{}» en orden o «{1}», «{2}»… Lo capturado se traduce a su vez (los nombres propios quedan igual).
   - iguales: ["…"] — textos que se escriben igual que en castellano (se dan por traducidos).
   - patrones: [[/^regex$/, "traducción con $1 $2", prioridad?], …] — para lo que no cabe en lo anterior; las
     capturas también se traducen («$=1» la deja tal cual; con «$+1» el patrón solo vale si esa captura se traduce; «$^1», igual y con mayúscula inicial). Prioridad: 99 por omisión (antes que las plantillas
     «{}», que pesan lo que su texto fijo); los genéricos llevan una baja para probarse al final.
   Lo que no se encuentra se parte por separadores (« · », « — », «: », frases) y se traduce a trozos; lo
   desconocido queda en castellano (nunca rompe la interfaz).
   Globales: IDIOMA, idiomaT(texto), idiomaOriginal(elemento), IDIOMA_DIC. */
var IDIOMA_DIC = window.IDIOMA_DIC || (window.IDIOMA_DIC = {});
const IDIOMA = {
  lang: "es",
  dic: {}, // idioma → diccionario compilado
  cache: {}, // idioma → Map(texto → traducción | null)
  rev: {}, // idioma → Map(traducción → castellano)
  faltan: new Set(), // castellano sin traducción (normalizado, «#» = cifra) — para ir completando
  anotar: false, // true: guarda en faltan lo que no encuentra (y en sin, el texto entero)
  sin: new Set(),
  obs: null,
  activo: false, // el observador ya se puso alguna vez (al volver a 'es' solo restaura)
  med: { nodos: 0, ms: 0 },
};
/* ---------- compilación de diccionarios ---------- */
const IDI_NUM = /\d+(?:[.,]\d+)*/g; // cifras («1.200», «3,5», «476»)
const IDI_T0 = 0xf100; // las cifras se cambian por caracteres de uso privado U+F100… (una por posición)
const idiTok = (i) => String.fromCharCode(IDI_T0 + i);
const IDI_TOK = /[\uf100-\uf1ff]/g;
const IDI_TOK1 = /[\uf100-\uf1ff]/;
/* «12 levas · 120 hombres» → { s: "\uf100 levas · \uf101 hombres", n: ["12", "120"] } */
function idiNorm(s) {
  const n = [];
  const r = s.replace(IDI_NUM, (m) => (n.length < 255 ? idiTok(n.push(m) - 1) : m));
  return { s: r, n };
}
const idiDenorm = (s, n) => (n.length ? s.replace(IDI_TOK, (c) => n[c.charCodeAt(0) - IDI_T0] ?? c) : s);
const idiEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/* «#» de la clave → fichas en orden; «#» / «#2» de la traducción → la ficha que toque */
function idiAlmohadillas(k, v) {
  let i = 0;
  const kk = k.replace(/#/g, () => idiTok(i++));
  let j = 0;
  const vv = String(v).replace(/#([1-9])?/g, (m, d) => idiTok(d ? +d - 1 : j++));
  return [kk, vv];
}
/* clave con «{}» → patrón. Devuelve null si casi no tiene texto fijo (atraparía cualquier cosa) */
function idiPlantilla(k, v) {
  let partes = k.split("{}");
  const fijo = partes.join("").replace(/[^\p{L}]/gu, "");
  /* «Los {}», «{} de {}»: demasiado poco texto fijo (con lo fijo a los dos lados basta menos). Si hay algo
     de texto («{} oro», «{} días»), la plantilla vale solo con cifras y signos en los huecos */
  const corta = fijo.length < (partes[0] && partes[partes.length - 1] ? 3 : 5);
  if (corta && fijo.length < 2) return null;
  /* traducción con marcadores numerados: «{}» en orden → {1}, {2}… */
  let j = 0;
  let val = String(v).replace(/\{(\d?)\}/g, (m, d) => "{" + (d ? d : ++j) + "}");
  /* «{}{}{}» seguidos no se pueden separar: se capturan como uno solo (y en la traducción tienen que ir
     juntos y en orden, «{2}{3}{4}»; si no, la plantilla no se usa) */
  if (k.includes("{}{}")) {
    const grupo = []; // marcador original (1…) → grupo
    let g = 0;
    const nuevas = [partes[0]];
    for (let i = 1; i < partes.length; i++) {
      if (partes[i - 1] !== "" || i === 1) g++;
      grupo[i] = g;
      if (partes[i] !== "" || i === partes.length - 1) nuevas.push(partes[i]);
    }
    /* runs: grupo → [primero, último] */
    const runs = {};
    for (let i = 1; i < partes.length; i++) {
      const r = runs[grupo[i]] || (runs[grupo[i]] = [i, i]);
      r[1] = i;
    }
    for (const gg in runs) {
      const [a, b] = runs[gg];
      if (a === b) continue;
      let seq = "";
      for (let i = a; i <= b; i++) seq += "{" + i + "}";
      val = val.split(seq).join("{G" + gg + "}");
    }
    let mal = false;
    val = val.replace(/\{(\d)\}/g, (m, d) => {
      const r = runs[grupo[+d]];
      if (!r || r[0] !== r[1]) mal = true;
      return "{G" + grupo[+d] + "}";
    });
    if (mal) return null;
    val = val.replace(/\{G(\d+)\}/g, "{$1}");
    partes = nuevas;
  }
  /* hueco pegado a una letra («persigue{}», «año{}»): puede ir vacío */
  let re = "^" + idiEsc(partes[0]);
  for (let i = 1; i < partes.length; i++) re += (corta ? "([^\\p{L}]+?)" : /\p{L}$/u.test(partes[i - 1]) ? "(.*?)" : "(.+?)") + idiEsc(partes[i]);
  re = new RegExp(re + "$", "su");
  const rep = val.replace(/\{(\d)\}/g, "$$$1");
  const m = IDI_PRIMERA.exec(partes[0]);
  return [re, rep, m ? m[1] : "", fijo.length];
}
function idiCompilar(lang) {
  if (IDIOMA.dic[lang]) return IDIOMA.dic[lang];
  const src = IDIOMA_DIC[lang];
  const d = { exact: new Map(), pats: new Map(), libres: [], n: 0 };
  IDIOMA.dic[lang] = d;
  if (!src) return d;
  const pon = (re, rep, primera, peso) => {
    const p = { re, rep, peso, sep: re.source.includes("·") };
    if (primera && !/[\uf100-\uf1ff]/.test(primera)) {
      if (!d.pats.has(primera)) d.pats.set(primera, []);
      d.pats.get(primera).push(p);
    } else d.libres.push(p);
  };
  const todas = Object.entries(src.exact || {});
  for (const k of src.iguales || []) todas.push([k, k]);
  for (const [k0, v] of todas) {
    if (v == null || v === "") continue;
    let [k, vv] = k0.includes("#") ? idiAlmohadillas(k0, v) : [k0, String(v)];
    if (k.includes("{}")) {
      const p = idiPlantilla(k, vv);
      if (p) pon(...p);
      continue;
    }
    /* claves con cifras escritas: se guardan normalizadas, si la traducción lleva las mismas cifras */
    if (/\d/.test(k)) {
      const a = idiNorm(k),
        b = idiNorm(vv);
      if (a.n.join("|") === b.n.join("|")) [k, vv] = [a.s, b.s];
      else d.exact.set(k, vv); // tal cual (se busca antes de normalizar)
    }
    d.exact.set(k, vv);
    d.n++;
  }
  /* en los patrones, \d también vale para las cifras ya cambiadas por fichas */
  for (const it of src.patrones || []) {
    if (!it || !it[0] || typeof it[0].exec !== "function") continue;
    const s = it[0].source.replace(/\\d\+|\\d|\[0-9\]\+/g, "[\\d\\uf100-\\uf1ff]+");
    const m = /^\^([\p{L}]+)/u.exec(s);
    pon(new RegExp(s, it[0].flags.replace("g", "")), it[1], m ? m[1] : "", typeof it[2] === "number" ? it[2] : 99);
  }
  for (const l of d.pats.values()) l.sort((a, b) => b.peso - a.peso);
  d.libres.sort((a, b) => b.peso - a.peso);
  return d;
}
/* ---------- traducción de una cadena ---------- */
const IDI_BORDE = /^([^\p{L}\p{N}\uf100-\uf1ff]*)([\s\S]*?)([^\p{L}\p{N}\uf100-\uf1ff]*)$/u;
/* separadores de trozos, del más fuerte al más débil: se parte por el primero que aparezca y cada trozo
   vuelve a pasar por todo (el corte entre frases usa «lookbehind»: si el navegador no lo entiende, sin él) */
const IDI_SEPS = [/(\s+·\s+)/, /(\s+[—–]\s+)/, /(\s+\|\s+)/, /(:\s+)/, /(;\s+)/];
try {
  IDI_SEPS.push(new RegExp("((?<=[.!?…»)])\\s+(?=[¡¿«(\\p{Lu}\\p{N}\\uf100-\\uf1ff]))", "u"));
} catch (_) {}
const IDI_PRIMERA = /^[^\p{L}]*([\p{L}]+)/u;
/* t: cadena normalizada (cifras como fichas) y sin espacios en los extremos → traducción o null */
function idiNucleo(d, t, prof) {
  if (!t) return null;
  const e = d.exact.get(t);
  if (e !== undefined) return e;
  if (prof > 8) return null;
  /* patrones del mismo comienzo y luego los libres */
  const m = IDI_PRIMERA.exec(t);
  const l = m && d.pats.get(m[1]);
  const prueba = (lista) => {
    for (const p of lista) {
      const mm = p.re.exec(t);
      if (!mm) continue;
      /* un hueco no se traga « · »: entonces mejor partir por trozos */
      if (!p.sep && t.includes(" · ") && mm.some((c, i) => i && c && c.includes(" · "))) continue;
      let falla = false;
      const r = p.rep.replace(/\$([=+^]?)(\d)/g, (x, modo, k) => {
        const c = mm[+k];
        if (c == null) return "";
        if (modo === "=") return c;
        const tr = idiCadena(d, c, prof + 1);
        if (tr == null && modo !== "") falla = true;
        return modo === "^" && tr ? tr[0].toUpperCase() + tr.slice(1) : tr ?? c;
      });
      if (falla) continue; // «$+1»: esa captura tenía que traducirse
      if (r === t) continue; // un patrón que no cambia nada no cuenta (puede haber otro mejor, o los trozos)
      return r;
    }
    return null;
  };
  let r = (l && prueba(l)) || prueba(d.libres);
  if (r != null) return r;
  /* mayúscula inicial distinta: «oro» / «Oro» */
  const c0 = t[0],
    lo = c0.toLowerCase(),
    up = c0.toUpperCase();
  if (lo !== up) {
    const alt = (c0 === lo ? up : lo) + t.slice(1);
    const e2 = d.exact.get(alt);
    if (e2 !== undefined) return c0 === lo ? e2[0].toLowerCase() + e2.slice(1) : e2[0].toUpperCase() + e2.slice(1);
  }
  return null;
}
/* con signos alrededor («¡…!», «(…)», «▶︎», «:») y partiendo por separadores */
function idiCadena(d, t, prof = 0) {
  /* las fichas de cifra de un trozo se renumeran desde 0 («Fuerza #» vale en cualquier posición de la frase) */
  if (t.length > 1 && IDI_TOK1.test(t)) {
    const orig = [];
    const t2 = t.replace(IDI_TOK, (c) => idiTok(orig.push(c) - 1));
    if (t2 !== t) {
      const r = idiCadena(d, t2, prof);
      return r == null ? r : r.replace(IDI_TOK, (c) => orig[c.charCodeAt(0) - IDI_T0] ?? c);
    }
  }
  let r = idiNucleo(d, t, prof);
  if (r != null) return r;
  const b = IDI_BORDE.exec(t);
  if (b && (b[1] || b[3]) && b[2]) {
    r = idiNucleo(d, b[2], prof + 1);
    if (r != null) return b[1].replace(/[¡¿]/g, "") + r + b[3];
  }
  if (prof > 10) return null;
  for (const sep of IDI_SEPS) {
    const sp = t.split(sep);
    if (sp.length < 2) continue;
    let alguno = false;
    for (let i = 0; i < sp.length; i += 2) {
      const tr = sp[i].trim() ? idiCadena(d, sp[i], prof + 1) : null;
      if (tr != null) {
        sp[i] = tr;
        alguno = true;
      } else if (IDIOMA.anotar && /\p{L}{2}/u.test(sp[i])) idiAnotar(sp[i]);
    }
    if (alguno) return sp.join("");
    break;
  }
  /* frase con comas: a trozos */
  if (prof < 2 && t.includes(", ")) {
    const sc = t.split(/(,\s+)/);
    let alguno = false;
    for (let i = 0; i < sc.length; i += 2) {
      const tr = idiCadena(d, sc[i], prof + 2);
      if (tr != null) {
        sc[i] = tr;
        alguno = true;
      }
    }
    if (alguno) return sc.join("");
  }
  return null;
}
function idiAnotar(t) {
  if (IDIOMA.faltan.size < 20000) IDIOMA.faltan.add(t.replace(IDI_TOK, "#").trim());
}
/* traducción de un texto entero (con sus espacios); devuelve el mismo texto si no hay traducción */
function idiTraducir(s, lang = IDIOMA.lang) {
  if (lang === "es" || !s) return s;
  const c = IDIOMA.cache[lang] || (IDIOMA.cache[lang] = new Map());
  const v = c.get(s);
  if (v !== undefined) return v;
  let out = s;
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s);
  if (m[2] && /\p{L}/u.test(m[2])) {
    const d = idiCompilar(lang);
    let r = d.exact.get(m[2]); // con cifras escritas en la clave
    if (r === undefined) {
      const nn = idiNorm(m[2]);
      /* «propuesta de {}» con {} = «el emperador X» sale «propuesta del emperador X»: se prueba también
         deshaciendo «del»/«al» (antes de partir en trozos) */
      const ex = /\b(?:[Dd]e|[Aa])l \p{Ll}/u.test(nn.s) ? nn.s.replace(/\b(de|a|De|A)l (?=\p{Ll})/gu, "$1 el ") : null;
      r = idiNucleo(d, nn.s, 0);
      if (r == null && ex) {
        r = idiNucleo(d, ex, 0);
        if (r != null && lang === "pt") r = r.replace(/\b([Dd])e ([oa]s?) /g, "$1$2 ").replace(/\b([Ee])m ([oa]s?) /g, (x, e, o) => (e === "E" ? "N" : "n") + o + " ").replace(/\b([Aa]) o(s?) /g, "$1o$2 ");
      }
      if (r == null) r = idiCadena(d, nn.s);
      if (r == null && ex) r = idiCadena(d, ex);
      if (r != null) r = idiDenorm(r, nn.n);
      else if (IDIOMA.anotar && /\p{L}{2}/u.test(m[2])) {
        idiAnotar(nn.s);
        IDIOMA.sin.add(m[2]);
      }
    }
    if (r != null) out = m[1] + r + m[3];
  }
  if (c.size > 60000) c.clear();
  c.set(s, out);
  if (out !== s) {
    const rv = IDIOMA.rev[lang] || (IDIOMA.rev[lang] = new Map());
    if (rv.size > 60000) rv.clear();
    rv.set(out, s);
  }
  return out;
}
const idiomaT = (texto) => (texto == null ? texto : idiTraducir(String(texto)));
/* castellano original de un texto que puede venir ya traducido (p. ej. leído del documento y vuelto a escribir) */
function idiOriginal(s) {
  for (const l in IDIOMA.rev) {
    const o = IDIOMA.rev[l].get(s);
    if (o !== undefined) return idiEsCastellano(s) ? s : o;
  }
  return s;
}
/* ¿es s un texto castellano que conoce algún diccionario? («Continuar» es castellano aunque también sea la
   traducción portuguesa de «Reanudar») */
function idiEsCastellano(s) {
  const t = s.trim();
  if (!t) return false;
  const n = idiNorm(t).s;
  for (const l in IDIOMA.dic) {
    const ex = IDIOMA.dic[l].exact;
    if (ex.has(t) || ex.has(n)) return true;
  }
  return false;
}
/* ---------- documento ---------- */
const IDI_NODO = new WeakMap(); // nodo de texto → { es, out }
const IDI_ATR = new WeakMap(); // elemento → { atributo: { es, out } }
const IDI_ATRS = ["title", "aria-label", "placeholder", "alt"];
const IDI_SALTA = new Set(["SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT", "CODE", "PRE"]);
const IDI_SEL_ATR = "[title],[aria-label],[placeholder],[alt]";
const idiGlifo = (n) => typeof ICO_HAY !== "undefined" && ICO_HAY.test(n.data) && !(typeof ICO_NO !== "undefined" && ICO_NO.has(n.parentNode.tagName));
function idiTexto(n) {
  const p = n.parentNode;
  if (!p || IDI_SALTA.has(p.nodeName) || p.isContentEditable) return;
  /* <option> sin value: su texto es el valor */
  if (p.nodeName === "OPTION" && !p.hasAttribute("value")) return;
  const data = n.data;
  let r = IDI_NODO.get(n),
    es;
  if (r && data === r.out) es = r.es;
  else es = idiOriginal(data);
  const lang = IDIOMA.lang;
  if (lang === "es") {
    if (es !== data) n.data = es;
    if (r) IDI_NODO.delete(n);
    return;
  }
  /* los iconos de recurso (iconos.js) parten el texto en trozos: se traducen los trozos */
  if (idiGlifo(n)) {
    if (es !== data) n.data = es;
    return;
  }
  const out = idiTraducir(es, lang);
  if (out === es && es === data) {
    if (r) IDI_NODO.delete(n);
    return;
  }
  if (r) {
    r.es = es;
    r.out = out;
  } else IDI_NODO.set(n, { es, out });
  if (data !== out) n.data = out;
}
function idiAtributo(el, a) {
  const v = el.getAttribute(a);
  if (v == null) return;
  let m = IDI_ATR.get(el);
  const r = m && m[a];
  const es = r && v === r.out ? r.es : idiOriginal(v);
  const lang = IDIOMA.lang;
  const out = lang === "es" ? es : idiTraducir(es, lang);
  if (out === v && es === v) return;
  if (!m) IDI_ATR.set(el, (m = {}));
  m[a] = { es, out };
  if (v !== out) el.setAttribute(a, out);
}
function idiElemento(el) {
  for (let i = 0; i < 4; i++) if (el.hasAttribute(IDI_ATRS[i])) idiAtributo(el, IDI_ATRS[i]);
}
function idiRecorrer(raiz) {
  if (!raiz) return;
  if (raiz.nodeType === 3) return idiTexto(raiz);
  if (raiz.nodeType !== 1 && raiz.nodeType !== 9 && raiz.nodeType !== 11) return;
  if (raiz.nodeType === 1) {
    if (IDI_SALTA.has(raiz.nodeName)) return;
    idiElemento(raiz);
    if (!raiz.firstChild) return;
  }
  if (raiz.querySelectorAll) for (const el of raiz.querySelectorAll(IDI_SEL_ATR)) idiElemento(el);
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  const l = [];
  for (let n = w.nextNode(); n; n = w.nextNode()) l.push(n);
  for (const n of l) idiTexto(n);
}
function idiMutaciones(ms) {
  const t0 = performance.now();
  for (const m of ms) {
    if (m.type === "childList") {
      for (const n of m.addedNodes) if (n.isConnected) idiRecorrer(n);
    } else if (m.type === "characterData") {
      const n = m.target,
        r = IDI_NODO.get(n);
      if (r && n.data === r.out) continue; // lo escribió este archivo
      if (n.isConnected) idiTexto(n);
    } else if (m.type === "attributes") {
      const el = m.target,
        r = IDI_ATR.get(el),
        v = el.getAttribute(m.attributeName);
      if (r && r[m.attributeName] && v === r[m.attributeName].out) continue;
      if (v != null) idiAtributo(el, m.attributeName);
    }
  }
  IDIOMA.med.nodos += ms.length;
  IDIOMA.med.ms += performance.now() - t0;
}
function idiObservar() {
  if (IDIOMA.obs) return;
  IDIOMA.obs = new MutationObserver(idiMutaciones);
  IDIOMA.obs.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: IDI_ATRS,
  });
  IDIOMA.activo = true;
}
const IDI_TITULO = { es: "Ocaso del Imperio" };
function idiTitulo() {
  const lang = IDIOMA.lang;
  if (!IDI_TITULO.orig) IDI_TITULO.orig = idiOriginal(document.title || "") || "Ocaso del Imperio";
  const t = lang === "es" ? IDI_TITULO.orig : idiTraducir(IDI_TITULO.orig, lang);
  if (document.title !== t) document.title = t;
}
/* aplica el idioma actual a todo el documento */
function idiAplicar() {
  const lang = IDIOMA.lang;
  document.documentElement.lang = lang;
  if (lang !== "es") idiObservar();
  if (!IDIOMA.activo) return; // 'es' desde el principio: nada que hacer
  idiRecorrer(document.documentElement);
  idiTitulo();
  /* los paneles se redibujan con el nuevo idioma; los lienzos, en su próximo cuadro */
  try {
    if (typeof G !== "undefined" && G && typeof ui === "function") ui();
  } catch (e) {
    console.error("[idioma] ui", e);
  }
}
function idiomaPoner(lang) {
  lang = lang === "pt" || lang === "en" ? lang : "es";
  if (lang === IDIOMA.lang && (lang === "es" || IDIOMA.obs)) return;
  IDIOMA.lang = lang;
  if (lang !== "es") idiCompilar(lang);
  if (document.documentElement) idiAplicar();
}
/* texto castellano de un elemento aunque esté traducido (para el código que compara textos) */
function idiomaOriginal(el) {
  if (!el) return "";
  if (el.nodeType === 3) {
    const r = IDI_NODO.get(el);
    return r && el.data === r.out ? r.es : el.data;
  }
  let s = "";
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const r = IDI_NODO.get(n);
    s += r && n.data === r.out ? r.es : n.data;
  }
  return s;
}
/* ---------- lienzos ---------- */
(() => {
  const P = typeof CanvasRenderingContext2D !== "undefined" && CanvasRenderingContext2D.prototype;
  if (!P || P.fillText.__idi) return;
  const tr = (t) => (IDIOMA.lang === "es" || typeof t !== "string" || t.length < 2 ? t : idiTraducir(t));
  const envolver = (nombre) => {
    const o = P[nombre];
    const f = function (t, ...r) {
      return o.call(this, tr(t), ...r);
    };
    f.__idi = true;
    P[nombre] = f;
  };
  envolver("fillText");
  envolver("strokeText");
  envolver("measureText");
  if (typeof OffscreenCanvasRenderingContext2D !== "undefined") {
    const Q = OffscreenCanvasRenderingContext2D.prototype;
    for (const nombre of ["fillText", "strokeText", "measureText"]) {
      const o = Q[nombre];
      Q[nombre] = function (t, ...r) {
        return o.call(this, tr(t), ...r);
      };
    }
  }
})();
/* ---------- arranque y cambios desde Opciones ---------- */
(() => {
  const ini = typeof OPC !== "undefined" && OPC.v ? OPC.v.idioma : "es";
  IDIOMA.lang = ini === "pt" || ini === "en" ? ini : "es";
  if (IDIOMA.lang !== "es") {
    idiCompilar(IDIOMA.lang);
    document.documentElement.lang = IDIOMA.lang;
    idiObservar(); // el analizador va añadiendo el <body>: el observador lo traduce según llega
    const fin = () => {
      idiRecorrer(document.documentElement);
      idiTitulo();
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fin);
    else fin();
  }
  if (typeof OPC !== "undefined" && OPC.on)
    OPC.on((d) => {
      if (d && d.clave === "idioma") idiomaPoner(d.valor);
    });
})();
