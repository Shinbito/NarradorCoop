/* ---------- comercio ----------
   Sistema de ECONOMÍA: un mercado común de bienes cuyos precios dependen de las existencias
   (oferta y demanda), rutas comerciales entre provincias propias o con reinos en paz,
   y sucesos de mercado (caravanas, sequías, piratas...). Estado en G.eco.mer, G.eco.rutas, G.eco.ev. */

/* bienes del mercado: base = precio de referencia por unidad; s0 = existencias de equilibrio */
const COM_MER = { comida: { base: 1, s0: 200, lote: 10 } };
ECO_RES.forEach((r) => (COM_MER[r.id] = { base: r.base, s0: 60, lote: 5 }));
const comBienes = () => Object.keys(COM_MER);

function comMercadoIni(E) {
  for (const id of comBienes()) if (!E.mer[id]) E.mer[id] = { s: COM_MER[id].s0, p0: COM_MER[id].base };
}
function comPrecio(id) {
  const m = ecoE().mer[id],
    d = COM_MER[id];
  if (!m || !d) return 1;
  return d.base * clamp((d.s0 / Math.max(1, m.s)) ** 0.6, 0.45, 2.6);
}
/* precio de un lote: comprar cuesta más que vender (comisión de los mercaderes) y paga la inflación */
const comLote = (id) => (COM_MER[id] ? COM_MER[id].lote : 5);
const comPCompra = (f, id) => Math.max(1, Math.round(comPrecio(id) * comLote(id) * 1.12 * ecoF(f).infl));
const comPVenta = (id) => Math.max(1, Math.round(comPrecio(id) * comLote(id) * 0.88));
function comComprar(f, id) {
  const E = ecoE(),
    c = comPCompra(f, id),
    n = comLote(id);
  if (!E.mer[id] || G.F[f].gold < c || E.mer[id].s < n + 1) return false;
  G.F[f].gold -= c;
  OC.sumar(f, id, n);
  E.mer[id].s -= n;
  return true;
}
function comVender(f, id) {
  const E = ecoE(),
    n = comLote(id);
  if (!E.mer[id] || OC.saldo(f, id) < n) return false;
  OC.sumar(f, id, -n);
  G.F[f].gold += comPVenta(id);
  E.mer[id].s += n;
  return true;
}
OC.accion("mer", (v) => {
  const [k, id] = v.split(":");
  if (k === "c") comComprar(ME, id);
  else if (k === "v") comVender(ME, id);
});

/* ---------- sucesos de mercado ---------- */
const COM_EV = [
  {
    id: "caravana",
    t: "una caravana llega de Oriente cargada de seda; la seda se abarata.",
    mer: { seda: 45 },
  },
  { id: "vendimia", t: "vendimia abundante en las colinas; el vino corre barato.", mer: { vino: 40 } },
  { id: "salinas", t: "las salinas del litoral rebosan; baja el precio de la sal.", mer: { sal: 40 } },
  {
    id: "sequia",
    t: "la sequía agosta los campos del mundo conocido; el grano se encarece.",
    mer: { comida: -80 },
  },
  { id: "forjas", t: "las guerras de Persia vacían las forjas; el hierro escasea.", mer: { hierro: -30 } },
  { id: "muermo", t: "el muermo diezma las yeguadas; los caballos se encarecen.", mer: { caballos: -25 } },
  {
    id: "basilicas",
    t: "se alzan basílicas por doquier; suben la piedra y la madera.",
    mer: { piedra: -25, madera: -25 },
  },
  { id: "piratas", t: "piratas infestan las costas; las rutas marítimas rinden la mitad.", dur: 2 },
  { id: "feria", t: "ferias concurridas en las ciudades; las rutas rinden un cuarto más.", dur: 1 },
];
const comEvento = () => {
  const E = ecoE();
  return E.ev && E.ev.fin >= G.year ? COM_EV.find((e) => e.id === E.ev.id) || null : null;
};
/* una vez al año, antes de la economía: el mercado vuelve hacia su equilibrio y puede haber un suceso */
OC.on("antesFinAnio", () => {
  if (!G) return;
  const E = ecoE();
  for (const id of comBienes()) {
    const m = E.mer[id],
      d = COM_MER[id];
    m.p0 = Math.round(comPrecio(id) * 100) / 100;
    m.s = clamp(Math.round(m.s + (d.s0 - m.s) * 0.3 + (R() - 0.5) * 0.16 * d.s0), d.s0 * 0.25, d.s0 * 3);
  }
  if (!comEvento() && R() < 0.3) {
    const ev = pick(COM_EV);
    E.ev = { id: ev.id, fin: G.year + (ev.dur || 1) };
    for (const k in ev.mer || {})
      if (E.mer[k]) E.mer[k].s = clamp(E.mer[k].s + ev.mer[k], COM_MER[k].s0 * 0.25, COM_MER[k].s0 * 3);
    addLog("Mercados: " + ev.t);
  }
  comRevisarRutas();
  /* el comercio acerca a los pueblos */
  const pares = new Set();
  for (const r of E.rutas) {
    const g = G.P[r.b].owner;
    if (g !== r.f && g < NF && !pares.has(r.f + "-" + g)) {
      pares.add(r.f + "-" + g);
      relAdd(r.f, g, 1);
    }
  }
});

