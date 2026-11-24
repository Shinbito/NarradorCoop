/* Prueba del sistema BATALLA 3D: vista isométrica ortográfica girable (Three.js) sobre la batalla táctica.
   - Batallas en los tres modos (t3, t1, rt) con la vista 3D: despliegue, selección tocando en 3D, órdenes
     de mover y de atacar por rayos, arrastre de una unidad, selección por rectángulo, giro libre (⟲ ⟳, Q/E),
     zoom, ejecución de turnos y cierre (la escena se libera).
   - Batallas automáticas completas en 3D (con murallas, río y lluvia) sin errores.
   - Batalla grande con tres pueblos (miles de figuras): fps aproximados y coste del fotograma.
   - Móvil (390×844, táctil): toque para elegir, pellizco y giro con dos dedos.
   - Sin WebGL: cae a la vista clásica sin errores.
   Uso:  node pruebas/batalla3d.js            (capturas en pruebas/capturas/batalla3d-*.png)
         node pruebas/batalla3d.js exportar   (además escribe assets/batalla3d/: modelos, paleta y JSON) */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const raiz = path.resolve(__dirname, "..");
const capt = path.join(__dirname, "capturas");
fs.mkdirSync(capt, { recursive: true });
const EXPORTAR = process.argv.includes("exportar");
const ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
let fallos = 0;
const ok = (c, m) => {
  console.log((c ? "  ✓ " : "  ✗ ") + m);
  if (!c) fallos++;
};

async function nueva(browser, opts, errores, sinGL) {
  const ctx = await browser.newContext(opts);
  if (sinGL)
    await ctx.addInitScript(() => {
      const g = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t, ...a) {
        if (/webgl/i.test(String(t))) return null;
        return g.call(this, t, ...a);
      };
    });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errores.push("pageerror: " + (e.stack || e.message)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/fonts\.g|ERR_|net::/.test(m.text())) errores.push("console: " + m.text());
  });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto("file://" + path.join(raiz, "index.html"));
  await page.evaluate(() => localStorage.clear());
  await page.waitForTimeout(250);
  await page.click('[data-act="s-new"]');
  await page.waitForTimeout(80);
  await page.click('[data-act="s-civ-0"]');
  await page.waitForTimeout(80);
  await page.click('[data-act="s-go"]');
  await page.waitForTimeout(400);
  for (let k = 0; k < 30; k++) {
    const m = await page.evaluate(() => document.getElementById("modal").classList.contains("show"));
    if (!m) break;
    await page.evaluate(() => {
      const bs = [...document.querySelectorAll("#modalc button")].filter((b) => !b.disabled);
      (bs.find((b) => /autom/i.test(b.textContent)) || bs[0])?.click();
    });
    await page.waitForTimeout(100);
  }
  return page;
}
/* abre una batalla táctica que manda el jugador (bando 0) */
async function abrir(page, modo, o = {}) {
  await page.evaluate(
    ([modo, o]) => {
      window.__tac = null;
      cmbTactica(
        { f: ME, u: { ...cmbVacio(), l: 3, i: 4, a: 3, c: 2, x: 1, ...(o.A || {}) }, gen: G.F[ME].ruler },
        { f: o.fd ?? 6, u: { ...cmbVacio(), i: 5, l: 2, a: 2, c: 2, ele: 1, inm: 1, ...(o.D || {}) }, gen: null },
        { terreno: o.terreno || "vado", fort: o.fort || 0, clima: o.clima || "despejado", hora: o.hora || "a media mañana", nombreLugar: "Prueba 3D", ...(o.ctx || {}) },
        modo,
      ).then((r) => (window.__tac = r));
    },
    [modo, o],
  );
  await page.waitForTimeout(600);
}
/* coordenadas de pantalla de un punto del campo */
const pant = (page, x, y, h = 0) =>
  page.evaluate(
    ([x, y, h]) => {
      const r = B3D.wrap.getBoundingClientRect(),
        p = b3dPantalla(x, y, h);
      return { x: r.left + p.x, y: r.top + p.y };
    },
    [x, y, h],
  );
const esperaCam = (page) => page.waitForFunction(() => Math.abs(B3D.cam.az - B3D.cam.azT) < 1e-3 && Math.abs(B3D.cam.zoom - B3D.cam.zoomT) < 1e-3, null, { timeout: 8000 });

