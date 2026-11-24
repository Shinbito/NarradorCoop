/* ---------- MAPA 3D: el mapa de campaña en vista isométrica con giro libre ----------
   Lienzo WebGL propio (#m3dgl) encima de #mapwrap. No dibuja nada por su cuenta: usa como textura el mapa que
   ya pinta la interfaz (#maphd: terreno, dueños, niebla, ciudades; #map: ejércitos, rutas, órdenes, selección)
   y la pone sobre un relieve hecho con las alturas del mapa (MAP.alt). Así todo lo que cambie en el mapa 2D
   (o lo que añadan otros sistemas) se ve igual en 3D.
   Cámara ortográfica con inclinación fija de 30° (como la batalla 3D) y GIRO LIBRE alrededor del eje vertical.
   Controles: arrastrar = desplazar · rueda / pellizco = zoom · botón derecho o dos dedos girando = girar
   libremente · ⟲ ⟳ y Q/W = girar 22,5° (E sigue siendo «terminar turno») · toque/clic = el mismo clic del mapa 2D (se traduce la casilla del
   relieve a un clic sobre #map, así seleccionar, marchar, atacar y los paneles son los de siempre).
   Botón «3D / 2D» en la barra del mapa; se recuerda en localStorage["ocaso-m3d"]. Por defecto 3D, salvo con
   WebGL por software (SwiftShader, llvmpipe…) o sin WebGL: entonces el mapa plano de siempre.
   Globales con prefijo m3d / M3D. Sin dependencias fuera de vendor/three.min.js. */
const M3D_EL = (30 * Math.PI) / 180;
const M3D_PASO = Math.PI / 8;
const M3D = {
  pref: (() => {
    try {
      return JSON.parse(localStorage.getItem("ocaso-m3d") || "{}") || {};
    } catch (_) {
      return {};
    }
  })(),
  ok: null, // null: sin probar · true · false (sin WebGL)
  soft: false,
  gl: null, // <canvas>
  ren: null,
  scene: null,
  camera: null,
  mesh: null,
  tex: null,
  comp: null,
  geoK: "",
  n: 0,
  tamW: 0,
  tamH: 0,
  cam: { az: -Math.PI / 4, azT: -Math.PI / 4, zoom: 1.35, zoomT: 1.35, tx: 0, tz: 0 },
  pts: new Map(),
  drag: null,
  dos: null,
  hovT: 0,
  ray: null,
};
const m3dVista = () => M3D.pref.vista || (M3D.soft ? "2d" : "3d");
const m3dActivo = () => !!(G && MAP && M3D.ok && m3dVista() === "3d" && typeof THREE !== "undefined");
const m3dClamp = (v, a, b) => Math.max(a, Math.min(b, v));
function m3dGuardar() {
  try {
    localStorage.setItem("ocaso-m3d", JSON.stringify(M3D.pref));
  } catch (_) {}
}

/* ---------- WebGL ---------- */
function m3dIniciar() {
  if (M3D.ok !== null) return M3D.ok;
  if (typeof THREE === "undefined" || !THREE.WebGLRenderer) return (M3D.ok = false);
  const c = document.createElement("canvas");
  c.id = "m3dgl";
  c.setAttribute("aria-label", "Mapa de campaña en 3D");
  const at = { alpha: false, depth: true, stencil: false, antialias: true, powerPreference: "high-performance" };
  let ctx = null;
  try {
    ctx = c.getContext("webgl2", at) || c.getContext("webgl", at);
  } catch (_) {}
  if (!ctx) return (M3D.ok = false);
  try {
    const r = new THREE.WebGLRenderer({ canvas: c, context: ctx, antialias: true });
    r.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    r.setClearColor(0x0a0d10, 1);
    M3D.ren = r;
    try {
      const gl = r.getContext(),
        ex = gl.getExtension("WEBGL_debug_renderer_info");
      M3D.soft = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(String(gl.getParameter(ex ? ex.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || ""));
    } catch (_) {}
  } catch (e) {
    console.warn("Mapa 3D: sin WebGL, se usa el mapa plano.", e && e.message);
    return (M3D.ok = false);
  }
  M3D.gl = c;
  M3D.scene = new THREE.Scene();
  M3D.camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 400);
  M3D.scene.add(new THREE.HemisphereLight(0xffffff, 0x556677, 2.6));
  const sol = new THREE.DirectionalLight(0xfff1dc, 1.3);
  sol.position.set(-40, 60, -30);
  M3D.scene.add(sol);
  M3D.ray = new THREE.Raycaster();
  c.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    M3D.ok = false;
    m3dMostrar(false);
  });
  m3dEntrada(c);
  return (M3D.ok = true);
}

