/* ---------- DIPLOMÁTICOS (legados): como los espías, pero para negociar ----------
   Se reclutan en una ciudad propia (sección «Diplomáticos» de la provincia), se mueven por el mapa como los
   espías (DPL.mov casillas por estación, cruzan fronteras y ejércitos) y actúan donde están:
   - En la corte de otro pueblo (a 1 casilla de una de sus ciudades): negociar (paz, alianza, no agresión,
     comercio, paso…: una gestión por estación aparte de la anual de Diplomacia), abrir embajada, y mientras
     esté allí suma DPL.bono × destreza a la aceptación de TODAS tus propuestas a ese pueblo y mejora un poco la
     relación cada estación. En guerra solo negocia la paz y cada estación puede ser apresado.
   - Junto a un campamento de mercenarios: contrata sus compañías sin llevar un ejército, con descuento en el
     enganche (10-30 % según la destreza); las tropas acuden a tu ciudad más cercana.
   Destreza: 2 + 0,7 × diplomacia del canciller (o 0,6 × la del soberano) + azar, de 1 a 10.
   Estado: G.cam.dpl (lista) y G.cam.dplSig. Globales con prefijo dpl / DPL. */
const DPL = { coste: 25, mov: 10, bono: 0.015, rel: 1, apresar: 0.12 };
let dplSel = null;
const dplLista = () => (camS().dpl = camS().dpl || []);
const dplDe = (f) => dplLista().filter((d) => d.f === f);
const dplPorId = (id) => dplLista().find((d) => d.id === id) || null;
const dplCanciller = (f) => (f < NF && typeof socCargo === "function" ? socCargo(f, "can") : null);
const dplMax = (f) => 1 + Math.floor(owned(f).length / 6) + (dplCanciller(f) ? 1 : 0);
function dplHab(f) {
  const c = dplCanciller(f);
  if (c) return c.di;
  const r = f < NF && G.F[f] ? G.C[G.F[f].ruler] : null;
  return r ? r.di * 0.6 : 2;
}
/* el pueblo en cuya corte está (ciudad ajena a 1 casilla) y la ciudad */
function dplCorte(d) {
  const p = G.P.find((q) => q.owner !== d.f && q.owner >= 0 && q.owner < NF && alive(q.owner) && camCheb(q.x, q.y, d.x, d.y) <= 1);
  return p ? { g: p.owner, p } : null;
}
const dplCampo = (d) => (typeof mercS === "function" ? mercS().camp.find((c) => c.cias.length && camCheb(c.x, c.y, d.x, d.y) <= 1) || null : null);
/* legado de f en la corte de g (el de más destreza) */
const dplEnCorte = (f, g) =>
  dplDe(f)
    .filter((d) => {
      const c = dplCorte(d);
      return c && c.g === g;
    })
    .sort((a, b) => b.cal - a.cal)[0] || null;
const dplDescuento = (d) => clamp(0.1 + (d.cal - 3) * 0.03, 0.1, 0.3);

