/* Service worker de Ocaso del Imperio: guarda el juego para jugar sin conexión (app instalable).
   La lista de archivos se genera con: node herramientas/lista-archivos.js → archivos.json.
   Estrategia: red primero para index y archivos.json (actualizaciones), caché primero para el resto. */
const VERSION = "ocaso-v1";
self.addEventListener("install", (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(VERSION);
      try {
        const l = await (await fetch("archivos.json", { cache: "no-store" })).json();
        await c.addAll(["./", ...l, "archivos.json"]);
      } catch (_) {
        await c.addAll(["./", "index.html"]);
      }
      self.skipWaiting();
    })(),
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  const fresco = u.pathname.endsWith("/") || u.pathname.endsWith("index.html") || u.pathname.endsWith("archivos.json");
  e.respondWith(
    (async () => {
      const c = await caches.open(VERSION);
      if (fresco) {
        try {
          const r = await fetch(e.request);
          if (r.ok) c.put(e.request, r.clone());
          return r;
        } catch (_) {
          return (await c.match(e.request)) || (await c.match("./"));
        }
      }
      const g = await c.match(e.request);
      if (g) return g;
      const r = await fetch(e.request);
      if (r.ok) c.put(e.request, r.clone());
      return r;
    })(),
  );
});
