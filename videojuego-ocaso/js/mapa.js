/* ---------- mapa ----------
   gen(semilla, dim): dim = {w, h, gx, gy} (G.mapa; ver mundoDims en mundo.js). Sin dim, el mapa
   del modo histórico (64×40, rejilla 8×5). Con el mismo dim y semilla el mapa sale siempre igual. */
function gen(seed, dim) {
  dim = dim && dim.w ? dim : MUNDO_DIM0;
  mundoLienzo(dim.w, dim.h);
  /* GX×GY semillas de provincia; s escala la textura del terreno con el tamaño (1 en el histórico) */
  const GX = dim.gx || 8,
    GY = dim.gy || 5,
    s = W / 64,
    n2x = Math.round(8 * s),
    n2y = Math.round(6 * s),
    n3x = Math.round(10 * s),
    n3y = Math.round(7 * s);
  for (let tries = 0; tries < 300; tries++, seed++) {
    const r = mul(seed),
      n1 = noise(r, 5, 4),
      n2 = noise(r, n2x, n2y),
      n3 = noise(r, n3x, n3y),
      n4 = noise(r, n3x, n3y),
      terr = [],
      grid = [];
    for (let y = 0; y < H; y++) {
      terr.push([]);
      grid.push([]);
      for (let x = 0; x < W; x++) {
        const dx = (x + 0.5 - W / 2) / (W / 2),
          dy = (y + 0.5 - H / 2) / (H / 2),
          d = dx * dx + dy * dy + (n1((x / W) * 5, (y / H) * 4) - 0.5) * 0.7,
          m = n2((x / W) * n2x, (y / H) * n2y);
        terr[y].push(d < 0.84 ? (m > 0.68 ? 3 : m > 0.55 ? 2 : 1) : 0);
        grid[y].push(-1);
      }
    }
    const pts = [];
    for (let gy = 0; gy < GY; gy++)
      for (let gx = 0; gx < GX; gx++)
        for (let k = 0; k < 14; k++) {
          const x = Math.floor(((gx + 0.15 + r() * 0.7) * W) / GX),
            y = Math.floor(((gy + 0.15 + r() * 0.7) * H) / GY);
          if (terr[y][x]) {
            pts.push({ x, y });
            break;
          }
        }
    if (pts.length < Math.round(GX * GY * (GX * GY > 40 ? 0.72 : 0.85))) continue;
    /* mapas grandes (leyendas): en vez de descartar la semilla, se quitan las provincias diminutas
       y las islas sueltas (se hunden en el mar). El mapa histórico conserva la regla estricta de siempre. */
    const flex = GX * GY > 40;
    let P = pts,
      cnt,
      sx,
      sy,
      adj,
      okm = false;
    for (let rep = 0; rep < 8 && P.length >= Math.round(GX * GY * 0.6); rep++) {
      cnt = P.map(() => 0);
      sx = P.map(() => 0);
      sy = P.map(() => 0);
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          grid[y][x] = -1;
          if (!terr[y][x]) continue;
          const jx = x + (n3((x / W) * n3x, (y / H) * n3y) - 0.5) * 5,
            jy = y + (n4((x / W) * n3x, (y / H) * n3y) - 0.5) * 5;
          let b = 0,
            bd = 1e9;
          P.forEach((p, i) => {
            const dd = (p.x - jx) ** 2 + (p.y - jy) ** 2;
            if (dd < bd) {
              bd = dd;
              b = i;
            }
          });
          grid[y][x] = b;
          cnt[b]++;
          sx[b] += x;
          sy[b] += y;
        }
      if (cnt.some((c) => c < 14)) {
        if (!flex) break;
        P = P.filter((_, i) => cnt[i] >= 14);
        continue;
      }
      adj = P.map(() => new Set());
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          const a = grid[y][x];
          if (a < 0) continue;
          for (const [ox, oy] of [
            [1, 0],
            [0, 1],
          ]) {
            const b = grid[y + oy]?.[x + ox];
            if (b !== undefined && b >= 0 && b !== a) {
              adj[a].add(b);
              adj[b].add(a);
            }
          }
        }
      /* componentes conexas; en el histórico basta con mirar la de la provincia 0 */
      const comp = P.map(() => -1),
        tam = [];
      for (let s0 = 0; s0 < P.length; s0++) {
        if (comp[s0] >= 0) continue;
        const k = tam.length,
          q = [s0];
        comp[s0] = k;
        tam.push(1);
        while (q.length) {
          const c = q.pop();
          adj[c].forEach((b) => {
            if (comp[b] < 0) {
              comp[b] = k;
              tam[k]++;
              q.push(b);
            }
          });
        }
        if (!flex) break;
      }
      if (tam[0] === P.length) {
        okm = true;
        break;
      }
      if (!flex) break;
      const mayor = tam.indexOf(Math.max(...tam));
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) if (grid[y][x] >= 0 && comp[grid[y][x]] !== mayor) terr[y][x] = 0;
      P = P.filter((_, i) => comp[i] === mayor);
    }
    if (!okm) continue;
    if (P !== pts) {
      pts.length = 0;
      pts.push(...P);
    }
    pts.forEach((p, i) => {
      const mx = sx[i] / cnt[i],
        my = sy[i] / cnt[i];
      let bd = 1e9;
      for (let y = 1; y < H - 1; y++)
        for (let x = 1; x < W - 3; x++)
          if (grid[y][x] === i) {
            const dd = (x - mx) ** 2 + (y - my) ** 2;
            if (dd < bd) {
              bd = dd;
              p.cx = x;
              p.cy = y;
            }
          }
    });
    return { terr, grid, pts, adj: adj.map((s) => [...s]), seed, w: W, h: H };
  }
}

