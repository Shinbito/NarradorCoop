/* ---------- mapa (generación: sistema Mundo) ----------
   gen(semilla, dim): dim = {w, h, gx, gy, v} (G.mapa; ver mundoDims en mundo.js). Sin dim, el mapa
   del modo histórico (64×40, rejilla 8×5). Con el mismo dim y semilla el mapa sale siempre igual.
   Capas (ver docs/mundo.md §6): terr (0 mar, 1 llanura, 2 bosque, 3 colina: NO cambia de códigos), alt,
   mont (montaña infranqueable), paso, rio, puente, vado, camino, bosque (denso), tipo (código extendido).
   mapaInfo(x, y) y mapaTransitable(x, y) resumen una casilla. */
function gen(seed, dim) {
  dim = dim && dim.w ? dim : MUNDO_DIM0;
  /* versión del generador: 1 = mapa de siempre (partidas antiguas, sin dim.v); 2 = con relieve (ríos,
     montañas infranqueables, pasos, puentes, vados, caminos). La forma (costa, provincias) es igual en ambas. */
  const VER = dim.v || 1;
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
    const M = { terr, grid, pts, adj: adj.map((s) => [...s]), seed, w: W, h: H, v: VER };
    mapaRelieve(M, (x, y) => n2((x / W) * n2x, (y / H) * n2y));
    return M;
  }
}
/* ---------- relieve (sistema Mundo) ----------
   Se calcula DESPUÉS de fijar costa y provincias, con su propio generador aleatorio: no cambia la forma del
   mapa. Versión 1 (partidas antiguas): solo altura, sin obstáculos. Versión 2:
   - montañas infranqueables (mont) en el corazón de las zonas de colinas, como cordilleras;
   - ríos que nacen junto a las montañas y bajan casilla a casilla hasta el mar (o a otro río);
   - caminos entre ciudades vecinas (árbol que une todas las provincias): donde cruzan un río hay PUENTE y
     donde atraviesan una montaña se abre un PASO; así ninguna ciudad queda aislada;
   - algunos VADOS en los tramos llanos; bosques densos (bosque) donde ocultarse. */
