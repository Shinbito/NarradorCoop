/* ---------- ONLINE: batallas en vivo contra pueblos de la IA ----------
   onlPrepararBatalla y onlPrepararMulti (js/online.js) solo reparten el mando cuando luchan al menos DOS
   jugadores humanos; si el rival es un pueblo de la IA, la batalla se resolvía sola y nadie la veía.
   Este archivo (cargado después de online.js) las envuelve para que con UN solo humano también se use el
   reparto normal (onlCtrlInicial → onlRepartirMando → onlLibrar):
     - si ese jugador es quien resuelve la estación → elige cómo librarla (turnos / tiempo real / auto);
     - si está conectado → se le invita a dirigirla en vivo; si no acepta, la resuelven sus capitanes;
     - si no está conectado → automática, como antes (sin detener la estación).
   Con dos o más humanos, o ninguno, se llama a la función original sin cambios. */
(function () {
  if (typeof onlPrepararBatalla !== "function" || typeof onlLibrar !== "function" || typeof onlRepartirMando !== "function") return;

  const origDos = onlPrepararBatalla;
  onlPrepararBatalla = async function (ejA, ejD, bctx, o) {
    const R0 = ONL.resolviendo,
      m = R0 && R0.meta;
    if (!m) return origDos.apply(this, arguments);
    const uA = onlUidHumano(m, ejA.f),
      uD = onlUidHumano(m, ejD.f);
    if (!uA === !uD || tot(ejD.u) <= 0 || tot(ejA.u) <= 0) return origDos.apply(this, arguments);
    const cfg = { ...ONL_CFG_DEF, ...(m.cfg || {}) },
      A = o.ejs && o.ejs[0],
      D = o.ejs && o.ejs[1],
      clave = `${m.turno}-${o.tipo || "campo"}-${A ? A.id : "c"}-${D ? D.id : "p" + (bctx.p ? bctx.p.id : "")}`,
      bid = "b" + onlHash(net.id + ":" + clave),
      s0 = JSON.stringify(cmbNorm({ ...ejA.u })),
      d0 = JSON.stringify(cmbNorm({ ...ejD.u })),
      prev = R0.bats[bid],
      lugar = bctx.nombreLugar || "campo abierto";
    if (prev && prev.res && prev.s0 === s0 && prev.d0 === d0) {
      bctx.onlRes = prev.res;
      return;
    }
    const desc = { lista: [ejA, ejD], uids: [uA, uD], ctrl: onlCtrlInicial([uA, uD]), dif: ["normal", "normal"], multi: false, bandos: [0, 1] };
    if (desc.ctrl.includes("ausente")) return origDos.apply(this, arguments); // desconectado: automática, como siempre
    onlTraza("prep-ia", ejA.f, ejD.f, o.tipo || "campo");
    await onlRepartirMando(bid, desc, { lugar, fa: ejA.f, fd: ejD.f, facs: [ejA.f, ejD.f] }, cfg);
    const { res, tact } = await onlLibrar(bid, desc, bctx, lugar, cfg);
    if (tact) o.sinInforme = true;
    bctx.onlRes = res;
    const nom = (f) => (CIV[f] ? CIV[f].s : "?");
    onlCron(
      [ejA.f, ejD.f].filter((f) => f < NF),
      `${nom(ejA.f)} contra ${nom(ejD.f)} en ${lugar}: ${res.gana === 0 ? "vence " + nom(ejA.f) : "resiste " + nom(ejD.f)} (${onlMandoTxt(desc)}).`,
      "",
    );
    onlTraza("batalla-ia", bid, desc.ctrl.join("/"), desc.dif.join("/"), "gana", res.gana);
    R0.ultBatalla = { bid, ctrl: desc.ctrl, dif: desc.dif, gana: res.gana, lugar };
    await onlGuardarBatalla(bid, m, { clave, a: uA, d: uD, fa: ejA.f, fd: ejD.f, lugar, s0, d0, ctrl: desc.ctrl, dif: desc.dif, res: onlClon(res) });
  };

  if (typeof onlPrepararMulti === "function") {
    const origMulti = onlPrepararMulti;
    onlPrepararMulti = async function (lista, bctx, o) {
      const R0 = ONL.resolviendo,
        m = R0 && R0.meta;
      if (!m) return origMulti.apply(this, arguments);
      const uids = lista.map((e) => onlUidHumano(m, e.f));
      if (new Set(uids.filter(Boolean)).size !== 1) return origMulti.apply(this, arguments);
      const cfg = { ...ONL_CFG_DEF, ...(m.cfg || {}) },
        clave = `${m.turno}-multi-${lista.map((e) => e.id).join(".")}`,
        bid = "b" + onlHash(net.id + ":" + clave),
        comp = JSON.stringify(lista.map((e) => cmbNorm({ ...e.u }))),
        prev = R0.bats[bid],
        lugar = bctx.nombreLugar || "campo abierto";
      if (prev && prev.res && prev.comp === comp) {
        bctx.onlResMulti = prev.res;
        return;
      }
      const bandos = lista.map((e, i) => e.bando ?? i),
        desc = { lista, uids, ctrl: onlCtrlInicial(uids), dif: lista.map(() => "normal"), multi: true, bandos },
        facs = [...new Set(lista.map((e) => e.f))];
      if (desc.ctrl.includes("ausente")) return origMulti.apply(this, arguments);
      await onlRepartirMando(bid, desc, { lugar, fa: lista[0].f, fd: (lista.find((e, i) => bandos[i] !== bandos[0]) || lista[1]).f, facs }, cfg);
      const { res } = await onlLibrar(bid, desc, bctx, lugar, cfg);
      bctx.onlResMulti = res;
      const nom = (f) => (CIV[f] ? CIV[f].s : "?"),
        gan = [...new Set(lista.filter((e, i) => bandos[i] === res.gana).map((e) => nom(e.f)))];
      onlCron(
        facs.filter((f) => f < NF),
        `Batalla en ${lugar} entre ${facs.map(nom).join(", ")}: vence${gan.length > 1 ? "n" : ""} ${gan.join(" y ") || "nadie"} (${onlMandoTxt(desc)}).`,
        "",
      );
      onlTraza("batalla-ia multi", bid, desc.ctrl.join("/"), desc.dif.join("/"), "gana", res.gana);
      R0.ultBatalla = { bid, ctrl: desc.ctrl, dif: desc.dif, gana: res.gana, lugar };
      await onlGuardarBatalla(bid, m, { clave, lugar, comp, uids, ctrl: desc.ctrl, dif: desc.dif, res: onlClon(res) });
    };
  }

  /* delegada contra la IA: quien la dirige no tiene rivales humanos, así que onlBatallaVivo no abre sala ni
     emite el «fin»; aquí se manda el resultado a quien está resolviendo la estación (onlDelegar lo espera) */
  if (typeof onlDelegado === "function") {
    const origDel = onlDelegado;
    onlDelegado = async function (E, d) {
      if ((d.ctrl || []).includes("remoto")) return origDel.apply(this, arguments);
      E.delegado = true;
      if (E.un) E.un();
      ONL.espejo = null;
      const t0 = Date.now();
      while ((!G || !ONL.ver) && Date.now() - t0 < 20000) await new Promise((r) => setTimeout(r, 200));
      const ctx = { ...d.bctx, p: d.bctx.p != null && G ? G.P[d.bctx.p] : null };
      onlTraza("delegado-ia", d.bid);
      let res = null;
      try {
        res = await onlBatallaVivo(d.bid, { lista: d.lista, uids: d.uids, ctrl: d.ctrl, dif: d.dif, multi: !!d.multi, bandos: d.bandos || [0, 1] }, ctx, d.modo);
      } catch (e) {
        console.error("[onl] delegada contra la IA", e);
      }
      if (!res) return;
      const sala = await onlUnirSala(d.bid);
      if (!sala) return;
      await onlEmitir(sala, "onl.b", { k: "fin", bid: d.bid, gana: res.gana, informe: res.informe, res, uid: net.uid });
      setTimeout(() => sala.leave().catch(() => {}), 3000);
    };
  }
})();