function dplCrear(f, p) {
  if (!p || p.owner !== f) return { ok: false, motivo: "Solo en una ciudad propia" };
  if (dplDe(f).length >= dplMax(f)) return { ok: false, motivo: `Máximo ${dplMax(f)} diplomáticos` };
  if (!OC.pagar(f, { oro: DPL.coste })) return { ok: false, motivo: `Faltan ${DPL.coste} de oro` };
  const S = camS(),
    noms = ["Prisco", "Olimpiodoro", "Casiodoro", "Avito", "Epifanio", "Sidonio", "Sinesio", "Constancio", "Paulino", "Rústico"],
    d = {
      id: (S.dplSig = (S.dplSig || 0) + 1),
      f,
      x: p.x,
      y: p.y,
      cal: Math.round(clamp(2 + dplHab(f) * 0.7 + R() * 2, 1, 10) * 10) / 10,
      mov: DPL.mov,
      nom: pick(noms),
      plan: null,
      gest: -1, // turno de su última gestión
    };
  dplLista().push(d);
  camTocar();
  if (isMe(f)) addLog(`El legado ${d.nom} sale de ${p.name} (destreza ${d.cal}).`, "good");
  return { ok: true, id: d.id };
}
/* se mueve como el espía: en línea recta, rápido; lo que no alcanza queda en plan */
function dplMover(d, x, y) {
  const dist = camCheb(d.x, d.y, x, y);
  if (!dist) return { ok: true };
  if (d.mov <= 0.5) {
    d.plan = [x, y];
    return { ok: true, plan: true };
  }
  let nx = x,
    ny = y;
  if (dist > d.mov) {
    const k = d.mov / dist;
    nx = Math.round(d.x + (x - d.x) * k);
    ny = Math.round(d.y + (y - d.y) * k);
  }
  const t = camTierraCerca(nx, ny);
  if (!t) return { ok: false, motivo: "No hay tierra allí" };
  d.mov = Math.max(0, d.mov - camCheb(d.x, d.y, t[0], t[1]));
  d.x = t[0];
  d.y = t[1];
  d.plan = t[0] === x && t[1] === y ? null : [x, y];
  camTocar();
  return { ok: true };
}
function dplRetirar(d) {
  camS().dpl = dplLista().filter((o) => o !== d);
  if (dplSel === d.id) dplSel = null;
  camTocar();
}
const dplTurno = () => (G.year || 0) * 4 + (G.estacion || 0);
const dplPuedeGestionar = (d) => d.gest !== dplTurno();

/* ---------- negociar en una corte ---------- */
const DPL_TIPOS = ["paz", "alianza", "nag", "comercio", "paso", "rehenes", "vasallaje"];
function dplNegociar(d, tipo) {
  const c = dplCorte(d);
  if (!c || !dplPuedeGestionar(d) || typeof dipModalPropuesta !== "function") return;
  if (G.st[d.f][c.g] === "guerra" && tipo !== "paz") return;
  /* la gestión del legado no gasta la anual de Diplomacia */
  const F = G.F[d.f],
    antes = F.dip[c.g];
  F.dip[c.g] = 0;
  d.gest = dplTurno();
  d.negoc = { g: c.g, antes };
  dipModalPropuesta(c.g, tipo);
}
function dplEmbajada(d) {
  const c = dplCorte(d);
  if (!c || !dplPuedeGestionar(d) || typeof dipEmbajada !== "function") return;
  if ((dipS().emb[d.f + ">" + c.g] || 0) >= G.year) return;
  d.gest = dplTurno();
  dipEmbajada(d.f, c.g);
  camTocar();
}
/* ---------- mercenarios ---------- */
function dplContratar(d, campId, ciaId, anos) {
  const M = mercS(),
    c = M.camp.find((x) => x.id === campId),
    f = d.f;
  if (!c || camCheb(c.x, c.y, d.x, d.y) > 1) return { ok: false, motivo: "El campamento está lejos" };
  const cia = c.cias.find((x) => x.id === ciaId);
  if (!cia) return { ok: false, motivo: "La compañía ya no está" };
  const enganche = Math.ceil(mercEnganche(cia) * (1 - dplDescuento(d))),
    pago = mercPago(cia.t, cia.n);
  if (G.F[f].gold < enganche + pago) return { ok: false, motivo: `Faltan ${enganche + pago - Math.floor(G.F[f].gold)} de oro` };
  /* las tropas acuden a la ciudad propia más cercana que no esté sitiada */
  const dest = owned(f)
    .filter((p) => !camAsedio(p.id))
    .sort((a, b) => camCheb(a.x, a.y, c.x, c.y) - camCheb(b.x, b.y, c.x, c.y))[0];
  if (!dest) return { ok: false, motivo: "No tienes una ciudad libre donde recibirlas" };
  OC.pagar(f, { oro: enganche });
  mercFirmar(f, cia, clamp(+anos || 2, 1, 3));
  c.cias = c.cias.filter((x) => x !== cia);
  cmbLlega(dest, { [cia.t]: cia.n }, { [cia.t]: MERC_K.vet }, {});
  addLog(
    isMe(f)
      ? `El legado ${d.nom} contrata a los ${cia.nom} (${cia.n * SPU} hombres) con un ${Math.round(dplDescuento(d) * 100)} % de rebaja: acuden a ${dest.name}.`
      : `${CIV[f].s} contrata a los ${cia.nom}.`,
    isMe(f) ? "good" : "",
  );
  camTocar();
  return { ok: true };
}

