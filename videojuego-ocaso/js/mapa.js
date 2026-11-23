/* ---------- mapa ---------- */
function gen(seed) {
  for (let tries = 0; tries < 300; tries++, seed++) {
    const r = mul(seed),
      n1 = noise(r, 5, 4),
      n2 = noise(r, 8, 6),
      n3 = noise(r, 10, 7),
      n4 = noise(r, 10, 7),
      terr = [],
      grid = [];
    for (let y = 0; y < H; y++) {
      terr.push([]);
      grid.push([]);
      for (let x = 0; x < W; x++) {
        const dx = (x + 0.5 - W / 2) / (W / 2),
          dy = (y + 0.5 - H / 2) / (H / 2),
          d = dx * dx + dy * dy + (n1((x / W) * 5, (y / H) * 4) - 0.5) * 0.7,
          m = n2((x / W) * 8, (y / H) * 6);
        terr[y].push(d < 0.84 ? (m > 0.68 ? 3 : m > 0.55 ? 2 : 1) : 0);
        grid[y].push(-1);
      }
    }
    const pts = [];
    for (let gy = 0; gy < 5; gy++)
      for (let gx = 0; gx < 8; gx++)
        for (let k = 0; k < 14; k++) {
          const x = Math.floor(((gx + 0.15 + r() * 0.7) * W) / 8),
            y = Math.floor(((gy + 0.15 + r() * 0.7) * H) / 5);
          if (terr[y][x]) {
            pts.push({ x, y });
            break;
          }
        }
    if (pts.length < 34) continue;
    const cnt = pts.map(() => 0),
      sx = pts.map(() => 0),
      sy = pts.map(() => 0);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (!terr[y][x]) continue;
        const jx = x + (n3((x / W) * 10, (y / H) * 7) - 0.5) * 5,
          jy = y + (n4((x / W) * 10, (y / H) * 7) - 0.5) * 5;
        let b = 0,
          bd = 1e9;
        pts.forEach((p, i) => {
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
    if (cnt.some((c) => c < 14)) continue;
    const adj = pts.map(() => new Set());
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
    const seen = new Set([0]),
      q = [0];
    while (q.length) {
      const c = q.pop();
      adj[c].forEach((b) => {
        if (!seen.has(b)) {
          seen.add(b);
          q.push(b);
        }
      });
    }
    if (seen.size < pts.length) continue;
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
    return { terr, grid, pts, adj: adj.map((s) => [...s]), seed };
  }
}
function drawBase() {
  const r = mul(MAP.seed + 7),
    { terr } = MAP,
    pk = (a) => a[Math.floor(r() * a.length)];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = terr[y][x],
        X = x * T,
        Y = y * T;
      if (!t) {
        bx.fillStyle = "#22517a";
        bx.fillRect(X, Y, T, T);
        if (r() < 0.3) {
          bx.fillStyle = "#3b76aa";
          bx.fillRect(X + 1 + Math.floor(r() * 4), Y + 1 + Math.floor(r() * 6), 3, 1);
        }
        continue;
      }
      bx.fillStyle = t === 3 ? "#7c8850" : "#5a983f";
      bx.fillRect(X, Y, T, T);
      for (let k = 0; k < 4; k++) {
        bx.fillStyle = pk(["#6aae49", "#4b8434", "#64a545"]);
        bx.fillRect(X + Math.floor(r() * 8), Y + Math.floor(r() * 8), 1, 1);
      }
      bx.fillStyle = "#d9c27c";
      if (!terr[y - 1]?.[x]) bx.fillRect(X, Y, T, 1);
      if (!terr[y + 1]?.[x]) bx.fillRect(X, Y + T - 1, T, 1);
      if (!terr[y][x - 1]) bx.fillRect(X, Y, 1, T);
      if (!terr[y][x + 1]) bx.fillRect(X + T - 1, Y, 1, T);
      if (t === 2) spr(bx, SP.tree, X + 1 + Math.floor(r() * 2), Y + 1 + Math.floor(r() * 2), BP);
      if (t === 3) spr(bx, SP.hill, X, Y + 3, BP);
    }
}
