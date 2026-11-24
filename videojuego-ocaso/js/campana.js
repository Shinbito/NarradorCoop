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
  if (d0 > 0 && typeof camRep === "function") camRep({ k: "bat", x: q.x, y: q.y, fs: [f, old], gana: win ? f : old, lugar: q.name });
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
/* (el dibujo de ejércitos y el botón de fin de estación los hace interfaz.js: ifzCamDibujar, camTextoFin) */
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
  camDibujarEspias(c, now);
  const S = camS(),
    vistos = new Set();
  /* ciudades cercadas (o con ejércitos enemigos en cerco a su lado) */
  for (const a of Object.values(S.as)) {
    const p = G.P[a.p];
    if (!p || !camVeProv(ME, p.id)) continue;
    vistos.add(p.id);
    const ejs = S.ej.filter((e) => e.asd === p.id && camCheb(e.x, e.y, p.x, p.y) === 1 && camTot(e.u) > 0 && camVeEj(ME, e));
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
  /* batalla en conjunto que se prepara: flechas de cada ejército participante hacia el punto de choque
     (color de su pueblo; los candidatos que aún se preguntan, parpadeando) y espadas cruzadas en el centro */
  if (camBatPrep) {
    const bp = camBatPrep,
      punto = { x: bp.x, y: bp.y },
      on = reduce || Math.floor(now / 250) % 2;
    if (performance.now() - bp.t0 > 60000) camBatPrep = null;
    else {
      const ids = [...bp.lados[0], ...bp.lados[1], ...(bp.cand || [])];
      for (const id of ids) {
        const e = camEj(id);
        if (!e || (e.x === bp.x && e.y === bp.y)) continue;
        const cand = (bp.cand || []).includes(id) && !bp.lados.flat().includes(id);
        if (cand && !on) continue;
        camFlecha(c, e, punto, CIV[e.f].c, now, id * 0.17);
      }
      const X = bp.x * T,
        Y = bp.y * T;
      c.fillStyle = "#000";
      c.fillRect(X + 1, Y + 1, 6, 6);
      c.fillStyle = on ? "#fff3b0" : "#ff7a2a";
      for (let k = 0; k < 4; k++) {
        c.fillRect(X + 2 + k, Y + 2 + k, 1, 1);
        c.fillRect(X + 5 - k, Y + 2 + k, 1, 1);
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
  /* niebla: el mapa se ve entero en sombra; lo que no se ve, sin ejércitos ajenos (solo quién manda) */
  const es = camEjsEn(x, y).filter((e) => typeof camVeEj !== "function" || camVeEj(ME, e)),
    sp = typeof camEsps === "function" ? camEsps().filter((s) => s.x === x && s.y === y && camSocio(ME, s.f)) : [];
  if (sp.length && !es.length) return sp.map((s) => `Espía ${s.nom} (${CIV[s.f].s})${s.mis ? " · " + CAM_MIS[s.mis.t].toLowerCase() : ""}`).join(" | ");
  if (es.length)
    return es
      .map((e) => `${camNombre(e)} (${CIV[e.f].s}) · ${camTot(e.u) * SPU} hombres · ${CAM_ESTADO[e.est] || e.est}`)
      .join(" | ");
  const m = typeof mercS === "function" ? mercS().camp.find((c) => c.x === x && c.y === y && c.cias.length) : null;
  if (m && (typeof camVisible !== "function" || camVisible(ME, x, y))) return `${m.nom}: ${m.cias.map((c) => c.nom).join(", ")}`;
  /* provincia que no se ve: solo quién manda en ella */
  const pid = camPid(x, y);
  if (pid >= 0 && typeof camVeProv === "function" && !camVeProv(ME, pid)) {
    const o = G.P[pid].owner;
    return `${G.P[pid].name} · ${CIV[o] ? CIV[o].s : "sin dueño"}`;
  }
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
  /* espía seleccionado: el clic lo mueve (o selecciona otro espía propio) */
  const espSel = camEspSel != null ? camEspPorId(camEspSel) : null,
    espAqui = camEspDe(ME).find((s) => s.x === x && s.y === y);
  if (espSel && isMe(espSel.f) && myTurn() && !G.over) {
    if (espAqui && espAqui !== espSel) camEspSel = espAqui.id;
    else if (espSel.x === x && espSel.y === y) camEspSel = null;
    else if (camPasable(x, y)) camOrdenUI({ tipo: "espiaMover", f: ME, esp: espSel.id, x, y });
    else camEspSel = null;
    ui();
    return true;
  }
  if (espAqui && !camEjsEn(x, y).some((e) => isMe(e.f))) {
    camEspSel = espAqui.id;
    camSel = null;
    if (tab !== "prov") tab = "prov";
    ui();
    return true;
  }
  const aqui0 = camS(),
    aqui = aqui0 && camEjsEn(x, y).filter((e) => typeof camVeEj !== "function" || camVeEj(ME, e)),
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
    h += b(`apoyo:${ej.id}:${ej.apoyo === "nunca" ? "siempre" : "nunca"}`, ej.apoyo === "nunca" ? "No acude a batallas vecinas" : "Acude a batallas vecinas", true, "Si chocan a 1-2 casillas tus ejércitos o los de tus aliados, este se suma a la batalla (se pregunta antes)");
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
    camEspSel = null;
    return;
  }
  /* niebla y espías */
  if (k === "niebla") {
    camS().niebla = !camNieblaOn();
    camTocar();
    return;
  }
  if (k === "esel") {
    camEspSel = id;
    camSel = null;
    const s = camEspPorId(id);
    if (s) centerOn(camPid(s.x, s.y));
    tab = "prov";
    return;
  }
  if (k === "ecrear") {
    camOrdenUI({ tipo: "espia", f: ME, p: id }).then((r) => {
      if (r && r.ok) camEspSel = r.esp;
      ui();
    });
    return false;
  }
  if (k === "eret") {
    camOrdenUI({ tipo: "espiaRetirar", f: ME, esp: id });
    return false;
  }
  if (k === "emis") {
    const ex = String(v.split(":")[3] || ""),
      o2 = { tipo: "mision", f: ME, esp: id, mis: b2 };
    if (ex.startsWith("e")) o2.obj = +ex.slice(1);
    else if (ex) o2.p = +ex;
    camOrdenUI(o2);
    return false;
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
  else if (k === "apoyo") camOrdenUI({ ...o, tipo: "apoyo", ej: id, modo: b2 });
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
      ene = S.ej.filter((e) => camGuerra(ME, e.f) && camProv(e) && camProv(e).owner === ME && camVeEj(ME, e));
    let h = `<h2>Campaña · ${camEstTxt()}</h2><p class="dim">Cada turno es una estación. Los ejércitos marchan por casillas hasta agotar su alcance (la clase más lenta, el general, las calzadas y el invierno lo deciden). La economía y la investigación se cierran al acabar el invierno.</p>`;
    h += `<div class="btns"><button data-act="cam-rapido" title="Sin ejércitos fuera ni cercos, el año pasa de una vez">${S.rapido ? "☑" : "☐"} Estaciones rápidas sin campañas</button><button data-act="cam-niebla" title="Solo ves lo que alcanzan tus provincias, torres, ejércitos y espías">${camNieblaOn() ? "☑" : "☐"} Niebla de guerra</button></div>`;
    const esps = camEspDe(ME);
    h += `<h3>Espías <span class="stats">· ${esps.length}/${camEspMax(ME)}${camMaestro(ME) ? " · maestro: " + camMaestro(ME).n : ""}</span></h3>${esps.length ? `<div class="btns">${esps.map((s) => `<button data-act="cam-esel:${s.id}">${esc(s.nom)}<small>${s.mis ? CAM_MIS[s.mis.t] : "sin misión"} · ${G.P[camPid(s.x, s.y)]?.name || ""}</small></button>`).join("")}</div>` : `<p class="dim">Ninguno. Se reclutan en tus ciudades (sección «Espías»).</p>`}`;
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
              return `<div class="cam-merc"><img src="${icon(ME, c.t)}" alt=""><div><b>${esc(c.nom)}</b> <span class="stats">${n * SPU} hombres · ${mercPago(c.t, n)} oro/estación · hasta ${c.hasta}${c.imp ? " · ¡sin cobrar!" : ""}</span><div class="btns"><button data-act="camm-r:${c.t}" ${dis ? "disabled" : ""}>Renovar</button><button data-act="camm-l:${c.t}" ${dis ? "disabled" : ""}>Licenciar</button><button data-act="camm-a:${c.t}:${c.auto ? 0 : 1}" ${dis ? "disabled" : ""} title="Qué hacer al vencer si no se te puede preguntar (online)">${c.auto ? "☑" : "☐"} Renovar al vencer</button></div></div></div>`;
            })
            .join("")
        : `<p class="dim">Sin compañías a sueldo. Se contratan llegando con un ejército a un campamento mercenario (tienda dorada del mapa) o en tus ciudades.</p>`;
      h += `<p class="stats">Campamentos: ${M.camp.filter((c) => c.cias.length).map((c) => `${esc(c.nom)} (${G.P[camPid(c.x, c.y)]?.name || "?"})`).join(" · ") || "ninguno"}.</p>`;
    }
    return h;
  },
});

