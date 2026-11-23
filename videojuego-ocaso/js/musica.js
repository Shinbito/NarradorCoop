/* ---------- música chiptune ---------- */
const AU = { ctx: null, want: true, cur: null, next: 0, step: 0, timer: null };
try {
  AU.want = localStorage.getItem("ocaso-mus") !== "0";
} catch (_) {}
function musLabel() {
  const b = $("musb");
  if (b) b.textContent = AU.want ? "♪" : "♪̸";
  b && b.setAttribute("aria-label", AU.want ? "Silenciar música" : "Activar música");
}
function audioInit() {
  if (AU.ctx) return;
  try {
    AU.ctx = new (window.AudioContext || window.webkitAudioContext)();
    AU.out = AU.ctx.createGain();
    AU.out.gain.value = 0.14;
    AU.out.connect(AU.ctx.destination);
    const b = AU.ctx.createBuffer(1, AU.ctx.sampleRate * 0.4, AU.ctx.sampleRate),
      d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    AU.noise = b;
    const re = new Float32Array(32),
      im = new Float32Array(32);
    for (let n = 1; n < 32; n++) im[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * 0.25);
    AU.pulse = AU.ctx.createPeriodicWave(re, im);
  } catch (e) {
    AU.ctx = null;
  }
}
const mf = (m) => 440 * 2 ** ((m - 69) / 12);
function tone(kind, m, t, dur, vol) {
  const o = AU.ctx.createOscillator(),
    g = AU.ctx.createGain();
  if (kind === "pulse") o.setPeriodicWave(AU.pulse);
  else o.type = kind;
  o.frequency.value = mf(m);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.setValueAtTime(vol, t + dur * 0.55);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
  o.connect(g);
  g.connect(AU.out);
  o.start(t);
  o.stop(t + dur + 0.03);
}
function hit(t, f, dur, vol) {
  const s = AU.ctx.createBufferSource(),
    fl = AU.ctx.createBiquadFilter(),
    g = AU.ctx.createGain();
  s.buffer = AU.noise;
  fl.type = f > 1500 ? "highpass" : "lowpass";
  fl.frequency.value = f;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(fl);
  fl.connect(g);
  g.connect(AU.out);
  s.start(t);
  s.stop(t + dur);
}
const N = (n) =>
  ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 })[n[0]] +
  (n[1] === "b" ? -1 : n[1] === "#" ? 1 : 0) +
  12 * (+n[n.length - 1] + 1);