const MAPA_T = { MAR: 0, LLANURA: 1, BOSQUE: 2, COLINA: 3, MONTANA: 4, RIO: 5 };
const MAPA_TN = ["mar", "llanura", "bosque", "colina", "montaña", "río"];
function mapaRelieve(M, alto) {
  const { terr, grid, pts } = M,
    capa = (v = 0) => Array.from({ length: H }, () => Array(W).fill(v)),
    V4 = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ],
    dentro = (x, y) => x >= 0 && y >= 0 && x < W && y < H,
    tierra = (x, y) => dentro(x, y) && terr[y][x] > 0;
  const alt = capa(),
    mont = capa(),
    paso = capa(),
    rio = capa(),
    puente = capa(),
    vado = capa(),
    camino = capa(),
    bosque = capa(),
    costa = capa(-1);
  Object.assign(M, { alt, mont, paso, rio, puente, vado, camino, bosque });
  /* distancia a la costa (BFS en 4 direcciones desde el mar) */
  const q = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (!terr[y][x]) {
        costa[y][x] = 0;
        q.push(x, y);
      }
  for (let i = 0; i < q.length; i += 2) {
    const x = q[i],
      y = q[i + 1];
    for (const [dx, dy] of V4) {
      const a = x + dx,
        b = y + dy;
      if (dentro(a, b) && costa[b][a] < 0) {
        costa[b][a] = costa[y][x] + 1;
        q.push(a, b);
      }
    }
  }
  M.costa = costa;
  const ver = M.v || 1,
    rr = mul((M.seed ^ 0x2f6b1d) + 977),
    c5x = Math.max(4, Math.round(W / 9)),
    c5y = Math.max(3, Math.round(H / 9)),
    c6x = Math.max(5, Math.round(W / 6)),
    c6y = Math.max(4, Math.round(H / 6)),
    n5 = noise(rr, c5x, c5y),
    n6 = noise(rr, c6x, c6y),
    cresta = (x, y) => 1 - Math.abs(2 * n5((x / W) * c5x, (y / H) * c5y) - 1),
    espesura = (x, y) => n6((x / W) * c6x, (y / H) * c6y);
  /* altura 1..7 en tierra: crece con el relieve (el mismo ruido que decide colinas y bosques) y tierra adentro */
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!terr[y][x]) continue;
      const h = alto(x, y);
      alt[y][x] = clamp(1 + Math.floor(Math.max(0, h - 0.3) * 9) + (costa[y][x] >= 5 ? 1 : 0), 1, 7);
      if (terr[y][x] === 3) alt[y][x] = Math.max(alt[y][x], 4);
    }
  M.tipo = terr.map((f) => f.slice());
  if (ver < 2) return M;

  /* --- montañas: las colinas más altas y en cresta, lejos de la costa y de las ciudades --- */
  const centro = capa();
  pts.forEach((p) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dentro(p.cx + dx, p.cy + dy)) centro[p.cy + dy][p.cx + dx] = 1;
  });
  let nTierra = 0;
  const cand = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!terr[y][x]) continue;
      nTierra++;
      if (terr[y][x] === 3 && costa[y][x] >= 2 && !centro[y][x])
        cand.push({ x, y, v: alto(x, y) * 0.65 + cresta(x, y) * 0.35 });
    }
  cand.sort((a, b) => b.v - a.v);
  const nMont = Math.min(cand.length, Math.round(nTierra * 0.055));
  for (let k = 0; k < nMont; k++) mont[cand[k].y][cand[k].x] = 1;
  /* sin montañas sueltas de una casilla: o forman sierra o vuelven a ser colina */
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (mont[y][x] && !V4.some(([dx, dy]) => mont[y + dy]?.[x + dx])) mont[y][x] = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) if (mont[y][x]) alt[y][x] = 8 + (alto(x, y) > 0.8 ? 1 : 0);

  /* --- ríos: nacen al pie de las montañas (o en colinas altas) y bajan hacia el mar --- */
  const fuentes = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!terr[y][x] || mont[y][x] || centro[y][x] || costa[y][x] < 5) continue;
      const pie = V4.some(([dx, dy]) => mont[y + dy]?.[x + dx]);
      if (pie || (terr[y][x] === 3 && alto(x, y) > 0.72)) fuentes.push({ x, y, v: rr() + (pie ? 1 : 0) });
    }
  fuentes.sort((a, b) => b.v - a.v);
  const nRios = Math.max(2, Math.round(nTierra / 330)),
    nacidas = [];
  M.rios = [];
  for (const f of fuentes) {
    if (M.rios.length >= nRios) break;
    if (nacidas.some((o) => Math.abs(o.x - f.x) + Math.abs(o.y - f.y) < 9)) continue;
    const cauce = [];
    let x = f.x,
      y = f.y,
      ok = false,
      lateral = false;
    while (true) {
      if (rio[y][x]) {
        ok = cauce.length >= 4; // desemboca en otro río
        break;
      }
      cauce.push([x, y]);
      const vec = V4.map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => dentro(a, b) && !mont[b][a]),
        sig = vec
          .filter(([a, b]) => costa[b][a] === costa[y][x] - 1)
          .sort(([a, b], [c, d]) => alto(a, b) - alto(c, d)),
        /* meandro: a veces un paso de lado (a la misma distancia del mar), nunca dos seguidos ni pegado a sí mismo */
        lado = vec.filter(
          ([a, b]) =>
            costa[b][a] === costa[y][x] &&
            !rio[b][a] &&
            !cauce.some(([c, d]) => Math.abs(c - a) + Math.abs(d - b) <= 1 && !(c === x && d === y)),
        );
      if (!sig.length) break; // solo puede bajar por la montaña: se descarta
      if (lado.length && !lateral && cauce.length > 1 && rr() < 0.4) {
        [x, y] = lado[Math.floor(rr() * lado.length)];
        lateral = true;
        continue;
      }
      lateral = false;
      [x, y] = sig[rr() < 0.75 ? 0 : sig.length - 1];
      if (!terr[y][x]) {
        ok = cauce.length >= 5; // llega al mar
        break;
      }
    }
    if (!ok) continue;
    nacidas.push(f);
    let a0 = 9;
    for (const [cx, cy] of cauce) {
      rio[cy][cx] = 1;
      a0 = Math.min(a0, alt[cy][cx]);
      alt[cy][cx] = a0; // el agua nunca sube
      if (centro[cy][cx] && pts.some((p) => p.cx === cx && p.cy === cy)) puente[cy][cx] = 1; // ciudad sobre el río
    }
    M.rios.push(cauce);
  }

  /* --- caminos: árbol de mínima distancia entre ciudades vecinas + algún ramal; puentes y pasos --- */
  const N = pts.length,
    dC = (i, j) => Math.hypot(pts[i].cx - pts[j].cx, pts[i].cy - pts[j].cy),
    aristas = [],
    en = new Set([0]);
  while (en.size < N) {
    let best = null;
    for (const i of en)
      for (const j of M.adj[i]) if (!en.has(j) && (!best || dC(i, j) < best[2])) best = [i, j, dC(i, j)];
    if (!best) break;
    en.add(best[1]);
    aristas.push(best);
  }
  for (let i = 0; i < N; i++)
    for (const j of M.adj[i])
      if (i < j && rr() < 0.12 && !aristas.some(([a, b]) => (a === i && b === j) || (a === j && b === i))) aristas.push([i, j]);
  const coste = (x, y) => {
    if (!terr[y][x]) return Infinity;
    let c = terr[y][x] === 1 ? 1 : terr[y][x] === 2 ? 1.8 : 2.4;
    if (mont[y][x]) c += 30;
    if (rio[y][x] && !puente[y][x]) c += 7;
    if (camino[y][x]) c *= 0.45;
    return c;
  };
  for (const [i, j] of aristas) {
    const ruta = mapaRuta(pts[i].cx, pts[i].cy, pts[j].cx, pts[j].cy, coste);
    for (const [x, y] of ruta) {
      camino[y][x] = 1;
      if (rio[y][x]) puente[y][x] = 1;
      if (mont[y][x]) {
        mont[y][x] = 0;
        paso[y][x] = 1;
        alt[y][x] = 7;
      }
    }
  }
  M.caminos = aristas.map(([i, j]) => [i, j]);

  /* --- vados: pocos, en tramos de llanura lejos de los puentes --- */
  for (const cauce of M.rios) {
    let ult = -99;
    cauce.forEach(([x, y], k) => {
      if (puente[y][x]) ult = k;
      if (k - ult >= 9 && terr[y][x] === 1 && rr() < 0.25) {
        vado[y][x] = 1;
        ult = k;
      }
    });
  }

  /* --- bosques densos: el corazón de los bosques (no los caminos) --- */
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (terr[y][x] === 2 && !camino[y][x] && !rio[y][x] && (espesura(x, y) > 0.45 || alto(x, y) > 0.62)) bosque[y][x] = 1;

  /* --- tipo extendido para el dibujo (y el 3D) --- */
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (mont[y][x]) M.tipo[y][x] = MAPA_T.MONTANA;
      else if (rio[y][x]) M.tipo[y][x] = MAPA_T.RIO;
  return M;
}
/* camino más barato (Dijkstra en 4 direcciones) de (x0,y0) a (x1,y1) con coste(x, y) por casilla */
function mapaRuta(x0, y0, x1, y1, coste) {
  const n = W * H,
    dist = new Float64Array(n).fill(Infinity),
    prev = new Int32Array(n).fill(-1),
    hp = [],
    push = (d, i) => {
      hp.push([d, i]);
      let k = hp.length - 1;
      while (k > 0) {
        const pa = (k - 1) >> 1;
        if (hp[pa][0] <= hp[k][0]) break;
        [hp[pa], hp[k]] = [hp[k], hp[pa]];
        k = pa;
      }
    },
    pop = () => {
      const top = hp[0],
        last = hp.pop();
      if (hp.length) {
        hp[0] = last;
        let k = 0;
        for (;;) {
          const l = 2 * k + 1,
            r = l + 1;
          let m = k;
          if (l < hp.length && hp[l][0] < hp[m][0]) m = l;
          if (r < hp.length && hp[r][0] < hp[m][0]) m = r;
          if (m === k) break;
          [hp[m], hp[k]] = [hp[k], hp[m]];
          k = m;
        }
      }
      return top;
    };
  const s = y0 * W + x0,
    t = y1 * W + x1;
  dist[s] = 0;
  push(0, s);
  while (hp.length) {
    const [d, i] = pop();
    if (d > dist[i]) continue;
    if (i === t) break;
    const x = i % W,
      y = (i - x) / W;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const a = x + dx,
        b = y + dy;
      if (a < 0 || b < 0 || a >= W || b >= H) continue;
      const c = coste(a, b);
      if (c === Infinity) continue;
      const j = b * W + a;
      if (d + c < dist[j]) {
        dist[j] = d + c;
        prev[j] = i;
        push(d + c, j);
      }
    }
  }
  const ruta = [];
  for (let i = t; i >= 0; i = prev[i]) {
    ruta.push([i % W, Math.floor(i / W)]);
    if (i === s) break;
  }
  return ruta.reverse();
}
/* ¿se puede pisar la casilla? (tierra, no montaña, y el río solo por puente o vado) */
function mapaTransitable(x, y, m = MAP) {
  if (!m || !m.terr[y] || !m.terr[y][x]) return false;
  if (m.mont && m.mont[y][x]) return false;
  if (m.rio && m.rio[y][x] && !m.puente[y][x] && !m.vado[y][x]) return false;
  return true;
}
/* resumen de una casilla para Campaña, Interfaz y el 3D */
function mapaInfo(x, y, m = MAP) {
  if (!m || !m.terr[y] || m.terr[y][x] == null)
    return { tipo: "mar", alt: 0, rio: false, puente: false, vado: false, bosque: false, infranqueable: true };
  const g = (k) => !!(m[k] && m[k][y][x]),
    t = (m.tipo || m.terr)[y][x];
  return {
    tipo: MAPA_TN[t] || "llanura",
    terr: m.terr[y][x],
    alt: m.alt ? m.alt[y][x] : m.terr[y][x] ? 1 : 0,
    rio: g("rio"),
    puente: g("puente"),
    vado: g("vado"),
    bosque: g("bosque"),
    camino: g("camino"),
    paso: g("paso"),
    montana: g("mont"),
    costa: m.costa ? m.costa[y][x] === 1 : false,
    infranqueable: !mapaTransitable(x, y, m),
    provincia: m.grid[y][x],
  };
}
/* ---------- dibujo del terreno (sistema Interfaz) ----------
   Cada casilla se pinta con ifzTileProc (procedural) o, si hay PNG en el manifest de sprites,
   con TILE.mar / TILE.llanura / TILE.bosque / TILE.colina (T×T, sin tinte). La costa se marca siempre. */