/* ---------- rutas comerciales ----------
   {f, a, b, y}: la facción f lleva una ruta desde su provincia a hasta b (propia o de un reino en paz).
   Rinde oro según distancia, mercados, especialidades distintas y litoral. Con otro reino, ambos ganan
   e intercambian 1 unidad al año del bien de la especialidad de cada extremo. La guerra la corta. */
const comDe = (f) => ecoE().rutas.filter((r) => r.f === f);
const comCoste = (f, ext) => Math.round((ext ? 45 : 30) * ecoF(f).infl);
function comMax(f) {
  const E = ecoE(),
    own = owned(f);
  return Math.min(
    6,
    1 +
      Math.floor(own.reduce((s, p) => s + (+p.market || 0), 0) / 2) +
      own.filter((p) => E.esp[p.id] === "puerto").length,
  );
}
function comValida(r) {
  const A = G.P[r.a],
    B = G.P[r.b];
  if (!A || !B || A.owner !== r.f || r.f >= NF || !alive(r.f)) return false;
  const g = B.owner;
  return g === r.f || (g < NF && alive(g) && G.st[r.f][g] !== "guerra");
}
function comRevisarRutas() {
  const E = ecoE();
  E.rutas = E.rutas.filter((r) => {
    if (comValida(r)) return true;
    const A = G.P[r.a],
      B = G.P[r.b];
    if (A && B && (isMe(r.f) || isMe(B.owner)))
      addLog(`Se corta la ruta comercial de ${A.name} a ${B.name}.`, "bad");
    return false;
  });
}
function comValor(f, A, B) {
  const E = ecoE(),
    g = B.owner,
    ext = g !== f,
    d = Math.hypot(A.x - B.x, A.y - B.y),
    mar = ecoTerreno(A.id).costa && ecoTerreno(B.id).costa,
    ev = comEvento();
  let v = 1 + d * 0.06 + ((+A.market || 0) + (+B.market || 0)) * 0.6;
  if (E.esp[A.id] !== E.esp[B.id]) v += 1.5;
  if (mar) v += 1;
  for (const P of [A, B]) if (E.esp[P.id] === "puerto") v += 1.5;
  if (ext) v *= 1.25;
  if (ev && ev.id === "piratas" && mar) v *= 0.5;
  if (ev && ev.id === "feria") v *= 1.25;
  if (E.peste[A.id] || E.peste[B.id]) v *= 0.6;
  return {
    v: Math.round(v),
    socio: ext ? g : -1,
    vs: ext ? Math.round(v * 0.4) : 0,
    imp: ext ? ecoRecursoEsp(B) : null,
    exp: ext ? ecoRecursoEsp(A) : null,
    mar,
  };
}
/* suma al balance de f lo que le dan sus rutas y las rutas ajenas que llegan a sus provincias */
function comBalanceRutas(f, b) {
  for (const r of ecoE().rutas) {
    if (!comValida(r)) continue;
    const A = G.P[r.a],
      B = G.P[r.b];
    if (r.f === f) {
      const c = comValor(f, A, B);
      b.ing.rut += c.v;
      if (c.imp) b.prod[c.imp] += 1;
    } else if (B.owner === f) {
      const c = comValor(r.f, A, B);
      b.ing.rut += c.vs;
      if (c.exp) b.prod[c.exp] += 1;
    }
  }
}
/* motivo por el que no se puede abrir la ruta (o "" si se puede) */
function comMotivo(f, A, B) {
  if (!A || !B || A === B || A.owner !== f) return "origen no válido";
  const g = B.owner;
  if (g === REB) return "tierra de bagaudas";
  if (g !== f) {
    if (!alive(g)) return "reino caído";
    if (G.st[f][g] === "guerra") return "estáis en guerra";
    if (G.rel[f][g] < 10) return "relación insuficiente (10)";
  }
  if (Math.hypot(A.x - B.x, A.y - B.y) < 4) return "demasiado cerca";
  const mias = comDe(f);
  if (mias.length >= comMax(f)) return "sin rutas libres";
  if (mias.some((r) => (r.a === A.id && r.b === B.id) || (r.a === B.id && r.b === A.id))) return "ya existe";
  const usos = (id) => mias.filter((r) => r.a === id || r.b === id).length;
  if (usos(A.id) >= 2 || usos(B.id) >= 2) return "provincia saturada";
  return "";
}
function comCandidatas(f, soloB = null, n = 6) {
  const l = [];
  for (const A of owned(f))
    for (const B of soloB ? [soloB] : G.P) {
      if (comMotivo(f, A, B)) continue;
      const c = comValor(f, A, B);
      l.push({ A, B, v: c.v, imp: c.imp, coste: comCoste(f, B.owner !== f) });
    }
  return l.sort((x, y) => y.v - x.v).slice(0, n);
}
function comAbrir(f, A, B) {
  const c = comCoste(f, B.owner !== f);
  if (comMotivo(f, A, B) || G.F[f].gold < c) return false;
  G.F[f].gold -= c;
  ecoE().rutas.push({ f, a: A.id, b: B.id, y: G.year });
  if (isMe(f)) addLog(`Abres una ruta comercial de ${A.name} a ${B.name}.`, "good");
  else if (isMe(B.owner)) addLog(`Mercaderes de ${CIV[f].s} abren una ruta hasta ${B.name}.`, "good");
  return true;
}
OC.on("guerraDeclarada", () => G && comRevisarRutas());

