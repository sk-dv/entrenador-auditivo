// ─── BOOTSTRAP ────────────────────────────────────────────────────
// Carga los fragmentos HTML (partials/) e inyecta cada uno en su lugar,
// luego arranca la app. Cada placeholder es <div data-partial="..."></div>
// y se reemplaza por el contenido real del fragmento (outerHTML).
//
// Nota: usa fetch(), por lo que la app debe servirse desde un servidor
// (Firebase Hosting en producción; en local: `python3 -m http.server` o
// `firebase serve`). Abrir index.html con doble click (file://) no funciona.
(async function () {
    const hosts = [...document.querySelectorAll('[data-partial]')];
    await Promise.all(hosts.map(async host => {
        const url = host.getAttribute('data-partial');
        try {
            const html = await fetch(url).then(r => r.text());
            host.outerHTML = html;
        } catch (err) {
            console.error('No se pudo cargar el fragmento', url, err);
        }
    }));
    if (typeof initApp === 'function') initApp();
})();