function song(bpm, lead, chords, drums) {
  const ev = [];
  let st = 0;
  for (const [n, l] of lead) {
    if (n) ev.push({ st, m: N(n), l });
    st += l;
  }
  return { bpm, ev, len: st, chords: chords.map((c) => c.map(N)), drums };
}
const SONGS = {
  camp: song(
    96,
    [
      ["D4", 4],
      ["A4", 4],
      ["G4", 2],
      ["F4", 2],
      ["E4", 4],
      ["D4", 12],
      [0, 4],
      ["F4", 4],
      ["G4", 2],
      ["A4", 2],
      ["C5", 4],
      ["A4", 4],
      ["G4", 8],
      [0, 8],
      ["A4", 4],
      ["D5", 4],
      ["C5", 2],
      ["B4", 2],
      ["A4", 4],
      ["G4", 4],
      ["A4", 2],
      ["G4", 2],
      ["F4", 8],
      ["E4", 4],
      ["F4", 4],
      ["G4", 4],
      ["E4", 4],
      ["D4", 16],
      ["F4", 2],
      ["G4", 2],
      ["A4", 4],
      ["A4", 2],
      ["G4", 2],
      ["F4", 4],
      ["G4", 4],
      ["E4", 8],
      [0, 4],
      ["C4", 4],
      ["D4", 4],
      ["E4", 4],
      ["F4", 2],
      ["E4", 2],
      ["D4", 4],
      ["C4", 8],
      ["D4", 4],
      ["F4", 4],
      ["A4", 6],
      ["G4", 2],
      ["F4", 4],
      ["E4", 4],
      ["D4", 8],
      ["A3", 4],
      ["C4", 4],
      ["D4", 16],
    ],
    [
      ["D3", "A3", "D4"],
      ["D3", "A3", "F4"],
      ["F3", "C4", "A4"],
      ["C3", "G3", "E4"],
      ["A2", "E3", "C4"],
      ["G2", "D3", "B3"],
      ["C3", "G3", "E4"],
      ["D3", "A3", "F4"],
      ["D3", "A3", "F4"],
      ["C3", "G3", "E4"],
      ["A2", "E3", "C4"],
      ["G2", "D3", "B3"],
      ["F3", "C4", "A4"],
      ["C3", "G3", "E4"],
      ["G2", "D3", "B3"],
      ["D3", "A3", "D4"],
    ],
    "k.....h.s.....h.",
  ),
  battle: song(
    138,
    [
      ["D5", 2],
      ["D5", 2],
      ["C5", 2],
      ["D5", 2],
      ["F5", 4],
      ["E5", 4],
      ["D5", 4],
      ["A4", 4],
      ["Bb4", 4],
      ["A4", 4],
      ["G4", 2],
      ["A4", 2],
      ["Bb4", 2],
      ["C5", 2],
      ["D5", 4],
      ["C5", 4],
      ["A4", 12],
      [0, 4],
      ["F5", 4],
      ["E5", 4],
      ["D5", 4],
      ["C5", 4],
      ["Bb4", 4],
      ["C5", 4],
      ["D5", 8],
      ["C5", 2],
      ["Bb4", 2],
      ["A4", 2],
      ["G4", 2],
      ["F4", 4],
      ["E4", 4],
      ["D4", 12],
      ["A4", 2],
      ["C5", 2],
    ],
    [
      ["D3", "A3", "F4"],
      ["D3", "A3", "F4"],
      ["G2", "D3", "Bb3"],
      ["A2", "E3", "C#4"],
      ["F3", "C4", "A4"],
      ["Bb2", "F3", "D4"],
      ["A2", "E3", "C#4"],
      ["D3", "A3", "D4"],
    ],
    "k.h.s.h.k.k.s.hh",
  ),
};
function playStep(sg, i, t, s16) {
  const bar = Math.floor(i / 16),
    ch = sg.chords[bar % sg.chords.length],
    b = i % 16;
  for (const e of sg.ev)
    if (e.st === i) {
      tone("pulse", e.m, t, e.l * s16 * 0.95, 0.55);
      tone("square", e.m + 12, t + s16 * 0.5, Math.min(e.l, 2) * s16 * 0.6, 0.06);
    }
  if (b % 4 === 0) tone("triangle", ch[0] - 12, t, s16 * 3.6, 0.9);
  if (b % 4 === 2) tone("triangle", ch[1] - 12, t, s16 * 1.6, 0.6);
  if (b % 2 === 1) tone("square", ch[(b >> 1) % 3] + 12, t, s16 * 0.9, 0.05);
  const d = sg.drums[b];
  if (d === "k") hit(t, 160, 0.16, 0.9);
  if (d === "s") hit(t, 1800, 0.12, 0.35);
  if (d === "h") hit(t, 6000, 0.04, 0.18);
}
function music(name) {
  if (AU.timer) {
    clearInterval(AU.timer);
    AU.timer = null;
  }
  AU.cur = name;
  if (!name || !AU.want || !AU.ctx) return;
  try {
    AU.ctx.resume();
  } catch (_) {}
  const sg = SONGS[name],
    s16 = 60 / sg.bpm / 4;
  AU.step = 0;
  AU.next = AU.ctx.currentTime + 0.08;
  AU.timer = setInterval(() => {
    if (!AU.ctx) return;
    while (AU.next < AU.ctx.currentTime + 0.15) {
      playStep(sg, AU.step, AU.next, s16);
      AU.next += s16;
      AU.step = (AU.step + 1) % sg.len;
    }
  }, 30);
}
document.addEventListener(
  "pointerdown",
  () => {
    if (AU.want && !AU.ctx) {
      audioInit();
      music(BT ? "battle" : "camp");
    }
  },
  { passive: true },
);
musLabel();