/* ======================================================================
   NIEBLA DE GUERRA Y ESPÍAS (sistema Campaña)
   Visibilidad por facción y por estación: provincias propias y aliadas (todas sus casillas y 3 alrededor
   de la ciudad, más con torre de vigilancia), ejércitos (2 casillas, 3 si son mayoría jinetes), espías
   (3, y ven dentro de los bosques); las colinas dan +1. Un ejército en BOSQUE solo se ve a 1 casilla, con
   una torre cerca o con un espía. Lo explorado se recuerda (G.cam.exp[f], bits en base64) con la última
   noticia de cada ciudad (G.cam.mem[f][pid] = [dueño, levas, murallas, año, estación]).
   API: camVisible(f, x, y) · camExplorado(f, x, y) · camVeProv(f, pid) · camVeEj(f, ej) · camMemProv(f, pid).
   ====================================================================== */
const CAM_VIS = { ciudad: 3, torre: 2, ej: 2, cab: 3, colina: 1, espia: 3 };
/* nivel de la torre de vigilancia de una ciudad (tecnología: tecVision; si no, p.torre) */
const camTorre = (p) => (typeof tecVision === "function" ? tecVision(p) : Math.max(0, Math.min(3, +p.torre || 0)));
const camNieblaOn = () => !!(G && G.cam && G.cam.niebla !== false);
function camB64(bits) {
  const by = new Uint8Array(Math.ceil(bits.length / 8));
  for (let i = 0; i < bits.length; i++) if (bits[i]) by[i >> 3] |= 1 << (i & 7);
  let s = "";
  for (let i = 0; i < by.length; i++) s += String.fromCharCode(by[i]);
  return btoa(s);
}
function camDeB64(str, n) {
  const out = new Uint8Array(n);
  let s = "";
  try {
    s = atob(str || "");
  } catch (_) {}
  for (let i = 0; i < n; i++) out[i] = (s.charCodeAt(i >> 3) >> (i & 7)) & 1;
  return out;
}
/* casillas de cada provincia (por mapa) */
let camProvCasC = null;
function camProvCasillas() {
  if (camProvCasC && camProvCasC.seed === MAP.seed && camProvCasC.n === W * H && camProvCasC.l.length === G.P.length) return camProvCasC.l;
  const l = G.P.map(() => []);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (MAP.grid[y][x] >= 0 && l[MAP.grid[y][x]]) l[MAP.grid[y][x]].push(y * W + x);
  camProvCasC = { seed: MAP.seed, n: W * H, l };
  return l;
}
const camSocio = (f, o) => f === o || (f < NF && o < NF && camAliado(f, o));
const camExpC = {};
function camExpArr(f) {
  const S = camS(),
    N = W * H;
  S.exp = S.exp || {};
  const s = S.exp[f] || "";
  if (!camExpC[f] || camExpC[f].s !== s || camExpC[f].a.length !== N) camExpC[f] = { s, a: camDeB64(s, N) };
  return camExpC[f].a;
}
let camVisC = {};
function camVisMapa(f) {
  const S = camS(),
    esp = S.esp || [],
    k = `${camVer}|${G.year}|${G.estacion}|${esp.map((s) => s.x * 97 + s.y + (s.mis ? 1 : 0)).join(",")}|${G.P.reduce((s, p, i) => s + (p.owner + 1) * (i + 7) + camTorre(p) * 1000, 0)}|${W}x${H}`;
  if (camVisC[f] && camVisC[f].k === k) return camVisC[f];
  const N = W * H,
    vis = new Uint8Array(N),
    hondo = new Uint8Array(N),
    disc = (x0, y0, r, h) => {
      if (MAP.terr[y0] && MAP.terr[y0][x0] === 3) r += CAM_VIS.colina;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const x = x0 + dx,
            y = y0 + dy;
          if (x < 0 || y < 0 || x >= W || y >= H || dx * dx + dy * dy > r * r + r) continue;
          const i = y * W + x;
          vis[i] = 1;
          if (h === true || Math.max(Math.abs(dx), Math.abs(dy)) <= (h || 0)) hondo[i] = 1;
        }
    },
    cas = camProvCasillas();
  for (const p of G.P) {
    if (!camSocio(f, p.owner)) continue;
    for (const i of cas[p.id] || []) vis[i] = 1;
    disc(p.x, p.y, CAM_VIS.ciudad + CAM_VIS.torre * camTorre(p), 1 + camTorre(p));
  }
  for (const e of S.ej) {
    if (!camSocio(f, e.f) || camTot(e.u) <= 0) continue;
    const cab = Object.keys(e.u).reduce((s, t) => s + (UN[t] && UN[t].cl === "cab" ? e.u[t] || 0 : 0), 0);
    disc(e.x, e.y, cab * 2 > camTot(e.u) ? CAM_VIS.cab : CAM_VIS.ej, 1);
  }
  for (const s of esp) {
    if (!camSocio(f, s.f)) continue;
    disc(s.x, s.y, CAM_VIS.espia, true);
    /* vigilancia: el espía ve toda la provincia que vigila, también dentro de los bosques */
    if (s.mis && s.mis.t === "vigilar" && G.P[s.mis.p] && camCheb(s.x, s.y, G.P[s.mis.p].x, G.P[s.mis.p].y) <= 1)
      for (const i of cas[s.mis.p] || []) vis[i] = hondo[i] = 1;
  }
  const r = { k, vis, hondo };
  camVisC[f] = r;
  if (f < NF && S.niebla !== false) camExplorar(f, vis);
  return r;
}
/* lo visto pasa a explorado y deja la última noticia de cada ciudad */
function camExplorar(f, vis) {
  const S = camS(),
    a = camExpArr(f);
  let nuevo = false;
  for (let i = 0; i < a.length; i++)
    if (vis[i] && !a[i]) {
      a[i] = 1;
      nuevo = true;
    }
  if (nuevo) {
    S.exp[f] = camB64(a);
    camExpC[f].s = S.exp[f];
  }
  S.mem = S.mem || {};
  const m = (S.mem[f] = S.mem[f] || {});
  for (const p of G.P) if (vis[camIdx(p.x, p.y)]) m[p.id] = [p.owner, tot(p.u), p.walls || 0, G.year, G.estacion];
}
function camVisible(f, x, y) {
  if (!camNieblaOn() || f == null || f >= NF) return true;
  return !!camVisMapa(f).vis[camIdx(x, y)];
}
function camExplorado(f, x, y) {
  if (!camNieblaOn() || f == null || f >= NF) return true;
  return !!(camVisMapa(f) && camExpArr(f)[camIdx(x, y)]);
}
function camVeProv(f, pid) {
  const p = G.P[pid];
  if (!p || !camNieblaOn() || f == null || f >= NF || camSocio(f, p.owner)) return true;
  return !!camVisMapa(f).vis[camIdx(p.x, p.y)];
}
function camVeEj(f, e) {
  if (!e || !camNieblaOn() || f == null || f >= NF || camSocio(f, e.f)) return true;
  const V = camVisMapa(f),
    i = camIdx(e.x, e.y);
  return !!(V.hondo[i] || (V.vis[i] && !camEsBosque(e.x, e.y)));
}
/* última noticia de una ciudad: {o, n, w, y, e, vista} (la real si se ve) */
function camMemProv(f, pid) {
  const p = G.P[pid];
  if (!p) return null;
  if (camVeProv(f, pid)) return { o: p.owner, n: tot(p.u), w: p.walls || 0, y: G.year, e: G.estacion, vista: true };
  const m = (camS().mem || {})[f],
    r = m && m[pid];
  return r ? { o: r[0], n: r[1], w: r[2], y: r[3], e: r[4], vista: false } : null;
}
/* para economía (ecoInfoVisible) y para la IA: lo que f sabe de la guarnición de q */
const camInfoVisible = (p, f) => camVeProv(f, p.id);
function camInfoCiudad(f, q) {
  const m = camMemProv(f, q.id);
  if (m && m.vista) return { u: { ...q.u }, walls: q.walls || 0, vista: true };
  const n = m ? m.n : 5,
    w = m ? m.w : q.cap ? 1 : 0;
  return { u: { ...cmbVacio(), i: Math.max(0, Math.round(n * 0.7)), a: Math.round(n * 0.3) }, walls: w, vista: false };
}
const camProvOculta = (p) => camNieblaOn() && p && p.owner !== ME && !camVeProv(ME, p.id);
function camPanelNiebla(p, dis) {
  /* niebla: se sabe quién manda en cada ciudad, nada más (ni tropas ni murallas) */
  const o = CIV[p.owner];
  return `<h2>${p.name}</h2><p class="dim">${o ? `Aquí manda ${o.n}.` : "Sin dueño."} No sabes cuántos la guardan ni qué ejércitos hay cerca.</p><p class="note">Para saber más: acerca un ejército, levanta una torre de vigilancia en una ciudad cercana o envía un espía (sección «Espías» de tus ciudades).</p>${camNieblaEspiasCerca(p, dis)}`;
}
/* ---------- dibujo de la niebla (capa cacheada; la llama ifzCamDibujar al principio, marcada CAM) ---------- */
let camNieblaC = { cv: null, k: "" };
function camDibujarNiebla(c, now) {
  if (!G || !MAP || !camNieblaOn() || ME == null || ME >= NF) return;
  const V = camVisMapa(ME),
    exp = camExpArr(ME),
    m = (camS().mem || {})[ME] || {},
    k = `${V.k}|${ME}|${((camS().exp || {})[ME] || "").length}|${JSON.stringify(m).length}`;
  if (camNieblaC.k !== k || !camNieblaC.cv) {
    const cc = camNieblaC.cv || (camNieblaC.cv = document.createElement("canvas"));
    cc.width = W * T;
    cc.height = H * T;
    const x = cc.getContext("2d");
    x.clearRect(0, 0, cc.width, cc.height);
    for (let i = 0; i < W * H; i++) {
      if (V.vis[i]) continue;
      const X = (i % W) * T,
        Y = Math.floor(i / W) * T;
      if (!exp[i]) {
        x.fillStyle = (i * 7919) % 5 ? "#151a1f" : "#1b2128";
        x.fillRect(X, Y, T, T);
        continue;
      }
      /* explorado y no visible: el terreno, el color del último dueño conocido y un velo */
      x.drawImage(base, X, Y, T, T, X, Y, T, T);
      const pid = MAP.grid[Math.floor(i / W)][i % W],
        mo = pid >= 0 && m[pid] ? m[pid][0] : null;
      if (mo != null && CIV[mo]) {
        x.globalAlpha = 0.22;
        x.fillStyle = CIV[mo].c;
        x.fillRect(X, Y, T, T);
      }
      x.globalAlpha = 0.42;
      x.fillStyle = "#0c1014";
      x.fillRect(X, Y, T, T);
      x.globalAlpha = 1;
    }
    /* ciudades exploradas no vistas: su último dueño y sus últimas levas conocidas */
    for (const p of G.P) {
      const i = camIdx(p.x, p.y);
      if (V.vis[i] || !exp[i]) continue;
      const r = m[p.id],
        cx = p.x * T + 4,
        cy = p.y * T + 4;
      if (!r) continue;
      const o = r[0];
      if (p.cap) spr(x, SP.castle, cx - 5, cy - 7, PAL[o] || PAL[0]);
      else spr(x, SP.town, cx - 4, cy - 4, PAL[o] || PAL[0]);
      if (r[1] && typeof ifzInsignia === "function" && CIV[o]) {
        x.globalAlpha = 0.75;
        x.drawImage(ifzInsignia(r[1], CIV[o].c, "#c9c2b4"), cx + 6, cy - 4);
        x.globalAlpha = 1;
      }
    }
    camNieblaC.k = k;
  }
  c.drawImage(camNieblaC.cv, 0, 0);
}

