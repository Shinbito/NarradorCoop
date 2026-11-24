/* ---------- BATALLA ISOMÉTRICA (vista por defecto) con los dibujos de Gemini ----------
   Una tercera vista de la batalla, junto a la 3D (batalla3d.js) y la clásica (batalla.js): cámara isométrica
   FIJA 2:1, pixel art de Gemini empaquetado en assets/iso (iso-0.png + máscara de color de bando + iso-datos.js,
   con los puntos de la BASE de cada dibujo: izquierda, abajo y derecha del rombo que apoya en el suelo).
   - Suelo: losas difuminadas (F_*) que se funden entre sí; paisaje hasta los bordes (no flota); línea roja
     en el límite del campo. Se cachea por trozos y solo se rehace al mover mucho la cámara o cambiar el zoom.
   - De pie y por profundidad: árboles (bosques del campo y de fuera), matas, rocas; en los asedios, las murallas
     del nivel de la plaza calzadas tramo a tramo por su base, torres en la línea y puertas DENTRO de ella; la
     ciudad: calles en cruz, el palacio (capital) o una plaza, los edificios que la provincia tiene construidos
     y en su nivel (cada uno en su parcela, sin pisarse), casas según la población; fuera, granjas y campos.
   - Tropas: figuras de Gemini por pelotón, teñidas con el color de su pueblo, en su estado (quietas, caminando,
     cargando, atacando, huyendo); miran hacia donde avanzan; de espaldas si se alejan de la cámara.
   - Lo que tapa a una tropa (árbol, casa, muralla) se vuelve translúcido y la tropa se ve como silueta.
   - Caídos con charco de sangre (y vísceras con «brutalidad»), flechas en vuelo, anillos de selección,
     zona de despliegue, cifras de cada pelotón.
   - Mandos: los de la vista clásica (tocar, arrastrar una unidad, pulsación larga, recuadro), traducidos del
     rombo al campo; arrastrar el terreno desplaza la vista; rueda o pellizco: zoom (el mismo zoom de la batalla).
   Botón «Vista» de la barra (isométrica → 3D → clásica) y Opciones · Vídeo. B3D.pref.vista: 'iso' | '3d' | '2d'
   (sin elegir: isométrica). Globales con prefijo iso / ISOB. */
const ISOB = { ok: false, img: null, tin: null, spr: {}, wrap: null, cv: null, x: null, cam: { x: 40, y: 25 }, btId: null, est: [], fig: [], suelo: null, drag: null, pts: new Map(), dpr: 1 };
const ISO_BASE = 56; /* ancho de una casilla en pantalla con el zoom de batalla al 100 % (los dibujos están hechos para 120) */

/* ---------- carga de los dibujos ---------- */
(() => {
  if (typeof ISO_DATOS === "undefined") return;
  const h = ISO_DATOS.hojas[0],
    a = new Image(),
    t = new Image();
  let n = 0;
  const listo = () => {
    if (++n < 2) return;
    ISOB.img = a;
    ISOB.tin = t;
    ISOB.ok = true;
  };
  a.onload = listo;
  t.onload = listo;
  a.src = h[0];
  t.src = h[1];
})();
/* un dibujo, recortado, teñido (magenta → color del bando) y volteado si hace falta; en caché */
function isoSpr(n, col, flip) {
  const k = n + "|" + (col || "") + (flip ? "|f" : "");
  if (ISOB.spr[k] !== undefined) return ISOB.spr[k];
  const d = ISO_DATOS.spr[n];
  if (!d || !ISOB.ok) return (ISOB.spr[k] = null);
  const [, sx, sy, w, h, bx, by, lx, ly, rx, ry, tin] = d,
    c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  if (flip) {
    x.translate(w, 0);
    x.scale(-1, 1);
  }
  x.drawImage(ISOB.img, sx, sy, w, h, 0, 0, w, h);
  if (tin && col) {
    /* color de bando sin leer píxeles (funciona también abriendo el juego como archivo):
       1) las partes magenta del dibujo (máscara con alfa); 2) modo de mezcla «color»: el tono del bando con la
       luz y las sombras del dibujo; 3) recortar de nuevo a la máscara y ponerlo encima */
    const m = document.createElement("canvas");
    m.width = w;
    m.height = h;
    const mx = m.getContext("2d");
    if (flip) {
      mx.translate(w, 0);
      mx.scale(-1, 1);
    }
    mx.drawImage(ISOB.img, sx, sy, w, h, 0, 0, w, h);
    mx.globalCompositeOperation = "destination-in";
    mx.drawImage(ISOB.tin, sx, sy, w, h, 0, 0, w, h);
    mx.setTransform(1, 0, 0, 1, 0, 0);
    mx.globalCompositeOperation = "color";
    mx.fillStyle = col;
    mx.fillRect(0, 0, w, h);
    mx.globalCompositeOperation = "destination-in";
    if (flip) {
      mx.translate(w, 0);
      mx.scale(-1, 1);
    }
    mx.drawImage(ISOB.tin, sx, sy, w, h, 0, 0, w, h);
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.drawImage(m, 0, 0);
  }
  /* puntos de la base (volteados si toca) */
  const fx = (v) => (flip ? w - v : v),
    o = { c, w, h, b: [fx(bx), by], l: flip ? [w - rx, ry] : [lx, ly], r: flip ? [w - lx, ly] : [rx, ry] };
  return (ISOB.spr[k] = o);
}
/* silueta lisa de un dibujo (tropas tapadas) */
function isoSil(s, col) {
  s.sil = s.sil || {};
  if (s.sil[col]) return s.sil[col];
  const c = document.createElement("canvas");
  c.width = s.w;
  c.height = s.h;
  const x = c.getContext("2d");
  x.drawImage(s.c, 0, 0);
  x.globalCompositeOperation = "source-in";
  x.fillStyle = col;
  x.fillRect(0, 0, s.w, s.h);
  return (s.sil[col] = c);
}

/* ---------- ¿qué vista? ---------- */
/* la batalla se ve SIEMPRE en isométrica (decisión de diseño: el jugador no elige). La 3D y la clásica quedan
   como respaldo si los dibujos no cargan, y para las pruebas (window.ISO_APAGADA). */
