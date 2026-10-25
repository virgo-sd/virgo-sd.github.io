// ============================================================
//  sw.js - Service Worker der VIRGO-Web-App (PWA)
//  NEU 22.10.2026. Zweck: App-Huelle (Startseite, Symbole, Hintergrundbild) schnell und fuer "Zum Startbildschirm hinzufuegen" bereitstellen.
//  Die grossen Spieldateien (Ordner Build/) fasst er NICHT an: Unity cached sie selbst (IndexedDB), und mit hashbaren Dateinamen holt der Browser
//  nach einer neuen Version automatisch nur die geaenderten Dateien. Updates: index.html wird immer zuerst vom Netz geholt ("network first"),
//  version.json nie gecached - die Seite vergleicht beide und zeigt "Neue Version verfuegbar".
//  2026.10.25-2128 wird beim Veroeffentlichen (Tools/Veroeffentlichen) durch die Versionsnummer ersetzt.
// ============================================================
const VERSION = '2026.10.25-2128';
const CACHE = 'virgo-shell-' + VERSION;
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'HG01.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('virgo-shell-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                                    // Server (Render), PlayFab usw. nie anfassen
  if (/\/(Build|StreamingAssets)\//.test(url.pathname) || /version\.json$/.test(url.pathname)) return;   // grosse Spieldateien + Versionsdatei: direkt vom Netz

  if (req.mode === 'navigate' && /\/(index\.html)?$/.test(url.pathname)) {   // NEU 25.10.2026: nur die Startseite (andere Seiten wie passwort-neu.html direkt vom Netz)                                                   // Startseite: Netz zuerst, Huelle als Notnagel
    event.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); return res; })
        .catch(() => caches.match('index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  event.respondWith(caches.match(req).then(hit => hit || fetch(req)));                // Symbole/Bild: Cache zuerst
});