/* ---------- IA: mercado y rutas ---------- */
function comIA(f) {
  const F = G.F[f],
    b = ecoBalance(f);
  /* hambre a la vista: comprar grano (caro solo si el hambre es inminente) */
  for (let k = 0; k < 4 && F.food + b.net * 2 < 0; k++)
    if ((F.food + b.net >= 0 && comPrecio("comida") > 1.8) || !comComprar(f, "comida")) break;
  /* vender excedentes, sin malvender */
  for (const r of ECO_RES) {
    const res = r.lujo ? ecoNecLujo(f) * 3 : r.id === "caballos" ? 12 : 25;
    for (let k = 0; k < 4 && OC.saldo(f, r.id) - comLote(r.id) >= res && comPrecio(r.id) >= r.base * 0.7; k++)
      if (!comVender(f, r.id)) break;
  }
  if (F.food > b.granero * 0.85 && b.net > 0)
    for (let k = 0; k < 3; k++) if (comPrecio("comida") < 0.8 || !comVender(f, "comida")) break;
  /* reponer hierro y caballos si sobra el oro */
  if (OC.saldo(f, "hierro") < 5 && F.gold > 100 && comPrecio("hierro") < 5 * 1.5) comComprar(f, "hierro");
  if (OC.saldo(f, "caballos") < 3 && F.gold > 120 && comPrecio("caballos") < 8 * 1.5)
    comComprar(f, "caballos");
  /* abrir la mejor ruta si compensa */
  if (comDe(f).length < comMax(f) && F.gold >= 55) {
    const c = comCandidatas(f, null, 1)[0];
    if (c && F.gold >= c.coste + 30 && c.v * 5 >= c.coste) comAbrir(f, c.A, c.B);
  }
}