function isoActiva() {
  return !!BT && ISOB.ok && !window.ISO_APAGADA;
}

/* ---------- proyección ---------- */
const isoTW = () => ISO_BASE * (typeof bzoom === "number" ? bzoom : 1) * ISOB.dpr;
function isoP(tx, ty) {
  const TW = isoTW(),
    c = ISOB.cam;
  return [ISOB.W / 2 + ((tx - c.x) - (ty - c.y)) * TW / 2, ISOB.H / 2 + ((tx - c.x) + (ty - c.y)) * TW / 4];
}
/* de un punto de la pantalla (px del lienzo) al campo */
function isoInv(sx, sy, cam = ISOB.cam) {
  const TW = isoTW(),
    u = (sx - ISOB.W / 2) / (TW / 2),
    v = (sy - ISOB.H / 2) / (TW / 4);
  return { x: cam.x + (u + v) / 2, y: cam.y + (v - u) / 2 };
}
const isoEv = (e) => {
  const r = ISOB.cv.getBoundingClientRect();
  return [(e.clientX - r.left) * ISOB.dpr, (e.clientY - r.top) * ISOB.dpr];
};
/* calzar un dibujo por su base: el punto «a» del dibujo cae en el punto A de la pantalla y «b» en B (en X) */
function isoCalza(s, pa, PA, pb, PB) {
  const k = Math.abs(PB[0] - PA[0]) / Math.max(1, Math.abs(s[pb][0] - s[pa][0]));
  return { k, x: PA[0] - s[pa][0] * k, y: PA[1] - s[pa][1] * k };
}

