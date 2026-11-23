/* ---------- ganchos: el contrato entre sistemas ----------
   Cada sistema (narrativa, combate, tecnología, economía, diplomacia, interfaz)
   vive en sus propios archivos y se engancha al núcleo SOLO a través de OC.
   Así varios desarrolladores pueden trabajar a la vez sin pisarse.
   Ver docs/CONTRATO.md para la lista de eventos, cálculos y secciones. */
const OC = {
  _ev: {},
  _mod: {},
  acciones: {},
  paneles: [],
  secciones: { prov: [], dyn: [], dip: [] },

  /* --- eventos: OC.on('finAnio', async (anio) => {...}) --- */
  on(ev, fn) {
    (this._ev[ev] = this._ev[ev] || []).push(fn);
  },
  async emitir(ev, ...a) {
    for (const fn of this._ev[ev] || []) {
      try {
        await fn(...a);
      } catch (e) {
        console.error("[OC] evento", ev, e);
      }
    }
  },
  emitirSync(ev, ...a) {
    for (const fn of this._ev[ev] || []) {
      try {
        fn(...a);
      } catch (e) {
        console.error("[OC] evento", ev, e);
      }
    }
  },

  /* --- modificadores: OC.mod('rendimiento', (y, ctx) => ({...y, g: y.g + 1})) ---
     prio menor se aplica antes. Un modificador que devuelve undefined no cambia el valor. */
  mod(nombre, fn, prio = 0) {
    const l = (this._mod[nombre] = this._mod[nombre] || []);
    l.push({ fn, prio });
    l.sort((a, b) => a.prio - b.prio);
  },
  calc(nombre, valor, ctx = {}) {
    for (const { fn } of this._mod[nombre] || []) {
      try {
        const v = fn(valor, ctx);
        if (v !== undefined) valor = v;
      } catch (e) {
        console.error("[OC] calc", nombre, e);
      }
    }
    return valor;
  },

  /* --- acciones de botones: <button data-act="nombre-valor"> ---
     fn(valor, boton). Por defecto solo se ejecuta en tu turno; {libre:true} siempre.
     Tras la acción se llama a ui() salvo que fn devuelva false. */
  accion(nombre, fn, opts = {}) {
    this.acciones[nombre] = { fn, libre: !!opts.libre };
  },

  /* --- pestañas nuevas del panel de mando ---
     OC.panel({id:'tec', titulo:'Ciencia', orden:40, render:(dis)=>html}) */
  panel(p) {
    this.paneles = this.paneles.filter((x) => x.id !== p.id);
    this.paneles.push({ orden: 50, ...p });
    this.paneles.sort((a, b) => a.orden - b.orden);
  },

  /* --- secciones dentro de pestañas existentes (prov, dyn, dip) ---
     OC.seccion('prov', {id:'edificios', orden:30, render:(ctx, dis)=>html})
     ctx en 'prov' = {p, f, mine, F}; en 'dyn' y 'dip' = {F, r} */
  seccion(panelId, s) {
    const l = (this.secciones[panelId] = this.secciones[panelId] || []);
    const i = l.findIndex((x) => x.id === s.id);
    if (i >= 0) l.splice(i, 1);
    l.push({ orden: 50, ...s });
    l.sort((a, b) => a.orden - b.orden);
  },
  renderSecciones(panelId, ctx, dis) {
    return (this.secciones[panelId] || [])
      .filter((s) => !s.visible || s.visible(ctx))
      .map((s) => {
        try {
          return s.render(ctx, dis) || "";
        } catch (e) {
          console.error("[OC] seccion", panelId, s.id, e);
          return "";
        }
      })
      .join("");
  },

  /* --- estado propio de cada sistema dentro de G (se guarda y se sincroniza online) ---
     const T = OC.estado('tec', () => ({...})). Crea G.tec si falta (partidas antiguas). */
  estado(clave, init) {
    if (!G) return null;
    if (G[clave] === undefined) G[clave] = init();
    return G[clave];
  },

  /* --- recursos: la economía puede añadir más con OC.recurso({...}) ---
     oro y comida se guardan en F.gold / F.food; el resto en F.res[id]. */
  recursos: [
    { id: "oro", nombre: "Oro", icono: "◉" },
    { id: "comida", nombre: "Comida", icono: "❦" },
  ],
  recurso(r) {
    this.recursos = this.recursos.filter((x) => x.id !== r.id);
    this.recursos.push(r);
  },
  saldo(f, id) {
    const F = G.F[f];
    if (id === "oro") return F.gold;
    if (id === "comida") return F.food;
    return (F.res && F.res[id]) || 0;
  },
  sumar(f, id, v) {
    const F = G.F[f];
    if (id === "oro") F.gold += v;
    else if (id === "comida") F.food += v;
    else {
      F.res = F.res || {};
      F.res[id] = (F.res[id] || 0) + v;
    }
  },
  /* coste = {oro: 40, madera: 10, ...} */
  puedePagar(f, coste) {
    return Object.entries(coste || {}).every(([id, v]) => this.saldo(f, id) >= v);
  },
  pagar(f, coste) {
    if (!this.puedePagar(f, coste)) return false;
    for (const [id, v] of Object.entries(coste || {})) this.sumar(f, id, -v);
    return true;
  },
  ganar(f, bolsa) {
    for (const [id, v] of Object.entries(bolsa || {})) this.sumar(f, id, v);
  },
  textoCoste(coste) {
    return Object.entries(coste || {})
      .filter(([, v]) => v)
      .map(([id, v]) => `${v} ${(this.recursos.find((r) => r.id === id)?.nombre || id).toLowerCase()}`)
      .join(" · ");
  },
};
