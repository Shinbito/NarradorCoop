/* ---------- SANGRE Y BRUTALIDAD en las batallas (Opciones · General · Sangre) ----------
   OPC.v.sangre: 'no' | 'si' | 'brutal'.
   - Cada caído (BT.dead, batalla.js) deja una mancha de sangre donde cae; con «brutal», además charcos
     grandes, salpicaduras y restos (brazos, piernas y vísceras), y los golpes también manchan el suelo
     bajo los pelotones que pierden hombres: los campos donde más se pelea acaban empapados.
   - Vista clásica (2D): las manchas se pintan en el fondo del campo (BT.bg), así quedan bajo las tropas.
   - Vista 3D: manchas planas (InstancedMesh) sobre el relieve y restos pequeños (cajitas), con topes.
   Se engancha envolviendo drawBattle (cada cuadro mira qué caídos son nuevos). Globales con prefijo sgr / SGR. */
const SGR = { bt: null, nDead: 0, nU: new Map(), m3: null, esc: null };
const SGR_TOPE = { si: { manchas: 700, restos: 0 }, brutal: { manchas: 3200, restos: 1400 } };
const SGR_ROJOS = ["#5c0b0b", "#6e0f0f", "#7d1212", "#4a0808", "#8a1616"];
const sgrModo = () => (typeof OPC !== "undefined" ? OPC.v.sangre || "si" : "si");
let sgrSem = 1;
const sgrR = () => ((sgrSem = (sgrSem * 16807) % 2147483647) / 2147483647);

/* ---------- 2D: sobre el fondo del campo ---------- */
function sgr2D(px, py, fuerza, brutal) {
  const bg = BT && BT.bg;
  if (!bg) return;
  const c = bg.getContext("2d"),
    r = (brutal ? 4 + fuerza * 6 : 2 + fuerza * 2.2) * (0.7 + sgrR() * 0.6);
  c.save();
  c.globalAlpha = brutal ? 0.75 : 0.55;
  c.fillStyle = SGR_ROJOS[(sgrR() * SGR_ROJOS.length) | 0];
  c.beginPath();
  c.ellipse(px, py, r * 1.3, r * 0.8, sgrR() * 3, 0, Math.PI * 2);
  c.fill();
  /* salpicaduras */
  const n = brutal ? 4 + ((sgrR() * 5) | 0) : 1 + ((sgrR() * 2) | 0);
  for (let k = 0; k < n; k++) {
    const a = sgrR() * 6.283,
      d = r + sgrR() * r * (brutal ? 2.2 : 1.2);
    c.fillRect(Math.round(px + Math.cos(a) * d), Math.round(py + Math.sin(a) * d * 0.7), brutal ? 2 : 1, brutal ? 2 : 1);
  }
  /* restos: un brazo o una pierna (palito claro con punta roja) o vísceras (bultito rosado) */
  if (brutal && fuerza >= 1 && sgrR() < 0.55) {
    c.globalAlpha = 1;
    const ox = px + (sgrR() - 0.5) * 10,
      oy = py + (sgrR() - 0.5) * 7;
    if (sgrR() < 0.55) {
      const hz = sgrR() < 0.5;
      c.fillStyle = "#d9a066";
      c.fillRect(Math.round(ox), Math.round(oy), hz ? 4 : 1, hz ? 1 : 4);
      c.fillStyle = "#8a1616";
      c.fillRect(Math.round(ox + (hz ? 4 : 0)), Math.round(oy + (hz ? 0 : 4)), 1, 1);
    } else {
      c.fillStyle = "#b0304a";
      c.fillRect(Math.round(ox), Math.round(oy), 2, 2);
      c.fillStyle = "#e07a8c";
      c.fillRect(Math.round(ox + 1), Math.round(oy), 1, 1);
      c.fillStyle = "#7a1a2a";
      c.fillRect(Math.round(ox + 2), Math.round(oy + 1), 2, 1);
    }
  }
  c.restore();
}