/* ---------- espías: G.cam.esp = [{id, f, x, y, cal, mov, mis:{t, p?, ej?}, nom, plan}] ---------- */
const CAM_ESP = { coste: 30, costeMaestro: 20, mov: 14, robo: 0.5, soborno: 0.6, sabotaje: 1, revuelta: 0.8 };
const CAM_MIS = {
  vigilar: "Vigilar",
  sabotear: "Sabotear",
  sobornar: "Sobornar la guarnición",
  robar: "Robar una técnica",
  revuelta: "Incitar una revuelta",
  contra: "Contraespionaje",
};
let camEspSel = null;
const camEsps = () => (camS().esp = camS().esp || []);
const camEspDe = (f) => camEsps().filter((s) => s.f === f);
const camEspPorId = (id) => camEsps().find((s) => s.id === id) || null;
const camMaestro = (f) => (f < NF && typeof socCargo === "function" ? socCargo(f, "esp") : null);
function camIntriga(f) {
  const m = camMaestro(f);
  if (m) return m.in;
  const r = f < NF && G.F[f] ? G.C[G.F[f].ruler] : null;
  return r ? r.in * 0.6 : 2;
}
const camEspMax = (f) => 1 + Math.floor(owned(f).length / 5) + (camMaestro(f) ? 1 : 0);
const camEspCoste = (f) => (camMaestro(f) ? CAM_ESP.costeMaestro : CAM_ESP.coste);
/* contraespionaje de quien manda en (x, y): su maestro de espías, sus torres y sus espías de guardia */
function camContra(o, x, y) {
  if (o == null || o >= NF) return 2;
  let v = camIntriga(o);
  for (const p of owned(o)) if (camTorre(p) > 0 && camCheb(p.x, p.y, x, y) <= 4) v += 1.5 * camTorre(p);
  for (const s of camEspDe(o)) if (s.mis && s.mis.t === "contra" && camCheb(s.x, s.y, x, y) <= 3) v += 2;
  return v;
}
function camEspCrear(f, p) {
  if (!p || p.owner !== f) return { ok: false, motivo: "Solo en una ciudad propia" };
  if (camEspDe(f).length >= camEspMax(f)) return { ok: false, motivo: `Máximo ${camEspMax(f)} espías` };
  const c = camEspCoste(f);
  if (!OC.pagar(f, { oro: c })) return { ok: false, motivo: `Faltan ${c} de oro` };
  const S = camS(),
    noms = ["Sombra", "Zorro", "Mercader", "Peregrino", "Juglar", "Liberto", "Copista", "Arriero", "Viuda", "Monje"],
    s = {
      id: (S.espSig = (S.espSig || 0) + 1),
      f,
      x: p.x,
      y: p.y,
      cal: Math.round(clamp(2 + camIntriga(f) * 0.7 + R() * 2, 1, 10) * 10) / 10,
      mov: CAM_ESP.mov,
      mis: null,
      nom: `«${pick(noms)}»`,
      plan: null,
    };
  camEsps().push(s);
  camTocar();
  if (isMe(f)) addLog(`Un espía, ${s.nom}, sale de ${p.name} (destreza ${s.cal}).`, "good");
  return { ok: true, esp: s.id };
}
/* casilla de tierra más cercana a (x, y) */
function camTierraCerca(x, y) {
  for (let r = 0; r < 4; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const a = x + dx,
          b = y + dy;
        if (a >= 0 && b >= 0 && a < W && b < H && camPasable(a, b)) return [a, b];
      }
  return null;
}
/* el espía va en línea recta, rápido, sin bloquear ni ser bloqueado; lo que no alcanza queda en plan */
function camEspMover(s, x, y) {
  const d = camCheb(s.x, s.y, x, y);
  if (!d) return { ok: true };
  if (s.mov <= 0.5) {
    s.plan = [x, y];
    return { ok: true, plan: true };
  }
  let nx = x,
    ny = y;
  if (d > s.mov) {
    const k = s.mov / d;
    nx = Math.round(s.x + (x - s.x) * k);
    ny = Math.round(s.y + (y - s.y) * k);
  }
  const t = camTierraCerca(nx, ny);
  if (!t) return { ok: false, motivo: "No hay tierra allí" };
  const x0 = s.x,
    y0 = s.y;
  s.mov = Math.max(0, s.mov - camCheb(s.x, s.y, t[0], t[1]));
  s.x = t[0];
  s.y = t[1];
  s.plan = t[0] === x && t[1] === y ? null : [x, y];
  camRep({ k: "esp", esp: s.id, f: s.f, de: [x0, y0], a: [s.x, s.y] });
  camTocar();
  return { ok: true };
}
/* objetivo junto al espía: ciudad a 1 casilla, o ejército ajeno con máquinas u obras a 1 casilla */
const camEspCiudad = (s) => G.P.find((p) => camCheb(p.x, p.y, s.x, s.y) <= 1) || null;
const camEspEjercito = (s) =>
  camS().ej.find((e) => e.f !== s.f && camCheb(e.x, e.y, s.x, s.y) <= 1 && (camMaqTot(e) > 0 || (e.obra || []).length)) || null;
