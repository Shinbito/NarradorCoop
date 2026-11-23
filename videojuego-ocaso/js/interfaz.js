/* ---------- interfaz de campaña ---------- */
function ui() {
  if (!G) return;
  const F = G.F[ME],
    e = inc(ME);
  $("res").innerHTML =
    `<span><b>${G.year}</b> d.C.</span><span>Oro <b>${F.gold}</b> <small class="${e.g < 0 ? "neg" : ""}">${e.g >= 0 ? "+" : ""}${e.g}</small></span><span>Comida <b>${F.food}</b> <small class="${e.net < 0 ? "neg" : ""}">${e.net >= 0 ? "+" : ""}${e.net}</small></span><span style="color:${CIV[ME].c}">${CIV[ME].s} · ${owned(ME).length}/${G.P.length}</span>`;
  const turnTxt = net.on
    ? net.cur === ME
      ? "Online · es tu turno"
      : `Online · turno de ${CIV[net.cur]?.s || "—"}${net.names[net.seats[net.cur]] ? " (" + esc(net.names[net.seats[net.cur]]) + ")" : ""}`
    : "Campaña · un jugador";
  $("tinfo").textContent = turnTxt;
  const dis = busy || !!G.over || !myTurn();
  $("endb").disabled = dis;
  $("endb").textContent = busy
    ? "Las potencias mueven…"
    : net.on
      ? myTurn()
        ? "Terminar mi turno ▶"
        : "Esperando al rival…"
      : "Fin del año ▶";
  const pest = pestanas();
  if (!pest.some((x) => x.id === tab)) tab = "prov";
  $("tabs").innerHTML = pest
    .map((x) => `<button data-act="tab-${x.id}" class="${x.id === tab ? "on" : ""}">${x.titulo}</button>`)
    .join("");
  const pa = pest.find((x) => x.id === tab);
  try {
    $("panel").innerHTML = pa.render(dis);
  } catch (e) {
    console.error("[panel]", tab, e);
    $("panel").innerHTML = `<h2>${pa.titulo}</h2><p class="dim">Error al mostrar este panel.</p>`;
  }
  const mx = Math.max(1, ...[...Array(NF).keys()].map(totPow));
  $("facs").innerHTML = [...Array(NF).keys()]
    .filter(alive)
    .map((f) => {
      const st = f === ME ? "tu" : G.st[ME][f];
      return `<div class="fac"><span style="color:${CIV[f].c}">${CIV[f].s}</span><div class="bar" title="Fuerza militar"><i style="width:${(totPow(f) / mx) * 100}%;background:${CIV[f].c}"></i></div><span>${owned(f).length} prov.</span></div>`;
    })
    .join("");
}
/* Pestañas: las básicas + las que registren los sistemas con OC.panel(...) */
function pestanas() {
  return [
    { id: "prov", titulo: "Provincia", orden: 10, render: provPanel },
    { id: "dyn", titulo: "Dinastía", orden: 20, render: dynPanel },
    { id: "dip", titulo: "Diplomacia", orden: 30, render: dipPanel },
    ...OC.paneles,
    { id: "log", titulo: "Crónica", orden: 90, render: logPanel },
  ].sort((a, b) => a.orden - b.orden);
}
function logPanel() {
  return `<h2>Crónica</h2><ul id="log">${G.log.map((l) => `<li class="${l.c}">${l.m}</li>`).join("")}</ul>`;
}
const stTag = (g) =>
  g === ME ? '<span class="tag tu">Tú</span>' : `<span class="tag ${G.st[ME][g]}">${G.st[ME][g]}</span>`;
