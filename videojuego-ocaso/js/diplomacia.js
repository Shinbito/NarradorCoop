function drift() {
  for (let a = 0; a < NF; a++)
    for (let b = a + 1; b < NF; b++) {
      let r = G.rel[a][b];
      r += r > 0 ? -1 : r < 0 ? 1 : 0;
      if (G.st[a][b] === "guerra") r -= 1;
      G.rel[a][b] = G.rel[b][a] = clamp(r, -100, 100);
    }
}
/* ---------- diplomacia ---------- */
function declareWar(a, b) {
  const was = G.st[a][b];
  G.st[a][b] = G.st[b][a] = "guerra";
  if (was === "alianza") {
    G.rel[a][b] = G.rel[b][a] = -70;
    for (let g = 0; g < NF; g++) if (g !== a && g !== b) relAdd(a, g, -10);
    addLog(
      `¡Traición! ${ruler(a).n} de ${CIV[a].s} rompe la alianza y declara la guerra a ${CIV[b].s}.`,
      isMe(b) ? "bad" : isMe(a) ? "" : "",
    );
  } else {
    relAdd(a, b, -30);
    addLog(`${CIV[a].s} declara la guerra a ${CIV[b].s}.`, isMe(b) ? "bad" : "");
  }
}
function makePeace(a, b) {
  G.st[a][b] = G.st[b][a] = "paz";
  relAdd(a, b, 10);
  addLog(`${CIV[a].s} y ${CIV[b].s} firman la paz.`, isMe(a) || isMe(b) ? "good" : "");
}
function ally(a, b) {
  G.st[a][b] = G.st[b][a] = "alianza";
  relAdd(a, b, 10);
  addLog(`${CIV[a].s} y ${CIV[b].s} sellan una alianza.`, isMe(a) || isMe(b) ? "good" : "");
}
const border = (a, b) => owned(a).some((p) => MAP.adj[p.id].some((i) => G.P[i].owner === b));
const bachelors = (f) =>
  family(f).filter(
    (c) => c.sp == null && c.age >= 16 && c.age <= 42 && c.id !== G.F[f].ruler && c.id !== G.F[f].heir,
  );
function marryAcross(mine, theirs) {
  const g = theirs.f,
    f = mine.f;
  theirs.f = f;
  G.P.forEach((p) => {
    if (p.gen === theirs.id) p.gen = null;
  });
  marry(mine, theirs);
  relAdd(f, g, 25);
  addLog(
    `Boda: ${mine.n} (${CIV[f].s}) se casa con ${theirs.n} (${CIV[g].s}).`,
    isMe(f) || isMe(g) ? "good" : "",
  );
  if (G.st[f][g] === "paz" && G.rel[f][g] >= 25) ally(f, g);
}
function tryAssassin(f, target) {
  const r = ruler(f),
    ch = clamp(0.35 + (r.in - target.in) * 0.05, 0.1, 0.8);
  G.F[f].asn = 1;
  if (R() < ch) {
    addLog(
      `${target.n} (${CIV[target.f].s}) aparece muerto: ¿veneno?`,
      isMe(f) ? "good" : isMe(target.f) ? "bad" : "",
    );
    kill(target, "ha sido asesinado");
    return true;
  }
  if (R() < 0.6) {
    relAdd(f, target.f, -40);
    addLog(
      `Se descubre un complot de ${CIV[f].s} contra ${target.n}.`,
      isMe(target.f) ? "good" : isMe(f) ? "bad" : "",
    );
    if (!human(target.f) && G.st[f][target.f] !== "guerra" && R() < 0.6) declareWar(target.f, f);
  } else if (isMe(f)) addLog(`El asesino fracasa en silencio. Nadie sabe nada.`);
  return false;
}
function pushInbox(f, it) {
  (G.inbox[f] = G.inbox[f] || []).push(it);
}
function aiDiplo(f) {
  const F = G.F[f],
    r = ruler(f),
    mp = totPow(f);
  for (let g = 0; g < NF; g++) {
    if (g === f || !alive(g)) continue;
    const s = G.st[f][g],
      rl = G.rel[f][g],
      gp = totPow(g) + 1;
    if (s === "alianza") {
      if (border(f, g) && mp > 1.5 * gp && R() < F.tre * (r.tr === "Ambicioso" ? 0.25 : 0.1))
        declareWar(f, g);
    } else if (s === "paz") {
      if (border(f, g) && rl < -15 && mp > gp * 0.9 && R() < F.amb * 0.18) declareWar(f, g);
      else if (rl > 45 && R() < 0.12) {
        if (human(g)) pushInbox(g, { k: "ally", from: f });
        else ally(f, g);
      }
    } else if ((mp < gp * 0.6 || rl > -5) && R() < 0.22) {
      if (human(g)) pushInbox(g, { k: "peace", from: f });
      else makePeace(f, g);
    }
    if (s !== "guerra" && rl > 10 && R() < 0.07) {
      const a = pick(bachelors(f)),
        b = a && bachelors(g).find((c) => c.sex !== a.sex);
      if (a && b) {
        if (human(g)) pushInbox(g, { k: "marry", from: f, a: a.id, b: b.id });
        else marryAcross(a, b);
      }
    }
    if (rl < -40 && !F.asn && R() < 0.04) {
      const t = pick([G.C[G.F[g].heir], ...family(g).filter((c) => genOf(c))].filter(Boolean));
      if (t) tryAssassin(f, t);
    }
  }
}