/* ---------- relieve y textura ---------- */
function m3dAlt(x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return 0;
  if (!MAP.terr[y][x]) return -0.08; // mar
  const a = MAP.alt ? MAP.alt[y][x] : MAP.terr[y][x];
  return 0.05 + a * 0.13;
}
function m3dGeo() {
  const k = MAP.seed + "|" + W + "x" + H;
  if (M3D.geoK === k && M3D.mesh) return;
  M3D.geoK = k;
  if (M3D.mesh) {
    M3D.scene.remove(M3D.mesh);
    M3D.mesh.geometry.dispose();
  }
  const g = new THREE.PlaneGeometry(W, H, W, H);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let j = 0; j <= H; j++)
    for (let i = 0; i <= W; i++) {
      /* vértice entre 4 casillas: media de sus alturas (la costa baja suave hasta el mar) */
      const h = (m3dAlt(i - 1, j - 1) + m3dAlt(i, j - 1) + m3dAlt(i - 1, j) + m3dAlt(i, j)) / 4;
      p.setY(j * (W + 1) + i, h);
    }
  g.computeVertexNormals();
  if (!M3D.comp) M3D.comp = document.createElement("canvas");
  const hd = $("maphd");
  M3D.comp.width = hd.width || W * 16;
  M3D.comp.height = hd.height || H * 16;
  if (M3D.tex) M3D.tex.dispose();
  M3D.tex = new THREE.CanvasTexture(M3D.comp);
  if (THREE.SRGBColorSpace) M3D.tex.colorSpace = THREE.SRGBColorSpace;
  M3D.tex.magFilter = THREE.NearestFilter;
  M3D.tex.anisotropy = M3D.ren.capabilities.getMaxAnisotropy ? M3D.ren.capabilities.getMaxAnisotropy() : 1;
  const mat = new THREE.MeshLambertMaterial({ map: M3D.tex });
  M3D.mesh = new THREE.Mesh(g, mat);
  M3D.scene.add(M3D.mesh);
  /* zócalo oscuro bajo el borde del mapa */
  if (!M3D.base) {
    M3D.base = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0x1b2128 }));
    M3D.scene.add(M3D.base);
  }
  M3D.base.scale.set(W + 0.02, 0.8, H + 0.02);
  M3D.base.position.set(0, -0.5, 0);
}
function m3dTextura() {
  const c = M3D.comp,
    x = c.getContext("2d"),
    hd = $("maphd");
  if (hd.width !== c.width || hd.height !== c.height) return (M3D.geoK = "");
  x.imageSmoothingEnabled = false;
  x.drawImage(hd, 0, 0);
  x.drawImage(cv, 0, 0, c.width, c.height);
  M3D.tex.needsUpdate = true;
}

