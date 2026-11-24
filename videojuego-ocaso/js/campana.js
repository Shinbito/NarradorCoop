/* ---------- marchas entre provincias e interfaz de campaña ----------
   Sistema CAMPAÑA. El motor de batalla (cmbResolverAuto, cmbEstimar, cmbTerreno, cmbEntorno…) vive en
   batalla.js (combate). Aquí: march/settle (traslado instantáneo entre provincias vecinas, que la IA usa
   para llevar guarniciones a la frontera) y, al final, la interfaz de los ejércitos del mapa. */
async function march(from, to, frac, fast) {
  const p = G.P[from],
    q = G.P[to],
    s = cmbVacio();
  cmbNorm(p.u);
  for (const t of TYP) s[t] = frac >= 1 ? p.u[t] : Math.floor(p.u[t] * frac);
  if (!tot(s)) return;
  const xp = { ...cmbVetDe(p) },
    ori = { ...cmbOriDe(p) };
  for (const t of TYP) p.u[t] -= s[t];
  cmbVetFijar(p, xp);
  cmbOriFijar(p, ori);
  let g = null;
  if (frac >= 1 && p.gen != null) {
    g = p.gen;
    p.gen = null;
  }
  await new Promise((res) => {
    anim = {
      f: p.owner,
      x0: p.x * T + 4,
      y0: p.y * T + 4,
      x1: q.x * T + 4,
      y1: q.y * T + 4,
      t0: performance.now(),
      dur: reduce ? 1 : fast ? 110 : Math.round(480 * (typeof camVel === "function" ? camVel() : 1)),
      res,
    };
  });
  await settle(p, q, s, g, xp, ori);
}

/* ---------- un ejército entra en una provincia ---------- */
const armyTxt = (f, u, g) =>
  `${CIV[f].s}: ${tot(u) * SPU} hombres${g != null && G.C[g] ? " al mando de " + G.C[g].n : ""}`;
const cmbComp = (f, u) =>
  TYP.filter((t) => u[t] > 0)
    .map((t) => `${u[t] * SPU} ${CIV[f].un[t].toLowerCase()}`)
    .join(", ");
function cmbVetGanar(xp, u, gana, rondas) {
  const v = { ...(xp || {}) },
    k = clamp(rondas / 6, 0.5, 1.5) * (gana ? 18 : 10);
  for (const t of TYP) if (u[t] > 0) v[t] = Math.min(100, (v[t] || 0) + k * (1 - (v[t] || 0) / 130));
  return v;
}
async function settle(p, q, s, g, xpA, oriA) {
  const f = p.owner;
  cmbNorm(s);
  cmbNorm(q.u);
  cmbNorm(p.u);
  xpA = xpA || cmbVetDe(p);
  oriA = oriA || cmbOriDe(p);
  if (q.owner === f) {
    cmbLlega(q, s, xpA, oriA);
    q.tired = true;
    if (g != null) {
      if (q.gen == null) q.gen = g;
      else if (p.gen == null) p.gen = g;
    }
    return;
  }
  const old = q.owner,
    gD = q.gen,
    n0 = tot(s),
    d0 = tot(q.u),
    xpD = { ...cmbVetDe(q) },
    oriD = { ...cmbOriDe(q) },
    ejA = { f, u: s, gen: g, vet: xpA, ori: oriA, fat: 10 },
    ejD = { f: old, u: { ...q.u }, gen: gD, vet: xpD, ori: oriD, fat: q.tired ? 5 : 0 },
    ctx = { fort: q.walls || 0, p: q, nombreLugar: q.name, terreno: cmbTerreno(q) };
  let res,
    ch = "auto";
  if (d0 <= 0) {
    res = { gana: 0, A: { ...s }, D: cmbVacio(), heridos: { A: 0, D: 0 }, informe: null, gen: [null, null] };
  } else {
    if (isMe(f)) {
      const pr = Math.round(cmbEstimar(ejA, ejD, ctx, 16) * 100),
        tr = ctx.terreno;
      ch = await modal(
        `Batalla por ${q.name}`,
        `<p>${armyTxt(f, s, g)}<br><span class="stats">${cmbComp(f, s)}</span><br>contra ${armyTxt(old, q.u, gD)}<br><span class="stats">${cmbComp(old, q.u)}</span>${q.walls ? "<br>tras murallas de nivel " + q.walls : ""}.</p><p class="dim">Terreno: ${CMBA_TERR[tr.tag]}. Tus capitanes ven la batalla ${pr >= 70 ? "favorable" : pr >= 45 ? "incierta" : "desfavorable"} (≈${pr}% de victoria).</p><p>¿Cómo quieres librarla?</p>`,
        [
          { t: "Por turnos · 3 acciones", v: "t3", cls: "gold" },
          { t: "Por turnos · 1 acción", v: "t1", cls: "gold" },
          { t: "Tiempo real", v: "rt", cls: "gold" },
          { t: "Resolución automática", v: "auto" },
        ],
      );
    }
    res = ch !== "auto" ? await cmbTactica(ejA, ejD, ctx, ch) : cmbResolverAuto(ejA, ejD, ctx);
  }
  const win = res.gana === 0,
    A = cmbNorm(res.A),
    D = cmbNorm(res.D),
    inf = res.informe,
    ron = inf ? inf.rondas.length : 0;
  if (inf) cmbGuardarInf(inf);
  if (d0 > 0) {
    cmbFamaSumar(win ? f : old, d0 >= 2 && n0 >= 2 ? 1 : 0.25);
    cmbFamaSumar(win ? old : f, 0.25);
  }
  const gm = res.gen || [null, null];
  OC.emitirSync("batallaResuelta", {
    p: q,
    atacante: f,
    defensor: old,
    gana: win,
    A,
    D,
    s0: s,
    d0: ejD.u,
    gA: g,
    gD,
    bajas: inf ? inf.bajas : null,
    heridos: res.heridos,
    factores: inf ? inf.factores.map((x) => x.k) : [],
    rondas: ron,
    general: gm,
    modo: ch,
    informe: inf,
  });
  if (gm[0] === "muerto" && g != null) kill(G.C[g], "cae en la batalla de " + q.name);
  if (gm[1] === "muerto" && gD != null) kill(G.C[gD], "cae en la batalla de " + q.name);
  flash = { x: q.x * T + 4, y: q.y * T + 4, t0: performance.now() };
  const cls = isMe(f) ? "good" : isMe(old) ? "bad" : "",
    bA = inf ? Math.round(inf.bajas[0].m) : (n0 - tot(A)) * SPU,
    bD = inf ? Math.round(inf.bajas[1].m) : d0 * SPU;
  if (win) {
    if (gD != null && G.C[gD] && G.C[gD].alive && R() < 0.3) kill(G.C[gD], "cae defendiendo " + q.name);
    /* los supervivientes del defensor se repliegan a una provincia propia vecina */
    const ref = tot(D)
      ? MAP.adj[q.id]
          .map((i) => G.P[i])
          .filter((x) => x.owner === old)
          .sort((a, b) => tot(b.u) - tot(a.u))[0]
      : null;
    if (ref) {
      cmbLlega(ref, D, cmbVetGanar(xpD, D, false, ron), oriD);
      if (gD != null && G.C[gD] && G.C[gD].alive && ref.gen == null) ref.gen = gD;
    }
    Object.assign(q, {
      owner: f,
      u: A,
      tired: true,
      recent: 3,
      order: Math.min(q.order, 45),
      tax: 1,
      gen: g != null && G.C[g] && G.C[g].alive ? g : null,
    });
    cmbVetFijar(q, cmbVetGanar(xpA, A, true, ron));
    cmbOriFijar(q, oriA);
    if (q.walls) q.walls--;
    OC.emitirSync("conquista", { p: q, de: old, a: f });
    if (CIV[f].loot) G.F[f].gold += CIV[f].loot;
    addLog(
      `${CIV[f].s} conquista ${q.name}${old !== REB ? " a " + CIV[old].s : ""}. Caídos: ${bA} propios, ${bD} enemigos${ref ? `; ${tot(D) * SPU} supervivientes se repliegan a ${ref.name}` : ""}.`,
      cls,
    );
    if (q.cap && old < REB && q.home === old) addLog(`¡Cae la capital de ${CIV[old].s}!`, cls);
    if (old < REB && !alive(old))
      addLog(`${CIV[old].n} desaparece de la historia.`, isMe(old) ? "bad" : "good");
  } else {
    q.u = D;
    cmbVetFijar(q, cmbVetGanar(xpD, D, true, ron));
    cmbOriFijar(q, oriD);
    cmbLlega(p, A, cmbVetGanar(xpA, A, false, ron), oriA);
    p.tired = true;
    if (g != null && G.C[g] && G.C[g].alive) {
      if (!tot(A) && R() < 0.5) kill(G.C[g], "muere en " + q.name);
      else if (p.gen == null) p.gen = g;
    }
    addLog(
      `${CIV[f].s} fracasa en ${q.name}. Caídos: ${bA} propios, ${bD} enemigos.`,
      isMe(f) ? "bad" : isMe(old) ? "good" : "",
    );
  }
  /* informe para el jugador */
  if (inf && (isMe(f) || isMe(old)) && ch === "auto") {
    const yo = isMe(f) ? 0 : 1,
      gano = inf.gana === yo;
    if (yo === 0 || !gano || d0 + n0 >= 8)
      await modal(`${gano ? "Victoria" : "Derrota"} en ${q.name}`, cmbInfHtml(inf, yo), [
        { t: "Continuar", cls: "gold" },
      ]);
  }
  checkEnd();
}

