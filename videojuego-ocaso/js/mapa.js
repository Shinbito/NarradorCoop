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