function camRobable(f, o) {
  if (o == null || o >= NF || f >= NF || typeof tecF !== "function" || !G.tec) return [];
  try {
    return tecF(o).h.filter((id) => !tecTiene(f, id) && (typeof tecDisponible !== "function" || tecDisponible(f, id)));
  } catch (_) {
    return [];
  }
}
function camEspMision(s, t, o = {}) {
  if (!CAM_MIS[t]) return { ok: false, motivo: "Misión desconocida" };
  if (t === "contra") {
    const q = G.P[camPid(s.x, s.y)];
    if (!q || q.owner !== s.f) return { ok: false, motivo: "El contraespionaje se hace en tierra propia" };
    s.mis = { t };
    camTocar();
    return { ok: true };
  }
  if (t === "sabotear" && o.obj != null) {
    const e = camEj(+o.obj);
    if (!e || camCheb(e.x, e.y, s.x, s.y) > 1) return { ok: false, motivo: "Hay que llegar junto al ejército" };
    s.mis = { t, ej: e.id };
    return { ok: true };
  }
  const p = o.p != null ? G.P[+o.p] : camEspCiudad(s);
  if (!p || camCheb(p.x, p.y, s.x, s.y) > 1) return { ok: false, motivo: "Hay que llegar junto a la ciudad" };
  if (p.owner === s.f) return { ok: false, motivo: "Es tu ciudad" };
  if (t === "sobornar") {
    const as = camAsedio(p.id);
    if (!as || !camCoCerco(as, s.f)) return { ok: false, motivo: "Solo una ciudad que cercas tú o tus socios" };
  }
  if (t === "robar" && !camRobable(s.f, p.owner).length) return { ok: false, motivo: "No saben nada que tú no sepas" };
  s.mis = { t, p: p.id };
  camTocar();
  return { ok: true };
}
async function camEspOrden(o) {
  const f = o.f;
  if (o.tipo === "espia") return camEspCrear(f, G.P[o.p]);
  const s = camEspPorId(+o.esp);
  if (!s || s.f !== f) return { ok: false, motivo: "Espía desconocido" };
  if (o.tipo === "espiaMover") return camEspMover(s, +o.x, +o.y);
  if (o.tipo === "mision") return camEspMision(s, o.mis, o);
  if (o.tipo === "espiaRetirar") {
    camS().esp = camEsps().filter((x) => x !== s);
    if (camEspSel === s.id) camEspSel = null;
    camTocar();
    return { ok: true };
  }
  return { ok: false, motivo: "Orden desconocida" };
}
/* espía descubierto: preso, agravio (casus belli) y peor relación */
function camEspCaptura(s, o, por) {
  camS().esp = camEsps().filter((x) => x !== s);
  if (camEspSel === s.id) camEspSel = null;
  if (o != null && o < NF && s.f < NF && o !== s.f) {
    if (typeof dipMem === "function" && G.dip) dipMem(o, s.f, "espias", "Espías descubiertos", -8, 1, 30);
    else relAdd(o, s.f, -8);
    if (typeof dipAgravio === "function" && G.dip) dipAgravio(o, s.f, `Espías de ${CIV[s.f].s}`, 3);
  }
  addLog(
    isMe(s.f)
      ? `Tu espía ${s.nom} cae en manos de ${CIV[o] ? CIV[o].s : "sus enemigos"}${por ? " " + por : ""}.`
      : isMe(o)
        ? `Tus guardias apresan a un espía de ${CIV[s.f].s}${por ? " " + por : ""}: tienes un agravio contra ellos.`
        : `${CIV[o] ? CIV[o].s : "?"} apresa a un espía de ${CIV[s.f].s}.`,
    isMe(s.f) ? "bad" : isMe(o) ? "good" : "",
  );
  camRep({ k: "esp-", esp: s.id, f: s.f });
  camTocar();
}
/* resolución de la misión de un espía (si sigue junto al objetivo); devuelve true si sale bien */
function camEspResolver(s) {
  const m = s.mis,
    p = m.p != null ? G.P[m.p] : null,
    e = m.ej != null ? camEj(m.ej) : null,
    dueno = p ? p.owner : e ? e.f : null,
    cerca = p ? camCheb(p.x, p.y, s.x, s.y) <= 1 : e ? camCheb(e.x, e.y, s.x, s.y) <= 1 : false,
    dif = CAM_ESP[{ sabotear: "sabotaje", sobornar: "soborno", robar: "robo", revuelta: "revuelta" }[m.t]] || 1,
    pr = clamp(0.35 + (s.cal - camContra(dueno, s.x, s.y)) * 0.06, 0.1, 0.85) * dif;
  if (!cerca) return { cerca: false };
  s.mis = null;
  if (R() >= pr) return { cerca: true, exito: false };
  let txt = "";
  if (m.t === "sabotear" && e) {
    const n = (e.obra || []).length + camMaqTot(e);
    e.obra = [];
    for (const k in CAM_MAQ) {
      if (e.u && e.u[k]) e.u[k] = Math.floor(e.u[k] / 2);
      if (e.maq && e.maq[k]) e.maq[k] = Math.floor(e.maq[k] / 2);
    }
    txt = `quema ${n ? "las máquinas y obras" : "los pertrechos"} de ${camNombre(e)}`;
  } else if (m.t === "sabotear" && p) {
    const as = camAsedio(p.id);
    if (as) as.brecha = Math.min(p.walls || 0, (as.brecha || 0) + 0.5);
    else {
      p.order = clamp(p.order - 6, 0, 100);
      if (camF(p.owner)) camF(p.owner).food = Math.max(0, Math.round(camF(p.owner).food * 0.9));
    }
    txt = as ? `abre una brecha en las murallas de ${p.name}` : `incendia los graneros de ${p.name}`;
  } else if (m.t === "sobornar" && p) {
    const as = camAsedio(p.id),
      ap = typeof ecoApoyoAsedio === "function" ? ecoApoyoAsedio(p, s.f) : 0,
      precio = 20 + tot(p.u) * 2,
      sit = as ? camSitiadores(p.id).filter((x) => x.f === as.f).sort((a, b) => pw(b.u) - pw(a.u))[0] || camSitiadores(p.id)[0] : null;
    if (!sit || R() >= clamp(0.6 - ap * 0.3, 0.2, 0.95) || !OC.pagar(s.f, { oro: precio })) return { cerca: true, exito: false };
    txt = `compra a la guardia de ${p.name} (${precio} de oro): abren las puertas`;
    camConquistar(p, sit, "rendicion", null, 0);
  } else if (m.t === "robar" && p) {
    const l = camRobable(s.f, p.owner);
    if (!l.length || typeof tecAprender !== "function") return { cerca: true, exito: false };
    const id = pick(l);
    tecAprender(s.f, id);
    txt = `roba el secreto de «${typeof TEC !== "undefined" && TEC[id] ? TEC[id].n : id}»`;
  } else if (m.t === "revuelta" && p) {
    p.order = clamp(p.order - 15, 0, 100);
    txt = `agita a la plebe de ${p.name}`;
  }
  if (txt && (isMe(s.f) || isMe(dueno))) addLog(isMe(s.f) ? `Tu espía ${s.nom} ${txt}.` : `Un espía de ${CIV[s.f].s} ${txt}.`, isMe(s.f) ? "good" : "bad");
  return { cerca: true, exito: !!txt };
}
/* cada estación (desde camEstacion): misiones, descubrimiento y contraespionaje */
async function camEspias() {
  for (const s of camEsps().slice()) {
    if (!camEsps().includes(s)) continue;
    if (s.f < NF && !alive(s.f)) {
      camS().esp = camEsps().filter((x) => x !== s);
      continue;
    }
    const pid = camPid(s.x, s.y),
      o = pid >= 0 ? G.P[pid].owner : null,
      ajena = o != null && !camSocio(s.f, o),
      hostil = s.mis && s.mis.t !== "vigilar" && s.mis.t !== "contra";
    let det = ajena ? clamp(0.05 + (camContra(o, s.x, s.y) - s.cal) * 0.03 + (hostil ? 0.08 : 0), 0.02, 0.6) : 0;
    if (hostil) {
      const r = camEspResolver(s);
      if (r.cerca && !r.exito) det += 0.12;
    }
    if (ajena && R() < det) camEspCaptura(s, o, "en " + G.P[pid].name);
  }
  for (const s of camEsps().slice()) {
    if (!s.mis || s.mis.t !== "contra") continue;
    for (const x of camEsps().slice())
      if (x.f !== s.f && !camSocio(s.f, x.f) && camCheb(x.x, x.y, s.x, s.y) <= 3 && R() < clamp(0.2 + (s.cal - x.cal) * 0.05, 0.05, 0.7))
        camEspCaptura(x, s.f, "por tus agentes");
  }
}
function camEspNuevaEstacion() {
  for (const s of camEsps()) {
    s.mov = CAM_ESP.mov;
    if (s.plan && human(s.f)) camEspMover(s, s.plan[0], s.plan[1]);
  }
}
/* IA: espías para vigilar al enemigo, sobornar sus cercos largos, robar técnicas e incitar revueltas */
function camEspIA(f) {
  const F = camF(f);
  if (!F || f >= NF) return;
  const guerras = [...Array(NF).keys()].filter((g) => g !== f && alive(g) && camGuerra(f, g)),
    mios = camEspDe(f);
  if (mios.length < camEspMax(f) && F.gold > 70 + camEspCoste(f) && (guerras.length || F.gold > 220)) {
    const fr = owned(f).filter((p) => foes(p, f).length).sort((a, b) => b.order - a.order)[0];
    if (fr) camEspCrear(f, fr);
  }
  for (const s of camEspDe(f)) {
    if (s.mis && s.mis.t !== "vigilar") continue;
    const cerco = Object.values(camS().as).find((a) => a.f === f && a.n >= 2);
    let q = cerco ? G.P[cerco.p] : null,
      t = q && F.gold > 40 + tot(q.u) * 2 ? "sobornar" : null;
    if (!t) {
      q = G.P.filter((p) => p.owner !== f && p.owner < NF && guerras.includes(p.owner)).sort(
        (a, b) => camCheb(a.x, a.y, s.x, s.y) - camCheb(b.x, b.y, s.x, s.y),
      )[0];
      if (!q) continue;
      t = camRobable(f, q.owner).length && R() < 0.35 ? "robar" : R() < 0.25 ? "revuelta" : "vigilar";
    }
    if (camCheb(q.x, q.y, s.x, s.y) > 1) {
      const v = CAM_V8.map(([dx, dy]) => [q.x + dx, q.y + dy]).find(([x, y]) => camPasable(x, y));
      if (v) camEspMover(s, v[0], v[1]);
    }
    if (camCheb(q.x, q.y, s.x, s.y) <= 1) camEspMision(s, t, { p: q.id });
  }
}
/* ---------- interfaz de los espías ---------- */
function camDibujarEspias(c, now) {
  for (const s of camEsps()) {
    const mio = camSocio(ME, s.f);
    if (!mio && camNieblaOn() && !camVisMapa(ME).hondo[camIdx(s.x, s.y)]) continue;
    const X = s.x * T + 1,
      Y = s.y * T + 1;
    c.fillStyle = "#000";
    c.fillRect(X + 1, Y, 5, 7);
    c.fillStyle = mio ? "#3a3550" : "#5a2a2a";
    c.fillRect(X + 2, Y + 1, 3, 5);
    c.fillStyle = CIV[s.f] ? CIV[s.f].c : "#fff";
    c.fillRect(X + 2, Y + 1, 3, 1);
    c.fillStyle = "#e3b48a";
    c.fillRect(X + 3, Y + 2, 1, 1);
    if (s.mis) {
      c.fillStyle = s.mis.t === "vigilar" || s.mis.t === "contra" ? "#c9a8ff" : "#ff7a2a";
      c.fillRect(X + 5, Y - 1, 2, 2);
    }
    if (s.id === camEspSel && (reduce || Math.floor(now / 350) % 2)) {
      c.strokeStyle = "#c9a8ff";
      c.lineWidth = 1;
      c.strokeRect(s.x * T + 0.5, s.y * T + 0.5, T - 1, T - 1);
    }
  }
}
function camNieblaEspiasCerca(p, dis) {
  const l = camEspDe(ME).filter((s) => camCheb(s.x, s.y, p.x, p.y) <= 1);
  return l.length ? `<div class="btns">${l.map((s) => `<button data-act="cam-esel:${s.id}">Espía ${esc(s.nom)}</button>`).join("")}</div>` : "";
}
function camPanelEsp(dis) {
  const s = camEspPorId(camEspSel);
  if (!s) return "";
  const p = camEspCiudad(s),
    e = camEspEjercito(s),
    q = G.P[camPid(s.x, s.y)],
    b = (mis, txt, ok, tit, extra = "") => `<button data-act="cam-emis:${s.id}:${mis}${extra}" ${dis || !ok ? "disabled" : ""} title="${esc(tit || "")}">${txt}</button>`;
  let h = `<h2 style="color:#c9a8ff">Espía ${esc(s.nom)}</h2><p class="dim">${CIV[s.f].n} · destreza ${s.cal} · en ${q ? q.name : "despoblado"}${q && q.owner !== s.f ? ` (${CIV[q.owner].s})` : ""}<br>Marcha ${s.mov}/${CAM_ESP.mov} · ${s.mis ? "misión: " + CAM_MIS[s.mis.t].toLowerCase() + (s.mis.p != null ? " en " + G.P[s.mis.p].name : "") : "sin misión"}${s.plan ? " · de camino" : ""}</p>`;
  if (q && !camSocio(s.f, q.owner)) {
    const det = clamp(0.05 + (camContra(q.owner, s.x, s.y) - s.cal) * 0.03, 0.02, 0.6);
    h += `<p class="stats">Riesgo de ser descubierto cada estación: ≈${Math.round(det * 100)} % (más si actúa).</p>`;
  }
  h += `<div class="btns">`;
  if (p && p.owner !== s.f) {
    const ex = `:${p.id}`,
      pr = Math.round(clamp(0.35 + (s.cal - camContra(p.owner, s.x, s.y)) * 0.06, 0.1, 0.85) * 100),
      as = camAsedio(p.id);
    h += b("vigilar", `Vigilar ${p.name}`, true, "Mientras esté allí ves toda la provincia, también lo que esconden sus bosques", ex);
    h += b("sabotear", `Sabotear ${p.name}<small>≈${pr} %</small>`, true, "Abre brecha si está cercada; si no, quema graneros", ex);
    h += b("sobornar", `Sobornar la guardia<small>${20 + tot(p.u) * 2} oro · ≈${Math.round(pr * CAM_ESP.soborno)} %</small>`, !!(as && camCoCerco(as, s.f)), "Solo si la cercas tú o tus socios: abren las puertas", ex);
    h += b("robar", `Robar una técnica<small>≈${Math.round(pr * CAM_ESP.robo)} %</small>`, camRobable(s.f, p.owner).length > 0, "Un secreto que ellos conocen y tú no", ex);
    h += b("revuelta", `Incitar revuelta<small>≈${Math.round(pr * CAM_ESP.revuelta)} %</small>`, true, "Baja el orden de la ciudad", ex);
  }
  if (e) h += b("sabotear", `Sabotear las máquinas de ${esc(camNombre(e))}`, true, "Quema obras y máquinas de asedio", `:e${e.id}`);
  if (q && q.owner === s.f) h += b("contra", "Contraespionaje", true, "Vigila tu tierra: puede apresar espías enemigos a 3 casillas");
  h += `<button data-act="cam-eret:${s.id}" ${dis ? "disabled" : ""}>Retirar</button><button data-act="cam-desel">Cerrar</button></div>`;
  h += `<p class="note">Clic en el mapa para moverlo (hasta ${CAM_ESP.mov} casillas por estación; cruza fronteras y ejércitos). Las misiones se resuelven al acabar la estación, si sigue junto al objetivo.</p>`;
  return h;
}
OC.seccion("prov", {
  id: "espias",
  orden: 47,
  visible: (c) => c.mine,
  render: ({ p }, dis) => {
    const n = camEspDe(ME).length,
      mx = camEspMax(ME),
      c = camEspCoste(ME),
      ma = camMaestro(ME),
      aqui = camEspDe(ME).filter((s) => s.x === p.x && s.y === p.y);
    return `<h3>Espías <span class="stats">· ${n}/${mx}</span></h3><div class="btns"><button data-act="cam-ecrear:${p.id}" ${dis || n >= mx || G.F[ME].gold < c ? "disabled" : ""} title="Su destreza depende de la intriga de ${ma ? "tu maestro de espías" : "tu soberano (nombra un maestro de espías en la Corte)"}">Reclutar espía<small>${c} oro</small></button>${aqui.map((s) => `<button data-act="cam-esel:${s.id}">${esc(s.nom)}</button>`).join("")}</div>${camTorre(p) > 0 ? `<p class="stats">Torre de vigilancia ${camTorre(p)}: ve ${CAM_VIS.ciudad + CAM_VIS.torre * camTorre(p)} casillas y dentro de los bosques cercanos.</p>` : ""}`;
  },
});