/* ---------- 3D: manchas planas y restos ---------- */
function sgr3DMontar() {
  if (typeof B3D === "undefined" || !B3D.scene || typeof THREE === "undefined") return null;
  if (SGR.m3 && SGR.m3.scene === B3D.scene) return SGR.m3;
  sgr3DQuitar();
  const T = SGR_TOPE.brutal,
    gm = new THREE.CircleGeometry(0.5, 8);
  gm.rotateX(-Math.PI / 2);
  const mm = new THREE.MeshLambertMaterial({ color: "#ffffff", transparent: true, opacity: 0.88, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
    man = new THREE.InstancedMesh(gm, mm, T.manchas),
    gr = new THREE.BoxGeometry(1, 1, 1),
    mr = new THREE.MeshLambertMaterial({ color: "#ffffff", flatShading: true }),
    res = new THREE.InstancedMesh(gr, mr, T.restos);
  man.count = 0;
  res.count = 0;
  man.renderOrder = 1;
  man.frustumCulled = res.frustumCulled = false;
  B3D.scene.add(man, res);
  SGR.m3 = { scene: B3D.scene, man, res, gm, mm, gr, mr, M4: new THREE.Matrix4(), Q: new THREE.Quaternion(), V: new THREE.Vector3(), Sv: new THREE.Vector3(), Y: new THREE.Vector3(0, 1, 0), col: new THREE.Color() };
  return SGR.m3;
}
function sgr3DQuitar() {
  const m = SGR.m3;
  if (!m) return;
  try {
    m.scene.remove(m.man, m.res);
    m.gm.dispose();
    m.mm.dispose();
    m.gr.dispose();
    m.mr.dispose();
  } catch (_) {}
  SGR.m3 = null;
}
function sgr3D(x, y, fuerza, brutal) {
  const m = sgr3DMontar();
  if (!m) return;
  const T = SGR_TOPE[brutal ? "brutal" : "si"],
    h = typeof b3dAlt === "function" ? b3dAlt(x, y) : 0;
  /* mancha (con tope: al llenarse, las nuevas reemplazan a las más viejas) */
  const pon = (px, py, s) => {
    const i = m.man.count < T.manchas ? m.man.count++ : (SGR.rot3 = ((SGR.rot3 || 0) + 1) % T.manchas);
    m.Q.setFromAxisAngle(m.Y, sgrR() * 6.283);
    m.M4.compose(m.V.set(px - BW / 2, h + 0.012 + i * 1e-6, py - BH / 2), m.Q, m.Sv.set(s * (1 + sgrR() * 0.5), 1, s));
    m.man.setMatrixAt(i, m.M4);
    m.man.setColorAt(i, m.col.set(SGR_ROJOS[(sgrR() * SGR_ROJOS.length) | 0]));
  };
  const r = brutal ? 0.3 + fuerza * 0.38 : 0.14 + fuerza * 0.12;
  pon(x, y, r * (0.7 + sgrR() * 0.6));
  if (brutal) for (let k = 0; k < 4; k++) pon(x + (sgrR() - 0.5) * r * 3.2, y + (sgrR() - 0.5) * r * 3.2, r * (0.25 + sgrR() * 0.4));
  m.man.instanceMatrix.needsUpdate = true;
  if (m.man.instanceColor) m.man.instanceColor.needsUpdate = true;
  /* restos */
  if (brutal && fuerza >= 1 && sgrR() < 0.6) {
    const n = 1 + ((sgrR() * 2.5) | 0);
    for (let k = 0; k < n; k++) {
      const i = m.res.count < T.restos ? m.res.count++ : (SGR.rotR = ((SGR.rotR || 0) + 1) % T.restos),
        miembro = sgrR() < 0.5,
        px = x + (sgrR() - 0.5) * 0.5,
        py = y + (sgrR() - 0.5) * 0.5;
      m.Q.setFromAxisAngle(m.Y, sgrR() * 6.283);
      if (miembro) m.Sv.set(0.11 + sgrR() * 0.05, 0.035, 0.035);
      else m.Sv.set(0.05 + sgrR() * 0.04, 0.03, 0.05 + sgrR() * 0.03);
      m.M4.compose(m.V.set(px - BW / 2, (typeof b3dAlt === "function" ? b3dAlt(px, py) : 0) + 0.02, py - BH / 2), m.Q, m.Sv);
      m.res.setMatrixAt(i, m.M4);
      m.res.setColorAt(i, m.col.set(miembro ? (sgrR() < 0.6 ? "#d9a066" : "#b98652") : ["#a3243b", "#c2405a", "#7a1a2a"][(sgrR() * 3) | 0]));
    }
    m.res.instanceMatrix.needsUpdate = true;
    if (m.res.instanceColor) m.res.instanceColor.needsUpdate = true;
  }
}

/* ---------- cada cuadro: caídos nuevos y golpes ---------- */
function sgrMancha(px, py, fuerza) {
  const modo = sgrModo();
  if (modo === "no") return;
  const brutal = modo === "brutal";
  sgr2D(px, py, fuerza, brutal);
  sgr3D(px / TS, py / TS, fuerza, brutal);
}
function sgrTick() {
  if (!BT) {
    if (SGR.bt) {
      SGR.bt = null;
      sgr3DQuitar();
    }
    return;
  }
  if (SGR.bt !== BT) {
    SGR.bt = BT;
    SGR.nDead = (BT.dead || []).length;
    SGR.ult = (BT.dead || [])[SGR.nDead - 1] || null;
    SGR.nU = new Map();
    sgrSem = 1 + ((Math.random() * 1e6) | 0);
    sgr3DQuitar();
  }
  if (sgrModo() === "no") return;
  /* BT.dead se recorta a 500 por delante: se sigue al último caído ya manchado, no a un índice */
  const D = BT.dead || [];
  if (D.length) {
    const i0 = SGR.ult ? D.lastIndexOf(SGR.ult) + 1 : SGR.nDead;
    for (let i = i0; i < D.length; i++) if (!D[i].std) sgrMancha(D[i].x + 3, D[i].y + 2, 1);
    SGR.ult = D[D.length - 1];
  }
  SGR.nDead = D.length;
  /* brutalidad: los golpes manchan el suelo bajo los pelotones que pierden hombres */
  if (sgrModo() === "brutal")
    for (const u of BT.units || []) {
      if (u.x < 0) continue;
      const n0 = SGR.nU.get(u.id);
      SGR.nU.set(u.id, u.n);
      if (n0 == null || u.n >= n0) continue;
      const k = Math.min(4, Math.ceil((n0 - u.n) / 2));
      for (let j = 0; j < k; j++) sgrMancha(u.x * TS + (sgrR() - 0.5) * TS * 1.4, u.y * TS + (sgrR() - 0.5) * TS, 0.5);
    }
}
if (typeof drawBattle === "function") {
  const sgrDB0 = drawBattle;
  drawBattle = function () {
    try {
      sgrTick();
    } catch (e) {
      console.error(e);
    }
    return sgrDB0.apply(this, arguments);
  };
}