/* ---------- el escenario (una vez por batalla): lo que está de pie ---------- */
const isoH = (a, b) => {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const isoFueraBosque = (tx, ty) => Math.sin(tx * 0.13 + 0.4) * Math.cos(ty * 0.16 + 1.1) + 0.5 * Math.sin((tx + ty) * 0.071) + 0.25 * Math.sin(tx * 0.41 - ty * 0.37) > 0.55;
function isoEscenario() {
  const E = [],
    MU = BT.muro && BT.muro.x0 != null ? BT.muro : null,
    M = 34;
  ISOB.mu = MU;
  ISOB.campos = new Set();
  const dentroMU = (tx, ty) => MU && tx >= MU.x0 && tx < MU.x1 && ty >= MU.y0 && ty < MU.y1,
    cercaMU = (tx, ty, d) => MU && tx >= MU.x0 - d && tx < MU.x1 + d && ty >= MU.y0 - d && ty < MU.y1 + d;
  ISOB.terr = (tx, ty) => {
    const dentro = tx >= 0 && ty >= 0 && tx < BW && ty < BH;
    let t = dentro ? BT.terr[ty][tx] : isoFueraBosque(tx, ty) ? 1 : 0;
    if (MU && cercaMU(tx, ty, 7) && t === 1) t = 0;
    return t;
  };
  ISOB.dentroMU = dentroMU;
  /* árboles y matas */
  for (let ty = -M; ty < BH + M; ty++)
    for (let tx = -M; tx < BW + M; tx++) {
      const t = ISOB.terr(tx, ty);
      if (dentroMU(tx, ty)) continue;
      if (t === 1)
        for (let k = 0; k < 2; k++) {
          const fx = tx + 0.2 + isoH(tx * 3 + k, ty) * 0.6,
            fy = ty + 0.2 + isoH(tx, ty * 3 + k) * 0.6,
            a = isoH(fx, fy);
          E.push({ n: a < 0.5 ? "E_pino" + (1 + ((a * 8) | 0)) : "E_roble" + (1 + (((a - 0.5) * 8) | 0)), fx, fy, d: fx + fy, k: 0.85, tapa: true });
        }
      else if (t !== 3 && t !== 4 && isoH(tx * 5, ty * 7) < 0.05 && !(MU && cercaMU(tx, ty, 6)))
        E.push({ n: ["E_hierba1", "E_hierba2", "E_arbusto1", "E_arbusto2", "E_roca1", "E_hierba3"][(isoH(tx, ty * 2) * 6) | 0], fx: tx + 0.5, fy: ty + 0.5, d: tx + ty + 1, k: 0.55 });
    }
  if (MU) isoCiudad(E, MU);
  ISOB.est = E;
  ISOB.suelo = null;
}
/* la plaza sitiada: murallas, torres, puertas, calles, edificios construidos, casas; granjas y campos fuera */
function isoCiudad(E, MU) {
  const f = BT.ctx && BT.ctx.fort != null ? BT.ctx.fort : BT.fort || 2,
    niv = f < 1.5 ? 1 : f < 2.5 ? 2 : 3,
    W = (n) => "W_m" + niv + "_" + n,
    def = BT.ejs && BT.ejs[BT.map ? BT.map[BT.def] : 1],
    col = def && CIV[def.f] ? CIV[def.f].c : "#888888",
    p = BT.ctx && BT.ctx.p ? BT.ctx.p : null;
  /* murallas: un tramo por casilla de cada lienzo, calzado por la base; la puerta ocupa SU tramo */
  const puerta = (tx, ty, l) => MU.puertas.some((q) => q.l === l && (l === "N" || l === "S" ? q.x - tx > -0.01 && q.x - tx <= 0.99 : q.y - ty > -0.01 && q.y - ty <= 0.99));
  for (let tx = MU.x0; tx < MU.x1; tx++)
    for (const [ly, l] of [
      [MU.y0, "N"],
      [MU.y1, "S"],
    ])
      E.push({ muro: 1, n: puerta(tx, ly, l) ? W("p_cerrada") : W("dir1"), pu: puerta(tx, ly, l), a: [tx, ly], b: [tx + 1, ly], ori: 1, d: tx + ly + 0.5, col, tapa: true });
  for (let ty = MU.y0; ty < MU.y1; ty++)
    for (const [lx, l] of [
      [MU.x0, "O"],
      [MU.x1, "E"],
    ])
      E.push({ muro: 1, n: puerta(lx, ty, l) ? W("p_cerrada") : W("dir2"), pu: puerta(lx, ty, l), a: [lx, ty + 1], b: [lx, ty], ori: 2, d: lx + ty + 0.5, col, tapa: true });
  /* torres en la línea de la muralla (y en las esquinas) */
  const tor = [...MU.torres.map((t) => [t.x, t.y]), [MU.x0, MU.y0], [MU.x1, MU.y0], [MU.x0, MU.y1], [MU.x1, MU.y1]],
    vistas = new Set();
  for (const [x, y] of tor) {
    const k = Math.round(x * 2) + "," + Math.round(y * 2);
    if (vistas.has(k)) continue;
    vistas.add(k);
    E.push({ torre: 1, n: W("torre"), fx: x, fy: y, d: x + y + 0.6, col, tapa: true });
  }
  /* edificios de la provincia (o un surtido si la batalla no es de una provincia) */
  const B = [],
    lv = (k) => Math.max(0, Math.round(p ? +p[k] || 0 : 0)),
    pon = (n, t = 2) => B.push({ n, t });
  if (p) {
    if (lv("market")) pon("B_mercado1");
    if (lv("temple")) pon(["B_templo1", "B_templo3", "B_templo4"][Math.min(2, lv("temple") - 1)], lv("temple") >= 3 ? 3 : 2);
    if (lv("cuartel")) pon("B_cuartel1");
    if (lv("establo")) pon("B_establo" + Math.min(3, lv("establo")));
    if (lv("guerreros")) pon("B_guerreros" + Math.min(3, lv("guerreros")));
    if (lv("arqueria")) pon("B_tiro" + Math.min(3, lv("arqueria")));
    if (lv("herreria")) pon(lv("herreria") >= 3 ? "B_taller3" : "B_herreria" + lv("herreria"));
    if (lv("escuela")) pon("B_escuela" + Math.min(3, lv("escuela")));
    if (lv("torre")) pon("B_vigia" + Math.min(3, lv("torre")));
    if (lv("acueducto")) pon("B_acueducto" + Math.min(2, lv("acueducto")));
  } else ["B_mercado1", "B_templo3", "B_cuartel1", "B_herreria2", "B_escuela2", "B_establo2", "B_guerreros1", "B_tiro2"].forEach((n) => pon(n));
  B.push({ n: "B_pozo2", t: 2, esc: 0.6 });
  pon(isoH(MU.x0, MU.y0) < 0.5 ? "B_almacen1" : "B_almacen2");
  /* casas según la población */
  const pob = p && typeof ecoPob === "function" && G && G.eco ? ecoPob(p) : 12,
    nCasas = 999; /* la ciudad amurallada, llena: casas en las parcelas libres (algún patio vacío) */
  /* parcelas de 2×2 dentro de la muralla, sin las calles en cruz; el centro para el palacio o la plaza */
  const cx = Math.round(MU.cx),
    cy = Math.round(MU.cy),
    lotes = [];
  for (let by = MU.y0 + 1; by + 2 <= MU.y1 - 1; by += 2)
    for (let bx = MU.x0 + 1; bx + 2 <= MU.x1 - 1; bx += 2) {
      if (bx < cx + 1 && bx + 2 > cx - 1) continue;
      if (by < cy + 1 && by + 2 > cy - 1) continue;
      lotes.push([bx, by]);
    }
  /* los edificios grandes, cerca del centro; luego las casas */
  lotes.sort((a, b) => Math.hypot(a[0] + 1 - cx, a[1] + 1 - cy) - Math.hypot(b[0] + 1 - cx, b[1] + 1 - cy));
  let i = 0;
  for (const e of B) {
    if (i >= lotes.length) break;
    const [bx, by] = lotes[i++];
    E.push({ lote: 1, n: e.n, bx, by, t: 2, d: bx + by + 4, col, tapa: true, esc: e.esc });
  }
  const casas = ["C_casa1", "C_casa2", "C_casa3", "C_casa4", "C_casa5", "C_casa6"];
  const dens = Math.min(0.92, 0.55 + pob / 60);
  for (let c = 0; c < nCasas && i < lotes.length; c++) {
    const [bx, by] = lotes[i++],
      h = isoH(bx, by);
    if (isoH(by * 3, bx * 7) > dens) continue;
    const
      n = h < 0.08 ? "C_villa1" : h < 0.14 ? "C_villa2" : casas[(isoH(by, bx) * 6) | 0];
    E.push({ lote: 1, n, bx, by, t: 2, d: bx + by + 4, col, tapa: true });
  }
  /* el centro: palacio en la capital; en las demás, la plaza con su pozo */
  if (p && p.cap) E.push({ lote: 1, n: "C_palacio", bx: cx - 2, by: cy - 2, t: 4, d: cx + cy + 4, col, tapa: true, sobre: 1 });
  else E.push({ lote: 1, n: "B_pozo2", bx: cx - 1, by: cy - 1, t: 2, d: cx + cy + 2, col, esc: 0.55 });
  /* fuera: granjas (según su nivel) con sus campos, y lo que se explote cerca */
  const fuera = [],
    gl = p ? Math.max(1, lv("farm")) : 2;
  for (let k = 0; k < Math.min(4, gl + 1); k++) fuera.push("B_granja" + Math.min(3, gl));
  fuera.push("B_molino2");
  if (p && lv("aserradero")) fuera.push("B_aserradero" + Math.min(3, lv("aserradero")));
  if (p && lv("mina")) fuera.push("B_mina" + Math.min(2, lv("mina")));
  if (p && lv("cantera")) fuera.push("B_cantera2");
  if (p && lv("salinas")) fuera.push("B_salinas" + Math.min(3, lv("salinas")));
  const sitios = [
    [MU.x0 - 5, MU.y0 + 1],
    [MU.x1 + 3, MU.y0 + 2],
    [MU.x0 + 2, MU.y0 - 5],
    [MU.x0 + 3, MU.y1 + 3],
    [MU.x1 + 3, MU.y1 - 4],
    [MU.x0 - 5, MU.y1 - 3],
    [MU.x1 - 4, MU.y0 - 5],
    [MU.x1 - 3, MU.y1 + 3],
  ];
  fuera.forEach((n, k) => {
    const s = sitios[k % sitios.length];
    E.push({ lote: 1, n, bx: s[0], by: s[1], t: 2, d: s[0] + s[1] + 4, col, tapa: true });
    /* campos de labor alrededor de la granja */
    if (n.startsWith("B_granja") || n === "B_molino2")
      for (let dy = -2; dy < 4; dy++) for (let dx = -2; dx < 4; dx++) if (!(dx >= 0 && dx < 2 && dy >= 0 && dy < 2)) ISOB.campos.add(s[0] + dx + "," + (s[1] + dy));
  });
}

/* ---------- el suelo, cacheado ---------- */
function isoSueloTile(tx, ty) {
  const v = (isoH(tx, ty) * 4) | 0,
    MU = ISOB.mu,
    t = ISOB.terr(tx, ty);
  if (MU && ISOB.dentroMU(tx, ty)) return Math.abs(tx + 0.5 - MU.cx) < 1 || Math.abs(ty + 0.5 - MU.cy) < 1 ? "F_calzada_" + v : "F_tierra_" + v;
  if (ISOB.campos.has(tx + "," + ty)) return (isoH(Math.floor(tx / 3), Math.floor(ty / 3)) < 0.5 ? "F_trigo_" : "F_arado_") + v;
  if (t === 1) return "F_sbosque_" + Math.min(2, v);
  if (t === 2) return "F_colina_" + v;
  if (t === 3) return "F_rio_" + v;
  if (t === 4) return "F_lago_3";
  return isoH(ty, tx) < 0.035 ? "F_flores_" + v : "F_pasto_" + v;
}
function isoSuelo() {
  const TW = isoTW(),
    TH = TW / 2,
    m = Math.ceil(TW * 3),
    c = ISOB.cam,
    S = ISOB.suelo;
  if (S && S.TW === TW && S.zona === BT.phase && Math.abs(S.cam.x - c.x) * TW < m * 0.45 && Math.abs(S.cam.y - c.y) * TW < m * 0.45 && S.W === ISOB.W && S.H === ISOB.H) return S;
  const cv = (S && S.cv) || document.createElement("canvas");
  cv.width = ISOB.W + 2 * m;
  cv.height = ISOB.H + 2 * m;
  const x = cv.getContext("2d");
  x.imageSmoothingEnabled = TW < 120;
  x.imageSmoothingQuality = "high";
  x.fillStyle = "#7d8a3a";
  x.fillRect(0, 0, cv.width, cv.height);
  const cam = { x: c.x, y: c.y },
    P = (tx, ty) => [m + ISOB.W / 2 + ((tx - cam.x) - (ty - cam.y)) * TW / 2, m + ISOB.H / 2 + ((tx - cam.x) + (ty - cam.y)) * TW / 4],
    esq = [isoInv(-m, -m, cam), isoInv(ISOB.W + m, -m, cam), isoInv(-m, ISOB.H + m, cam), isoInv(ISOB.W + m, ISOB.H + m, cam)],
    x0 = Math.floor(Math.min(...esq.map((p) => p.x))) - 1,
    x1 = Math.ceil(Math.max(...esq.map((p) => p.x))) + 1,
    y0 = Math.floor(Math.min(...esq.map((p) => p.y))) - 1,
    y1 = Math.ceil(Math.max(...esq.map((p) => p.y))) + 1,
    K = 1.22,
    mio = BT.phase === "deploy" ? (BT.mios || [0])[0] : null;
  for (let ty = y0; ty <= y1; ty++)
    for (let tx = x0; tx <= x1; tx++) {
      const [X, Y] = P(tx, ty);
      if (X < -TW || X > cv.width + TW || Y < -TW || Y > cv.height + TW) continue;
      const s = isoSpr(isoSueloTile(tx, ty));
      if (s) x.drawImage(s.c, X - (TW * K) / 2, Y + TH / 2 - (TH * K) / 2, TW * K, TH * K);
    }
  /* zona de despliegue del jugador: más clara */
  if (mio != null && typeof cmbEnZona === "function") {
    x.fillStyle = "rgba(255,240,170,.16)";
    for (let ty = Math.max(0, y0); ty <= Math.min(BH - 1, y1); ty++)
      for (let tx = Math.max(0, x0); tx <= Math.min(BW - 1, x1); tx++) {
        if (!cmbEnZona(mio, tx + 0.5, ty + 0.5)) continue;
        const [X, Y] = P(tx, ty);
        x.beginPath();
        x.moveTo(X, Y);
        x.lineTo(X + TW / 2, Y + TH / 2);
        x.lineTo(X, Y + TH);
        x.lineTo(X - TW / 2, Y + TH / 2);
        x.fill();
      }
  }
  /* línea roja: el campo donde se pelea */
  x.strokeStyle = "#d8392b";
  x.lineWidth = Math.max(1.5, TW / 40);
  x.setLineDash([TW / 6, TW / 12]);
  x.beginPath();
  [
    [0, 0],
    [BW, 0],
    [BW, BH],
    [0, BH],
  ].forEach(([a, b], i) => {
    const [X, Y] = P(a, b);
    i ? x.lineTo(X, Y) : x.moveTo(X, Y);
  });
  x.closePath();
  x.stroke();
  x.setLineDash([]);
  return (ISOB.suelo = { cv, cam, m, TW, zona: BT.phase, W: ISOB.W, H: ISOB.H });
}

/* ---------- un fotograma ---------- */
const ISO_FR = {
  leg: { qui: ["leg_qui", "leg_qui2", "leg_qui3", "leg_qui4"], cam: ["leg_cam", "leg_cam2", "leg_cam3", "leg_cam4"], cor: ["leg_cor", "leg_cor2", "leg_cor3"], ata: ["leg_ata", "leg_ata2", "leg_ata4"], hui: ["leg_hui", "leg_hui2", "hui1", "hui2"], esp: ["leg_esp"] },
  lan: { qui: ["lan_qui"], cam: ["lan_cam", "lan_cam2", "lan_cam3", "lan_cam4"], cor: ["lan_cam5", "lan_cam6"], ata: ["lan_cam7", "lan_cam"], hui: ["lan_hui", "hui3", "hui4"], esp: ["lan_es1", "lan_es2", "lan_es3"] },
  arq: { qui: ["arq_qui"], cam: ["arq_cam"], cor: ["arq_cam"], ata: ["arq_ata1", "arq_ata2", "arq_ata3", "arq_ata4", "arq_ata5"], hui: ["hui5", "hui6"], esp: null },
  hon: { qui: ["hon1", "hon2"], cam: ["hon3", "hon4"], cor: ["hon5"], ata: ["hon6", "hon7", "hon8"], hui: ["hon_es3", "hon_es4"], esp: ["hon_es1", "hon_es2"] },
  pes: { qui: ["pes1", "pes2"], cam: ["pes3", "pes4", "pes5"], cor: ["pes6"], ata: ["pes7", "pes8", "pes9"], hui: ["hui1", "hui2"], esp: null },
};
function isoFiguras(now) {
  const TW = isoTW(),
    S = TW / 120,
    F = [];
  for (const u of BT.units) {
    if (u.x < 0 || u.n <= 0 || !act(u)) continue;
    const [UX, UY] = isoP(u.x, u.y);
    if (UX < -TW * 2 || UX > ISOB.W + TW * 2 || UY < -TW * 2 || UY > ISOB.H + TW * 2) continue;
    const cl = u.cs && u.cs.cl,
      mov = u.mvT && now - u.mvT < 600,
      est = u.rout ? "hui" : u.eng > 0 ? "ata" : u.charge > 0 ? "cor" : mov ? "cam" : "qui";
    /* hacia dónde mira: su avance (o la dirección de su bando) proyectado en la pantalla */
    const fw = typeof cmbFwd === "function" ? cmbFwd(u.side) : [u.side % 2 ? -1 : 1, 0],
      dx = u.rout ? -fw[0] : fw[0],
      dy = u.rout ? -fw[1] : fw[1],
      sxd = dx - dy,
      syd = dx + dy,
      izq = sxd < 0,
      lejos = syd < -0.05;
    let lista,
      fig = Math.min(9, Math.max(2, Math.ceil(u.n / 3))),
      k = 0.62,
      flip = izq;
    if (cl === "cab") {
      const base = u.t === "m" ? "aqa" : u.t === "k" || u.t === "c" ? "cab" : "jin";
      lista = ["U_" + base + "_" + (est === "hui" ? (base === "jin" ? "hui_es" : base === "cab" ? "hui" : "cam_fr") : est === "ata" ? "ata_fr" : est === "cor" || est === "cam" ? (base === "cab" ? "cor_fr" : "cam_fr") : "qui_fr")];
      fig = Math.min(5, fig);
      k = 0.75;
    } else if (/ele/.test(u.t)) {
      lista = ["U_ele_" + (est === "ata" ? "ata_fr" : est === "qui" ? "qui_fr" : "cam_fr")];
      fig = 1;
      k = 0.8;
    } else if (u.t === "cat" || u.t === "ari" || u.t === "tor") {
      lista = ["U_" + u.t + "_" + (est === "ata" ? "ata" : est === "qui" ? "qui" : "cam")];
      fig = 1;
      k = 0.8;
    } else {
      const g = cl === "dis" ? (u.t === "h" ? "hon" : "arq") : u.t === "l" ? "lan" : u.t === "p" ? "pes" : "leg",
        Fr = ISO_FR[g];
      if (lejos && Fr.esp && (est === "qui" || est === "cam" || est === "cor")) {
        lista = Fr.esp;
        flip = !izq;
      } else lista = Fr[est] || Fr.qui;
      lista = lista.map((n) => "I_" + n);
    }
    lista = lista.filter((n) => ISO_DATOS.spr[n]);
    if (!lista.length) lista = ["I_leg_qui"];
    const col = CIV[u.f] ? CIV[u.f].c : "#999999",
      cols = Math.ceil(Math.sqrt(fig * 1.6)),
      paso = (now / 170) | 0;
    for (let q = 0; q < fig; q++) {
      const fx = u.x + ((q % cols) - (cols - 1) / 2) * 0.42 + (isoH(u.id, q) - 0.5) * 0.12,
        fy = u.y + (Math.floor(q / cols) - 0.5) * 0.42 + (isoH(q, u.id) - 0.5) * 0.12,
        s = isoSpr(lista[(q + paso) % lista.length], col, flip);
      if (!s) continue;
      const [X, Y] = isoP(fx, fy),
        kk = k * S;
      F.push({ u, fx, fy, X, Y, s, kk, col, r: [X - (s.w * kk) / 2, Y + 6 * S - s.h * kk, s.w * kk, s.h * kk], sil: false });
    }
  }
  return F;
}
function isoFrame(now) {
  isoDom();
  const cv = ISOB.cv,
    dpr = (ISOB.dpr = Math.min(2, window.devicePixelRatio || 1)),
    r = ISOB.wrap.getBoundingClientRect(),
    W = Math.max(1, Math.round(r.width * dpr)),
    H = Math.max(1, Math.round(r.height * dpr));
  if (cv.width !== W || cv.height !== H) {
    cv.width = W;
    cv.height = H;
  }
  ISOB.W = W;
  ISOB.H = H;
  if (ISOB.btId !== BT) {
    ISOB.btId = BT;
    ISOB.centrado = false;
    isoEscenario();
    isoCentrar();
  }
  /* al desplegarse tus tropas (o al empezar), la cámara va a ellas una vez */
  if (!ISOB.centrado && BT.units.some((u) => u.x >= 0 && (BT.mios || [0]).includes(u.side))) {
    ISOB.centrado = true;
    isoCentrar();
  }
  const x = ISOB.x,
    TW = isoTW(),
    S = TW / 120;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.imageSmoothingEnabled = S < 1;
  x.imageSmoothingQuality = "high";
  /* suelo */
  const sl = isoSuelo(),
    [cx0, cy0] = [ISOB.W / 2 + ((sl.cam.x - ISOB.cam.x) - (sl.cam.y - ISOB.cam.y)) * TW / 2, ISOB.H / 2 + ((sl.cam.x - ISOB.cam.x) + (sl.cam.y - ISOB.cam.y)) * TW / 4];
  x.drawImage(sl.cv, Math.round(cx0 - ISOB.W / 2 - sl.m), Math.round(cy0 - ISOB.H / 2 - sl.m));
  /* figuras de este fotograma */
  const FIG = isoFiguras(now);
  ISOB.fig = FIG;
  const L = [];
  /* lo que está de pie */
  for (const e of ISOB.est) {
    const s = isoSpr(e.n, e.col);
    if (!s) continue;
    let k, dx, dy;
    if (e.muro) {
      const A = isoP(e.a[0], e.a[1]),
        Bp = isoP(e.b[0], e.b[1]);
      if (e.pu) {
        k = (Math.abs(Bp[0] - A[0]) * 1.15) / s.w;
        dx = (A[0] + Bp[0]) / 2 - (s.w * k) / 2;
        dy = (A[1] + Bp[1]) / 2 + TW * 0.12 - s.h * k;
      } else {
        const c = e.ori === 1 ? isoCalza(s, "l", A, "b", Bp) : isoCalza(s, "b", A, "r", Bp);
        k = c.k;
        dx = c.x;
        dy = c.y;
      }
    } else if (e.torre) {
      const [X, Y] = isoP(e.fx, e.fy);
      k = (TW * 0.62) / Math.max(1, s.r[0] - s.l[0]);
      dx = X - s.b[0] * k;
      dy = Y + TW * 0.12 - s.b[1] * k;
    } else if (e.lote) {
      /* el dibujo ocupa su parcela de t×t casillas: izquierda, abajo y derecha del rombo */
      const Lf = isoP(e.bx, e.by + e.t),
        Bt = isoP(e.bx + e.t, e.by + e.t),
        Rt = isoP(e.bx + e.t, e.by);
      k = ((Rt[0] - Lf[0]) * 0.94 * (e.esc || 1)) / Math.max(1, s.r[0] - s.l[0]);
      dx = Bt[0] - s.b[0] * k;
      dy = Bt[1] - TW * 0.04 - s.b[1] * k;
    } else {
      const [X, Y] = isoP(e.fx, e.fy);
      k = e.k * S;
      dx = X - (s.w * k) / 2;
      dy = Y + 4 * S - s.h * k;
    }
    const w = s.w * k,
      h = s.h * k;
    if (dx > ISOB.W || dy > ISOB.H || dx + w < 0 || dy + h < 0) continue;
    L.push({ d: e.d, s: 1, f: () => {
      /* si tapa a alguna tropa que está detrás, translúcido */
      if (e.tapa) {
        let t = false;
        for (const f of FIG) if (f.fx + f.fy < e.d - 0.2 && f.X > dx && f.X < dx + w && f.Y > dy && f.Y < dy + h + 4 * S) { f.sil = true; t = true; }
        if (t) x.globalAlpha = 0.4;
      }
      x.drawImage(s.c, dx, dy, w, h);
      x.globalAlpha = 1;
    } });
  }
  /* caídos */
  const modo = typeof OPC !== "undefined" ? OPC.v.sangre || "si" : "si";
  (BT.dead || []).forEach((d, i) => {
    const fx = d.x / TS,
      fy = d.y / TS,
      [X, Y] = isoP(fx, fy);
    if (X < -TW || X > ISOB.W + TW || Y < -TW || Y > ISOB.H + TW) return;
    const h = isoH(i, 3);
    if (modo !== "no")
      L.push({ d: fx + fy - 0.4, s: 0, f: () => {
        const sp = isoSpr("G_san_p" + (modo === "brutal" ? 3 + ((h * 4) | 0) : 2 + ((h * 2) | 0)));
        if (sp) x.drawImage(sp.c, X - (sp.w * 0.8 * S) / 2, Y - (sp.h * 0.8 * S) / 2, sp.w * 0.8 * S, sp.h * 0.8 * S);
        if (modo === "brutal" && h < 0.35) {
          const v = isoSpr("G_vis" + (1 + ((h * 11) | 0)));
          if (v) x.drawImage(v.c, X + 8 * S - (v.w * 0.45 * S) / 2, Y + 2 * S - (v.h * 0.45 * S) / 2, v.w * 0.45 * S, v.h * 0.45 * S);
        }
      } });
    L.push({ d: fx + fy, s: 2, f: () => {
      const c = isoSpr(h < 0.5 ? "I_leg_cai" : "I_leg_mu", CIV[d.f] ? CIV[d.f].c : "#888888", h > 0.75);
      if (c) x.drawImage(c.c, X - (c.w * 0.6 * S) / 2, Y + 6 * S - c.h * 0.6 * S, c.w * 0.6 * S, c.h * 0.6 * S);
    } });
  });
  /* anillos de selección, debajo de las figuras */
  const sels = new Set(BT.sels || (BT.sel != null ? [BT.sel] : []));
  for (const u of BT.units) {
    if (!sels.has(u.id) || u.x < 0 || !act(u)) continue;
    const [X, Y] = isoP(u.x, u.y),
      rr = (typeof rad === "function" ? rad(u) : 0.7) * TW * 0.75;
    L.push({ d: u.x + u.y - 1, s: 0, f: () => {
      x.strokeStyle = "#ffd75a";
      x.lineWidth = Math.max(1.5, TW / 45);
      x.beginPath();
      x.ellipse(X, Y, rr * 1.3, rr * 0.65, 0, 0, Math.PI * 2);
      x.stroke();
    } });
  }
  /* las figuras */
  for (const f of FIG)
    L.push({ d: f.fx + f.fy, s: 3, f: () => {
      x.fillStyle = "rgba(0,0,0,.28)";
      x.beginPath();
      x.ellipse(f.X, f.Y + 2 * S, f.s.w * f.kk * 0.3, 7 * S, 0, 0, Math.PI * 2);
      x.fill();
      x.drawImage(f.s.c, f.r[0], f.r[1], f.r[2], f.r[3]);
    } });
  L.sort((a, b) => a.d - b.d || a.s - b.s);
  for (const o of L) o.f();
  /* siluetas de las tropas tapadas */
  x.globalAlpha = 0.5;
  for (const f of FIG) if (f.sil) x.drawImage(isoSil(f.s, f.col), f.r[0], f.r[1], f.r[2], f.r[3]);
  x.globalAlpha = 1;
  /* flechas en vuelo */
  x.strokeStyle = "#3a2a18";
  x.lineWidth = Math.max(1, TW / 70);
  for (const a of BT.fx || []) {
    if (!a.arrow) continue;
    const t = (now - a.t0) / 700;
    if (t < 0 || t > 1) continue;
    const px = a.x0 + (a.x - a.x0) * t,
      py = a.y0 + (a.y - a.y0) * t,
      [X, Y] = isoP(px, py),
      hgt = Math.sin(t * Math.PI) * TW * 0.9,
      [X2, Y2] = isoP(px - (a.x - a.x0) * 0.04, py - (a.y - a.y0) * 0.04),
      h2 = Math.sin(Math.max(0, t - 0.04) * Math.PI) * TW * 0.9;
    x.beginPath();
    x.moveTo(X, Y - hgt);
    x.lineTo(X2, Y2 - h2);
    x.stroke();
  }
  /* cifras de cada pelotón (como las barras de la 3D) */
  if (!B3D.pref || B3D.pref.barras !== false) {
    x.font = `${Math.round(Math.max(10, TW / 6))}px "Press Start 2P", monospace`;
    x.textAlign = "center";
    for (const u of BT.units) {
      if (u.x < 0 || u.n <= 0 || !act(u)) continue;
      const [X, Y] = isoP(u.x, u.y),
        yy = Y - TW * 0.75;
      if (X < 0 || X > ISOB.W || yy < 0 || yy > ISOB.H) continue;
      const t = String(u.n);
      x.fillStyle = "rgba(0,0,0,.6)";
      const w = x.measureText(t).width + 8;
      x.fillRect(X - w / 2, yy - TW / 6, w, TW / 5);
      x.fillStyle = typeof mio === "function" && mio(u) ? "#fff3b0" : CIV[u.f] ? CIV[u.f].c : "#fff";
      x.fillText(t, X, yy);
    }
    x.textAlign = "left";
  }
}
/* la cámara empieza sobre tus tropas */
function isoCentrar() {
  const us = BT.units.filter((u) => u.x >= 0 && act(u) && (BT.mios || [0]).includes(u.side)),
    l = us.length ? us : BT.units.filter((u) => u.x >= 0);
  if (!l.length) {
    ISOB.cam = { x: BW / 2, y: BH / 2 };
    return;
  }
  const mx = l.reduce((s, u) => s + u.x, 0) / l.length,
    my = l.reduce((s, u) => s + u.y, 0) / l.length,
    en = BT.units.filter((u) => u.x >= 0 && act(u) && !l.includes(u)),
    ex = en.length ? en.reduce((s, u) => s + u.x, 0) / en.length : BW / 2,
    ey = en.length ? en.reduce((s, u) => s + u.y, 0) / en.length : BH / 2;
  /* tus tropas en el centro, un poco hacia el enemigo */
  ISOB.cam = { x: mx * 0.8 + ex * 0.2, y: my * 0.8 + ey * 0.2 };
}

/* ---------- DOM y mandos ---------- */
function isoDom() {
  if (ISOB.wrap) return;
  const bm = document.querySelector("#battle .bmain"),
    sc = $("bscroll");
  if (!bm || !sc) return;
  if (typeof b3dDom === "function") b3dDom(); /* la barra con el botón «Vista» */
  const w = document.createElement("div");
  w.id = "bisowrap";
  w.setAttribute("role", "application");
  w.setAttribute("aria-label", "Campo de batalla (vista isométrica)");
  w.tabIndex = 0;
  w.innerHTML = '<canvas id="bisocv"></canvas>';
  bm.insertBefore(w, sc);
  ISOB.wrap = w;
  ISOB.cv = $("bisocv");
  ISOB.x = ISOB.cv.getContext("2d");
  const cv = ISOB.cv,
    lp = { t: null };
  /* punto del campo bajo el dedo: si toca el cuerpo de una figura, su unidad */
  const campo = (e, cam) => {
    const [sx, sy] = isoEv(e);
    for (let i = ISOB.fig.length - 1; i >= 0; i--) {
      const f = ISOB.fig[i];
      if (sx >= f.r[0] && sx <= f.r[0] + f.r[2] && sy >= f.r[1] && sy <= f.r[1] + f.r[3]) return { x: f.u.x, y: f.u.y, u: f.u };
    }
    return isoInv(sx, sy, cam);
  };
  cv.addEventListener("pointerdown", (e) => {
    ISOB.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ISOB.pts.size === 2) {
      clearTimeout(lp.t);
      ISOB.drag = null;
      const [a, b] = [...ISOB.pts.values()];
      ISOB.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: bzoom };
      return;
    }
    if (ISOB.pts.size > 2 || !BT) return;
    const p = campo(e),
      h = p.u || hitAt(p.x, p.y);
    ISOB.drag = { cx: e.clientX, cy: e.clientY, cam0: { ...ISOB.cam }, x0: p.x, y0: p.y, x: p.x, y: p.y, h: h ? h.id : null, mine: !!(h && mio(h)), mode: null };
    clearTimeout(lp.t);
    lp.t = setTimeout(() => {
      const d = ISOB.drag;
      if (!d || d.mode || !BT) return;
      if (d.mine && BT.phase === "plan") {
        toggleSel(d.h);
        d.mode = "done";
        buzz();
        bui();
      } else if (!d.h && BT.phase === "plan") {
        d.mode = "box";
        buzz();
      }
    }, 420);
    try {
      cv.setPointerCapture(e.pointerId);
    } catch (_) {}
  });
  cv.addEventListener("pointermove", (e) => {
    if (ISOB.pts.has(e.pointerId)) ISOB.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ISOB.pinch && ISOB.pts.size >= 2) {
      const [a, b] = [...ISOB.pts.values()];
      isoZoom((ISOB.pinch.z0 * Math.hypot(a.x - b.x, a.y - b.y)) / ISOB.pinch.d0, (a.x + b.x) / 2, (a.y + b.y) / 2);
      return;
    }
    const d = ISOB.drag;
    if (!d || !BT) return;
    const mv = Math.hypot(e.clientX - d.cx, e.clientY - d.cy) > 8;
    if (!d.mode && mv) {
      clearTimeout(lp.t);
      if (d.mine && (BT.phase === "deploy" || canOrder())) {
        d.mode = "unit";
        if (!BT.sels.includes(d.h)) {
          BT.sels = [d.h];
          BT.sel = d.h;
          fixSlot();
        }
      } else d.mode = "pan";
    }
    if (d.mode === "pan") {
      /* el terreno sigue al dedo: el punto que agarraste queda bajo el dedo */
      const [sx, sy] = isoEv(e),
        q = isoInv(sx, sy, d.cam0);
      ISOB.cam = { x: clamp(d.cam0.x - (q.x - d.x0), -10, BW + 10), y: clamp(d.cam0.y - (q.y - d.y0), -10, BH + 10) };
      return;
    }
    const p = campo(e);
    d.x = p.x;
    d.y = p.y;
  });
  const fin = (e) => {
    ISOB.pts.delete(e.pointerId);
    if (ISOB.pinch) {
      if (ISOB.pts.size < 2) ISOB.pinch = null;
      ISOB.drag = null;
      return;
    }
    clearTimeout(lp.t);
    const d = ISOB.drag;
    ISOB.drag = null;
    if (!BT || !d || e.type === "pointercancel") return;
    const [sx, sy] = isoEv(e),
      p = d.mode === "box" ? isoInv(sx, sy) : campo(e);
    if (d.mode === "pan" || d.mode === "done") return;
    if (d.mode === "box") {
      const x0 = Math.min(d.x0, p.x),
        x1 = Math.max(d.x0, p.x),
        y0 = Math.min(d.y0, p.y),
        y1 = Math.max(d.y0, p.y),
        ids = BT.units.filter((u) => mio(u) && act(u) && !u.rout && u.x + rad(u) >= x0 && u.x - rad(u) <= x1 && u.y + 0.6 >= y0 && u.y - 0.6 <= y1).map((u) => u.id);
      if (ids.length) {
        BT.sels = ids;
        BT.sel = ids[0];
        fixSlot();
        buzz();
      }
      bui();
      return;
    }
    if (d.mode === "unit") {
      if (BT.phase === "deploy") {
        const u = bU(d.h);
        if (u) cmbColocar(u, p.x, p.y);
        bui();
        return;
      }
      const h = p.u || hitAt(p.x, p.y);
      if (h && !aliado(h)) orderGroup({ tg: h.id });
      else orderGroup({ x: p.x, y: p.y });
      return;
    }
    tapAt(p.x, p.y, e.shiftKey);
  };
  cv.addEventListener("pointerup", fin);
  cv.addEventListener("pointercancel", fin);
  cv.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      isoZoom(bzoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
    },
    { passive: false },
  );
  cv.addEventListener("contextmenu", (e) => e.preventDefault());
}
/* zoom con el punto bajo el cursor fijo (el mismo zoom de batalla que los botones) */
function isoZoom(z, cx, cy) {
  const r = ISOB.cv.getBoundingClientRect(),
    sx = (cx - r.left) * ISOB.dpr,
    sy = (cy - r.top) * ISOB.dpr,
    a = isoInv(sx, sy);
  batZoom(z);
  const b = isoInv(sx, sy);
  ISOB.cam = { x: ISOB.cam.x + (a.x - b.x), y: ISOB.cam.y + (a.y - b.y) };
}
/* el oyente del sonido: la cámara isométrica */
function isoOyente() {
  if (!isoActiva() || !ISOB.cv) return null;
  const TW = isoTW() / ISOB.dpr;
  return { W: ISOB.W / ISOB.dpr, H: ISOB.H / ISOB.dpr, ppc: TW / 1.4, p: (x, y) => { const [X, Y] = isoP(x, y); return { x: X / ISOB.dpr, y: Y / ISOB.dpr }; } };
}