/* ---------- cada estación: marcha pendiente, estancia en la corte y riesgo en guerra ---------- */
function dplNuevaEstacion() {
  for (const d of dplLista().slice()) {
    d.mov = DPL.mov;
    if (d.plan) dplMover(d, d.plan[0], d.plan[1]);
    const c = dplCorte(d);
    if (!c) continue;
    if (G.st[d.f][c.g] === "guerra") {
      if (R() < DPL.apresar) {
        dplRetirar(d);
        if (isMe(d.f)) addLog(`${CIV[c.g].s} apresa a tu legado ${d.nom} en ${c.p.name}.`, "bad");
        else if (isMe(c.g)) addLog(`Apresas al legado ${d.nom} de ${CIV[d.f].s}.`, "good");
      }
      continue;
    }
    if (typeof relAdd === "function") relAdd(d.f, c.g, DPL.rel + d.cal * 0.2);
  }
}

/* ---------- la aceptación sube con un legado en su corte ---------- */
if (typeof dipAceptacion === "function") {
  const dplAcep0 = dipAceptacion;
  dipAceptacion = function (f, g, tipo, ext) {
    const r = dplAcep0.apply(this, arguments);
    if (!r || !r.p || !G.cam) return r;
    const d = dplEnCorte(f, g);
    if (!d) return r;
    const v = d.cal * DPL.bono;
    return { ...r, p: clamp(r.p + v, 0, 0.98), mot: [[`Legado ${d.nom} en su corte`, v], ...(r.mot || [])] };
  };
}