/* ---------- cámara ---------- */
function m3dCamara() {
  const C = M3D.cam,
    cam = M3D.camera;
  C.tx = m3dClamp(C.tx, -W / 2, W / 2);
  C.tz = m3dClamp(C.tz, -H / 2, H / 2);
  const d = 150;
  cam.position.set(C.tx + d * Math.cos(M3D_EL) * Math.sin(C.az), d * Math.sin(M3D_EL), C.tz + d * Math.cos(M3D_EL) * Math.cos(C.az));
  cam.up.set(0, 1, 0);
  cam.lookAt(C.tx, 0, C.tz);
  const asp = M3D.tamW / Math.max(1, M3D.tamH),
    R = Math.hypot(W / 2, H / 2),
    hy = Math.max(R * Math.sin(M3D_EL) + 1, R / asp) * 1.02;
  cam.top = hy;
  cam.bottom = -hy;
  cam.right = hy * asp;
  cam.left = -hy * asp;
  cam.zoom = C.zoom;
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
}
function m3dCamPaso() {
  const C = M3D.cam,
    k = matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0.2;
  C.az += (C.azT - C.az) * k;
  if (Math.abs(C.azT - C.az) < 1e-4) C.az = C.azT;
  C.zoom += (C.zoomT - C.zoom) * k;
  if (Math.abs(C.zoomT - C.zoom) < 1e-4) C.zoom = C.zoomT;
  m3dCamara();
}
function m3dGira(d) {
  M3D.cam.azT += d * M3D_PASO;
}
function m3dGiraLibre(a) {
  M3D.cam.azT += a;
  M3D.cam.az = M3D.cam.azT;
}
function m3dZoom(f) {
  M3D.cam.zoomT = m3dClamp(M3D.cam.zoomT * f, 0.8, 9);
  m3dZoomTxt();
}
function m3dZoomTxt() {
  const z = $("mzl");
  if (z && m3dActivo()) z.textContent = Math.round(M3D.cam.zoomT * 100) + "%";
}
function m3dPan(dx, dy) {
  const cam = M3D.camera,
    C = M3D.cam,
    wpp = (cam.right - cam.left) / cam.zoom / Math.max(1, M3D.tamW),
    e = cam.matrixWorld.elements,
    ul = Math.hypot(e[4], e[6]) || 1;
  C.tx -= e[0] * dx * wpp - (e[4] / ul) * (dy * wpp) / Math.sin(M3D_EL);
  C.tz -= e[2] * dx * wpp - (e[6] / ul) * (dy * wpp) / Math.sin(M3D_EL);
  m3dCamara();
}
/* centra la vista en una casilla (capital, eventos: lo que el 2D hace con centerOn) */
function m3dCentrar(x, y) {
  M3D.cam.tx = x + 0.5 - W / 2;
  M3D.cam.tz = y + 0.5 - H / 2;
}

/* ---------- de la pantalla a la casilla ---------- */
function m3dUV(cx, cy) {
  if (!M3D.mesh) return null;
  const r = M3D.gl.getBoundingClientRect(),
    v = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  M3D.ray.setFromCamera(v, M3D.camera);
  const h = M3D.ray.intersectObject(M3D.mesh, false)[0];
  return h && h.uv ? { u: h.uv.x, v: 1 - h.uv.y } : null;
}
/* el mismo evento sobre #map (cv), en el punto que corresponde a esa casilla */
function m3dEvento(tipo, cx, cy, extra) {
  const uv = m3dUV(cx, cy);
  if (!uv) {
    if (tipo === "mousemove") cv.dispatchEvent(new MouseEvent("mouseleave"));
    return false;
  }
  const r = cv.getBoundingClientRect();
  cv.dispatchEvent(new MouseEvent(tipo, { bubbles: true, cancelable: true, clientX: r.left + uv.u * r.width, clientY: r.top + uv.v * r.height, ...(extra || {}) }));
  return true;
}