/* ---------- panel de diplomacia ---------- */
function dipPanel(dis) {
  const F = G.F[ME],
    r = ruler(ME);
  let h = `<h2>Diplomacia</h2><p class="dim">Tu diplomacia (${r.di}) mejora la aceptación; tu intriga (${r.in}) decide los asesinatos.</p>`;
  for (let g = 0; g < NF; g++) {
    if (g === ME || !alive(g)) continue;
    const s = G.st[ME][g],
      rl = G.rel[ME][g],
      rr = ruler(g),
      used = F.dip[g],
      hum = human(g);
    h += `<div class="row"><div class="hd"><b style="color:${CIV[g].c}">${CIV[g].n}</b>${stTag(g)}</div><span class="stats">${ttl(rr)} ${rr.n} (${rr.age})${hum ? " · jugador" + (net.names[net.seats[g]] ? " " + esc(net.names[net.seats[g]]) : "") : ""} · relación ${rl > 0 ? "+" : ""}${rl}</span>
  <div class="bar"><i style="width:${(rl + 100) / 2}%;background:${rl < -20 ? "#e0503f" : rl < 20 ? "#e8b632" : "#4caf50"}"></i></div>
  <div class="btns"><button data-act="gift-${g}" ${dis || used || F.gold < 50 ? "disabled" : ""}>Regalo 50 oro</button>
  ${s === "guerra" ? `<button data-act="peace-${g}" ${dis || used ? "disabled" : ""}>Proponer paz</button>` : `<button data-act="war-${g}" class="red" ${dis ? "disabled" : ""}>${s === "alianza" ? "Traicionar" : "Declarar guerra"}</button>`}
  ${s === "paz" ? `<button data-act="ally-${g}" ${dis || used ? "disabled" : ""}>Proponer alianza</button>` : ""}
  <button data-act="asn-${g}" ${dis || F.asn || F.gold < 60 ? "disabled" : ""}>Asesinato 60 oro</button></div></div>`;
  }
  h += OC.renderSecciones("dip", { F, r }, dis);
  return h + '<p class="note">Una acción diplomática por reino y año; un asesinato por año.</p>';
}