/* ---------- interfaz ---------- */
function dplPanel(dis) {
  const d = dplPorId(dplSel);
  if (!d) return "";
  const q = G.P[camPid(d.x, d.y)],
    c = dplCorte(d),
    mc = dplCampo(d),
    gest = dplPuedeGestionar(d),
    b = (act, txt, ok, tit) => `<button data-act="${act}" ${dis || !ok ? "disabled" : ""} title="${esc(tit || "")}">${txt}</button>`;
  let h = `<h2 style="color:#f2c14e">Legado ${esc(d.nom)}</h2><p class="dim">${CIV[d.f].n} · destreza ${d.cal} · en ${q ? q.name : "despoblado"}${q && q.owner !== d.f && CIV[q.owner] ? ` (${CIV[q.owner].s})` : ""}<br>Marcha ${d.mov}/${DPL.mov}${d.plan ? " · de camino" : ""}${gest ? "" : " · ya negoció esta estación"}</p>`;
  if (c) {
    const g = c.g,
      guerra = G.st[d.f][g] === "guerra";
    h += `<h3>En la corte de ${esc(CIV[g].s)}</h3><p class="stats">Mientras esté aquí, tus propuestas a ${esc(CIV[g].s)} tienen +${Math.round(d.cal * DPL.bono * 100)} % de aceptación y la relación mejora cada estación.${guerra ? " <b class='neg'>Estáis en guerra: solo puede negociar la paz y pueden apresarlo.</b>" : ""}</p><div class="btns">`;
    for (const t of DPL_TIPOS) {
      if (guerra && t !== "paz") continue;
      const motivo = typeof dipPuede === "function" ? dipPuede(d.f, g, t) : "";
      if (motivo && t !== "paz") continue;
      if (t === "paz" && !guerra) continue;
      const pr = typeof dipAceptacion === "function" ? Math.round(dipAceptacion(d.f, g, t, {}).p * 100) : null;
      h += b(`dplneg-${d.id}:${t}`, `${DIP_N[t] || t}${pr != null ? `<small>≈${pr} %</small>` : ""}`, gest && !motivo, motivo || "Una gestión del legado por estación, aparte de la anual de Diplomacia");
    }
    const emb = (dipS().emb[d.f + ">" + g] || 0) >= G.year;
    if (!guerra) h += b(`dplemb-${d.id}`, emb ? "Embajada abierta" : "Abrir embajada", gest && !emb, "Embajada en su corte: +8 % de aceptación durante 8 años");
    h += `</div>`;
  }
  if (mc) {
    const desc = Math.round(dplDescuento(d) * 100);
    h += `<h3>${esc(mc.nom)}</h3><p class="stats">El legado negocia el enganche con un ${desc} % de rebaja; las tropas acuden a tu ciudad más cercana.</p>`;
    h += mercHtmlCias(mc.cias, dis, (cia, a) => `dplmerc-${d.id}:${mc.id}:${cia.id}.${a}`);
  }
  if (!c && !mc) h += `<p class="dim">Llévalo junto a una ciudad de otro pueblo para negociar en su corte, o junto a un campamento de mercenarios para contratarlos sin un ejército.</p>`;
  h += `<div class="btns">${b(`dplret-${d.id}`, "Retirar", true, "Vuelve a casa (deja de contar para el máximo)")}<button data-act="dplsel-x">Cerrar</button></div>`;
  h += `<p class="note">Clic en el mapa para moverlo (hasta ${DPL.mov} casillas por estación; cruza fronteras y ejércitos).</p>`;
  return h;
}
OC.seccion("prov", {
  id: "diplomaticos",
  orden: 48,
  visible: (c) => c.mine,
  render: ({ p }, dis) => {
    const n = dplDe(ME).length,
      mx = dplMax(ME),
      can = dplCanciller(ME),
      aqui = dplDe(ME).filter((d) => d.x === p.x && d.y === p.y),
      todos = dplDe(ME).filter((d) => !(d.x === p.x && d.y === p.y));
    return `<h3>Diplomáticos <span class="stats">· ${n}/${mx}</span></h3><div class="btns"><button data-act="dplcrear-${p.id}" ${dis || n >= mx || G.F[ME].gold < DPL.coste ? "disabled" : ""} title="Su destreza depende de la diplomacia de ${can ? "tu canciller" : "tu soberano (nombra un canciller en la Corte)"}">Enviar un legado<small>${DPL.coste} oro</small></button>${[...aqui, ...todos].map((d) => `<button data-act="dplsel-${d.id}">${esc(d.nom)}<small>${(dplCorte(d) && CIV[dplCorte(d).g].s) || (dplCampo(d) && "mercenarios") || G.P[camPid(d.x, d.y)]?.name || ""}</small></button>`).join("")}</div>`;
  },
});
OC.accion("dplcrear", (v) => {
  const r = dplCrear(ME, G.P[+v]);
  if (r.ok) {
    dplSel = r.id;
    if (typeof camEspSel !== "undefined") camEspSel = null;
    if (typeof camSel !== "undefined") camSel = null;
  } else if (r.motivo) addLog(r.motivo, "bad");
  ui();
});
OC.accion("dplsel", (v) => {
  if (v === "x") dplSel = null;
  else {
    dplSel = +v;
    if (typeof camEspSel !== "undefined") camEspSel = null;
    if (typeof camSel !== "undefined") camSel = null;
    const d = dplPorId(+v);
    if (d) centerOn(camPid(d.x, d.y));
    tab = "prov";
  }
  ui();
});
OC.accion("dplneg", (v) => {
  const [id, t] = String(v).split(":"),
    d = dplPorId(+id);
  if (d && isMe(d.f)) dplNegociar(d, t);
  ui();
});
OC.accion("dplemb", (v) => {
  const d = dplPorId(+v);
  if (d && isMe(d.f)) dplEmbajada(d);
  ui();
});
OC.accion("dplret", (v) => {
  const d = dplPorId(+v);
  if (d && isMe(d.f)) dplRetirar(d);
  ui();
});
OC.accion("dplmerc", (v) => {
  const [id, camp, rest] = String(v).split(":"),
    [cia, anos] = String(rest).split("."),
    d = dplPorId(+id);
  if (!d || !isMe(d.f)) return;
  const r = dplContratar(d, +camp, cia, +anos);
  if (!r.ok && r.motivo) addLog(r.motivo, "bad");
  ui();
});

