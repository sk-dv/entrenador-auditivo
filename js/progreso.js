// ─── PROGRESO ─────────────────────────────────────────────────────
const CLAVE_PROGRESO = 'oido_armonico_v1';

function cargarProgreso() {
    try { return JSON.parse(localStorage.getItem(CLAVE_PROGRESO)) || {}; }
    catch { return {}; }
}

function guardarRonda(modulo, correctas, total) {
    if (total === 0) return;
    const data = cargarProgreso();
    if (!data[modulo]) data[modulo] = [];
    const pct = Math.round(correctas / total * 100);
    data[modulo].push({ ts: Date.now(), c: correctas, t: total, pct });
    if (data[modulo].length > 50) data[modulo] = data[modulo].slice(-50);
    if (!data.streak) data.streak = {};
    if (!data.streak[modulo]) data.streak[modulo] = { current: 0, best: 0 };
    if (pct >= 70) {
        data.streak[modulo].current++;
        if (data.streak[modulo].current > data.streak[modulo].best)
            data.streak[modulo].best = data.streak[modulo].current;
    } else {
        data.streak[modulo].current = 0;
    }
    localStorage.setItem(CLAVE_PROGRESO, JSON.stringify(data));
    if (window.FB) window.FB.push(data);
    renderHistorial(modulo);
    renderRacha(modulo);
}

function renderRacha(modulo) {
    const el = document.getElementById('racha-' + modulo);
    if (!el) return;
    const s = ((cargarProgreso().streak) || {})[modulo] || { current: 0, best: 0 };
    if (s.current >= 3) {
        el.innerHTML = `<span class="racha-fire">racha: ${s.current} seguidas</span><span class="racha-best"> · mejor: ${s.best}</span>`;
    } else if (s.best >= 2) {
        el.innerHTML = `<span class="racha-best">mejor racha: ${s.best}</span>`;
    } else {
        el.innerHTML = '';
    }
}

// ─── DETALLE GRANULAR ─────────────────────────────────────────────
// Registra precisión por ítem individual (grado, nota, tipo de inversión)
const DETALLE_DEFAULTS = {
    grados:     { I:[0,0], II:[0,0], III:[0,0], IV:[0,0], V:[0,0], VI:[0,0] },
    dictado:    Object.fromEntries(['Do','Do#','Re','Mib','Mi','Fa','Fa#','Sol','Lab','La','Sib','Si'].map(n=>[n,[0,0]])),
    inversiones:{ fundamental:[0,0], primera:[0,0], segunda:[0,0] },
};

function registrarDetalle(modulo, key, correct) {
    const data = cargarProgreso();
    if (!data.detalle) data.detalle = JSON.parse(JSON.stringify(DETALLE_DEFAULTS));
    if (!data.detalle[modulo]) data.detalle[modulo] = {};
    if (!data.detalle[modulo][key]) data.detalle[modulo][key] = [0, 0];
    data.detalle[modulo][key][1]++;
    if (correct) data.detalle[modulo][key][0]++;
    localStorage.setItem(CLAVE_PROGRESO, JSON.stringify(data));
    if (window.FB) window.FB.push(data);
}

function renderHistorial(modulo) {
    const el = document.getElementById('hist-' + modulo);
    if (!el) return;
    const data = cargarProgreso();
    const hist = (data[modulo] || []).slice(-10);
    if (hist.length === 0) { el.innerHTML = '<span class="hist-empty">sin historial aún</span>'; return; }
    const avg = Math.round(hist.reduce((s, x) => s + x.pct, 0) / hist.length);
    const trend = hist.length >= 3
        ? hist.slice(-2).reduce((s,x) => s+x.pct,0)/2 - hist.slice(0,-2).reduce((s,x) => s+x.pct,0)/Math.max(hist.length-2,1)
        : 0;
    const flecha = trend > 5 ? '↑' : trend < -5 ? '↓' : '→';
    const puntos = hist.map(r => {
        const clase = r.pct >= 80 ? 'hp-green' : r.pct >= 50 ? 'hp-yellow' : 'hp-red';
        return `<span class="hist-punto ${clase}" title="${r.pct}%"></span>`;
    }).join('');
    el.innerHTML = `<span class="hist-flecha">${flecha}</span><span class="hist-puntos">${puntos}</span><span class="hist-avg">${avg}% últ.${hist.length}</span>`;
}

function initHistoriales() {
    ['inversiones','grados','progresivo','progresiones','dictado','posicion','intervalos',
     'funciones','cadencias','modalidad','completar'].forEach(m => {
        renderHistorial(m);
        renderRacha(m);
    });
}