(async () => {
  const browser = await chromium.launch({ args: ARGS });
  const errores = [];

  /* ---------- 1. escritorio: los tres modos con la vista 3D ---------- */
  console.log("\n1. Escritorio (1400×900): batallas t3, t1 y rt en 3D");
  const page = await nueva(browser, { viewport: { width: 1400, height: 900 } }, errores);
  ok(await page.evaluate(() => typeof THREE !== "undefined" && THREE.REVISION === "160"), "Three.js r160 local cargado (vendor/three.min.js)");
  /* sin GPU (SwiftShader) la vista automática es la clásica; el botón «Vista» pasa a 3D */
  await abrir(page, "t1");
  const auto = await page.evaluate(() => ({ soft: B3D.soft, gpu: B3D.gpu, v: b3dVista(), on: document.getElementById("battle").classList.contains("b3d-on") }));
  ok(auto.soft && auto.v === "2d" && !auto.on, `con WebGL por software («${auto.gpu.slice(0, 40)}») la vista automática es la clásica`);
  await page.click('[data-b3d="vista"]');
  await page.waitForTimeout(400);
  ok(await page.evaluate(() => B3D.pref.vista === "3d" && document.getElementById("battle").classList.contains("b3d-on") && !!B3D.scene), "«Vista: 3D» activa la vista 3D y se recuerda");
  await page.evaluate(() => battleAct("flee"));
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector("#modalc button")?.click());
  await page.waitForTimeout(200);
  for (const modo of ["t3", "t1", "rt"]) {
    console.log(`  — modo ${modo}`);
    await abrir(page, modo, { fort: modo === "t1" ? 2 : 0, A: modo === "t1" ? { ari: 2, cat: 1, tor: 1 } : {} });
    await page.waitForTimeout(400);
    const e0 = await page.evaluate(() => ({
      on: document.getElementById("battle").classList.contains("b3d-on"),
      ok: B3D.ok,
      wrap: getComputedStyle(B3D.wrap).display,
      clasico: getComputedStyle(document.getElementById("bscroll")).display,
      escena: !!B3D.scene && B3D.bt === BT,
      dc: B3D.stats.dc,
      tam: B3D.tam,
    }));
    ok(e0.on && e0.ok && e0.wrap === "block" && e0.clasico === "none", `vista 3D activa y lienzo clásico oculto (${modo})`);
    ok(e0.escena && e0.dc > 4, `la escena se construye y se dibuja (${e0.dc} llamadas, ${e0.tam && e0.tam.join("×")} px de render)`);
    if (modo === "t3") await page.screenshot({ path: path.join(capt, "batalla3d-despliegue.png") });
    /* despliegue: tocar una unidad propia sin desplegar y luego el suelo de la franja */
    const dep = await page.evaluate(() => {
      const u = BT.units.find((o) => !o.side && o.x < 0);
      BT.sel = u.id;
      BT.sels = [u.id];
      return u.id;
    });
    const pz = await pant(page, 6, 4);
    await page.mouse.click(pz.x, pz.y);
    await page.waitForTimeout(150);
    const dp = await page.evaluate((id) => {
      const u = bU(id);
      return { x: u.x, y: u.y };
    }, dep);
    ok(Math.abs(dp.x - 6) < 0.5 && Math.abs(dp.y - 4) < 0.5, `despliegue tocando el suelo en 3D coloca la unidad (${dp.x.toFixed(2)}, ${dp.y.toFixed(2)})`);
    await page.evaluate(() => battleAct("go"));
    await page.waitForTimeout(300);
    if (modo === "rt") await page.evaluate(() => (BT.paused = true));
    /* seleccionar otra unidad tocándola */
    const sel = await page.evaluate(() => {
      const u = BT.units.filter((o) => !o.side && act(o) && o.x >= 0 && o.id !== BT.sel).sort((a, b) => a.y - b.y)[2];
      return { id: u.id, x: u.x, y: u.y, antes: BT.sel };
    });
    let p = await pant(page, sel.x, sel.y, 0.15);
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(150);
    const s1 = await page.evaluate(() => BT.sel);
    ok(s1 === sel.id && s1 !== sel.antes, `tocar una unidad en 3D la selecciona (BT.sel ${sel.antes} → ${s1})`);
    /* orden de mover: tocar el suelo */
    /* destino libre (sin unidades cerca) y al alcance de la unidad en los modos por turnos */
    const dest = await page.evaluate(
      ([id, rt]) => {
        const u = bU(id),
          libre = (x, y) => !BT.units.some((o) => act(o) && o.x >= 0 && Math.hypot(o.x - x, o.y - y) < rad(o) + 1.2);
        if (rt && libre(16, 7)) return { x: 16, y: 7 };
        for (const r of [2.5, 2, 3, 1.5])
          for (let a = 0; a < 6.28; a += 0.4) {
            const x = Math.round((u.x + Math.cos(a) * Math.min(r, reach(u) - 0.3)) * 10) / 10,
              y = Math.round((u.y + Math.sin(a) * Math.min(r, reach(u) - 0.3)) * 10) / 10;
            if (x > 0.5 && x < 20 && y > 0.5 && y < BH - 0.5 && libre(x, y)) return { x, y };
          }
        return { x: u.x + 1.5, y: u.y };
      },
      [sel.id, modo === "rt"],
    );
    p = await pant(page, dest.x, dest.y);
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(150);
    const o1 = await page.evaluate((id) => {
      const u = bU(id),
        o = u.plan[0].o;
      return o && { x: o.x, y: o.y, tg: o.tg };
    }, sel.id);
    ok(o1 && o1.tg == null && Math.hypot(o1.x - dest.x, o1.y - dest.y) < 0.6, `orden de mover por rayo: destino (${o1 && o1.x.toFixed(2)}, ${o1 && o1.y.toFixed(2)}) ≈ (${dest.x}, ${dest.y})`);
    /* orden de atacar: tocar un enemigo (con ⚔ activado) */
    if (modo === "t3") await page.evaluate(() => (BT.slot = 0));
    const en = await page.evaluate(() => {
      const e = BT.units.filter((o) => o.side && act(o) && o.x >= 0).sort((a, b) => a.y - b.y)[1];
      return { id: e.id, x: e.x, y: e.y };
    });
    await page.click("#atkb");
    p = await pant(page, en.x, en.y, 0.15);
    await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(150);
    const o2 = await page.evaluate((id) => {
      const o = bU(id).plan[0].o;
      return o && o.tg;
    }, sel.id);
    ok(o2 === en.id, `⚔ y tocar un enemigo en 3D da la orden de atacar (tg ${o2} = ${en.id})`);
    /* arrastrar desde una unidad propia hasta el suelo: orden de grupo */
    if (modo !== "t3") {
      const u3 = await page.evaluate(() => {
        const u = BT.units.filter((o) => !o.side && act(o) && o.x >= 0 && !o.gen).sort((a, b) => b.y - a.y)[0];
        return { id: u.id, x: u.x, y: u.y };
      });
      const a = await pant(page, u3.x, u3.y, 0.15),
        b = await pant(page, u3.x + 3, u3.y - 1);
      /* el arrastre va en una sola tarea: con la GPU por software un fotograma lento podría hacer saltar
         la pulsación larga (420 ms) entre dos eventos y convertir el arrastre en «sumar a la selección» */
      await page.evaluate(
        ([a, b]) => {
          const w = B3D.wrap,
            ev = (t, x, y) => w.dispatchEvent(new PointerEvent(t, { pointerId: 1, clientX: x, clientY: y, pointerType: "mouse", button: 0, buttons: t === "pointerup" ? 0 : 1, isPrimary: true, bubbles: true }));
          ev("pointerdown", a.x, a.y);
          for (let k = 1; k <= 8; k++) ev("pointermove", a.x + ((b.x - a.x) * k) / 8, a.y + ((b.y - a.y) * k) / 8);
          ev("pointerup", b.x, b.y);
        },
        [a, b],
      );
      await page.waitForTimeout(120);
      const o3 = await page.evaluate((id) => {
        const o = bU(id).plan[0].o;
        return o && { x: o.x, y: o.y };
      }, u3.id);
      ok(o3 && Math.hypot(o3.x - (u3.x + 3), o3.y - (u3.y - 1)) < 0.8, "arrastrar una unidad en 3D le da la orden de marchar");
    }
    /* selección por rectángulo (mayúsculas + arrastre sobre el suelo) */
    {
      const r = await page.evaluate(() => {
        const me = BT.units.filter((o) => !o.side && act(o) && o.x >= 0);
        const xs = me.map((o) => o.x),
          ys = me.map((o) => o.y);
        return { x0: Math.min(...xs) - 1.5, x1: Math.max(...xs) + 1.5, y0: Math.min(...ys) - 1.5, y1: Math.max(...ys) + 1.5, n: me.length };
      });
      const esq = [];
      for (const [x, y] of [
        [r.x0, r.y0],
        [r.x1, r.y0],
        [r.x0, r.y1],
        [r.x1, r.y1],
      ])
        esq.push(await pant(page, x, y));
      const sx0 = Math.min(...esq.map((q) => q.x)),
        sx1 = Math.max(...esq.map((q) => q.x)),
        sy0 = Math.min(...esq.map((q) => q.y)) - 20,
        sy1 = Math.max(...esq.map((q) => q.y));
      await page.keyboard.down("Shift");
      await page.mouse.move(sx0, sy0);
      await page.mouse.down();
      await page.mouse.move(sx1, sy1, { steps: 6 });
      await page.mouse.up();
      await page.keyboard.up("Shift");
      await page.waitForTimeout(120);
      const n = await page.evaluate(() => BT.sels.length);
      ok(n >= Math.min(3, r.n), `rectángulo de selección proyectado: ${n} unidades`);
    }
    /* giro libre: botones y teclas Q/E a pasos de 22,5°, siempre con la misma inclinación */
    if (modo === "rt") {
      await page.evaluate(() => {
        BT.sels = [];
        B3D.cam.zoomT = 1;
      });
      const az0 = await page.evaluate(() => B3D.cam.azT);
      for (let k = 0; k < 4; k++) {
        await esperaCam(page);
        await page.waitForTimeout(150);
        await page.screenshot({ path: path.join(capt, `batalla3d-giro${k * 22.5}.png`) });
        if (k < 3) await page.click('[data-b3d="der"]');
      }
      const az1 = await page.evaluate(() => B3D.cam.azT);
      ok(Math.abs(az1 - az0 - (3 * Math.PI) / 8) < 1e-6, "⟳ gira la vista en pasos de 22,5° (4 capturas)");
      await page.keyboard.press("q");
      await page.keyboard.press("Q");
      await page.keyboard.press("e");
      const az2 = await page.evaluate(() => B3D.cam.azT);
      ok(Math.abs(az2 - (az1 - Math.PI / 8)) < 1e-6, "teclas Q/E giran 22,5°");
      const inc = await page.evaluate(() => {
        const c = B3D.camera,
          d = c.getWorldDirection(new THREE.Vector3());
        return (Math.asin(-d.y) * 180) / Math.PI;
      });
      ok(Math.abs(inc - 30) < 0.5 && (await page.evaluate(() => B3D.camera.isOrthographicCamera)), `cámara ortográfica con inclinación fija (${inc.toFixed(1)}°)`);
      /* zoom: botones del panel y rueda */
      const z0 = await page.evaluate(() => B3D.cam.zoomT);
      await page.click('[data-act="b-zoom:in"]');
      const z1 = await page.evaluate(() => B3D.cam.zoomT);
      const c = await pant(page, 20, 12);
      await page.mouse.move(c.x, c.y);
      await page.mouse.wheel(0, -300);
      await page.waitForTimeout(100);
      const z2 = await page.evaluate(() => B3D.cam.zoomT);
      ok(z1 > z0 && z2 > z1, `zoom ortográfico con botones y rueda (${z0.toFixed(2)} → ${z1.toFixed(2)} → ${z2.toFixed(2)})`);
      /* desplazar arrastrando el suelo */
      const t0 = await page.evaluate(() => [B3D.cam.tx, B3D.cam.tz]);
      const g = await pant(page, 20, 20);
      await page.mouse.move(g.x, g.y);
      await page.mouse.down();
      await page.mouse.move(g.x - 120, g.y - 40, { steps: 5 });
      await page.mouse.up();
      const t1 = await page.evaluate(() => [B3D.cam.tx, B3D.cam.tz]);
      ok(Math.hypot(t1[0] - t0[0], t1[1] - t0[1]) > 1, "arrastrar el suelo desplaza la vista");
      /* seguir unidad y reiniciar */
      await page.evaluate(() => (BT.sel = BT.units.find((o) => !o.side && act(o)).id));
      await page.click('[data-b3d="seguir"]');
      await page.waitForTimeout(1200);
      const sg = await page.evaluate(() => {
        const u = bU(BT.sel);
        return Math.hypot(B3D.cam.tx - (u.x - BW / 2), B3D.cam.tz - (u.y - BH / 2));
      });
      ok(sg < 2.5, `«Seguir unidad» centra la cámara en la elegida (a ${sg.toFixed(2)} casillas)`);
      await page.screenshot({ path: path.join(capt, "batalla3d-cerca.png") });
      await page.click('[data-b3d="reset"]');
      await esperaCam(page);
      const rs = await page.evaluate(() => ({ s: B3D.cam.seguir, z: B3D.cam.zoomT, a: Math.abs(Math.sin((B3D.cam.azT - B3D.az0) / 2)) }));
      ok(!rs.s && rs.z === 1 && rs.a < 1e-6, "«Reiniciar vista» vuelve al giro y zoom iniciales");
      /* la batalla corre en 3D: 4 s de simulación */
      await page.evaluate(() => {
        BT.paused = false;
        BT.speed = 4;
      });
      const q0 = await page.evaluate(() => [B3D.stats.frames, performance.now()]);
      await page.waitForTimeout(4000);
      const fpsN = await page.evaluate((q0) => ((B3D.stats.frames - q0[0]) * 1000) / (performance.now() - q0[1]), q0);
      console.log(`  batalla normal: ≈ ${fpsN.toFixed(1)} fps en SwiftShader (calidad alta, ${await page.evaluate(() => B3D.stats.fig)} figuras)`);
      await page.screenshot({ path: path.join(capt, "batalla3d-combate.png") });
      const fr = await page.evaluate(() => ({ t: BT.t, fig: B3D.stats.fig }));
      ok(fr.t > 1 && fr.fig > 100, `la simulación avanza con la vista 3D (t = ${fr.t.toFixed(1)} s, ${fr.fig} figuras)`);
      /* vista clásica y vuelta */
      await page.click('[data-b3d="vista"]');
      await page.waitForTimeout(200);
      const cl = await page.evaluate(() => ({ on: document.getElementById("battle").classList.contains("b3d-on"), d: getComputedStyle(document.getElementById("bscroll")).display, esc: B3D.scene }));
      ok(!cl.on && cl.d !== "none" && cl.esc === null, "«Vista: clásica» vuelve al lienzo 2D y libera la escena 3D");
      await page.click('[data-b3d="vista"]');
      await page.waitForTimeout(300);
      ok(await page.evaluate(() => !!B3D.scene && document.getElementById("battle").classList.contains("b3d-on")), "«Vista: 3D» reconstruye la escena");
    } else {
      /* ejecutar un turno con la vista 3D */
      await page.evaluate(() => battleAct("exec"));
      await page.waitForFunction(() => !BT || !BT.run, null, { timeout: 180000 });
      ok(await page.evaluate(() => !!BT && BT.turn === 2), `se ejecuta un turno ${modo} con la vista 3D`);
      if (modo === "t1") await page.screenshot({ path: path.join(capt, "batalla3d-murallas.png") });
    }
    /* retirada: se cierra la batalla y se libera la escena */
    await page.evaluate(() => battleAct("flee"));
    await page.waitForTimeout(300);
    for (let k = 0; k < 10; k++) {
      const m = await page.evaluate(() => document.getElementById("modal").classList.contains("show"));
      if (!m) break;
      await page.evaluate(() => document.querySelector("#modalc button")?.click());
      await page.waitForTimeout(100);
    }
    ok(await page.evaluate(() => !BT && B3D.scene === null), `al cerrar la batalla se libera la escena 3D (${modo})`);
  }

  /* ---------- 2. automáticas completas (la IA manda los dos bandos) ---------- */
  console.log("\n2. Batallas automáticas completas en 3D");
  for (const [modo, o] of [
    ["t3", { terreno: "colinas", clima: "lluvia", hora: "al alba" }],
    ["t1", { fort: 2, terreno: "bosque", hora: "por la tarde", A: { ari: 2, cat: 2, tor: 1 } }],
    ["rt", { terreno: "vado", clima: "niebla" }],
  ]) {
    /* calidad baja: con la GPU por software cada fotograma frena los turnos (que esperan entre fases) */
    await page.evaluate(() => (B3D.pref.cal = "baja"));
    await abrir(page, modo, { ...o, ctx: { auto: true, sinModal: true, velocidad: 16 } });
    let shot = false;
    for (let k = 0; k < 1600; k++) {
      await page.waitForTimeout(150);
      if (!shot && k === 12) {
        await page.screenshot({ path: path.join(capt, `batalla3d-auto-${modo}.png`) });
        shot = true;
      }
      if (await page.evaluate(() => !!window.__tac)) break;
    }
    const r = await page.evaluate(() => window.__tac && { gana: window.__tac.gana, fin: window.__tac.informe.fin, esc: B3D.scene });
    ok(r && r.gana != null && r.esc === null, `${modo} (${o.terreno}${o.fort ? ", murallas" : ""}${o.clima ? ", " + o.clima : ""}) termina: ${r && r.fin}`);
  }

  /* ---------- 2b. varios bandos (cmbTacticaMulti): asalto por dos flancos con refuerzos ---------- */
  console.log("\n2b. Varios bandos: asalto a la ciudad por dos flancos, aliado y refuerzos (tú, por el sur)");
  await page.evaluate(() => (B3D.pref.cal = "alta"));
  await page.evaluate(() => {
    window.__tac = null;
    const otros = G.activas.filter((f) => f !== ME),
      U = (o) => ({ ...cmbVacio(), ...o });
    cmbTacticaMulti(
      [
        { id: "yo", f: ME, bando: 0, dir: "S", u: U({ i: 5, l: 2, a: 2, c: 2 }), gen: G.F[ME].ruler },
        { id: "ali", f: otros[0], bando: 0, dir: "O", u: U({ i: 5, a: 2, c: 1, ari: 2, tor: 1 }), gen: null },
        { id: "guarnicion", f: otros[1], bando: 1, dir: "C", u: U({ i: 6, l: 2, a: 3 }), gen: null },
      ],
      {
        fort: 2,
        flancos: 2,
        terreno: "llanura",
        nombreLugar: "Prueba 3D",
        refuerzos: [{ ej: { id: "ref", f: otros[2] ?? otros[1], bando: 1, dir: "N", u: U({ c: 3, x: 2 }), gen: null }, dir: "N", llegada: 6 }],
      },
      "rt",
    ).then((r) => (window.__tac = r));
  });
  await page.waitForTimeout(900);
  const mb = await page.evaluate(() => ({
    on: !!B3D.scene && B3D.bt === BT,
    lado: b3dMiLado(),
    az0: B3D.az0,
    zonas: B3D.zonas.length,
    muro: !!B3D.muro && B3D.muro.torres.length,
    mios: BT.units.filter(mio).length,
    pueblos: new Set(BT.units.map((u) => u.f)).size,
  }));
  ok(mb.on && mb.lado === "S" && Math.abs(mb.az0 - Math.PI / 4) < 1e-6, `tu ejército llega por el sur: la vista empieza con tu lado abajo (giro ${((mb.az0 * 180) / Math.PI).toFixed(0)}°)`);
  ok(mb.zonas >= 3 && mb.muro >= 6, `zonas de despliegue por lado (${mb.zonas}) y recinto amurallado con ${mb.muro} torres`);
  await page.screenshot({ path: path.join(capt, "batalla3d-bandos-despliegue.png") });
  await page.evaluate(() => {
    battleAct("auto");
    battleAct("go");
    BT.paused = true;
  });
  await page.waitForTimeout(300);
  const mu = await page.evaluate(() => {
    const u = BT.units.filter((o) => mio(o) && act(o) && o.id !== BT.sel)[1];
    return { id: u.id, x: u.x, y: u.y };
  });
  const pmu = await pant(page, mu.x, mu.y, 0.15);
  await page.mouse.click(pmu.x, pmu.y);
  await page.waitForTimeout(150);
  ok((await page.evaluate(() => BT.sel)) === mu.id, "en la batalla de varios bandos se eligen tus unidades tocándolas");
  const ali = await page.evaluate(() => {
    const a = BT.units.find((o) => aliado(o) && !mio(o) && act(o));
    return a && { id: a.id, x: a.x, y: a.y };
  });
  if (ali) {
    const pa = await pant(page, ali.x, ali.y, 0.15);
    await page.mouse.click(pa.x, pa.y);
    await page.waitForTimeout(150);
    ok(await page.evaluate((id) => BT.sel !== id && !BT.sels.includes(id), ali.id), "las unidades aliadas no se pueden elegir");
  }
  await page.evaluate(() => {
    BT.paused = false;
    BT.speed = 4;
    BT.auto0 = true;
    aiOrders && BT.mios.forEach((s) => aiOrders(s));
  });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(capt, "batalla3d-bandos-asalto.png") });
  const mr = await page.evaluate(() => ({ t: BT && BT.t, ref: BT && BT.units.some((u) => u.lleg != null && act(u)), fig: B3D.stats.fig }));
  ok(mr.t > 1 && mr.fig > 100, `el asalto de varios bandos avanza en 3D (t = ${mr.t && mr.t.toFixed(1)} s, ${mr.fig} figuras)`);
  await page.evaluate(() => battleAct("flee"));
  await page.waitForTimeout(300);
  for (let k = 0; k < 10; k++) {
    const m = await page.evaluate(() => document.getElementById("modal").classList.contains("show"));
    if (!m) break;
    await page.evaluate(() => document.querySelector("#modalc button")?.click());
    await page.waitForTimeout(100);
  }
  ok(await page.evaluate(() => !BT && B3D.scene === null), "al acabar la batalla de varios bandos se libera la escena");

  /* ---------- 3. rendimiento: tres pueblos y miles de figuras ---------- */
  console.log("\n3. Rendimiento: batalla grande con tres pueblos (cmbTacticaMulti)");
  await page.evaluate(() => {
    B3D.pref.cal = "alta";
    window.__tac = null;
    const otros = G.activas.filter((f) => f !== ME),
      U = (o) => ({ ...cmbVacio(), ...o });
    cmbTacticaMulti(
      [
        { id: "a", f: ME, bando: 0, dir: "O", u: U({ l: 30, i: 40, a: 25, c: 15, x: 8, k: 8 }), gen: G.F[ME].ruler },
        { id: "b", f: otros[0], bando: 1, dir: "E", u: U({ i: 40, l: 15, a: 20, c: 15, ele: 4 }), gen: null },
        { id: "c", f: otros[1], bando: 2, dir: "N", u: U({ i: 35, l: 15, a: 15, c: 15 }), gen: null },
      ],
      { terreno: "colinas", nombreLugar: "Prueba 3D", auto: true, sinModal: true, velocidad: 1, oportunista: false },
      "rt",
    ).then((r) => (window.__tac = r));
  });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    window.__ms = [];
    const f0 = b3dFrame;
    b3dFrame = function (now) {
      const t = performance.now();
      f0(now);
      window.__ms.push(performance.now() - t);
    };
  });
  await page.waitForTimeout(2500);
  const fr0 = await page.evaluate(() => [B3D.stats.frames, performance.now()]);
  await page.waitForTimeout(3000);
  const rend = await page.evaluate((fr0) => {
    const ms = window.__ms.slice(-60).sort((a, b) => a - b);
    return { fps: ((B3D.stats.frames - fr0[0]) * 1000) / (performance.now() - fr0[1]), fig: B3D.stats.fig, dc: B3D.stats.dc, tri: B3D.stats.tri, med: ms[ms.length >> 1], cal: B3D.pref.cal, pueblos: new Set(BT.units.map((u) => u.f)).size };
  }, fr0);
  console.log(`  ${rend.fig} figuras · ${rend.dc} llamadas de dibujo · ${Math.round(rend.tri / 1000)} k triángulos · calidad ${rend.cal}`);
  console.log(`  ≈ ${rend.fps.toFixed(1)} fps en SwiftShader (GPU por software) · fotograma mediano ${rend.med.toFixed(1)} ms`);
  ok(rend.fig > 2000 && rend.pueblos >= 3, `miles de figuras de ${rend.pueblos} pueblos en pantalla con InstancedMesh`);
  ok(rend.dc < 60, "pocas llamadas de dibujo (una por modelo, no por figura)");
  ok(rend.fps > 0.2, "el render sigue vivo con la GPU por software");
  ok(rend.med < 40, "el trabajo de JavaScript por fotograma es moderado (matrices de miles de figuras)");
  await page.screenshot({ path: path.join(capt, "batalla3d-tres-pueblos.png") });
  /* calidad baja: sin sombras, menos figuras */
  await page.click('[data-b3d="cal"]');
  await page.waitForTimeout(800);
  const baja = await page.evaluate(() => ({ cal: B3D.pref.cal, som: B3D.ren.shadowMap.enabled, fig: B3D.stats.fig, blob: B3D.blob.visible }));
  ok(baja.cal === "baja" && !baja.som && baja.blob && baja.fig < rend.fig, `calidad baja: sin sombras, sombras simples y ${baja.fig} figuras`);
  await page.screenshot({ path: path.join(capt, "batalla3d-calidad-baja.png") });
  await page.evaluate(() => {
    B3D.pref.cal = "alta";
    battleAct("flee");
  });
  await page.waitForTimeout(300);

  /* ---------- 4. herramienta: exportar modelos y paleta ---------- */
  console.log("\n4. Exportación de modelos y paleta");
  const ex = await page.evaluate(() => {
    const r = b3dExportar(0);
    return r && { n: r.modelos.length, ids: r.modelos.map((m) => m.id), modelos: r.modelos, paleta: r.paleta, terreno: r.terreno, json: r.json };
  });
  ok(ex && ex.n >= 30 && ex.modelos.every((m) => m.png.length > 800), `vista previa PNG de ${ex && ex.n} modelos`);
  if (ex && EXPORTAR) {
    const dir = path.join(raiz, "assets", "batalla3d");
    fs.mkdirSync(dir, { recursive: true });
    const b64 = (u) => Buffer.from(u.split(",")[1], "base64");
    for (const m of ex.modelos) fs.writeFileSync(path.join(dir, `modelo-${m.id}.png`), b64(m.png));
    fs.writeFileSync(path.join(dir, "paleta.png"), b64(ex.paleta));
    fs.writeFileSync(path.join(dir, "terreno.png"), b64(ex.terreno));
    fs.writeFileSync(path.join(dir, "paleta.json"), JSON.stringify(ex.json, null, 2) + "\n");
    console.log(`  escritos ${ex.n + 3} archivos en assets/batalla3d/`);
  }
  await page.context().close();

  /* ---------- 5. móvil ---------- */
  console.log("\n5. Móvil (390×844, táctil)");
  const mov = await nueva(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, errores);
  await mov.evaluate(() => (B3D.pref.vista = "3d"));
  await abrir(mov, "rt");
  await mov.evaluate(() => battleAct("go"));
  await mov.waitForTimeout(300);
  await mov.evaluate(() => (BT.paused = true));
  const mm = await mov.evaluate(() => {
    const r = B3D.wrap.getBoundingClientRect();
    return { w: r.width, h: r.height, cal: B3D.pref.cal, ancho: document.documentElement.scrollWidth };
  });
  ok(mm.w > 300 && mm.h > 200 && mm.ancho <= 392, `el lienzo 3D cabe en el móvil (${Math.round(mm.w)}×${Math.round(mm.h)}, calidad ${mm.cal})`);
  const um = await mov.evaluate(() => {
    const u = BT.units.filter((o) => !o.side && act(o) && o.id !== BT.sel).sort((a, b) => a.y - b.y)[1];
    return { id: u.id, x: u.x, y: u.y };
  });
  const pm = await pant(mov, um.x, um.y, 0.15);
  await mov.touchscreen.tap(pm.x, pm.y);
  await mov.waitForTimeout(200);
  ok((await mov.evaluate(() => BT.sel)) === um.id, "un toque sobre una unidad la selecciona");
  /* dos dedos: pellizco y giro (eventos de puntero táctiles) */
  const dosDedos = async (a0, b0, a1, b1) => {
    await mov.evaluate(
      ([a0, b0, a1, b1]) => {
        const w = B3D.wrap,
          ev = (t, id, p) => w.dispatchEvent(new PointerEvent(t, { pointerId: id, clientX: p[0], clientY: p[1], pointerType: "touch", isPrimary: id === 11, bubbles: true }));
        ev("pointerdown", 11, a0);
        ev("pointerdown", 12, b0);
        for (let k = 1; k <= 6; k++) {
          const f = k / 6,
            l = (p, q) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
          ev("pointermove", 11, l(a0, a1));
          ev("pointermove", 12, l(b0, b1));
        }
        ev("pointerup", 11, a1);
        ev("pointerup", 12, b1);
      },
      [a0, b0, a1, b1],
    );
  };
  const wr = await mov.evaluate(() => {
    const r = B3D.wrap.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  });
  const zA = await mov.evaluate(() => B3D.cam.zoomT);
  await dosDedos([wr.cx - 40, wr.cy], [wr.cx + 40, wr.cy], [wr.cx - 90, wr.cy], [wr.cx + 90, wr.cy]);
  const zB = await mov.evaluate(() => B3D.cam.zoomT);
  ok(zB > zA * 1.5, `pellizco: zoom ${zA.toFixed(2)} → ${zB.toFixed(2)}`);
  const aA = await mov.evaluate(() => B3D.cam.azT);
  await dosDedos([wr.cx - 60, wr.cy], [wr.cx + 60, wr.cy], [wr.cx, wr.cy - 60], [wr.cx, wr.cy + 60]);
  const aB = await mov.evaluate(() => B3D.cam.azT);
  ok(Math.abs(Math.abs(aB - aA) - Math.PI / 2) < 0.05, `girar dos dedos 90° gira la vista lo mismo, sin pasos (${((Math.abs(aB - aA) * 180) / Math.PI).toFixed(1)}°)`);
  await mov.waitForTimeout(800);
  await mov.screenshot({ path: path.join(capt, "batalla3d-movil.png") });
  await mov.context().close();

  /* ---------- 6. sin WebGL: vista clásica ---------- */
  console.log("\n6. Sin WebGL");
  const sin = await nueva(browser, { viewport: { width: 1200, height: 800 } }, errores, true);
  await abrir(sin, "t1");
  await sin.waitForTimeout(400);
  const sg = await sin.evaluate(() => ({
    ok: B3D.ok,
    on: document.getElementById("battle").classList.contains("b3d-on"),
    bm: getComputedStyle(document.getElementById("bscroll")).display,
    w: getComputedStyle(document.getElementById("b3dwrap")).display,
    vis: document.querySelector('[data-b3d="vista"]').textContent,
    dis: document.querySelector('[data-b3d="vista"]').disabled,
  }));
  ok(sg.ok === false && !sg.on && sg.bm !== "none" && sg.w === "none", "sin WebGL se usa la vista clásica");
  ok(sg.dis && /clásica/.test(sg.vis), "el botón de vista indica «clásica» y queda deshabilitado");
  await sin.evaluate(() => battleAct("go"));
  await sin.evaluate(() => battleAct("exec"));
  await sin.waitForFunction(() => !BT || !BT.run, null, { timeout: 180000 });
  ok(await sin.evaluate(() => !!BT && BT.turn === 2), "la batalla clásica sigue funcionando");
  await sin.screenshot({ path: path.join(capt, "batalla3d-sin-webgl.png") });
  await sin.context().close();

  console.log("\nErrores de página:", errores.length ? "\n  " + errores.join("\n  ") : "ninguno");
  if (errores.length) fallos++;
  await browser.close();
  console.log(fallos ? `\n✗ ${fallos} fallos` : "\nOK sin errores");
  process.exit(fallos ? 1 : 0);
})();