/* ---------- interfaz: mercado y rutas (pestaña Tesoro) ---------- */
function comVistaMercado(dis) {
  const F = G.F[ME],
    ev = comEvento();
  let h = `<div class="eco-mer"><div class="eco-fila eco-hd"><span>Bien</span><span title="Tus existencias">Hay</span><span title="Compra / venta por lote">Precio</span><span></span><span></span></div>`;
  for (const id of comBienes()) {
    const r = OC.recursos.find((x) => x.id === id) || { nombre: id, icono: "" },
      m = ecoE().mer[id],
      p = comPrecio(id),
      tr = p > m.p0 * 1.04 ? '<i class="eco-dn">▲</i>' : p < m.p0 * 0.96 ? '<i class="eco-up">▼</i>' : "",
      pc = comPCompra(ME, id),
      pv = comPVenta(id),
      n = comLote(id);
    h += `<div class="eco-fila"><span title="${r.nombre}">${r.icono} ${r.nombre}</span><b>${Math.floor(OC.saldo(ME, id))}</b><span>${pc}/${pv}${tr}</span><button class="eco-mini" data-act="mer-c:${id}" ${dis || F.gold < pc || m.s <= n ? "disabled" : ""} title="Comprar ${n} por ${pc} oro">+${n}</button><button class="eco-mini" data-act="mer-v:${id}" ${dis || OC.saldo(ME, id) < n ? "disabled" : ""} title="Vender ${n} por ${pv} oro">−${n}</button></div>`;
  }
  h += `</div><p class="note">Precio en oro por lote (compra/venta). Vender mucho hunde el precio; cada año el mercado se recupera.${ev ? "<br>Este año: " + ev.t : ""}</p>`;
  return h;
}
function comVistaRutas(dis) {
  const E = ecoE(),
    mias = comDe(ME),
    mx = comMax(ME),
    ic = (id) => (id ? ecoResInfo(id)?.icono || "" : "");
  let h = `<p class="stats">Rutas ${mias.length}/${mx} · más con mercados y puertos francos</p>`;
  h += mias.length ? "" : '<p class="dim">Ninguna caravana sale de tus ciudades.</p>';
  for (const r of mias) {
    const A = G.P[r.a],
      B = G.P[r.b],
      c = comValor(ME, A, B);
    h += `<div class="eco-ruta"><div><b>${A.name}</b> → <b>${B.name}</b>${c.socio >= 0 ? ` <span class="tag" style="color:${CIV[c.socio].c}">${CIV[c.socio].s}</span>` : ""}<br><small>+${c.v} oro${c.imp ? " · trae " + ic(c.imp) : ""}${c.mar ? " · marítima" : ""}</small></div><button class="eco-mini" data-act="ruta-cortar:${E.rutas.indexOf(r)}" ${dis ? "disabled" : ""}>Cortar</button></div>`;
  }
  const ajenas = E.rutas.filter((r) => r.f !== ME && G.P[r.b].owner === ME && comValida(r));
  if (ajenas.length)
    h += `<h3>Mercaderes extranjeros</h3>${ajenas
      .map((r) => {
        const c = comValor(r.f, G.P[r.a], G.P[r.b]);
        return `<p class="stats"><span style="color:${CIV[r.f].c}">${CIV[r.f].s}</span>: ${G.P[r.a].name} → ${G.P[r.b].name} · +${c.vs} oro${c.exp ? " · trae " + ic(c.exp) : ""}</p>`;
      })
      .join("")}`;
  h += `<div class="btns"><button data-act="ruta-nueva" ${dis || mias.length >= mx ? "disabled" : ""}>Nueva ruta<small>${comCoste(ME, false)} oro propia · ${comCoste(ME, true)} extranjera</small></button></div>`;
  const ev = comEvento();
  return (
    h +
    `<p class="note">Con reinos en paz y relación 10 o más. La guerra corta la ruta.${ev ? "<br>Este año: " + ev.t : ""}</p>`
  );
}
function comBotonHasta(p, dis) {
  if (p.owner === REB || p.owner === ME) return "";
  const c = comCandidatas(ME, p, 1)[0];
  if (c)
    return `<div class="btns"><button data-act="ruta-hasta:${p.id}" ${dis || G.F[ME].gold < c.coste ? "disabled" : ""}>Ruta comercial hasta aquí<small>+${c.v} oro/año · ${c.coste} oro</small></button></div>`;
  const m = owned(ME).length ? comMotivo(ME, owned(ME)[0], p) : "";
  return m && /guerra|relación|rutas/.test(m) ? `<p class="stats">Comercio: ${m}.</p>` : "";
}
function comModalNueva(B) {
  const l = comCandidatas(ME, B, 6),
    F = G.F[ME];
  if (!l.length) {
    modal("Rutas comerciales", '<p class="dim">No hay ninguna ruta posible ahora mismo.</p>', [
      { t: "Vale" },
    ]);
    return;
  }
  modal(
    "Nueva ruta comercial",
    '<p class="dim">Elige origen y destino. Rinde cada año mientras haya paz.</p>',
    l
      .map((c, i) => ({
        t: `${c.A.name} → ${c.B.name}<small>+${c.v} oro/año${c.imp ? " · trae " + ecoResInfo(c.imp).icono : ""} · ${c.coste} oro</small>`,
        v: i,
        dis: F.gold < c.coste,
      }))
      .concat([{ t: "Cancelar", v: -1 }]),
  ).then((i) => {
    if (i >= 0 && l[i] && comAbrir(ME, l[i].A, l[i].B)) ui();
  });
}
OC.accion("ruta", (v) => {
  const [k, x] = v.split(":"),
    E = ecoE();
  if (k === "cortar") {
    const r = E.rutas[+x];
    if (r && r.f === ME) {
      E.rutas.splice(+x, 1);
      addLog(`Abandonas la ruta de ${G.P[r.a].name} a ${G.P[r.b].name}.`);
    }
  } else if (k === "nueva") comModalNueva(null);
  else if (k === "hasta") comModalNueva(G.P[+x]);
});