function provPanel(dis) {
  /* CAM: con un ejército seleccionado, su panel (campana.js) */
  if (camSel != null && camEj(camSel)) return camPanelEj(dis);
  if (sel === null)
    return '<h2>Mapa de campaña</h2><p class="dim">Haz clic en una provincia. Las tuyas llevan tu color; los castillos son capitales.</p>';
  const p = G.P[sel],
    f = p.owner,
    mine = f === ME,
    F = G.F[ME],
    gc = G.C[p.gen];
  let h = `<h2 style="color:${CIV[f].c}">${p.name}${p.cap ? " ♛" : ""}</h2><p class="dim">${CIV[f].n}${f < REB ? " " + stTag(f) : ""}${p.cap ? " · capital" : ""}<br>Rinde ${yields(p).g} oro y ${yields(p).fo} comida · orden ${Math.round(p.order)}</p><div class="bar"><i style="width:${p.order}%;background:${p.order < 30 ? "#e0503f" : p.order < 55 ? "#e8b632" : "#4caf50"}"></i></div>`;
  /* CAM: las compañías mercenarias (y máquinas) solo se listan si las hay */
  h += `<div class="troops">${TYP.filter((t) => p.u[t] > 0 || !(UN[t].merc || UN[t].asedio)).map((t) => `<div><img src="${icon(f, t)}" alt=""><b>${p.u[t]}</b>${CIV[f].un[t]}</div>`).join("")}</div>`;
  h += `<p class="dim" style="margin-top:8px">${typeof tecLineaEdificios === "function" ? tecLineaEdificios(p) : ""}</p>`;
  h += `<p>General: ${gc ? `<b>${gc.n}</b> (mando ${gc.ma}, ${gc.age} años)` : '<span class="dim">ninguno</span>'}</p>`;
  if (!mine) {
    const near = MAP.adj[p.id].map((i) => G.P[i]).filter((q) => q.owner === ME && !q.tired);
    return (
      h +
      OC.renderSecciones("prov", { p, f, mine, F }, dis) +
      `<p class="note">Defensa estimada ${Math.round(pw(p.u) * gb(p.gen) * (1.1 + 0.25 * p.walls))}${near.length ? " · tu mayor fuerza vecina " + Math.max(...near.map((q) => Math.round(pw(q.u) * gb(q.gen)))) : ""}${f < REB && !atWar(ME, f) ? "<br>Estáis en " + G.st[ME][f] + ": atacar significa declarar la guerra." : ""}</p>`
    );
  }
  const free = family(ME).filter((c) => c.age >= 16 && !genOf(c));
  h += gc
    ? `<div class="btns"><button data-act="ungen" ${dis ? "disabled" : ""}>Retirar general</button></div>`
    : free.length
      ? `<div class="g2"><select id="gsel" aria-label="Elegir general">${free.map((c) => `<option value="${c.id}">${c.n} · mando ${c.ma}</option>`).join("")}</select><button data-act="gen" ${dis ? "disabled" : ""}>Nombrar general</button></div>`
      : "";
  h += OC.renderSecciones("prov", { p, f, mine, F }, dis);
  /* CAM: Ejército — formar ejércitos que salen al mapa (campana.js) */
  return h + camSeccionProv(p, dis);
}
function cline(c) {
  return `<span class="stats">Mando ${c.ma} · Intriga ${c.in} · Diplomacia ${c.di} · Gestión ${c.ge} · ${c.tr}</span>`;
}
/* ---------- dibujo del mapa ---------- */
function drawMap(now) {
  const { grid, adj } = MAP;
  ctx.drawImage(base, 0, 0);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = grid[y][x];
      if (i < 0) continue;
      ctx.globalAlpha = i === sel ? 0.42 : i === hover ? 0.36 : 0.26;
      ctx.fillStyle = CIV[G.P[i].owner].c;
      ctx.fillRect(x * T, y * T, T, T);
    }
  if (aim && sel !== null) {
    ctx.globalAlpha = 0.22 + 0.16 * Math.sin(now / 140);
    ctx.fillStyle = "#fff";
    const a = adj[sel];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) if (a.includes(grid[y][x])) ctx.fillRect(x * T, y * T, T, T);
  }
  ctx.globalAlpha = 1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = grid[y][x];
      if (i < 0) continue;
      const o = G.P[i].owner,
        X = x * T,
        Y = y * T;
      for (const [ox, oy, ex, ey, ew, eh] of [
        [1, 0, T - 1, 0, 1, T],
        [-1, 0, 0, 0, 1, T],
        [0, 1, 0, T - 1, T, 1],
        [0, -1, 0, 0, T, 1],
      ]) {
        const j = grid[y + oy]?.[x + ox];
        if (j === undefined || j < 0 || j === i) continue;
        if (i === sel) ctx.fillStyle = "#fff";
        else if (j === sel) continue;
        else if (G.P[j].owner !== o) ctx.fillStyle = CIV[o].d;
        else {
          if (ox < 0 || oy < 0) continue;
          ctx.fillStyle = "rgba(0,0,0,.3)";
        }
        ctx.fillRect(X + ex, Y + ey, ew, eh);
      }
    }
  const wave = Math.floor(now / 450) % 2;
  ctx.font = '8px "Press Start 2P",monospace';
  ctx.textBaseline = "top";
  for (const p of G.P) {
    const cx = p.x * T + 4,
      cy = p.y * T + 4;
    if (p.cap) spr(ctx, wave ? SP.castle2 : SP.castle, cx - 5, cy - 7, PAL[p.owner]);
    else spr(ctx, SP.town, cx - 4, cy - 4, PAL[p.owner]);
    if (p.gen != null) {
      ctx.fillStyle = CIV[p.owner].c;
      ctx.fillRect(cx - 8, cy - 9, 3, 2);
      ctx.fillStyle = "#211c26";
      ctx.fillRect(cx - 9, cy - 9, 1, 6);
    }
    const n = tot(p.u);
    if (n) {
      spr(ctx, SP.i, cx + 7, cy - 3, PAL[p.owner]);
      const s = String(n);
      ctx.fillStyle = "#000";
      for (const [a, b] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
      ])
        ctx.fillText(s, cx + 15 + a, cy - 1 + b);
      ctx.fillStyle = p.tired ? "#a9a9a9" : "#fff";
      ctx.fillText(s, cx + 15, cy - 1);
    }
  }
  /* CAM: ejércitos, alcance, rutas, campamentos, asedios y estación (campana.js) */
  camDibujar(now);
  if (anim) {
    const k = Math.min(1, (now - anim.t0) / anim.dur),
      x = anim.x0 + (anim.x1 - anim.x0) * k,
      y = anim.y0 + (anim.y1 - anim.y0) * k - Math.abs(Math.sin(k * Math.PI * 4)) * 2;
    spr(ctx, SP.i, Math.round(x - 3), Math.round(y - 5), PAL[anim.f]);
    spr(ctx, SP.c, Math.round(x + 1), Math.round(y - 3), PAL[anim.f]);
    if (k >= 1) {
      const r = anim.res;
      anim = null;
      r();
    }
  }
  if (flash) {
    const k = (now - flash.t0) / 600;
    if (k > 1) flash = null;
    else {
      const r = Math.round(3 + k * 10);
      ctx.fillStyle = Math.floor(k * 8) % 2 ? "#fff3b0" : "#ff7a2a";
      for (let a = 0; a < 8; a++) {
        const an = (a * Math.PI) / 4;
        ctx.fillRect(
          Math.round(flash.x + Math.cos(an) * r) - 1,
          Math.round(flash.y + Math.sin(an) * r) - 1,
          2,
          2,
        );
      }
    }
  }
}
function frame(now) {
  try {
    if ($("start").classList.contains("show")) drawScene(now);
    if (G && MAP) drawMap(now);
    if (BT) drawBattle(now);
  } catch (e) {
    console.error(e);
  }
  requestAnimationFrame(frame);
}