/* ======================================================================
   DIBUJO DEL TERRENO (sistema Interfaz). El mapa se pinta en alta resolución en #maphd: IFZ_S px por
   casilla (16, el doble que la lógica, T = 8). #map (cv) sigue midiendo W·T × H·T, transparente y encima,
   para los clics, el hover y lo que otros sistemas dibujen con ctx. Nada de esto cambia gen().
   Capas: terreno (ifzTerrenoHD, una vez por mapa: suelo con matices, costa con arena y espuma, aguas
   someras, ríos con meandros en las provincias con río, bosques de varias especies con sombras, colinas
   iluminadas, montañas con nieve, aldeas) y, encima, la capa política de interfaz.js.
   Cualquier tesela puede sustituirse por PNG (TILE.mar|llanura|bosque|colina|montana, IFZ_S×IFZ_S).
   ====================================================================== */
const IFZ_S = 16,
  IFZ_K = IFZ_S / T;
const IFZ_HD = { info: null, infoK: "", ter: null, terK: "", ms: {} };
const IFZ_TILE = ["mar", "llanura", "bosque", "colina", "montana"];
/* análisis del mapa (solo depende de la semilla y el tamaño): distancias a la costa, montañas, ríos,
   aldeas, casillas y bordes de cada provincia */
function ifzMapaInfo() {
  const k = MAP.seed + "|" + W + "x" + H;
  if (IFZ_HD.infoK === k && IFZ_HD.info) return IFZ_HD.info;
  const t0 = performance.now(),
    N = W * H,
    tr = MAP.terr,
    at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : tr[y][x]),
    r = mul(MAP.seed + 101),
    gx = Math.max(3, Math.round(W / 7)),
    gy = Math.max(3, Math.round(H / 7)),
    hum = noise(r, gx, gy),
    det = noise(r, Math.max(4, Math.round(W / 3)), Math.max(4, Math.round(H / 3))),
    H1 = (u, v) => hum((u / W) * gx, (v / H) * gy),
    H2 = (u, v) => det((u / W) * Math.max(4, Math.round(W / 3)), (v / H) * Math.max(4, Math.round(H / 3)));
  /* distancias (4 vecinos): dMar en tierra hasta el mar; dTie en el mar hasta la tierra */
  const bfs = (fuente) => {
    const d = new Int16Array(N).fill(-1),
      q = [];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (fuente(x, y)) {
          d[y * W + x] = 0;
          q.push(y * W + x);
        }
    for (let h = 0; h < q.length; h++) {
      const i = q[h],
        x = i % W,
        y = (i / W) | 0;
      for (const [a, b] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const X = x + a,
          Y = y + b;
        if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const j = Y * W + X;
        if (d[j] < 0) {
          d[j] = d[i] + 1;
          q.push(j);
        }
      }
    }
    return d;
  };
  const dMar = bfs((x, y) => !tr[y][x] || x === 0 || y === 0 || x === W - 1 || y === H - 1),
    dTie = bfs((x, y) => !!tr[y][x]);
  /* montañas: colinas rodeadas de colinas, lejos del mar */
  const mont = new Uint8Array(N);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (tr[y][x] !== 3 || dMar[y * W + x] < 2) continue;
      let c = 0;
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) if (at(x + a, y + b) === 3) c++;
      if ((c >= 8 && dMar[y * W + x] >= 3) || (c >= 7 && H2(x, y) > 0.6)) mont[y * W + x] = 1;
    }
  /* provincias: casillas y bordes (segmentos de 2 px por dentro, con la provincia vecina; -1 = mar) */
  const nP = MAP.pts.length,
    provT = Array.from({ length: nP }, () => []),
    bordes = Array.from({ length: nP }, () => []);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = MAP.grid[y][x];
      if (i < 0) continue;
      provT[i].push(y * W + x);
      const X = x * IFZ_S,
        Y = y * IFZ_S;
      for (const [a, b, sx, sy, sw, sh] of [
        [1, 0, IFZ_S - 2, 0, 2, IFZ_S],
        [-1, 0, 0, 0, 2, IFZ_S],
        [0, 1, 0, IFZ_S - 2, IFZ_S, 2],
        [0, -1, 0, 0, IFZ_S, 2],
      ]) {
        const j = MAP.grid[y + b]?.[x + a];
        if (j === i) continue;
        bordes[i].push(X + sx, Y + sy, sw, sh, j === undefined ? -1 : j);
      }
    }
  /* ríos: en las provincias con río (cmbTerreno), desde su casilla más alta hasta el mar */
  const rio = new Uint8Array(N),
    rios = [];
  if (typeof cmbTerreno === "function")
    for (let pid = 0; pid < nP; pid++) {
      let ct = null;
      try {
        ct = cmbTerreno({ id: pid });
      } catch (_) {}
      if (!ct || !ct.rio || !provT[pid].length) continue;
      let cur = provT[pid].reduce((b, i) => (dMar[i] + r() * 0.9 > dMar[b] ? i : b), provT[pid][0]);
      const path = [cur];
      for (let g = 0; g < 200 && dMar[cur] > 0; g++) {
        const x = cur % W,
          y = (cur / W) | 0,
          vec = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]
            .map(([a, b]) => [x + a, y + b])
            .filter(([X, Y]) => X >= 0 && Y >= 0 && X < W && Y < H)
            .map(([X, Y]) => Y * W + X)
            .filter((j) => dMar[j] < dMar[cur]);
        if (!vec.length) break;
        const j = vec[Math.floor(r() * vec.length)];
        path.push(j);
        if (rio[j] || !tr[(j / W) | 0][j % W]) break;
        cur = j;
      }
      for (const j of path) if (tr[(j / W) | 0][j % W]) rio[j] = 1;
      if (path.length > 1) rios.push(path);
    }
  /* aldeas dispersas en la llanura, lejos de las ciudades */
  const aldea = new Uint8Array(N),
    ciud = new Set(MAP.pts.map((p) => p.cy * W + p.cx));
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (tr[y][x] !== 1 || rio[i] || r() > 0.05) continue;
      let cerca = false;
      for (let b = -1; b <= 1 && !cerca; b++) for (let a = -1; a <= 1; a++) if (ciud.has((y + b) * W + x + a)) cerca = true;
      if (!cerca) aldea[i] = 1;
    }
  IFZ_HD.info = { dMar, dTie, mont, rio, rios, aldea, provT, bordes, H1, H2 };
  IFZ_HD.infoK = k;
  IFZ_HD.ms.info = performance.now() - t0;
  return IFZ_HD.info;
}
/* paletas del terreno */
const IFZ_TC = {
  mar: ["#163a5c", "#1b4569", "#21517a", "#2a6390", "#3a7fa6"],
  pasto: ["#3f7f33", "#4c8d3a", "#5a983f", "#6ba347", "#86a14c", "#9aa456"],
  bosque: ["#2f5f2a", "#36692e", "#3d7533", "#4b8238"],
  colina: ["#6c7a45", "#7c8850", "#8b935a"],
  montana: ["#5f5850", "#6d655b", "#7a7066"],
};
/* color de un bloque de 4 px según la humedad (con tramado ordenado: pixel art sin escalones) */
function ifzSuelo(tt, u, v, inf, dx, dy) {
  /* tramado irregular (hash de la posición): matices sin dibujo de tablero */
  let hh = Math.imul((dx >> 2) * 374761393 + (dy >> 2) * 668265263, 1274126177);
  hh ^= hh >>> 13;
  const dith = ((hh >>> 0) % 1000) / 1000 - 0.5;
  if (!tt) {
    const d = inf.dTie[Math.floor(v) * W + Math.floor(u)] || 1,
      z = clamp(4.6 - d * 1.05 + (inf.H2(u, v) - 0.5) * 1.4 + dith * 0.3, 0, 4.99);
    return IFZ_TC.mar[Math.floor(z)];
  }
  const h = inf.H1(u, v) * 0.75 + inf.H2(u, v) * 0.25;
  if (tt === 2) return IFZ_TC.bosque[Math.floor(clamp(h * 4 + dith * 0.6, 0, 3.99))];
  if (tt === 3) return inf.mont[Math.floor(v) * W + Math.floor(u)] ? IFZ_TC.montana[Math.floor(clamp(h * 3 + dith, 0, 2.99))] : IFZ_TC.colina[Math.floor(clamp(h * 3 + dith, 0, 2.99))];
  /* llanura: húmeda (verde intenso) a seca (pajiza) */
  return IFZ_TC.pasto[Math.floor(clamp((1 - h) * 6 + dith * 0.7, 0, 5.99))];
}
/* imagen PNG que sustituye a una tesela, si hay (manifest: TILE.<tipo>) */
const ifzTilePNG = (n) => (typeof IFZ_SPR !== "undefined" && IFZ_SPR.m && IFZ_SPR.img["TILE." + n]) || null;
/* dibuja con caché un sprite de IFZ_SP (o su PNG) — definido en interfaz.js; aquí un respaldo */
function ifzDibT(c, n, x, y, f, fl) {
  if (typeof ifzDib === "function") return ifzDib(c, n, x, y, f, fl);
}
/* una tesela suelta (para exportarla): suelo y decorado de su tipo */
function ifzTeselaSuelta(c, tipo) {
  const inf = {
    dTie: { length: 1 },
    mont: new Uint8Array(1),
    H1: () => 0.5,
    H2: () => 0.5,
  };
  inf.dTie = new Proxy([], { get: () => 2 });
  const tt = { mar: 0, llanura: 1, bosque: 2, colina: 3, montana: 3 }[tipo];
  if (tipo === "montana") inf.mont = new Proxy([], { get: () => 1 });
  for (let dy = 0; dy < IFZ_S; dy += 4)
    for (let dx = 0; dx < IFZ_S; dx += 4) {
      c.fillStyle = ifzSuelo(tt, 0.5, 0.5, inf, dx, dy);
      c.fillRect(dx, dy, 4, 4);
    }
  const r = mul(11);
  ifzDetalle(c, tt, 0, 0, r, false);
  ifzDecor(c, tt, tipo === "montana", 0, 0, r, false);
}
/* motas, matas, flores y olas de una casilla */
function ifzDetalle(c, tt, X, Y, r, rio) {
  if (!tt) {
    if (r() < 0.55) {
      c.fillStyle = "rgba(170,215,235,.35)";
      c.fillRect(X + 2 + Math.floor(r() * 9), Y + 2 + Math.floor(r() * 12), 3, 1);
    }
    return;
  }
  const claro = tt === 3 ? "#97a064" : tt === 2 ? "#4a8a3c" : "#76b04e",
    osc = tt === 3 ? "#5c683a" : tt === 2 ? "#264f22" : "#3f7a31";
  for (let k = 0; k < 9; k++) {
    c.fillStyle = r() < 0.5 ? claro : osc;
    c.fillRect(X + Math.floor(r() * IFZ_S), Y + Math.floor(r() * IFZ_S), 1, 1);
  }
  if (tt === 1) {
    for (let k = 0; k < 3; k++) {
      c.fillStyle = "#3a7230";
      const x = X + Math.floor(r() * 14),
        y = Y + Math.floor(r() * 14);
      c.fillRect(x, y, 1, 2);
      c.fillRect(x + 1, y + 1, 1, 1);
    }
    if (!rio && r() < 0.35) {
      const fl = ["#f3ecc0", "#e9a8c8", "#ffffff", "#e8d04a", "#b8a0e8"][Math.floor(r() * 5)];
      for (let k = 0; k < 2 + Math.floor(r() * 3); k++) {
        c.fillStyle = fl;
        c.fillRect(X + Math.floor(r() * 15), Y + Math.floor(r() * 15), 1, 1);
      }
    }
  }
}
/* decorado con volumen (se pinta por filas, de arriba abajo, para que se solapen bien) */
function ifzDecor(c, tt, monte, X, Y, r, rio, aldea) {
  const sombra = (x, y, w) => {
    c.fillStyle = "rgba(0,0,0,.22)";
    c.fillRect(x - 1, y - 1, w, 2);
  };
  if (tt === 2) {
    const sitios = [
      [4, 6],
      [11, 4],
      [7, 11],
      [14, 12],
      [2, 15],
      [10, 16],
    ];
    const n = rio ? 2 : 5 + (r() < 0.5 ? 1 : 0);
    for (let k = 0; k < n; k++) {
      const [sx, sy] = sitios[k],
        x = X + sx + Math.floor(r() * 3) - 1,
        y = Y + sy + Math.floor(r() * 3) - 1,
        e = r(),
        sp = e < 0.45 ? "arbol.pino" : e < 0.85 ? "arbol.roble" : "arbol.abedul",
        rows = IFZ_SP[sp];
      sombra(x + 1, y, rows[0].length);
      ifzDibT(c, sp, x - (rows[0].length >> 1), y - rows.length, null);
    }
  } else if (tt === 3 && monte) {
    /* macizos variados: un pico grande o dos menores, a veces de espaldas */
    if (r() < 0.55) {
      const rows = IFZ_SP["mapa.monte"];
      ifzDibT(c, "mapa.monte", X + Math.floor(r() * 5) - 1, Y + IFZ_S - rows.length + 1 + Math.floor(r() * 3), null, r() < 0.4);
    } else {
      const rows = IFZ_SP["mapa.monte2"];
      ifzDibT(c, "mapa.monte2", X - 1 + Math.floor(r() * 3), Y + 4 + Math.floor(r() * 3), null, r() < 0.5);
      ifzDibT(c, "mapa.monte2", X + 6 + Math.floor(r() * 3), Y + IFZ_S - rows.length + 1, null, r() < 0.5);
    }
  } else if (tt === 3) {
    const rows = IFZ_SP["mapa.colina"];
    ifzDibT(c, "mapa.colina", X + Math.floor(r() * 5), Y + 4 + Math.floor(r() * 3), null);
    if (r() < 0.6) ifzDibT(c, "mapa.colina", X + 4 + Math.floor(r() * 4), Y + 9 + Math.floor(r() * 3), null);
    if (rows && r() < 0.2) ifzDibT(c, "arbol.abedul", X + 2 + Math.floor(r() * 10), Y + 2, null);
  } else if (tt === 1) {
    if (aldea) {
      ifzDibT(c, "mapa.aldea", X + 2 + Math.floor(r() * 3), Y + 5 + Math.floor(r() * 3), null);
      return;
    }
    if (!rio && r() < 0.12) {
      const sp = r() < 0.6 ? "arbol.roble" : "arbol.olivo",
        rows = IFZ_SP[sp],
        x = X + 3 + Math.floor(r() * 10),
        y = Y + 6 + Math.floor(r() * 9);
      sombra(x + 1, y, rows[0].length);
      ifzDibT(c, sp, x - (rows[0].length >> 1), y - rows.length, null);
    } else if (r() < 0.18) {
      c.fillStyle = "#33652b";
      const x = X + Math.floor(r() * 13),
        y = Y + Math.floor(r() * 13);
      c.fillRect(x, y, 3, 2);
      c.fillStyle = "#4b8a3c";
      c.fillRect(x, y, 2, 1);
    }
  }
}
/* capa de terreno completa en alta resolución (una vez por mapa o al cargar PNG) */
function ifzTerrenoHD() {
  const k = MAP.seed + "|" + W + "x" + H + "|" + (typeof IFZ !== "undefined" ? IFZ.baseVer : 0);
  if (IFZ_HD.terK === k && IFZ_HD.ter) return IFZ_HD.ter;
  const t0 = performance.now(),
    inf = ifzMapaInfo(),
    tr = MAP.terr,
    S = IFZ_S,
    c0 = IFZ_HD.ter || (IFZ_HD.ter = document.createElement("canvas"));
  if (c0.width !== W * S || c0.height !== H * S) {
    c0.width = W * S;
    c0.height = H * S;
  }
  const c = c0.getContext("2d"),
    r = mul(MAP.seed + 7),
    png = IFZ_TILE.map(ifzTilePNG),
    tipoDe = (x, y) => (tr[y][x] === 3 && inf.mont[y * W + x] ? 4 : tr[y][x]);
  c.imageSmoothingEnabled = false;
  /* 1. suelo con matices y textura */
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const tt = tr[y][x],
        X = x * S,
        Y = y * S,
        im = png[tipoDe(x, y)];
      if (im) {
        c.drawImage(im, X, Y, S, S);
        continue;
      }
      for (let dy = 0; dy < S; dy += 4)
        for (let dx = 0; dx < S; dx += 4) {
          c.fillStyle = ifzSuelo(tt, x + (dx + 2) / S, y + (dy + 2) / S, inf, X + dx, Y + dy);
          c.fillRect(X + dx, Y + dy, 4, 4);
        }
      ifzDetalle(c, tt, X, Y, r, inf.rio[y * W + x]);
    }
  /* 2. costa: arena en la orilla, espuma y rompientes en el agua */
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : tr[y][x]);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const tt = tr[y][x],
        X = x * S,
        Y = y * S;
      for (const [a, b] of [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ]) {
        const o = at(x + a, y + b);
        if (tt && !o) {
          /* arena: banda irregular de 2-4 px y una línea de arena mojada */
          for (let q = 0; q < S; q++) {
            const g = 2 + Math.floor(r() * 2.4);
            c.fillStyle = "#d8c07a";
            if (b) c.fillRect(X + q, b < 0 ? Y : Y + S - g, 1, g);
            else c.fillRect(a < 0 ? X : X + S - g, Y + q, g, 1);
            c.fillStyle = "#b8a463";
            if (b) c.fillRect(X + q, b < 0 ? Y : Y + S - 1, 1, 1);
            else c.fillRect(a < 0 ? X : X + S - 1, Y + q, 1, 1);
          }
        } else if (!tt && o) {
          for (let q = 0; q < S; q++) {
            for (const [off, pr, col] of [
              [1, 0.55, "rgba(228,242,244,.85)"],
              [2, 0.25, "rgba(228,242,244,.45)"],
              [4, 0.12, "rgba(220,240,245,.35)"],
            ]) {
              if (r() > pr) continue;
              c.fillStyle = col;
              if (b) c.fillRect(X + q, b < 0 ? Y + off : Y + S - 1 - off, 1, 1);
              else c.fillRect(a < 0 ? X + off : X + S - 1 - off, Y + q, 1, 1);
            }
          }
        }
      }
    }
  /* 3. ríos con meandros: orilla, agua y reflejo */
  for (const path of inf.rios) {
    const pts = path.map((j, n) => {
      const x = j % W,
        y = (j / W) | 0,
        rr = mul(j * 31 + MAP.seed);
      return [x * S + S / 2 + (n && n < path.length - 1 ? Math.round((rr() - 0.5) * 8) : 0), y * S + S / 2 + (n && n < path.length - 1 ? Math.round((rr() - 0.5) * 8) : 0)];
    });
    const muestras = [];
    for (let n = 0; n < pts.length - 1; n++) {
      const a = n ? [(pts[n - 1][0] + pts[n][0]) / 2, (pts[n - 1][1] + pts[n][1]) / 2] : pts[0],
        b = [(pts[n][0] + pts[n + 1][0]) / 2, (pts[n][1] + pts[n + 1][1]) / 2],
        ctl = n ? pts[n] : [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      for (let q = 0; q <= 1; q += 0.04) {
        const u = 1 - q;
        muestras.push([u * u * a[0] + 2 * u * q * ctl[0] + q * q * b[0], u * u * a[1] + 2 * u * q * ctl[1] + q * q * b[1]]);
      }
    }
    muestras.push(pts[pts.length - 1]);
    const ancho = (i) => (i > muestras.length * 0.6 ? 2 : 1);
    for (const [col, w] of [
      ["#3e6f30", 5],
      ["#2f6f9e", 3],
      ["#5fa2cf", 1],
    ])
      muestras.forEach(([x, y], i) => {
        const ww = w === 1 ? 1 : w + ancho(i) - 1,
          tx = Math.floor(x / S),
          ty = Math.floor(y / S);
        if (w === 5 && !at(tx, ty)) return;
        c.fillStyle = col;
        c.fillRect(Math.round(x - ww / 2), Math.round(y - ww / 2), ww, ww);
      });
  }
  /* 4. bosques, colinas, montañas, árboles sueltos y aldeas (por filas) */
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const tt = tr[y][x],
        i = y * W + x;
      if (!tt || png[tipoDe(x, y)]) continue;
      ifzDecor(c, tt, !!inf.mont[i], x * S, y * S, r, !!inf.rio[i], !!inf.aldea[i]);
    }
  IFZ_HD.terK = k;
  IFZ_HD.ms.terreno = performance.now() - t0;
  return c0;
}
/* drawBase: lo llaman los demás al crear o cargar un mapa. El terreno HD se rehace en el próximo cuadro. */
function drawBase() {
  if (typeof IFZ !== "undefined") IFZ.baseVer++;
  IFZ_HD.terK = "";
  ifzMapaInfo();
}