/* el panel de la provincia muestra el del legado si hay uno elegido */
if (typeof provPanel === "function") {
  const dplProv0 = provPanel;
  provPanel = function (dis) {
    if (dplSel != null && dplPorId(dplSel)) return dplPanel(dis);
    return dplProv0.apply(this, arguments);
  };
}
/* clic en el mapa: con un legado elegido lo mueve; en un legado propio, lo elige */
if (typeof camClic === "function") {
  const dplClic0 = camClic;
  camClic = function (x, y) {
    const s = dplSel != null ? dplPorId(dplSel) : null,
      aqui = dplDe(ME).find((d) => d.x === x && d.y === y);
    if (s && isMe(s.f) && myTurn() && !G.over) {
      if (aqui && aqui !== s) dplSel = aqui.id;
      else if (s.x === x && s.y === y) dplSel = null;
      else if (camPasable(x, y)) {
        const r = dplMover(s, x, y);
        if (!r.ok && r.motivo) addLog(r.motivo, "bad");
      } else dplSel = null;
      ui();
      return true;
    }
    if (aqui && !camEjsEn(x, y).some((e) => isMe(e.f)) && !(typeof camEspDe === "function" && camEspDe(ME).some((e) => e.x === x && e.y === y))) {
      dplSel = aqui.id;
      if (typeof camEspSel !== "undefined") camEspSel = null;
      if (typeof camSel !== "undefined") camSel = null;
      if (tab !== "prov") tab = "prov";
      ui();
      return true;
    }
    if (dplSel != null) dplSel = null;
    return dplClic0.apply(this, arguments);
  };
}
/* dibujo: figura con túnica blanca y ribete dorado (los espías van de oscuro) */
if (typeof camDibujarEspias === "function") {
  const dplDib0 = camDibujarEspias;
  camDibujarEspias = function (c, now) {
    dplDib0.apply(this, arguments);
    for (const d of dplLista()) {
      const mio = camSocio(ME, d.f);
      if (!mio && camNieblaOn() && !camVisible(ME, d.x, d.y)) continue;
      const X = d.x * T + 1,
        Y = d.y * T + 1;
      c.fillStyle = "#000";
      c.fillRect(X + 1, Y, 5, 7);
      c.fillStyle = "#ece5d2";
      c.fillRect(X + 2, Y + 1, 3, 5);
      c.fillStyle = "#f2c14e";
      c.fillRect(X + 2, Y + 5, 3, 1);
      c.fillStyle = CIV[d.f] ? CIV[d.f].c : "#fff";
      c.fillRect(X + 2, Y + 1, 3, 1);
      c.fillStyle = "#e3b48a";
      c.fillRect(X + 3, Y + 2, 1, 1);
      if (d.id === dplSel && (reduce || Math.floor(now / 350) % 2)) {
        c.strokeStyle = "#f2c14e";
        c.lineWidth = 1;
        c.strokeRect(d.x * T + 0.5, d.y * T + 0.5, T - 1, T - 1);
      }
    }
  };
}
/* estación nueva */
if (typeof camEspNuevaEstacion === "function") {
  const dplEst0 = camEspNuevaEstacion;
  camEspNuevaEstacion = function () {
    const r = dplEst0.apply(this, arguments);
    try {
      dplNuevaEstacion();
    } catch (e) {
      console.error("[dpl]", e);
    }
    return r;
  };
}
/* la propuesta hecha por el legado no gasta la gestión anual de Diplomacia con ese pueblo */
if (typeof dipJugadorPropone === "function") {
  const dplProp0 = dipJugadorPropone;
  dipJugadorPropone = function (g) {
    const d = dplDe(ME).find((x) => x.negoc && x.negoc.g === g);
    const r = dplProp0.apply(this, arguments);
    if (d) {
      G.F[ME].dip[g] = d.negoc.antes || 0;
      d.negoc = null;
    }
    return r;
  };
}

