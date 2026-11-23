/* ---------- vida de la corte ---------- */
function life() {
  for (const c of G.C) {
    if (!c.alive) continue;
    c.age++;
    let pd = c.age < 5 ? 0.02 : c.age < 40 ? 0.008 : c.age < 55 ? 0.025 : c.age < 65 ? 0.06 : 0.14;
    if (c.tr === "Enfermizo") pd *= 2;
    if (R() < pd) {
      kill(c, c.age < 6 ? "muere en la infancia" : "muere de causas naturales");
      continue;
    }
    if (c.age === 16 && isMe(c.f)) addLog(`${c.n} alcanza la mayoría de edad.`);
  }
  for (const c of G.C.slice()) {
    if (!c.alive || c.sex !== "f" || c.sp == null) continue;
    const h = G.C[c.sp];
    if (!h.alive || h.f !== c.f || c.age < 16 || c.age > 42) continue;
    if (kidsOf(c).length < 6 && R() < 0.26) {
      const k = mkChar(c.f, R() < 0.5 ? "m" : "f", 0, h.id, c.id);
      if (isMe(c.f)) addLog(`Nace ${k.n}, ${k.sex === "m" ? "hijo" : "hija"} de ${h.n} y ${c.n}.`, "good");
      autoHeir(c.f);
    }
  }
  for (let f = 0; f < NF; f++) {
    if (!alive(f)) continue;
    autoHeir(f);
    if (human(f)) continue;
    for (const c of family(f))
      if (c.sp == null && c.age >= 18 && c.age <= 40 && R() < 0.2)
        marry(c, mkChar(f, c.sex === "m" ? "f" : "m", clamp(c.age + ri(-4, 2), 16, 45)));
  }
}