let zoom = innerWidth < 700 ? 2 : 1;
function zoomAt(wrap, cnv, z, cx, cy) {
  const r = cnv.getBoundingClientRect(),
    wr = wrap.getBoundingClientRect(),
    fx = (cx - r.left) / r.width,
    fy = (cy - r.top) / r.height;
  cnv.style.width = z * 100 + "%";
  const r2 = cnv.getBoundingClientRect();
  wrap.scrollLeft += r2.left + fx * r2.width - cx;
  wrap.scrollTop += r2.top + fy * r2.height - cy;
}
function pinchDist(m) {
  const a = [...m.values()];
  return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1;
}
function pinchMid(m) {
  const a = [...m.values()];
  return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 };
}
const mp = { pts: new Map(), pan: null, pinch: null, moved: false };
function mapZoom(z, cx, cy) {
  zoom = clamp(z, 1, 4);
  const w = $("mapwrap");
  if (cx == null) {
    const r = w.getBoundingClientRect();
    cx = r.left + r.width / 2;
    cy = r.top + r.height / 2;
  }
  zoomAt(w, cv, zoom, cx, cy);
  $("mzl").textContent = Math.round(zoom * 100) + "%";
}
cv.addEventListener("pointerdown", (e) => {
  mp.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  try {
    cv.setPointerCapture(e.pointerId);
  } catch (_) {}
  const w = $("mapwrap");
  if (mp.pts.size === 1) {
    mp.moved = false;
    mp.pan = { cx: e.clientX, cy: e.clientY, sl: w.scrollLeft, st: w.scrollTop };
  } else if (mp.pts.size === 2) {
    mp.pinch = { d0: pinchDist(mp.pts), z0: zoom };
    mp.pan = null;
    mp.moved = true;
  }
});
cv.addEventListener("pointermove", (e) => {
  if (!mp.pts.has(e.pointerId)) return;
  mp.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const w = $("mapwrap");
  if (mp.pinch && mp.pts.size >= 2) {
    const m = pinchMid(mp.pts);
    mapZoom((mp.pinch.z0 * pinchDist(mp.pts)) / mp.pinch.d0, m.x, m.y);
    return;
  }
  if (mp.pan) {
    const dx = e.clientX - mp.pan.cx,
      dy = e.clientY - mp.pan.cy;
    if (Math.hypot(dx, dy) > 7) mp.moved = true;
    if (mp.moved) {
      w.scrollLeft = mp.pan.sl - dx;
      w.scrollTop = mp.pan.st - dy;
    }
  }
});
const mpEnd = (e) => {
  mp.pts.delete(e.pointerId);
  if (mp.pts.size < 2) mp.pinch = null;
  if (mp.pts.size === 1) {
    const a = [...mp.pts.values()][0],
      w = $("mapwrap");
    mp.pan = { cx: a.x, cy: a.y, sl: w.scrollLeft, st: w.scrollTop };
  }
  if (!mp.pts.size) mp.pan = null;
};
cv.addEventListener("pointerup", mpEnd);
cv.addEventListener("pointercancel", mpEnd);
cv.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    mapZoom(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
  },
  { passive: false },
);
function setZoom(z) {
  const w = $("mapwrap"),
    cx = (w.scrollLeft + w.clientWidth / 2) / w.scrollWidth,
    cy = (w.scrollTop + w.clientHeight / 2) / w.scrollHeight;
  zoom = clamp(z, 1, 4);
  cv.style.width = zoom * 100 + "%";
  const zl = $("mzl");
  if (zl) zl.textContent = Math.round(zoom * 100) + "%";
  w.scrollLeft = cx * w.scrollWidth - w.clientWidth / 2;
  w.scrollTop = cy * w.scrollHeight - w.clientHeight / 2;
}
function centerOn(i) {
  const p = G.P[i],
    w = $("mapwrap");
  if (!p) return;
  requestAnimationFrame(() => {
    w.scrollLeft = (p.x / W) * w.scrollWidth - w.clientWidth / 2;
    w.scrollTop = (p.y / H) * w.scrollHeight - w.clientHeight / 2;
  });
}
setZoom(zoom);
/* ---------- modal ---------- */
function modal(title, html, btns) {
  OC.modales = (OC.modales || 0) + 1;
  const pr = mq.then(
    () =>
      new Promise((res) => {
        $("modalc").innerHTML =
          `<h2>${title}</h2><div>${html}</div><div class="mbtn">${btns.map((b, i) => (b.inl ? "" : `<button data-mi="${i}" class="${b.cls || ""}" ${b.dis ? "disabled" : ""}>${b.t}</button>`)).join("")}</div>`;
        $("modal").classList.add("show");
        setTimeout(() => $("modalc").querySelector("button:not(:disabled)")?.focus(), 30);
        $("modalc").onclick = (e) => {
          const x = e.target.closest("[data-mi]");
          if (!x || x.disabled) return;
          $("modal").classList.remove("show");
          $("modalc").onclick = null;
          const b = btns[+x.dataset.mi];
          try {
            b.fn && b.fn();
          } finally {
            res(b.v !== undefined ? b.v : +x.dataset.mi);
            if (G) ui();
          }
        };
      }),
  );
  mq = pr.catch(() => {});
  return pr;
}
/* ---------- acciones ---------- */
document.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-act]");
  if (!b || b.disabled) return;
  const ds = b.dataset.act,
    ix = ds.indexOf("-"),
    a = ix < 0 ? ds : ds.slice(0, ix),
    v = ix < 0 ? "" : ds.slice(ix + 1);
  if (a === "music") {
    AU.want = !AU.want;
    try {
      localStorage.setItem("ocaso-mus", AU.want ? "1" : "0");
    } catch (_) {}
    if (AU.want) {
      audioInit();
      music(BT ? "battle" : "camp");
    } else music(null);
    musLabel();
    if (ST.view === "home" && $("start").classList.contains("show")) renderStart();
    return;
  }
  if (a === "zoom") {
    mapZoom(zoom * (v === "in" ? 1.4 : 1 / 1.4));
    return;
  }
  if (a === "menu") {
    openStart("home");
    return;
  }
  if (a === "s") {
    startAct(v);
    return;
  }
  if (a === "b") {
    battleAct(v);
    return;
  }
  if (!G) return;
  if (a === "tab") {
    tab = v;
    ui();
    return;
  }
  if (a === "end") {
    endTurn();
    return;
  }
  const ocA = OC.acciones[a];
  if (ocA && ocA.libre) {
    if (ocA.fn(v, b) !== false) ui();
    return;
  }
  if (busy || G.over || !myTurn()) return;
  if (ocA) {
    if (ocA.fn(v, b) !== false) ui();
    return;
  }
  const p = G.P[sel];
  if (p && p.owner === ME) {
    if (a === "aim") {
      const f = +v;
      aim = aim === f ? 0 : f;
    }
    if (a === "gen") {
      const id = +$("gsel").value;
      G.P.forEach((q) => {
        if (q.gen === id) q.gen = null;
      });
      p.gen = id;
    }
    if (a === "ungen") p.gen = null;
  }
  ui();
});
const tileAt = (e) => {
  const b = cv.getBoundingClientRect(),
    x = Math.floor(((e.clientX - b.left) / b.width) * W),
    y = Math.floor(((e.clientY - b.top) / b.height) * H);
  const i = MAP.grid[y]?.[x];
  return i === undefined ? -1 : i;
};
cv.addEventListener("click", (e) => {
  if (mp.moved) {
    mp.moved = false;
    return;
  }
  if (!G || busy || BT) return;
  /* CAM: ejércitos del mapa (seleccionar, marchar, asediar, atacar) */
  const cxy = camCasillaEv(e);
  if (cxy && camClic(cxy[0], cxy[1])) return;
  const i = tileAt(e);
  if (i < 0) {
    sel = null;
    aim = 0;
    ui();
    return;
  }
  if (aim && sel !== null && myTurn() && !G.over && MAP.adj[sel].includes(i)) {
    const s = sel,
      f = aim,
      q = G.P[i];
    aim = 0;
    const go = () => {
      busy = true;
      ui();
      march(s, i, f)
        .catch(console.error)
        .finally(() => {
          busy = false;
          if (q.owner === ME) sel = i;
          ui();
          save();
        });
    };
    if (q.owner !== ME && q.owner < REB && !atWar(ME, q.owner)) {
      const tr = G.st[ME][q.owner] === "alianza";
      modal(
        tr ? "¿Traicionar a tu aliado?" : "¿Declarar la guerra?",
        `<p>${q.name} pertenece a ${CIV[q.owner].n}. ${tr ? "Atacar a un aliado es una traición que todos recordarán." : "Atacar significa declarar la guerra."}</p>`,
        [
          {
            t: "Atacar",
            cls: "red",
            fn: () => {
              declareWar(ME, q.owner);
              go();
            },
          },
          { t: "Cancelar" },
        ],
      );
    } else go();
    return;
  }
  aim = 0;
  sel = i;
  if (tab !== "prov") tab = "prov";
  ui();
});
cv.addEventListener("mousemove", (e) => {
  if (!G) return;
  const i = tileAt(e);
  hover = i < 0 ? null : i;
  const p = G.P[i];
  /* CAM: casilla bajo el ratón (ruta) y ejércitos o campamentos que haya en ella */
  const cxy = camCasillaEv(e),
    ct = cxy ? camHoverTxt(cxy[0], cxy[1]) : "";
  camHov = cxy ? camIdx(cxy[0], cxy[1]) : -1;
  $("hv").textContent = ct || (i < 0 ? "Mar" : `${p.name} · ${CIV[p.owner].s} · ${tot(p.u)} soldados${camAsedio(i) ? " · sitiada" : ""}`);
});
cv.addEventListener("mouseleave", () => {
  hover = null;
  camHov = -1;
});
document.addEventListener("keydown", (e) => {
  if (e.target.matches("input,select")) return;
  if (e.key === "Escape") {
    aim = 0;
    if (G) ui();
  }
  if ((e.key === "e" || e.key === "E") && !e.ctrlKey && !e.metaKey && !$("modal").classList.contains("show"))
    endTurn();
});
