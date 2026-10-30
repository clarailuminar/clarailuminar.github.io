// Guarda a página no celular para ela abrir mesmo sem internet no congresso.
// Rede primeiro (preço e frete sempre atualizados); se a rede falhar ou demorar, usa a cópia guardada.
const CACHE = "meia-da-sorte-v4";
const BASE = ["./", "qrcode.js", "icone.svg", "fotos/rosa-no-pe.jpg", "fotos/branca-no-pe.jpg"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  const local = url.origin === location.origin;
  const fonte = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!local && !fonte) return;   // ViaCEP, planilha etc. vão direto para a rede

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const rede = fetch(req).then(r => { if (r.ok || r.type === "opaque") cache.put(req, r.clone()); return r; });
    rede.catch(() => {});
    const espera = new Promise(ok => setTimeout(ok, 3500));
    try {
      const r = await Promise.race([rede, espera]);
      if (r) return r;
    } catch {}
    const guardada = await cache.match(req, { ignoreSearch: req.mode === "navigate" });
    return guardada || rede;
  })());
});