/* ---------- la IA también envía legados ----------
   Recluta alguno si le sobra oro; cada legado va a la corte del pueblo con el que su diplomacia más ganaría
   (dipIAPropuesta: alianza, comercio, no agresión, paso…) o, en guerra, a pedir la paz al enemigo; allí
   propone una vez al año (si el otro es humano, le llega al buzón como cualquier propuesta), abre embajada y
   se queda (la relación mejora). En guerra y con oro, uno va a un campamento de mercenarios y contrata. */
function dplJuntoA(d, q) {
  if (camCheb(q.x, q.y, d.x, d.y) <= 1) return true;
  const v = CAM_V8.map(([dx, dy]) => [q.x + dx, q.y + dy]).find(([x, y]) => camPasable(x, y));
  if (v) dplMover(d, v[0], v[1]);
  return camCheb(q.x, q.y, d.x, d.y) <= 1;
}
function dplIA(f) {
  const F = G.F[f];
  if (!F || f >= NF || !alive(f) || human(f)) return;
  const guerras = [...Array(NF).keys()].filter((g) => g !== f && alive(g) && G.st[f][g] === "guerra");
  /* reclutar */
  if (dplDe(f).length < dplMax(f) && F.gold > 90 + DPL.coste && R() < 0.25) {
    const cap = G.P[F.capId];
    if (cap && cap.owner === f) dplCrear(f, cap);
  }
  const legs = dplDe(f);
  legs.forEach((d, i) => {
    /* uno de ellos, a los mercenarios si hay guerra y oro */
    if (i === 0 && guerras.length && F.gold > 160 && typeof mercS === "function") {
      const c = mercS()
        .camp.filter((x) => x.cias.length)
        .sort((a, b) => camCheb(a.x, a.y, d.x, d.y) - camCheb(b.x, b.y, d.x, d.y))[0];
      if (c && dplJuntoA(d, c)) {
        const cia = c.cias.find((x) => G.F[f].gold > Math.ceil(mercEnganche(x) * (1 - dplDescuento(d))) + mercPago(x.t, x.n) + 60);
        if (cia) dplContratar(d, c.id, cia.id, 2);
        return;
      }
      if (c) return;
    }
    /* a una corte: paz con un enemigo o la mejor propuesta de su diplomacia */
    let obj = null;
    const enemigo = guerras.find((g) => !dplDe(f).some((o) => o !== d && o.obj && o.obj.g === g));
    if (enemigo != null && R() < 0.5) obj = { g: enemigo, tipo: "paz", ext: typeof dipTerminosIA === "function" ? dipTerminosIA(f, enemigo) : {} };
    else {
      const pr = typeof dipIAPropuesta === "function" ? dipIAPropuesta(f) : null;
      if (pr && !dplDe(f).some((o) => o !== d && o.obj && o.obj.g === pr.g)) obj = { g: pr.g, tipo: pr.tipo, ext: pr.ext || {} };
    }
    if (!obj && d.obj && alive(d.obj.g)) obj = d.obj;
    if (!obj) return;
    d.obj = obj;
    const q = owned(obj.g).sort((a, b) => camCheb(a.x, a.y, d.x, d.y) - camCheb(b.x, b.y, d.x, d.y))[0];
    if (!q || !dplJuntoA(d, q)) return;
    /* en la corte: una propuesta al año, y embajada */
    if (d.gestAnio !== G.year && obj.tipo !== "embajada" && typeof dipProponer === "function") {
      d.gestAnio = G.year;
      d.gest = dplTurno();
      dipProponer(f, obj.g, obj.tipo, obj.ext);
    } else if (G.st[f][obj.g] !== "guerra" && (dipS().emb[f + ">" + obj.g] || 0) < G.year && dplPuedeGestionar(d)) dplEmbajada(d);
  });
}
if (typeof camEspIA === "function") {
  const dplIA0 = camEspIA;
  camEspIA = function (f) {
    const r = dplIA0.apply(this, arguments);
    try {
      dplIA(f);
    } catch (e) {
      console.error("[dpl] IA", f, e);
    }
    return r;
  };
}