/* ---------- entrada ---------- */
function m3dEntrada(c) {
  const pts = M3D.pts;
  c.addEventListener("contextmenu", (e) => e.preventDefault());
  c.addEventListener("pointerdown", (e) => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      c.setPointerCapture(e.pointerId);
    } catch (_) {}
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      M3D.dos = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: M3D.cam.zoomT, an0: Math.atan2(b.y - a.y, b.x - a.x), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      M3D.drag = null;
      return;
    }
    M3D.drag = { modo: e.button === 2 ? "giro" : "pan", x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, movido: false };
  });
  c.addEventListener("pointermove", (e) => {
    if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (M3D.dos && pts.size >= 2) {
      const [a, b] = [...pts.values()],
        D = M3D.dos,
        dist = Math.hypot(a.x - b.x, a.y - b.y) || 1,
        an = Math.atan2(b.y - a.y, b.x - a.x),
        mx = (a.x + b.x) / 2,
        my = (a.y + b.y) / 2;
      M3D.cam.zoomT = m3dClamp((D.z0 * dist) / D.d0, 0.8, 9);
      M3D.cam.zoom = M3D.cam.zoomT;
      const da = Math.atan2(Math.sin(an - D.an0), Math.cos(an - D.an0));
      m3dGiraLibre(-da);
      D.an0 = an;
      m3dPan(mx - D.mx, my - D.my);
      D.mx = mx;
      D.my = my;
      m3dZoomTxt();
      return;
    }
    const d = M3D.drag;
    if (!d) {
      /* ratón sin pulsar: el texto de la casilla bajo el puntero (como el mapa 2D) */
      if (e.pointerType === "mouse" && performance.now() - M3D.hovT > 50) {
        M3D.hovT = performance.now();
        m3dEvento("mousemove", e.clientX, e.clientY);
      }
      return;
    }
    if (!d.movido && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 7) d.movido = true;
    if (!d.movido) return;
    if (d.modo === "giro") m3dGiraLibre(-(e.clientX - d.lx) * 0.007);
    else m3dPan(e.clientX - d.lx, e.clientY - d.ly);
    d.lx = e.clientX;
    d.ly = e.clientY;
  });
  const fin = (e) => {
    const d = M3D.drag;
    pts.delete(e.pointerId);
    if (pts.size < 2) M3D.dos = null;
    if (d && e.type === "pointerup" && !d.movido && d.modo === "pan" && !pts.size) m3dEvento("click", e.clientX, e.clientY);
    if (!pts.size) M3D.drag = null;
  };
  c.addEventListener("pointerup", fin);
  c.addEventListener("pointercancel", fin);
  c.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && cv.dispatchEvent(new MouseEvent("mouseleave")));
  c.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      m3dZoom(e.deltaY < 0 ? 1.15 : 1 / 1.15);
    },
    { passive: false },
  );
  document.addEventListener("keydown", (e) => {
    if (!m3dActivo() || !M3D.gl.isConnected || M3D.gl.style.display === "none") return;
    if ($("battle").classList.contains("show") || $("start").classList.contains("show") || $("modal").classList.contains("show")) return;
    if (e.ctrlKey || e.metaKey || e.altKey || (e.target.matches && e.target.matches("input,select,textarea"))) return;
    if (e.key === "q" || e.key === "Q") m3dGira(-1);
    else if (e.key === "w" || e.key === "W") m3dGira(1); /* E ya es «terminar turno» en el mapa */
  });
}