/* ---------- enganche: drawBattle, el botón «Vista» y su etiqueta ---------- */
if (typeof drawBattle === "function") {
  const isoDB0 = drawBattle;
  drawBattle = function (now) {
    const on = isoActiva();
    const bt = $("battle");
    if (bt) bt.classList.toggle("biso-on", on);
    if (!on) return isoDB0.apply(this, arguments);
    if (typeof b3dDesmontar === "function" && B3D.scene) b3dDesmontar();
    try {
      isoFrame(now);
    } catch (e) {
      console.error(e);
    }
    if (B3D.bar && !ISOB.barra) {
      ISOB.barra = 1;
      b3dBarra();
    }
  };
}
if (typeof b3dBoton === "function") {
  const isoBot0 = b3dBoton;
  b3dBoton = function (k) {
    if (k !== "vista") return isoBot0.apply(this, arguments);
    /* isométrica → 3D → clásica → isométrica */
    const v = b3dVista();
    B3D.pref.vista = v === "iso" ? "3d" : v === "3d" ? "2d" : "iso";
    b3dGuardar();
    if (B3D.pref.vista !== "3d" && B3D.scene) b3dDesmontar();
    if (B3D.pref.vista === "3d") b3dWebGL();
    ISOB.barra = 0;
    b3dBarra();
  };
}
if (typeof b3dBarra === "function") {
  const isoBar0 = b3dBarra;
  b3dBarra = function () {
    const r = isoBar0.apply(this, arguments);
    if (B3D.bar && isoActiva()) {
      if (B3D.ayuda) B3D.ayuda.textContent = matchMedia("(pointer: coarse)").matches ? "Pellizca: zoom · arrastra el terreno: desplazar · toca una unidad y luego el destino" : "Rueda: zoom · arrastra el terreno: desplazar · toca una unidad y luego el destino (o arrástrala)";
      const v = B3D.bar.querySelector('[data-b3d="vista"]');
      if (v) {
        v.textContent = "Vista: isométrica";
        v.setAttribute("aria-pressed", "true");
        v.title = "Cambiar entre la vista isométrica, la 3D y la clásica";
      }
      const z = $("bzl");
      if (z) z.textContent = Math.round(bzoom * 100) + "%";
    }
    return r;
  };
}
