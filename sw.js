// Incrementar este número con cada deploy para forzar actualización del caché
const CACHE = 'oido-v3';

const APP_SHELL = [
    '/',
    '/index.html',
    // CSS modular
    '/css/base.css',
    '/css/components.css',
    '/css/quiz.css',
    '/css/grados.css',
    '/css/armonia.css',
    '/css/dictado-intervalos.css',
    // JS modular
    '/js/audio.js',
    '/js/acordes-explorer.js',
    '/js/quiz-inversiones.js',
    '/js/datos-armonia.js',
    '/js/progresivo.js',
    '/js/custom-progs.js',
    '/js/quiz-armonia.js',
    '/js/progreso.js',
    '/js/dictado.js',
    '/js/analisis-posicion.js',
    '/js/secuencias.js',
    '/js/intervalos.js',
    '/js/init.js',
    '/js/ui-handlers.js',
    '/js/bootstrap.js',
    // Fragmentos HTML
    '/partials/tab-aprender.html',
    '/partials/tab-explorar.html',
    '/partials/tab-practicar.html',
    '/partials/tab-grados.html',
    '/partials/tab-dictado.html',
    '/partials/tab-intervalos.html',
    '/partials/modal-acorde.html',
    '/partials/modal-analisis.html',
    '/partials/pwa-banner.html',
    '/firebase.js',
    '/firebase-config.js',
    '/manifest.json',
];

// Instalación: guarda el app shell en caché
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(c => c.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

// Activación: elimina cachés viejos de versiones anteriores
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Permite que el banner de actualización fuerce la activación inmediata
self.addEventListener('message', e => {
    if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// Fetch: cache-first para archivos propios, network-only para Firebase/APIs externas
self.addEventListener('fetch', e => {
    const url = e.request.url;

    // Dejar pasar sin interceptar: Firebase, Google APIs, CDNs externos
    if (
        url.includes('firestore.googleapis') ||
        url.includes('identitytoolkit') ||
        url.includes('securetoken') ||
        url.includes('gstatic.com') ||
        url.includes('fonts.googleapis') ||
        url.includes('fonts.gstatic')
    ) return;

    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(res => {
                // Solo cachear respuestas válidas de nuestro origen
                if (res.ok && e.request.url.startsWith(self.location.origin)) {
                    const clone = res.clone();
                    caches.open(CACHE).then(c => c.put(e.request, clone));
                }
                return res;
            });
        })
    );
});