/* ======================================================================
   INTERFAZ DE CAMPAÑA (sistema Campaña): dibujo de ejércitos, alcance y rutas en el mapa, panel del
   ejército seleccionado, sección «Ejército» de la provincia y pestaña «Campaña».
   La lógica (órdenes, asedios, estaciones) está en ejercitos.js; los mercenarios en mercenarios.js.
   ====================================================================== */
const CAM_ESTADO = { marcha: "en marcha", campamento: "acampado", asedio: "asediando", guarnicion: "de guarnición" };
let camRutaC = null;
/* ruta que se dibuja hasta la casilla bajo el ratón: [dentro del alcance, más allá] */
function camRutaHover(ej) {
  if (camHov < 0) return null;
  const k = `${ej.id}|${camHov}|${camVer}|${ej.mov}`;
  if (camRutaC && camRutaC.k === k) return camRutaC.r;
  const [x, y] = camXY(camHov);
  let r = null;
  if (MAP.terr[y] && MAP.terr[y][x] && !(x === ej.x && y === ej.y)) {
    const pr = camPlanRuta(ej, x, y, {});
    if (pr) {
      const D = camAlcance(ej),
        a = pr.ruta.filter((j) => Number.isFinite(D.dist[j]) && D.dist[j] <= ej.mov + 1e-9);
      let n = 0;
      while (n < pr.ruta.length && a.includes(pr.ruta[n])) n++;
      r = { dentro: pr.ruta.slice(0, n), fuera: pr.ruta.slice(n), luego: pr.plan.luego };
    }
  }
  camRutaC = { k, r };
  return r;
}
function camSprite(c, ej, X, Y, now) {
  const cab = Object.keys(ej.u).reduce((s, t) => s + (UN[t] && UN[t].cl === "cab" ? ej.u[t] || 0 : 0), 0),
    pal = PAL[ej.f] || PAL[0],
    bob = ej.est === "marcha" && !reduce ? Math.floor(now / 300 + ej.id) % 2 : 0;
  /* estandarte del pueblo */
  c.fillStyle = "#211c26";
  c.fillRect(X - 2, Y - 5, 1, 9);
  c.fillStyle = CIV[ej.f].c;
  c.fillRect(X - 1, Y - 5, 4, 3);
  c.fillStyle = CIV[ej.f].d;
  c.fillRect(X - 1, Y - 3, 4, 1);
  spr(c, cab * 2 > camTot(ej.u) ? SP.c : SP.i, X, Y - 3 - bob, pal);
  if (ej.est === "campamento") {
    /* tienda */
    c.fillStyle = "#e9dcb4";
    for (let k = 0; k < 4; k++) c.fillRect(X + 6 - k, Y + 3 + k, 1 + 2 * k, 1);
    c.fillStyle = "#6b4a2a";
    c.fillRect(X + 6, Y + 5, 1, 2);
  }
  const s = String(camTot(ej.u));
  c.fillStyle = "#000";
  for (const [a, b] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ])
    c.fillText(s, X + 8 + a, Y + b);
  c.fillStyle = ej.mov > 0.5 || !isMe(ej.f) ? "#fff" : "#a9a9a9";
  c.fillText(s, X + 8, Y);
}
function camDibujar(now) {
  if (!G || !MAP) return;
  const S = camS(),
    c = ctx,
    sel = camSel != null ? camEj(camSel) : null,
    mio = sel && isMe(sel.f) && myTurn() && !G.over;
  /* alcance de la estación y ruta */
  if (mio) {
    const D = camAlcance(sel);
    c.globalAlpha = 0.16 + 0.08 * Math.sin(now / 160);
    c.fillStyle = "#fff";
    for (let i = 0; i < W * H; i++) if (D.dist[i] <= sel.mov + 1e-9 && i !== D.s) c.fillRect((i % W) * T, Math.floor(i / W) * T, T, T);
    c.globalAlpha = 0.45;
    c.fillStyle = "#ff5a3a";
    for (const p of G.P)
      if (camCiudadCerrada(sel.f, p) && CAM_V8.some(([dx, dy]) => D.dist[camIdx(p.x + dx, p.y + dy)] <= sel.mov + 1e-9 || (sel.x === p.x + dx && sel.y === p.y + dy)))
        c.fillRect(p.x * T, p.y * T, T, T);
    for (const e of S.ej) if (camGuerra(sel.f, e.f) && D.dist[camIdx(e.x, e.y)] <= sel.mov + 1e-9) c.fillRect(e.x * T, e.y * T, T, T);
    c.globalAlpha = 1;
    const r = camRutaHover(sel);
    if (r) {
      c.fillStyle = "#fff3b0";
      for (const j of r.dentro) c.fillRect((j % W) * T + 3, Math.floor(j / W) * T + 3, 2, 2);
      c.fillStyle = "rgba(255,243,176,.45)";
      for (const j of r.fuera) c.fillRect((j % W) * T + 3, Math.floor(j / W) * T + 3, 2, 2);
    }
  }
  /* huella de la última marcha */
  for (const e of S.ej) {
    if (!e.pas || !e.pas.length) continue;
    c.fillStyle = CIV[e.f].d;
    c.globalAlpha = 0.6;
    for (const j of e.pas) c.fillRect((j % W) * T + 3, Math.floor(j / W) * T + 4, 2, 1);
    c.globalAlpha = 1;
  }
  /* campamentos mercenarios */
  if (typeof mercS === "function")
    for (const m of mercS().camp) {
      if (!m.cias.length) continue;
      const X = m.x * T,
        Y = m.y * T;
      c.fillStyle = "#c9a227";
      for (let k = 0; k < 4; k++) c.fillRect(X + 4 - k, Y + 3 + k, 1 + 2 * k, 1);
      c.fillStyle = "#211c26";
      c.fillRect(X + 4, Y - 2, 1, 5);
      c.fillStyle = "#e8b632";
      c.fillRect(X + 5, Y - 2, 3, 2);
    }
  /* asedios: escalas y fuego sobre la ciudad */
  for (const a of Object.values(S.as)) {
    const p = G.P[a.p];
    if (!p) continue;
    const X = p.x * T,
      Y = p.y * T,
      fl = Math.floor(now / 200) % 2;
    c.fillStyle = "#6b4a2a";
    c.fillRect(X - 1, Y - 4, 1, 8);
    c.fillRect(X + 1, Y - 4, 1, 8);
    for (let k = 0; k < 4; k++) c.fillRect(X - 1, Y - 3 + k * 2, 3, 1);
    c.fillStyle = fl ? "#ff7a2a" : "#ffd04a";
    c.fillRect(X + 6, Y - 6 + fl, 2, 2);
    if (a.vi < 0) {
      c.fillStyle = "#e0503f";
      c.fillRect(X + 3, Y - 7, 2, 2);
    }
  }
  camDibujarCerco(c, now);
  /* ejércitos */
  const ciu = camCiudades();
  for (const e of S.ej) {
    if (camTot(e.u) <= 0) continue;
    let X = e.x * T + 1,
      Y = e.y * T + 2;
    if (ciu.has(camIdx(e.x, e.y))) X -= 8;
    camSprite(c, e, X, Y, now);
    if (e.id === camSel && Math.floor(now / 350) % 2) {
      c.strokeStyle = "#fff";
      c.lineWidth = 1;
      c.strokeRect(e.x * T + 0.5, e.y * T + 0.5, T - 1, T - 1);
    }
  }
  /* estación en curso */
  const tx = `${CAM_EST[G.estacion]} ${G.year}`;
  c.fillStyle = "rgba(0,0,0,.55)";
  c.fillRect(2, 2, tx.length * 8 + 6, 12);
  c.fillStyle = G.estacion === 3 ? "#cfe3ff" : "#f2d27a";
  c.fillText(tx, 5, 4);
  /* el botón de fin de turno dice qué termina (la interfaz escribe «Fin del año») */
  const eb = $("endb");
  if (eb && !busy && myTurn() && !G.over && !net.on) {
    const t = camTextoFin();
    if (eb.textContent !== t) eb.textContent = t;
  }
}
/* ---------- cercos por flancos (capa que también llama interfaz.js, marcada CAM) ----------
   Marca de color del sitiador en cada lado ocupado de la ciudad, flechas de cada ejército hacia ella,
   los compañeros de un asalto conjunto resaltados al seleccionar a uno y la animación del asalto. */
