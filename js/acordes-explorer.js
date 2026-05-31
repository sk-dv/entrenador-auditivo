// ─── CHORD DATA — INVERSIONES ─────────────────────────────────────
const NOTAS = ['Do', 'Do#', 'Re', 'Mib', 'Mi', 'Fa', 'Fa#', 'Sol', 'Lab', 'La', 'Sib', 'Si'];
const BASE_MIDI = 48; // Do3

function generarAcordes() {
    const INT_INFO = {
        mayor: {
            fundamental: { int1: '3ª Mayor (4 st)', int2: '5ª Justa (7 st)',  intKey: 'fund-int', color: 'Estable · sólido · conclusivo',
                int1Why: 'define el carácter Mayor — brillante y abierto',
                int2Why: 'cierra sin generar tensión — sin 4ª desde el bajo, el oído descansa' },
            primera:     { int1: '3ª menor (3 st)', int2: '6ª Mayor (9 st)',  intKey: 'inv1-int', color: 'Suave · fluido · atenúa',
                int1Why: 'la 3ª en el bajo suaviza el ancla — ya no manda la raíz',
                int2Why: 'la 6ª reemplaza a la 5ª — más abierto y ligero, menos conclusivo' },
            segunda:     { int1: '4ª Justa (5 st)', int2: '6ª Mayor (9 st)', intKey: 'inv2-int', color: 'Tenso · suspendido · exponencializa',
                int1Why: '⚠ la 4ª desde el bajo es el intervalo más inestable — el oído pide resolver',
                int2Why: 'la 6ª amplifica la tensión de la 4ª — el acorde necesita continuar' },
        },
        menor: {
            fundamental: { int1: '3ª menor (3 st)', int2: '5ª Justa (7 st)',  intKey: 'fund-int', color: 'Estable · oscuro · peso completo',
                int1Why: 'define el carácter menor — oscuro y cerrado',
                int2Why: 'completa sin añadir tensión — peso oscuro, nada pide continuar' },
            primera:     { int1: '3ª Mayor (4 st)', int2: '6ª menor (8 st)', intKey: 'inv1-int', color: 'Suave · atenúa · menor ligero',
                int1Why: 'la 3ª menor en el bajo — alivia el peso, con color sombrío',
                int2Why: 'la 6ª menor arriba — más abierto que la 5ª, pero con oscuridad' },
            segunda:     { int1: '4ª Justa (5 st)', int2: '6ª menor (8 st)', intKey: 'inv2-int', color: 'Tenso · sombríamente inestable',
                int1Why: '⚠ la 4ª desde el bajo suspende el acorde — inestable y urgente',
                int2Why: 'la 6ª menor oscurece la tensión — inestabilidad sombría y densa' },
        }
    };
    const acordes = [];
    for (let raiz = 0; raiz < 12; raiz++) {
        const raizMidi = BASE_MIDI + raiz;
        const raizNombre = NOTAS[raiz];
        for (const calidad of ['mayor', 'menor']) {
            const tercera = calidad === 'mayor' ? 4 : 3;
            const quinta  = 7;
            const terceraMidi = raizMidi + tercera;
            const quintaMidi  = raizMidi + quinta;
            const terceraNombre = NOTAS[terceraMidi % 12];
            const quintaNombre  = NOTAS[quintaMidi  % 12];
            const nombreAcorde = `${raizNombre} ${calidad === 'mayor' ? 'Mayor' : 'menor'}`;
            const sufijo = calidad === 'mayor' ? 'M' : 'm';
            // Fundamental
            const fi = INT_INFO[calidad].fundamental;
            acordes.push({
                id: `${raiz}_${calidad}_fund`, name: nombreAcorde,
                degree: `${raizNombre}${sufijo}`, quality: calidad, type: 'fundamental',
                notes: [raizNombre, terceraNombre, quintaNombre],
                midis: [raizMidi, terceraMidi, quintaMidi],
                bassNote: raizNombre, bassRole: 'raíz',
                root: raizNombre,
                ...fi, flavour: `${nombreAcorde} en posición fundamental. Bajo en ${raizNombre} (raíz).`
            });
            // 1ª Inversión
            const i1 = INT_INFO[calidad].primera;
            acordes.push({
                id: `${raiz}_${calidad}_inv1`, name: nombreAcorde,
                degree: `${raizNombre}${sufijo}⁶`, quality: calidad, type: 'primera',
                notes: [terceraNombre, quintaNombre, raizNombre],
                midis: [terceraMidi, quintaMidi, raizMidi + 12],
                bassNote: terceraNombre, bassRole: '3ª',
                root: raizNombre,
                ...i1, flavour: `${nombreAcorde} en 1ª inversión. Bajo en ${terceraNombre} (la 3ª).`
            });
            // 2ª Inversión
            const i2 = INT_INFO[calidad].segunda;
            acordes.push({
                id: `${raiz}_${calidad}_inv2`, name: nombreAcorde,
                degree: `${raizNombre}${sufijo}⁶₄`, quality: calidad, type: 'segunda',
                notes: [quintaNombre, raizNombre, terceraNombre],
                midis: [quintaMidi, raizMidi + 12, terceraMidi + 12],
                bassNote: quintaNombre, bassRole: '5ª',
                root: raizNombre,
                ...i2, flavour: `${nombreAcorde} en 2ª inversión. Bajo en ${quintaNombre} (la 5ª).`
            });
        }
    }
    return acordes;
}