/* ---------- montaje sobre el mapa 2D ---------- */
function m3dBotones() {
  const z = document.querySelector(".ifz-zoom");
  if (!z || z.querySelector("[data-m3d]")) return;
  const mk = (k, t, l) => {
    const b = document.createElement("button");
    b.className = "zb m3d-b";
    b.dataset.m3d = k;
    b.textContent = t;
    b.title = l;
    b.setAttribute("aria-label", l);
    return b;
  };
  z.prepend(mk("der", "⟳", "Girar el mapa (W; botón derecho o dos dedos para girar libremente)"));
  z.prepend(mk("izq", "⟲", "Girar el mapa (Q)"));
  z.prepend(mk("vista", "3D", "Cambiar entre el mapa en 3D y el plano"));
}
function m3dMostrar(on) {
  const w = $("mapwrap");
  if (!w) return;
  if (on && !M3D.gl.isConnected) w.parentNode.insertBefore(M3D.gl, w);
  if (M3D.gl) M3D.gl.style.display = on ? "block" : "none";
  w.classList.toggle("m3d-on", !!on);
  document.querySelectorAll("[data-m3d]").forEach((b) => {
    if (b.dataset.m3d === "vista") {
      b.textContent = on ? "2D" : "3D";
      b.setAttribute("aria-pressed", String(!!on));
      b.disabled = M3D.ok === false;
      b.title = M3D.ok === false ? "Sin WebGL: solo el mapa plano" : on ? "Ver el mapa plano" : "Ver el mapa en 3D (isométrico, con giro libre)";
    } else b.hidden = !on;
  });
  if (!on && typeof setZoom === "function" && $("mzl")) $("mzl").textContent = Math.round(zoom * 100) + "%";
  else m3dZoomTxt();
}
document.addEventListener(
  "click",
  (e) => {
    const b = e.target.closest && e.target.closest("[data-m3d], [data-act='zoom-in'], [data-act='zoom-out'], [data-act='zoom-cap']");
    if (!b) return;
    const k = b.dataset.m3d;
    if (k === "vista") {
      M3D.pref.vista = m3dVista() === "3d" ? "2d" : "3d";
      m3dGuardar();
      return;
    }
    if (!m3dActivo()) return;
    if (k === "izq") m3dGira(-1);
    else if (k === "der") m3dGira(1);
    else if (b.dataset.act === "zoom-in" || b.dataset.act === "zoom-out") {
      e.stopPropagation();
      e.preventDefault();
      m3dZoom(b.dataset.act === "zoom-in" ? 1.4 : 1 / 1.4);
    }
    /* zoom-cap: lo hace el juego (selecciona la capital y llama a centerOn, que aquí también centra) */
  },
  true,
);
/* centerOn (interfaz): también mueve la vista 3D */
if (typeof centerOn === "function") {
  const m3dCenterOn0 = centerOn;
  centerOn = function (i) {
    const p = G && G.P[i];
    if (p && m3dActivo()) m3dCentrar(p.x, p.y);
    return m3dCenterOn0.apply(this, arguments);
  };
}

/* ---------- cada fotograma, después de dibujar el mapa 2D ---------- */
function m3dDibujar() {
  m3dBotones();
  if (M3D.ok === null && G && MAP) m3dIniciar();
  const on = m3dActivo() && !$("battle").classList.contains("show");
  if (on !== M3D.visto) {
    M3D.visto = on;
    if (M3D.gl || !on) m3dMostrar(on);
  }
  if (!on) return;
  const w = $("mapwrap"),
    tw = w.clientWidth,
    th = Math.max(200, Math.min(w.clientHeight || 0, innerHeight * 0.72) || Math.round((tw * H) / W));
  if (tw !== M3D.tamW || th !== M3D.tamH) {
    M3D.tamW = tw;
    M3D.tamH = th;
    M3D.ren.setSize(tw, th, false);
    M3D.gl.style.width = tw + "px";
    M3D.gl.style.height = th + "px";
  }
  m3dGeo();
  /* la textura, a ~20 fotogramas por segundo (subirla en cada uno pesa en el móvil) */
  if (++M3D.n % 3 === 0 || !M3D.texLista) {
    m3dTextura();
    M3D.texLista = true;
  }
  m3dCamPaso();
  M3D.ren.render(M3D.scene, M3D.camera);
}
if (typeof drawMap === "function") {
  const m3dDrawMap0 = drawMap;
  drawMap = function (now) {
    const r = m3dDrawMap0.apply(this, arguments);
    try {
      m3dDibujar(now);
    } catch (e) {
      console.error("[mapa3d]", e);
      M3D.ok = false;
      m3dMostrar(false);
    }
    return r;
  };
}