const CAM_LADO_XY = { N: [0, -1], E: [1, 0], S: [0, 1], O: [-1, 0] };
function camMarcaLado(c, p, l, col) {
  const X = p.x * T,
    Y = p.y * T;
  c.fillStyle = "#000";
  if (l === "N") c.fillRect(X - 2, Y - 3, T + 4, 3);
  if (l === "S") c.fillRect(X - 2, Y + T, T + 4, 3);
  if (l === "E") c.fillRect(X + T, Y - 2, 3, T + 4);
  if (l === "O") c.fillRect(X - 3, Y - 2, 3, T + 4);
  c.fillStyle = col;
  if (l === "N") c.fillRect(X - 1, Y - 2, T + 2, 1);
  if (l === "S") c.fillRect(X - 1, Y + T + 1, T + 2, 1);
  if (l === "E") c.fillRect(X + T + 1, Y - 1, 1, T + 2);
  if (l === "O") c.fillRect(X - 2, Y - 1, 1, T + 2);
}
function camFlecha(c, e, p, col, now, fase) {
  const ax = e.x * T + 4,
    ay = e.y * T + 4,
    bx = p.x * T + 4,
    by = p.y * T + 4,
    mv = reduce ? 0 : ((now / 420 + (fase || 0)) % 1) * 0.25;
  for (const k of [0.3, 0.5, 0.7]) {
    const t = k + mv,
      x = Math.round(ax + (bx - ax) * t),
      y = Math.round(ay + (by - ay) * t);
    c.fillStyle = "#000";
    c.fillRect(x - 1, y - 1, 3, 3);
    c.fillStyle = col;
    c.fillRect(x, y, 1, 1);
  }
}
function camDibujarCerco(c, now) {
  if (!G || !MAP) return;
  const S = camS(),
    vistos = new Set();
  /* ciudades cercadas (o con ejércitos enemigos en cerco a su lado) */
  for (const a of Object.values(S.as)) {
    const p = G.P[a.p];
    if (!p) continue;
    vistos.add(p.id);
    const ejs = S.ej.filter((e) => e.asd === p.id && camCheb(e.x, e.y, p.x, p.y) === 1 && camTot(e.u) > 0);
    for (const e of ejs) {
      const l = camFlanco(e.x - p.x, e.y - p.y);
      if (l) camMarcaLado(c, p, l, CIV[e.f].c);
      camFlecha(c, e, p, CIV[e.f].c, now, e.id * 0.13);
    }
  }
  /* compañeros de un asalto conjunto del ejército seleccionado */
  const se = camSel != null ? camEj(camSel) : null;
  if (se && isMe(se.f)) {
    const p = G.P.find((q) => camCiudadCerrada(se.f, q) && camCheb(q.x, q.y, se.x, se.y) === 1);
    if (p) {
      const part = camParticipantes(se, p);
      if (part.length > 1) {
        const on = reduce || Math.floor(now / 300) % 2;
        for (const e of part) {
          const X = e.x * T,
            Y = e.y * T;
          c.fillStyle = on ? "#f2c14e" : "#fff3b0";
          for (const [a, b, w, h] of [
            [-1, -1, 3, 1],
            [-1, -1, 1, 3],
            [T - 2, -1, 3, 1],
            [T, -1, 1, 3],
            [-1, T, 3, 1],
            [-1, T - 2, 1, 3],
            [T - 2, T, 3, 1],
            [T, T - 2, 1, 3],
          ])
            c.fillRect(X + a, Y + b, w, h);
          if (!vistos.has(p.id)) {
            const l = camFlanco(e.x - p.x, e.y - p.y);
            if (l) camMarcaLado(c, p, l, CIV[e.f].c);
            camFlecha(c, e, p, "#f2c14e", now, e.id * 0.13);
          }
        }
      }
    }
  }
  /* animación del asalto conjunto: columnas que convergen y un estallido sobre la ciudad */
  if (camAnimAsalto) {
    const k = (performance.now() - camAnimAsalto.t0) / (1300 * camVel()),
      p = G.P[camAnimAsalto.p];
    if (k > 1 || !p) camAnimAsalto = null;
    else {
      const bx = p.x * T + 4,
        by = p.y * T + 4;
      for (const [x, y, f] of camAnimAsalto.ejs) {
        const t = Math.min(1, k * 1.6),
          px = Math.round(x * T + 4 + (bx - x * T - 4) * t),
          py = Math.round(y * T + 4 + (by - y * T - 4) * t);
        c.fillStyle = "#000";
        c.fillRect(px - 2, py - 2, 5, 5);
        c.fillStyle = CIV[f] ? CIV[f].c : "#fff";
        c.fillRect(px - 1, py - 1, 3, 3);
      }
      if (k > 0.55) {
        const r = Math.round(3 + (k - 0.55) * 22);
        c.fillStyle = Math.floor(k * 12) % 2 ? "#fff3b0" : "#ff7a2a";
        for (let a = 0; a < 12; a++) {
          const an = (a * Math.PI) / 6;
          c.fillRect(Math.round(bx + Math.cos(an) * r) - 1, Math.round(by + Math.sin(an) * r) - 1, 2, 2);
        }
      }
    }
  }
}
/* casilla del mapa bajo el puntero */
function camCasillaEv(e) {
  const b = cv.getBoundingClientRect(),
    x = Math.floor(((e.clientX - b.left) / b.width) * W),
    y = Math.floor(((e.clientY - b.top) / b.height) * H);
  return x >= 0 && y >= 0 && x < W && y < H ? [x, y] : null;
}
function camHoverTxt(x, y) {
  const es = camEjsEn(x, y);
  if (es.length)
    return es
      .map((e) => `${camNombre(e)} (${CIV[e.f].s}) · ${camTot(e.u) * SPU} hombres · ${CAM_ESTADO[e.est] || e.est}`)
      .join(" | ");
  const m = typeof mercS === "function" ? mercS().camp.find((c) => c.x === x && c.y === y && c.cias.length) : null;
  if (m) return `${m.nom}: ${m.cias.map((c) => c.nom).join(", ")}`;
  return "";
}
/* ejecuta una orden del jugador con la interfaz bloqueada y animación */
async function camOrdenUI(o) {
  if (busy) return;
  busy = true;
  ui();
  let r;
  try {
    r = await camAplicarOrden(G, o, { anim: true });
  } catch (e) {
    console.error(e);
  } finally {
    busy = false;
  }
  if (r && !r.ok && r.motivo) addLog(r.motivo, "bad");
  if (camSel != null && !camEj(camSel)) camSel = null;
  ui();
  save();
  return r;
}
/* clic en el mapa: devuelve true si la campaña lo atiende */
function camClic(x, y) {
  const aqui0 = camS(),
    aqui = aqui0 && camEjsEn(x, y),
    mio = aqui.find((e) => isMe(e.f)),
    cur = camSel != null ? camEj(camSel) : null;
  if (cur && isMe(cur.f) && myTurn() && !G.over) {
    if (cur.x === x && cur.y === y) {
      camSel = null;
      return false;
    }
    if (mio && mio.id !== cur.id && !(camCheb(cur.x, cur.y, x, y) <= 1 && cur.mov > 0)) {
      camSel = mio.id;
      ui();
      return true;
    }
    if (!MAP.terr[y][x]) {
      camSel = null;
      ui();
      return true;
    }
    const pid = MAP.grid[y][x],
      o = G.P[pid].owner;
    if (!camPaso(cur.f, o, cur)) {
      modal(
        `Tierras de ${CIV[o].s}`,
        `<p>Estás en ${G.st[ME][o]} con ${CIV[o].n} y no tienes derecho de paso. Para entrar en ${G.P[pid].name} hay que declarar la guerra (o pactar el paso en Diplomacia).</p>`,
        [
          {
            t: "Declarar la guerra…",
            cls: "red",
            fn: () =>
              setTimeout(async () => {
                if (typeof dipModalGuerra === "function") {
                  dipModalGuerra(o);
                  await mq;
                } else declareWar(ME, o);
                if (camGuerra(ME, o)) camOrdenUI({ tipo: "mover", f: ME, ej: cur.id, x, y });
              }, 0),
          },
          { t: "Cancelar" },
        ],
      );
      return true;
    }
    const otro = mio && mio.id !== cur.id ? mio : null,
      ciu = !otro && camCiudadEn(x, y);
    /* ciudad propia: ¿resguardar el ejército tras sus muros? */
    if (ciu && ciu.owner === ME) {
      modal(
        `¿Resguardar el ejército?`,
        `<p>${esc(camNombre(cur))} marcha hacia ${ciu.name}.</p><p class="dim">Si se resguarda, entra en la ciudad y se suma a su guarnición (deja de ser un ejército en el mapa). Si solo se acerca, se queda allí como ejército, listo para seguir marchando.</p>`,
        [
          { t: `Resguardar en ${ciu.name}`, cls: "gold", fn: () => camOrdenUI({ tipo: "mover", f: ME, ej: cur.id, x, y, luego: "disolver", p: ciu.id }) },
          { t: "Solo acercarse", fn: () => camOrdenUI({ tipo: "mover", f: ME, ej: cur.id, x, y, noEntrar: true }) },
          { t: "Cancelar" },
        ],
      );
      return true;
    }
    /* ciudad rival en guerra (o rebelde): ¿asediar o atacar? */
    /* ciudad cercada por otro bando: unirse a su cerco (si lo acepta) o declararle la guerra; la ciudad no se toca */
    const ajeno = ciu && ciu.owner !== ME && camGuerra(ME, ciu.owner) ? camCercoAjeno(ME, ciu) : null;
    if (ajeno) {
      const A = ajeno.f,
        guerraA = camGuerra(ME, A),
        btns = [];
      if (!guerraA && A < NF)
        btns.push({
          t: "Unirse al asedio",
          cls: "gold",
          fn: () =>
            setTimeout(async () => {
              if (await camPedirCerco(ME, ciu)) camOrdenUI({ tipo: "mover", f: ME, ej: cur.id, x, y, luego: "asediar", p: ciu.id });
              else ui();
            }, 0),
        });
      if (!guerraA && A < NF)
        btns.push({
          t: `Declarar la guerra a ${CIV[A].s}`,
          cls: "red",
          fn: () =>
            setTimeout(() => {
              if (typeof dipModalGuerra === "function") dipModalGuerra(A);
              else declareWar(ME, A);
            }, 0),
        });
      btns.push({ t: "Cancelar" });
      modal(
        `${ciu.name}`,
        `<p>Asediada por <b style="color:${CIV[A].c}">${CIV[A].s}</b> (${camSitiadores(ciu.id).length} ${camSitiadores(ciu.id).length === 1 ? "ejército" : "ejércitos"}, ${ajeno.n} ${ajeno.n === 1 ? "estación" : "estaciones"} de cerco).</p><p class="dim">Quien cerca una ciudad manda en ella: no puedes asaltarla ni ocuparla por tu cuenta. ${guerraA ? `Estás en guerra con ${CIV[A].s}: ataca a sus ejércitos sitiadores (clic sobre ellos) para romper su cerco.` : `Puedes pedir unirte al asedio (cubrirías otro flanco y entrarías en un asalto conjunto; la ciudad sería de ${CIV[A].s}, el botín se reparte) o declararle la guerra y luchar contra su ejército.`}</p>`,
        btns,
      );
      return true;
    }
    if (ciu && ciu.owner !== ME && camGuerra(ME, ciu.owner)) {
      const gu = tot(ciu.u) * SPU,
        mu = ciu.walls || 0,
        mios = camTot(cur.u) * SPU,
        maq = Object.values(camMaq(cur)).reduce((a, b) => a + b, 0),
        /* flancos: tus ejércitos (y aliados) ya junto a la ciudad, y los que se sumarían a un asalto conjunto */
        fl = camFlancosDe(ME, ciu),
        yaJunto = camCheb(cur.x, cur.y, ciu.x, ciu.y) === 1,
        otros = fl.ejs.filter((e) => e.id !== cur.id && e.acc !== camClaveEst() && (e.f === ME || !human(e.f))),
        destino = yaJunto ? null : camPlanRuta(cur, x, y, {}),
        llega = yaJunto || (destino && camRutaCabe(cur, destino.ruta)),
        lados = [...new Set([...fl.lados, ...(yaJunto ? [] : destino && destino.ruta.length ? [camFlanco((destino.ruta[destino.ruta.length - 1] % W) - ciu.x, Math.floor(destino.ruta[destino.ruta.length - 1] / W) - ciu.y)] : [])])].filter(Boolean),
        nConj = otros.length + 1,
        con = otros.map((e) => e.id);
      const btns = [
        { t: "Asediar", cls: "gold", fn: () => camOrdenUI({ tipo: "mover", f: ME, ej: cur.id, x, y, luego: "asediar", p: ciu.id }) },
        { t: "¡Atacar!", cls: "red", fn: () => camOrdenUI({ tipo: "mover", f: ME, ej: cur.id, x, y, luego: "asaltar", p: ciu.id }) },
      ];
      if (otros.length && llega)
        btns.push({
          t: `Asalto conjunto (${nConj} ejércitos, ${lados.length} ${lados.length === 1 ? "flanco" : "flancos"})`,
          cls: "red",
          fn: () => camOrdenUI({ tipo: "mover", f: ME, ej: cur.id, x, y, luego: "asaltar", p: ciu.id, con }),
        });
      btns.push({ t: "Cancelar" });
      modal(
        `${ciu.name}`,
        `<p>${esc(camNombre(cur))} (${mios} hombres${maq ? `, ${maq} máquinas` : ""}) contra ${ciu.name}: ${gu ? gu + " defensores" : "sin guarnición"}${mu ? ` tras murallas de nivel ${mu}` : ", sin murallas"}.</p><p>Tus ejércitos junto a la ciudad: <b>${fl.ejs.length}</b> · flancos cubiertos <b>${fl.lados.length}/4</b>${fl.lados.length ? ` (${fl.lados.map((l) => CAM_LADO_N[l]).join(", ")})` : ""}.</p><p class="dim">Asediar: cercas la ciudad varias estaciones (desde un flanco libre si lo hay), sus víveres y su moral caen y puedes construir arietes, torres y catapultas. Atacar: asalto inmediato al llegar${mu ? "; contra murallas sin máquinas es muy costoso" : ""}.${otros.length ? " Asalto conjunto: todos atacan a la vez; cada flanco más reparte a los defensores (menos murallas y moral)." : ""} Si no llega esta estación, seguirá la marcha y lo hará al llegar.</p>`,
        btns,
      );
      return true;
    }
    camOrdenUI({ tipo: "mover", f: ME, ej: cur.id, x, y, luego: otro ? "unir" : undefined, con: otro ? otro.id : undefined });
    return true;
  }
  if (aqui.length) {
    camSel = (mio || aqui[0]).id;
    const p = camProv(camEj(camSel));
    if (p) sel = p.id;
    if (tab !== "prov") tab = "prov";
    ui();
    return true;
  }
  if (camSel != null) camSel = null;
  return false;
}
/* ---------- panel del ejército seleccionado ---------- */
const camBarra = (v, mx, col) => `<div class="bar"><i style="width:${clamp((v / mx) * 100, 0, 100)}%;background:${col}"></i></div>`;
function camPanelEj(dis) {
  const ej = camSel != null ? camEj(camSel) : null;
  if (!ej) return "";
  const p = camProv(ej),
    mio = isMe(ej.f),
    g = camGen(ej),
    mx = camMovMax(ej),
    as = ej.asd != null ? camAsedio(ej.asd) : null,
    q = ej.asd != null ? G.P[ej.asd] : null,
    m = camMaq(ej),
    d = dis || !mio,
    b = (act, txt, ok, tit = "") => `<button data-act="cam-${act}" ${d || !ok ? "disabled" : ""} title="${esc(tit)}">${txt}</button>`;
  let h = `<h2 style="color:${CIV[ej.f].c}">${esc(camNombre(ej))}</h2><p class="dim">${CIV[ej.f].n} · ${CAM_ESTADO[ej.est] || ej.est}${p ? ` en ${p.name} (${p.owner === ej.f ? "tierra propia" : CIV[p.owner].s})` : ""} · ${camEstTxt()}</p>`;
  h += `<div class="cam-st"><span>Marcha ${Math.round(ej.mov * 10) / 10}/${mx}</span>${camBarra(ej.mov, mx, "#e8b632")}<span>Víveres ${ej.sum}/${CAM_K.sumMax} estaciones</span>${camBarra(ej.sum, CAM_K.sumMax, ej.sum <= 0 ? "#e0503f" : "#4caf50")}<span>Cansancio ${Math.round(ej.fat)}</span>${camBarra(ej.fat, 100, "#b0763a")}<span>Moral ${Math.round(ej.mor)}</span>${camBarra(ej.mor, 100, "#5a8fd6")}</div>`;
  const ts = Object.keys(ej.u).filter((t) => UN[t] && ej.u[t] > 0);
  h += `<div class="troops">${ts.map((t) => `<div><img src="${icon(ej.f, t)}" alt=""><b>${ej.u[t]}</b>${(CIV[ej.f].un && CIV[ej.f].un[t]) || UN[t].s}</div>`).join("")}</div>`;
  const her = Object.values(ej.her || {}).reduce((a, b) => a + b, 0),
    mq0 = Object.entries(m).filter(([, v]) => v > 0);
  h += `<p class="stats">${camTot(ej.u) * SPU} hombres · fuerza ${pw(camUCampo(ej.u))}${her ? ` · ${her * SPU} heridos en los carros` : ""}${mq0.length ? " · " + mq0.map(([k, v]) => `${v} ${v > 1 ? CAM_MAQ[k].pl : CAM_MAQ[k].n.toLowerCase()}`).join(", ") : ""}${(ej.obra || []).length ? " · construyendo: " + ej.obra.map((o) => `${CAM_MAQ[o.t].n.toLowerCase()} (${o.q} est.)`).join(", ") : ""}</p>`;
  if (mio) {
    const free = family(ME).filter((c) => c.age >= 16 && !genOf(c) && !c.dipReh && !camS().ej.some((e) => e.gen === c.id));
    h += g
      ? `<p>General: <b>${g.n}</b> (mando ${g.ma}) <button data-act="cam-gen:${ej.id}:-1" ${d ? "disabled" : ""}>Retirar</button></p>`
      : free.length
        ? `<div class="g2"><select id="camgsel" aria-label="General del ejército">${free.map((c) => `<option value="${c.id}">${c.n} · mando ${c.ma}</option>`).join("")}</select><button data-act="cam-gen:${ej.id}:s" ${d ? "disabled" : ""}>Dar el mando</button></div>`
        : `<p class="dim">Sin general.</p>`;
  } else if (g) h += `<p>General: <b>${g.n}</b> (mando ${g.ma})</p>`;
  /* asedio */
  if (q && as) {
    const ap = typeof ecoApoyoAsedio === "function" ? ecoApoyoAsedio(q, ej.f) : 0,
      pr = mio ? Math.round(cmbEstimar(camParaBatalla(ej), camGuarnicion(q), camCtxAsalto(ej, q), 6) * 100) : null;
    h += `<h3>Asedio de ${q.name}</h3><p class="stats">${as.n} ${as.n === 1 ? "estación" : "estaciones"} de cerco · víveres de la guarnición: ${as.vi >= 0 ? as.vi + " estaciones" : "¡hambre!"} · moral ${Math.round(as.mo)} · el pueblo ${ap > 0.3 ? "resiste" : ap < -0.3 ? "quiere abrir las puertas" : "duda"}<br>Murallas ${q.walls || 0} → ${camFortEf(q, ej, as)} con tus máquinas${as.brecha ? ` (brecha ${Math.round(as.brecha * 100) / 100})` : ""} · guarnición ${tot(q.u) * SPU} hombres${pr != null ? ` · asalto ≈${pr}%` : ""}</p>`;
  }
  /* flancos: ejércitos junto a la ciudad y asalto conjunto */
  const qc = q || G.P.find((c) => camCiudadCerrada(ej.f, c) && camCheb(c.x, c.y, ej.x, ej.y) === 1),
    part = qc && mio ? camParticipantes(ej, qc) : [];
  if (qc && mio) {
    const fl = camFlancosDe(ej.f, qc);
    h += `<p class="stats">Junto a ${qc.name}: ${fl.ejs.length} ${fl.ejs.length === 1 ? "ejército" : "ejércitos"} · flancos cubiertos ${fl.lados.length}/4${fl.lados.length ? ` (${fl.lados.map((l) => CAM_LADO_N[l]).join(", ")})` : ""}${part.length > 1 ? ` · asalto conjunto ≈${Math.round(camEstimarAsalto(part, qc, 6) * 100)}%` : ""}</p>`;
  }
  if (mio) {
    const ady = G.P.filter((c) => camCiudadCerrada(ej.f, c) && camCheb(c.x, c.y, ej.x, ej.y) <= 1),
      otro = camEjsEn(ej.x, ej.y, ej.id).find((e) => e.f === ej.f);
    h += `<div class="btns">`;
    h += b(`acampar:${ej.id}`, "Acampar", ej.est !== "asedio" && ej.est !== "campamento", "Campamento fortificado: descansa, cura heridos y, en tierra ajena, saquea la comarca");
    if (ej.est === "asedio") {
      h += b(`asaltar:${ej.id}`, "Asaltar", ej.acc !== camClaveEst(), ej.acc === camClaveEst() ? "Ya asaltó esta estación" : "Asalto a las murallas con las máquinas que tengas");
      for (const k in CAM_MAQ) {
        const mo = camPuedeMaq(ej, k);
        h += b(`maq:${ej.id}:${k}`, `${CAM_MAQ[k].n}<small>${OC.textoCoste(camCosteMaq(ME, k))} · ${CAM_MAQ[k].est} est.</small>`, !mo, mo || `Se termina en ${CAM_MAQ[k].est} ${CAM_MAQ[k].est > 1 ? "estaciones" : "estación"}`);
      }
      h += b(`levantar:${ej.id}`, "Levantar el cerco", true);
    } else for (const c of ady) h += b(`asediar:${ej.id}:${c.id}`, `Asediar ${c.name}`, true, "Rodear la ciudad: sus víveres y su moral irán cayendo");
    if (part.length > 1) {
      const k = camLadosDe(part, qc).length;
      h += b(
        `conj:${ej.id}:${qc.id}:${part.slice(1).map((e) => e.id).join(".")}`,
        `Asalto conjunto<small>${part.length} ejércitos · ${k} ${k === 1 ? "flanco" : "flancos"}</small>`,
        ej.acc !== camClaveEst(),
        "Todos los ejércitos junto a la ciudad atacan a la vez; cada flanco más resta murallas y moral a los defensores",
      );
    }
    h += b(`disolver:${ej.id}`, "Disolver", p && p.owner === ej.f, "Las tropas pasan a la guarnición de la provincia (solo en tierra propia)");
    h += b(`dividir:${ej.id}`, "Dividir", camTot(ej.u) > 1, "Separa la mitad en un destacamento");
    if (otro) h += b(`unir:${ej.id}:${otro.id}`, "Unir", true, "Reúne los dos ejércitos de esta casilla");
    h += `<button data-act="cam-desel">Deseleccionar</button></div>`;
    /* mercenarios del campamento vecino */
    if (typeof mercCampoCerca === "function")
      for (const c of mercCampoCerca(ej))
        h += `<h3>${esc(c.nom)}</h3>${mercHtmlCias(c.cias, d, (cia, a) => `camm-k:${ej.id}:${c.id}:${cia.id}.${a}`)}`;
    h += `<p class="note">${ej.mov > 0.5 ? "Clic en una casilla iluminada para marchar; en una ciudad enemiga (roja), para asediarla; en una de tus ciudades, para acuartelarte. Más allá del alcance, la marcha sigue la estación siguiente." : "Este ejército ya no puede marchar esta estación."}${ej.plan ? " Marcha pendiente." : ""}</p>`;
  } else h += `<div class="btns"><button data-act="cam-desel">Cerrar</button></div>`;
  return h;
}
/* sección «Ejército» de la provincia (en provPanel) */
function camSeccionProv(p, dis) {
  if (!p || p.owner !== ME) return "";
  const can = tot(p.u) > 0 && !dis && !camEjsEn(p.x, p.y).some((e) => e.f !== ME),
    gc = G.C[p.gen],
    aqui = camS().ej.filter((e) => e.f === ME && camProv(e) === p),
    as = camAsedio(p.id);
  let h = `<h3>Ejército</h3><div class="g3"><button data-act="cam-formar:${p.id}:1" ${can ? "" : "disabled"}>Formar con todo</button><button data-act="cam-formar:${p.id}:0.5" ${can && tot(p.u) > 1 ? "" : "disabled"}>Con la mitad</button><button data-act="cam-elegir:${p.id}" ${can ? "" : "disabled"}>Elegir tropas…</button></div>`;
  if (as) {
    const sit = camSitiadores(p.id);
    h += `<p class="note">¡${p.name} está sitiada por ${CIV[as.f].s}! ${as.n} estaciones de cerco · víveres ${as.vi >= 0 ? as.vi + " estaciones" : "agotados"}.</p><div class="btns"><button data-act="cam-salida:${p.id}" ${dis || !tot(p.u) || !sit.length ? "disabled" : ""}>Hacer una salida</button></div>`;
  }
  if (aqui.length)
    h += `<div class="btns">${aqui.map((e) => `<button data-act="cam-sel:${e.id}">${esc(camNombre(e))} · ${camTot(e.u)}</button>`).join("")}</div>`;
  h += `<p class="note">${p.tired ? "Estas tropas ya marcharon esta estación: el ejército no podrá moverse hasta la siguiente." : "Fuerza " + Math.round(pw(p.u) * gb(p.gen)) + (gc ? ` · ${gc.n} irá al mando del ejército` : "") + `. Un ejército sale al mapa y marcha por casillas (${CAM_EST[G.estacion].toLowerCase()}).`}</p>`;
  return h;
}
function camModalElegir(p) {
  const ts = TYP.filter((t) => (p.u[t] || 0) > 0);
  modal(
    `Formar un ejército en ${p.name}`,
    `<div class="cam-el">${ts.map((t) => `<label><img src="${icon(ME, t)}" alt="">${CIV[ME].un[t]} <input type="number" min="0" max="${p.u[t]}" value="${p.u[t]}" data-cam-t="${t}"> / ${p.u[t]}</label>`).join("")}</div>${p.gen != null && G.C[p.gen] ? `<label class="cam-el"><input type="checkbox" id="camgen" checked> ${G.C[p.gen].n} va al mando</label>` : ""}`,
    [
      {
        t: "Formar",
        cls: "gold",
        fn: () => {
          const u = {};
          document.querySelectorAll("#modalc [data-cam-t]").forEach((i) => (u[i.dataset.camT] = +i.value || 0));
          const gen = !!document.querySelector("#modalc #camgen")?.checked;
          setTimeout(() => camOrdenUI({ tipo: "formar", f: ME, p: p.id, u, gen }).then((r) => r && r.ok && (camSel = r.ej) && ui()), 0);
        },
      },
      { t: "Cancelar" },
    ],
  );
}
OC.accion("cam", (v) => {
  const [k, a, b2] = v.split(":"),
    id = +a;
  const o = { f: ME };
  if (k === "desel") {
    camSel = null;
    return;
  }
  if (k === "sel") {
    camSel = id;
    const e = camEj(id);
    if (e) centerOn(camPid(e.x, e.y));
    tab = "prov";
    return;
  }
  if (k === "rapido") {
    camS().rapido = !camS().rapido;
    return;
  }
  if (k === "elegir") {
    camModalElegir(G.P[id]);
    return false;
  }
  if (k === "formar") {
    const p = G.P[id],
      u = {};
    for (const t of TYP) u[t] = Math.floor((p.u[t] || 0) * +b2);
    camOrdenUI({ tipo: "formar", f: ME, p: id, u, gen: +b2 >= 1 }).then((r) => {
      if (r && r.ok) camSel = r.ej;
      ui();
    });
    return false;
  }
  if (k === "gen") {
    const c = b2 === "s" ? +($("camgsel") || {}).value : null;
    camOrdenUI({ tipo: "general", f: ME, ej: id, c: b2 === "s" ? c : null });
    return false;
  }
  const map = { acampar: "acampar", asaltar: "asaltar", levantar: "levantar", disolver: "disolver", dividir: "dividir" };
  if (map[k]) camOrdenUI({ ...o, tipo: map[k], ej: id });
  else if (k === "asediar") camOrdenUI({ ...o, tipo: "asediar", ej: id, p: +b2 });
  else if (k === "conj") camOrdenUI({ ...o, tipo: "asaltar", ej: id, p: +b2, con: String(v.split(":")[3] || "").split(".").filter(Boolean).map(Number) });
  else if (k === "maq") camOrdenUI({ ...o, tipo: "construir", ej: id, maq: b2 });
  else if (k === "unir") camOrdenUI({ ...o, tipo: "unir", ej: id, con: +b2 });
  else if (k === "salida") camOrdenUI({ ...o, tipo: "salida", p: id });
  return false;
});
/* ---------- pestaña «Campaña» ---------- */
OC.panel({
  id: "cam",
  titulo: "Campaña",
  orden: 16,
  render: (dis) => {
    const S = camS(),
      mios = S.ej.filter((e) => isMe(e.f)),
      cercos = Object.values(S.as).filter((a) => a.f === ME || (G.P[a.p] && G.P[a.p].owner === ME)),
      ene = S.ej.filter((e) => camGuerra(ME, e.f) && camProv(e) && camProv(e).owner === ME);
    let h = `<h2>Campaña · ${camEstTxt()}</h2><p class="dim">Cada turno es una estación. Los ejércitos marchan por casillas hasta agotar su alcance (la clase más lenta, el general, las calzadas y el invierno lo deciden). La economía y la investigación se cierran al acabar el invierno.</p>`;
    h += `<div class="btns"><button data-act="cam-rapido" title="Sin ejércitos fuera ni cercos, el año pasa de una vez">${S.rapido ? "☑" : "☐"} Estaciones rápidas sin campañas</button></div>`;
    h += `<h3>Tus ejércitos</h3>${mios.length ? `<div class="btns">${mios.map((e) => `<button data-act="cam-sel:${e.id}">${esc(camNombre(e))}<small>${camTot(e.u) * SPU} h. · ${CAM_ESTADO[e.est]} · ${camProv(e)?.name || ""}</small></button>`).join("")}</div>` : `<p class="dim">Ninguno en campaña. Fórmalos desde la provincia (sección Ejército).</p>`}`;
    if (ene.length) h += `<h3>Enemigos en tu tierra</h3><div class="btns">${ene.map((e) => `<button data-act="cam-sel:${e.id}">${esc(camNombre(e))}<small>${CIV[e.f].s} · ${camTot(e.u) * SPU} h. · ${camProv(e).name}</small></button>`).join("")}</div>`;
    if (cercos.length)
      h += `<h3>Asedios</h3>${cercos.map((a) => `<p class="stats">${G.P[a.p].name}: ${a.f === ME ? "lo sitias tú" : "te sitia " + CIV[a.f].s} · ${a.n} estaciones · víveres ${a.vi >= 0 ? a.vi : "agotados"} · moral ${Math.round(a.mo)}</p>`).join("")}`;
    if (typeof mercS === "function") {
      const M = mercS(),
        con = M.con.filter((c) => c.f === ME);
      h += `<h3>Mercenarios</h3>`;
      h += con.length
        ? con
            .map((c) => {
              const n = mercCuenta(ME, c.t);
              return `<div class="cam-merc"><img src="${icon(ME, c.t)}" alt=""><div><b>${esc(c.nom)}</b> <span class="stats">${n * SPU} hombres · ${mercPago(c.t, n)} oro/estación · hasta ${c.hasta}${c.imp ? " · ¡sin cobrar!" : ""}</span><div class="btns"><button data-act="camm-r:${c.t}" ${dis ? "disabled" : ""}>Renovar</button><button data-act="camm-l:${c.t}" ${dis ? "disabled" : ""}>Licenciar</button></div></div></div>`;
            })
            .join("")
        : `<p class="dim">Sin compañías a sueldo. Se contratan llegando con un ejército a un campamento mercenario (tienda dorada del mapa) o en tus ciudades.</p>`;
      h += `<p class="stats">Campamentos: ${M.camp.filter((c) => c.cias.length).map((c) => `${esc(c.nom)} (${G.P[camPid(c.x, c.y)]?.name || "?"})`).join(" · ") || "ninguno"}.</p>`;
    }
    return h;
  },
});