const IFZ_TILE = ["mar", "llanura", "bosque", "colina"];
function ifzTileProc(c, t, X, Y, r, solo) {
  const pk = (a) => a[Math.floor(r() * a.length)];
  if (!t) {
    c.fillStyle = "#22517a";
    c.fillRect(X, Y, T, T);
    if (r() < 0.3 || solo) {
      c.fillStyle = "#3b76aa";
      c.fillRect(X + 1 + Math.floor(r() * 4), Y + 1 + Math.floor(r() * 6), 3, 1);
    }
    return;
  }
  c.fillStyle = t === 3 ? "#7c8850" : "#5a983f";
  c.fillRect(X, Y, T, T);
  for (let k = 0; k < 4; k++) {
    c.fillStyle = pk(["#6aae49", "#4b8434", "#64a545"]);
    c.fillRect(X + Math.floor(r() * 8), Y + Math.floor(r() * 8), 1, 1);
  }
  if (t === 2) spr(c, SP.tree, X + 1 + Math.floor(r() * 2), Y + 1 + Math.floor(r() * 2), BP);
  if (t === 3) spr(c, SP.hill, X, Y + 3, BP);
}
function drawBase() {
  const r = mul(MAP.seed + 7),
    { terr } = MAP,
    png = typeof IFZ_SPR !== "undefined" && IFZ_SPR.m ? IFZ_TILE.map((n) => IFZ_SPR.img["TILE." + n] || null) : [];
  if (typeof IFZ !== "undefined") IFZ.baseVer++;
  bx.imageSmoothingEnabled = false;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = terr[y][x],
        X = x * T,
        Y = y * T;
      if (png[t]) bx.drawImage(png[t], X, Y, T, T);
      else ifzTileProc(bx, t, X, Y, r);
      if (!t) continue;
      bx.fillStyle = "#d9c27c";
      if (!terr[y - 1]?.[x]) bx.fillRect(X, Y, T, 1);
      if (!terr[y + 1]?.[x]) bx.fillRect(X, Y + T - 1, T, 1);
      if (!terr[y][x - 1]) bx.fillRect(X, Y, 1, T);
      if (!terr[y][x + 1]) bx.fillRect(X + T - 1, Y, 1, T);
    }
}
