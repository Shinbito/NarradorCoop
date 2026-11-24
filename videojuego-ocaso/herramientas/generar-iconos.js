/* Genera los iconos de la app (PWA y Android) en pixel art: un castillo ante el sol poniente.
   Uso: node herramientas/generar-iconos.js   → iconos/icono-{48,72,96,144,180,192,512}.png e icono-512-mask.png */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "iconos");
fs.mkdirSync(dir, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage();
  const datos = await page.evaluate(() => {
    const N = 32,
      base = document.createElement("canvas");
    base.width = base.height = N;
    const c = base.getContext("2d");
    const px = (x, y, w, h, col) => {
      c.fillStyle = col;
      c.fillRect(x, y, w, h);
    };
    /* cielo de ocaso en bandas */
    const cielo = ["#1b1430", "#2a1a3c", "#4a2244", "#7a2e44", "#b5473d", "#e07a3a", "#f2c14e"];
    for (let i = 0; i < cielo.length; i++) px(0, i * 3, N, 3, cielo[i]);
    px(0, 21, N, 11, "#12171c");
    /* sol poniente */
    for (let y = 0; y < 9; y++)
      for (let x = 0; x < 17; x++) {
        const dx = x - 8,
          dy = y - 8;
        if (dx * dx + dy * dy <= 64) px(8 + x, 12 + y, 1, 1, dy < -5 ? "#ffe9a8" : "#f7d36a");
      }
    /* colinas */
    px(0, 19, 9, 2, "#1d2a24");
    px(23, 19, 9, 2, "#1d2a24");
    /* castillo */
    const P = "#0b0f12";
    px(9, 13, 14, 10, P);
    px(7, 9, 4, 14, P);
    px(21, 9, 4, 14, P);
    px(14, 6, 4, 17, P);
    for (const x of [7, 9, 21, 23]) px(x, 8, 1, 1, P);
    for (const x of [14, 16]) px(x, 5, 1, 1, P);
    for (const x of [9, 11, 13, 19, 21]) px(x, 12, 1, 1, P);
    /* ventanas y puerta con luz */
    px(15, 9, 2, 2, "#f2c14e");
    px(8, 13, 1, 2, "#f2c14e");
    px(23, 13, 1, 2, "#f2c14e");
    px(15, 18, 2, 5, "#f2c14e");
    /* estandarte */
    px(16, 1, 1, 5, "#8a7a5a");
    px(17, 1, 4, 3, "#c8323a");
    px(17, 2, 3, 1, "#f2c14e");
    /* suelo */
    px(0, 23, N, 9, "#141c20");
    px(0, 23, N, 1, "#2b3a33");
    const out = {};
    const hacer = (S, mask) => {
      const k = document.createElement("canvas");
      k.width = k.height = S;
      const x = k.getContext("2d");
      x.imageSmoothingEnabled = false;
      if (mask) {
        x.fillStyle = "#12171c";
        x.fillRect(0, 0, S, S);
        const m = Math.round(S * 0.12);
        x.drawImage(base, m, m, S - 2 * m, S - 2 * m);
      } else x.drawImage(base, 0, 0, S, S);
      return k.toDataURL("image/png").split(",")[1];
    };
    for (const S of [48, 72, 96, 144, 180, 192, 512]) out["icono-" + S] = hacer(S, false);
    out["icono-512-mask"] = hacer(512, true);
    return out;
  });
  for (const [k, v] of Object.entries(datos)) fs.writeFileSync(path.join(dir, k + ".png"), Buffer.from(v, "base64"));
  console.log("iconos:", Object.keys(datos).join(", "));
  await b.close();
})();
