// ─── HANDLERS DE UI GLOBALES ──────────────────────────────────────
// Listeners a nivel documento y registro del service worker.
// (Antes vivían como <script> inline dentro de index.html.)

// Cerrar el popover de volumen al hacer click fuera
document.addEventListener('click', e => {
    const pop = document.getElementById('volPopover');
    if (pop && !pop.contains(e.target)) pop.classList.remove('open');
});

// ─── PWA: service worker + banner de actualización ────────────────
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(reg => {
        reg.addEventListener('updatefound', () => {
            const sw = reg.installing;
            sw.addEventListener('statechange', () => {
                if (sw.state === 'installed' && navigator.serviceWorker.controller) {
                    const banner = document.getElementById('swUpdateBanner');
                    if (banner) banner.style.display = 'flex';
                }
            });
        });
    });
}

function swUpdate() {
    navigator.serviceWorker.getRegistration().then(reg => {
        if (reg && reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            reg.waiting.addEventListener('statechange', e => {
                if (e.target.state === 'activated') location.reload();
            });
        } else {
            location.reload();
        }
    });
}

navigator.serviceWorker && navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