/* ---------- bodas y asesinatos (modales) ---------- */
function marryModal(c) {
  const opts = [];
  for (let g = 0; g < NF; g++) {
    if (g === ME || !alive(g) || G.st[ME][g] === "guerra") continue;
    for (const b of bachelors(g).filter((b) => b.sex !== c.sex)) opts.push(b);
  }
  const r = ruler(ME),
    chance = (b) => clamp(0.35 + G.rel[ME][b.f] / 120 + r.di * 0.04, 0.05, 0.95);
  const btns = opts.map((b) => ({
    inl: 1,
    fn: () => {
      G.F[ME].dip[b.f] = 1;
      if (human(b.f)) {
        pushInbox(b.f, { k: "marry", from: ME, a: c.id, b: b.id });
        addLog(`Propuesta de boda enviada a ${CIV[b.f].s}.`);
      } else if (R() < chance(b)) marryAcross(c, b);
      else {
        addLog(`${CIV[b.f].s} rechaza la boda de ${c.n} con ${b.n}.`, "bad");
        relAdd(ME, b.f, -3);
      }
    },
  }));
  btns.push(
    {
      t: "Nobleza local",
      fn: () => {
        marry(c, mkChar(ME, c.sex === "m" ? "f" : "m", clamp(c.age + ri(-4, 2), 16, 45)));
        addLog(`${c.n} se casa con una familia noble del reino.`);
      },
    },
    { t: "Cancelar" },
  );
  const list = opts.length
    ? opts
        .map(
          (b, i) =>
            `<div class="row"><div class="hd"><b style="color:${CIV[b.f].c}">${b.n}</b><span class="stats">${CIV[b.f].s} · ${b.age} años</span></div>${cline(b)}<div class="btns"><button data-mi="${i}" ${G.F[ME].dip[b.f] ? "disabled" : ""}>Proponer · ${Math.round(chance(b) * 100)}%</button></div></div>`,
        )
        .join("")
    : '<p class="dim">No hay candidatos libres en los reinos con los que estás en paz.</p>';
  modal(
    `Boda para ${c.n}`,
    `<p class="dim">Una boda con otro pueblo mejora la relación y, si estáis en paz con buena relación, sella una alianza. El cónyuge se une a tu corte.</p><div style="max-height:52vh;overflow:auto">${list}</div>`,
    btns,
  );
}
function asnModal(g) {
  const F = G.F[g],
    ts = [G.C[F.ruler], G.C[F.heir], ...family(g).filter((c) => genOf(c))].filter(
      (c, i, a) => c && c.alive && a.indexOf(c) === i,
    ),
    r = ruler(ME);
  const ch = (t) => Math.round(clamp(0.35 + (r.in - t.in) * 0.05, 0.1, 0.8) * 100);
  const btns = ts.map((t) => ({
    inl: 1,
    fn: () => {
      G.F[ME].gold -= 60;
      tryAssassin(ME, t);
      checkEnd();
    },
  }));
  btns.push({ t: "Cancelar" });
  modal(
    `Asesinato en ${CIV[g].s}`,
    `<p class="dim">Cuesta 60 oro. Si se descubre, la relación se hunde y puede estallar la guerra.</p>${ts.map((t, i) => `<div class="row"><div class="hd"><b>${t.n}</b><span class="tag">${t.id === F.ruler ? ttl(t) : t.id === F.heir ? "Heredero" : "General"}</span></div>${cline(t)}<div class="btns"><button data-mi="${i}" class="red">Enviar al asesino · ${ch(t)}%</button></div></div>`).join("")}`,
    btns,
  );
}


/* ---------- acciones diplomáticas ---------- */
OC.accion("asn", (v) => {
  asnModal(+v);
});
OC.accion("gift", (v) => {
  const F = G.F[ME],
    g = +v;
  F.gold -= 50;
  F.dip[g] = 1;
  relAdd(ME, g, 10 + ruler(ME).di);
  addLog(`Envías regalos a ${CIV[g].s}.`);
});
OC.accion("war", (v) => {
  const g = +v,
    tr = G.st[ME][g] === "alianza";
  modal(
    tr ? "¿Traicionar la alianza?" : "¿Declarar la guerra?",
    `<p>${tr ? "Romper una alianza hundirá tu reputación con todos los reinos." : "Podrás atacar sus provincias, y ellos las tuyas."}</p>`,
    [{ t: tr ? "Traicionar" : "Declarar la guerra", cls: "red", fn: () => declareWar(ME, g) }, { t: "Cancelar" }],
  );
});
function proponer(a, v) {
  const F = G.F[ME],
    g = +v;
  F.dip[g] = 1;
  if (human(g)) {
    pushInbox(g, { k: a, from: ME });
    addLog(`Propuesta enviada a ${CIV[g].s}.`);
  } else {
    const rl = G.rel[ME][g],
      di = ruler(ME).di,
      ch0 =
        a === "peace"
          ? 0.25 + rl / 100 + (totPow(ME) / (totPow(g) + 1) - 1) * 0.3 + di * 0.03
          : (rl - 15) / 60 + di * 0.03;
    /* OC 'aceptacionDiplomatica': probabilidad 0..1. ctx {f, g, tipo} */
    const ch = OC.calc("aceptacionDiplomatica", ch0, { f: ME, g, tipo: a });
    if (R() < ch) (a === "peace" ? makePeace : ally)(ME, g);
    else addLog(`${CIV[g].s} rechaza tu propuesta de ${a === "peace" ? "paz" : "alianza"}.`, "bad");
  }
}
OC.accion("peace", (v) => proponer("peace", v));
OC.accion("ally", (v) => proponer("ally", v));
