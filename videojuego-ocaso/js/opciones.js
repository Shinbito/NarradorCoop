/* ---------- OPCIONES DEL JUEGO (almacén común) ----------
   Un solo objeto de preferencias del jugador, guardado en localStorage «ocaso-opc». Lo leen el menú de
   opciones (menu.js), la traducción (idioma.js), el sonido (sonido.js), la sangre (sangre.js) y el vídeo.
   - OPC.v: los valores actuales (ver OPC_DEF).
   - OPC.set(clave, valor): cambia, guarda y avisa con el evento de window «ocaso-opciones»
     (detail = {clave, valor, v: OPC.v}).
   - OPC.on(fn): fn({clave, valor, v}) en cada cambio.
   Claves de volumen: 0..1. Globales con prefijo OPC. */
const OPC_DEF = {
  /* general */
  idioma: "es", // 'es' | 'pt' | 'en'
  texto: 1, // escala del texto: 0.85 | 1 | 1.15 | 1.3
  sangre: "si", // 'no' | 'si' | 'brutal' (brutalidad: campos empapados, miembros y vísceras)
  /* vídeo */
  calidad: "alta", // 'baja' | 'media' | 'alta' (preajuste; las demás se pueden tocar sueltas)
  sombras: true,
  sombrasSuaves: true,
  antialias: true,
  resolucion: 1, // 0.5..1 escala de resolución de la batalla 3D
  vegetacion: "alta", // 'baja' | 'media' | 'alta' (densidad de árboles y matas)
  figuras: "alta", // 'baja' | 'media' | 'alta' (figuras por pelotón)
  efectos: true, // humo, polvo, chispas
  niebla3d: true, // bruma de distancia
  relieveMapa: true, // montañas y bosques de pie en el mapa de campaña
  fps: 60, // 30 | 60 tope de cuadros
  barras: true, // cifras sobre los pelotones en la batalla
  /* audio (0..1) */
  volGeneral: 0.8,
  volMusica: 0.5,
  volEfectos: 0.8,
  volAmbiente: 0.6,
  volVoces: 0.8, // gritos de guerra, de huida, de muerte
  silencio: false,
};
const OPC = {
  v: { ...OPC_DEF },
  fns: [],
  set(clave, valor) {
    if (!(clave in OPC_DEF)) return;
    OPC.v[clave] = valor;
    OPC.guardar();
    const d = { clave, valor, v: OPC.v };
    for (const f of OPC.fns)
      try {
        f(d);
      } catch (e) {
        console.error(e);
      }
    try {
      window.dispatchEvent(new CustomEvent("ocaso-opciones", { detail: d }));
    } catch (_) {}
  },
  on(fn) {
    OPC.fns.push(fn);
  },
  guardar() {
    try {
      localStorage.setItem("ocaso-opc", JSON.stringify(OPC.v));
    } catch (_) {}
  },
};
try {
  const s = JSON.parse(localStorage.getItem("ocaso-opc") || "null");
  if (s && typeof s === "object") for (const k in OPC_DEF) if (k in s) OPC.v[k] = s[k];
} catch (_) {}
/* volumen efectivo de una categoría ('Musica' | 'Efectos' | 'Ambiente' | 'Voces') */
const opcVol = (cat) => (OPC.v.silencio ? 0 : (OPC.v.volGeneral ?? 1) * (OPC.v["vol" + cat] ?? 1));