const CHORDS = generarAcordes();

const INTERVAL_MAP = { 'fund-int': 'fundamental', 'inv1-int': 'primera', 'inv2-int': 'segunda' };
const TYPE_LABELS = { fundamental: 'Posición Fundamental', primera: '1ª Inversión', segunda: '2ª Inversión' };
const COLOR_BY_TYPE = { fundamental: 'var(--fund-acc)', primera: 'var(--inv1-acc)', segunda: 'var(--inv2-acc)' };

// ─── EXPLORER ────────────────────────────────────────────────────
let currentFilter = 'all';
let currentRootFilter = 'all';

function buildTiles() {
    const container = document.getElementById('chordTiles');
    container.innerHTML = CHORDS.map(c => {
        const tClass = c.type === 'fundamental' ? 't-fund' : c.type === 'primera' ? 't-inv1' : 't-inv2';
        return `<div class="chord-tile ${tClass}" id="tile-${c.id}" onclick="openTile('${c.id}')">
  <div class="ct-color-strip"></div>
  <div class="ct-top"><div class="ct-name">${c.name}</div><div class="ct-degree">${c.degree}</div></div>
  <div class="ct-type-badge">${TYPE_LABELS[c.type]}</div>
  <div class="ct-notes"><span class="bass-note">${c.notes[0]}</span> · ${c.notes[1]} · ${c.notes[2]}</div>
  <div class="ct-intervals">${c.int1} / ${c.int2}</div>
</div>`;
    }).join('');
    applyFilter();
}

function setFilter(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn:not(.root-filter-btn)').forEach(b => b.classList.remove('f-active'));
    btn.classList.add('f-active');
    applyFilter();
    closeDrawer();
}

function setRootFilter(root, btn) {
    currentRootFilter = root;
    document.querySelectorAll('.root-filter-btn').forEach(b => b.classList.remove('f-active'));
    btn.classList.add('f-active');
    applyFilter();
    closeDrawer();
}

function applyFilter() {
    CHORDS.forEach(c => {
        const el = document.getElementById('tile-' + c.id);
        if (!el) return;
        const matchType = currentFilter === 'all'         ? true
                        : currentFilter === 'fundamental' ? c.type === 'fundamental'
                        : currentFilter === 'primera'     ? c.type === 'primera'
                        : currentFilter === 'segunda'     ? c.type === 'segunda'
                        : currentFilter === 'mayor'       ? c.quality === 'mayor'
                        :                                   c.quality === 'menor';
        const matchRoot = currentRootFilter === 'all' || c.root === currentRootFilter;
        el.classList.toggle('hidden', !(matchType && matchRoot));
    });
}

function openTile(id) {
    const c = CHORDS.find(x => x.id === id);
    if (!c) return;
    playChord(c.midis, 0.1);
    const tile = document.getElementById('tile-' + id);
    tile.classList.add('playing');
    setTimeout(() => tile.classList.remove('playing'), 400);

    document.getElementById('ddName').textContent = `${c.name} — ${TYPE_LABELS[c.type]}`;
    document.getElementById('ddFlavour').textContent = c.flavour;
    document.getElementById('ddType').textContent = TYPE_LABELS[c.type];
    document.getElementById('ddColor').textContent = c.color;
    document.getElementById('ddBass').textContent = `${c.bassNote}  (es la ${c.bassRole})`;
    document.getElementById('ddNotes').innerHTML = `<strong>${c.notes[0]}</strong> · ${c.notes[1]} · ${c.notes[2]}`;

    const st1 = c.int1.match(/\d+ st/)?.[0] || '';
    const st2 = c.int2.match(/\d+ st/)?.[0] || '';
    const lb1 = c.int1.replace(/\s*\(\d+ st\)/, '').trim();
    const lb2 = c.int2.replace(/\s*\(\d+ st\)/, '').trim();
    document.getElementById('ddIntBody').innerHTML = `
<tr><td>${c.bassNote} → ${c.notes[1]}</td><td>${c.notes[1]}</td><td>${lb1}</td><td>${st1}</td></tr>
<tr><td>${c.bassNote} → ${c.notes[2]}</td><td>${c.notes[2]}</td><td>${lb2}</td><td>${st2}</td></tr>`;

    document.getElementById('chordModalBg').classList.add('open');
    document.body.classList.add('modal-open');
}

function closeDrawer() {
    document.getElementById('chordModalBg').classList.remove('open');
    document.body.classList.remove('modal-open');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDrawer(); closeAnalysis(); } });