/* ---------- eventos ---------- */
const capOf = (f) => (G.P[G.F[f].capId].owner === f ? G.P[G.F[f].capId] : owned(f)[0]);
function relig(f, a, b) {
  for (let g = 0; g < NF; g++) {
    if (g === f) continue;
    if (CIV[g].rel === a) relAdd(f, g, 15);
    if (CIV[g].rel === b) relAdd(f, g, -15);
  }
  owned(f).forEach(
    (p) => (p.order = clamp(p.order + (CIV[f].rel === a ? 6 : CIV[f].rel === b ? -6 : 0), 0, 100)),
  );
}
const EVENTS = [
  {
    t: "Concilio de obispos",
    d: () =>
      "Arrianos y nicenos se acusan de herejía. Los obispos esperan tu palabra; los reinos vecinos escuchan.",
    o: [
      ["Defender el credo niceno", (c) => relig(c.f, "niceno", "arriano")],
      ["Proteger a los arrianos", (c) => relig(c.f, "arriano", "niceno")],
    ],
  },
  {
    t: "Mala cosecha",
    d: (c) => `El granizo arrasa los campos de ${c.p.name}. El pueblo pide pan.`,
    o: [
      [
        "Abrir los graneros (−15 comida, +15 orden)",
        (c) => {
          G.F[c.f].food -= 15;
          c.p.order += 15;
        },
      ],
      [
        "Que se las arreglen (−20 orden)",
        (c) => {
          c.p.order -= 20;
        },
      ],
    ],
  },
  {
    t: "Bagaudas en los caminos",
    d: (c) => `Campesinos armados asaltan las villas de ${c.p.name}.`,
    o: [
      [
        "Enviar a la guarnición (−2 infantería, +10 orden)",
        (c) => {
          c.p.u.i = Math.max(0, c.p.u.i - 2);
          c.p.order += 10;
        },
      ],
      [
        "Comprar su silencio (−40 oro)",
        (c) => {
          G.F[c.f].gold -= 40;
        },
      ],
    ],
  },
  {
    t: "Mercaderes de seda",
    d: () => "Una caravana de Oriente ofrece oro a cambio de exenciones y privilegios en tus mercados.",
    o: [
      [
        "Conceder privilegios (+70 oro, −8 orden en la capital)",
        (c) => {
          G.F[c.f].gold += 70;
          capOf(c.f).order -= 8;
        },
      ],
      [
        "Rechazarlos (+5 orden en la capital)",
        (c) => {
          capOf(c.f).order += 5;
        },
      ],
    ],
  },
  {
    t: "Conjura en la corte",
    d: (c) => `Nobles descontentos conspiran contra ${ruler(c.f).n}.`,
    o: [
      [
        "Purgar a los conjurados (−10 orden, +1 intriga)",
        (c) => {
          owned(c.f).forEach((p) => (p.order -= 10));
          ruler(c.f).in = Math.min(10, ruler(c.f).in + 1);
        },
      ],
      [
        "Comprar lealtades (−50 oro)",
        (c) => {
          G.F[c.f].gold -= 50;
        },
      ],
      [
        "Ignorarlos",
        (c) => {
          if (R() < 0.4) {
            const v = pick(family(c.f).filter((x) => x.id !== G.F[c.f].ruler));
            if (v) kill(v, "es asesinado por los conjurados");
          }
        },
      ],
    ],
  },
  {
    t: "Embajada huna",
    ok: (f) => f !== 3 && alive(3),
    d: () => `Emisarios de ${ruler(3).n} exigen un tributo en oro "por la paz de tus fronteras".`,
    o: [
      [
        "Pagar 60 oro (+25 relación)",
        (c) => {
          G.F[c.f].gold -= 60;
          relAdd(c.f, 3, 25);
        },
      ],
      [
        "Negarse (−25 relación)",
        (c) => {
          relAdd(c.f, 3, -25);
          if (G.st[3][c.f] !== "guerra" && R() < 0.4) declareWar(3, c.f);
        },
      ],
    ],
  },
  {
    t: "Peste",
    d: (c) => `Una peste se extiende por ${c.p.name}.`,
    o: [
      [
        "Cuarentena (−30 oro)",
        (c) => {
          G.F[c.f].gold -= 30;
        },
      ],
      [
        "Encomendarse a Dios",
        (c) => {
          if (R() < 0.5) {
            for (const t of TYP) c.p.u[t] = Math.floor(c.p.u[t] / 2);
            addLog(`La peste diezma la guarnición de ${c.p.name}.`, "bad");
          }
        },
      ],
    ],
  },
  {
    t: "Mercenarios alanos",
    d: () => "Una banda de jinetes alanos ofrece sus lanzas al mejor postor.",
    o: [
      [
        "Contratarlos (−60 oro, +4 caballería)",
        (c) => {
          G.F[c.f].gold -= 60;
          capOf(c.f).u.c += 4;
        },
      ],
      ["Rechazarlos", () => {}],
    ],
  },
  {
    t: "Juegos en el hipódromo",
    d: () => "La plebe pide carreras y espectáculos.",
    o: [
      [
        "Celebrar juegos (−40 oro, +10 orden)",
        (c) => {
          G.F[c.f].gold -= 40;
          owned(c.f).forEach((p) => (p.order += 10));
        },
      ],
      ["Ahorrar el oro", () => {}],
    ],
  },
];
async function runEvent(ev) {
  const c = { f: ME, p: pick(owned(ME)) };
  await modal(
    ev.t,
    `<p>${ev.d(c)}</p>`,
    ev.o.map(([t, fn]) => ({
      t,
      fn: () => {
        fn(c);
        owned(ME).forEach((p) => (p.order = clamp(p.order, 0, 100)));
      },
    })),
  );
}
async function inboxItem(it) {
  const g = it.from;
  if (!alive(g) || !alive(ME)) return;
  const rn = `${ttl(ruler(g))} ${ruler(g).n} de ${CIV[g].s}`;
  if (it.k === "peace" && G.st[g][ME] === "guerra")
    await modal("Oferta de paz", `<p>${rn} ofrece la paz.</p>`, [
      { t: "Aceptar la paz", fn: () => makePeace(ME, g), cls: "gold" },
      { t: "Rechazar", fn: () => relAdd(ME, g, -5) },
    ]);
  if (it.k === "ally" && G.st[g][ME] === "paz")
    await modal("Propuesta de alianza", `<p>${rn} propone una alianza.</p>`, [
      { t: "Sellar la alianza", fn: () => ally(ME, g), cls: "gold" },
      { t: "Rechazar", fn: () => relAdd(ME, g, -5) },
    ]);
  if (it.k === "marry") {
    const a = G.C[it.a],
      b = G.C[it.b];
    if (!a?.alive || !b?.alive || a.sp != null || b.sp != null || a.f !== g || b.f !== ME) return;
    await modal(
      "Propuesta de matrimonio",
      `<p>${rn} propone casar a ${a.n} (${a.age}) con tu ${b.sex === "m" ? "pariente" : "parienta"} ${b.n} (${b.age}). ${a.n} vendría a vivir a tu corte.</p>`,
      [
        { t: "Aceptar la boda", fn: () => marryAcross(b, a), cls: "gold" },
        { t: "Rechazar", fn: () => relAdd(ME, g, -10) },
      ],
    );
  }
}
async function startTurn() {
  if (!G || G.over || !alive(ME) || G.evY[ME] === G.year) return;
  G.evY[ME] = G.year;
  const box = G.inbox[ME] || [];
  G.inbox[ME] = [];
  for (const it of box) await inboxItem(it);
  await OC.emitir("inicioTurno", ME);
  if (G.year > 410 && R() < 0.45) {
    const ev = pick(EVENTS.filter((e) => !e.ok || e.ok(ME)));
    if (ev) await runEvent(ev);
  }
  ui();
  save();
}
