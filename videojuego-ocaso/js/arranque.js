/* ---------- arranque ---------- */
(async () => {
  try {
    if (typeof claude === "undefined" || !claude.use) return;
    const [db, user] = await Promise.all([claude.use("db"), claude.use("user")]);
    net.db = db;
    net.user = user;
    if (user) net.uid = await user.id();
    if (ST.view === "home") renderStart();
  } catch (e) {}
})();
renderStart();
const go = () => requestAnimationFrame(frame);
(document.fonts ? document.fonts.load('8px "Press Start 2P"') : Promise.resolve()).then(go, go);
