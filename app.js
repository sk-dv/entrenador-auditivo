// ─── TAB ─────────────────────────────────────────────────────────
function switchTab(name) {
    ['aprender', 'explorar', 'practicar'].forEach((n, i) => {
        document.querySelectorAll('.tab-btn')[i].classList.toggle('active', n === name);
        document.getElementById('tab-' + n).classList.toggle('active', n === name);
    });
}

// ─── AUDIO ───────────────────────────────────────────────────────
const AC = window.AudioContext || window.webkitAudioContext;
let ac;
function ctx() { if (!ac) ac = new AC(); if (ac.state === 'suspended') ac.resume(); return ac; }
function mfreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
function playNote(midi, start, dur) {
    const a = ctx(), o = a.createOscillator(), g = a.createGain();
    const o2 = a.createOscillator(), g2 = a.createGain();
    o.type = 'triangle'; o.frequency.value = mfreq(midi);
    o2.type = 'sine'; o2.frequency.value = mfreq(midi) * 2; g2.gain.value = 0.06;
    o2.connect(g2); g2.connect(a.destination); o2.start(start); o2.stop(start + dur + 0.1);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.26, start + 0.025);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.connect(g); g.connect(a.destination); o.start(start); o.stop(start + dur + 0.1);
}
function playChord(midis, arp) {
    const a = ctx(), now = a.currentTime + 0.05;
    midis.forEach((m, i) => playNote(m, now + (arp ? i * 0.1 : 0), 1.8));
}

// ─── CHORD DATA ───────────────────────────────────────────────────
const CHORDS = [
    // C
    {
        id: 'C_inv2', name: 'Do Mayor', degree: 'I⁶₄', quality: 'mayor', type: 'segunda',
        notes: ['Sol', 'Do', 'Mi'], midis: [43, 48, 52], bassNote: 'Sol', bassRole: '5ª',
        int1: '4ª Justa (5 st)', int2: '6ª Mayor (9 st)', intKey: 'inv2-int',
        color: 'Tenso · suspendido · exponencializa',
        flavour: 'C en 2ª inv. Bajo en Sol crea tensión máxima sobre la tónica. Pide resolución.'
    },
    {
        id: 'C_fund', name: 'Do Mayor', degree: 'I', quality: 'mayor', type: 'fundamental',
        notes: ['Do', 'Mi', 'Sol'], midis: [48, 52, 55], bassNote: 'Do', bassRole: 'raíz',
        int1: '3ª Mayor (4 st)', int2: '5ª Justa (7 st)', intKey: 'fund-int',
        color: 'Estable · sólido · conclusivo',
        flavour: 'Tónica en fundamental. El estado de reposo absoluto en Do Mayor.'
    },
    {
        id: 'C_inv1', name: 'Do Mayor', degree: 'I⁶', quality: 'mayor', type: 'primera',
        notes: ['Mi', 'Sol', 'Do'], midis: [52, 55, 60], bassNote: 'Mi', bassRole: '3ª',
        int1: '3ª menor (3 st)', int2: '6ª Mayor (9 st)', intKey: 'inv1-int',
        color: 'Suave · fluido · atenúa',
        flavour: 'C en 1ª inv. Bajo en Mi alivia el peso de la tónica. Elegante.'
    },

    // Dm
    {
        id: 'Dm_inv1', name: 'Re menor', degree: 'II⁶', quality: 'menor', type: 'primera',
        notes: ['Fa', 'La', 'Re'], midis: [53, 57, 62], bassNote: 'Fa', bassRole: '3ª',
        int1: '3ª Mayor (4 st)', int2: '6ª menor (8 st)', intKey: 'inv1-int',
        color: 'Suave · atenúa · predomínante ligero',
        flavour: 'Dm en 1ª inv. El bajo en Fa suaviza el oscuro Re menor. Clásico antes del V.'
    },
    {
        id: 'Dm_fund', name: 'Re menor', degree: 'II', quality: 'menor', type: 'fundamental',
        notes: ['Re', 'Fa', 'La'], midis: [50, 53, 57], bassNote: 'Re', bassRole: 'raíz',
        int1: '3ª menor (3 st)', int2: '5ª Justa (7 st)', intKey: 'fund-int',
        color: 'Estable · oscuro · peso completo',
        flavour: 'Re menor en fundamental. Oscuro y estable.'
    },

    // A mayor
    {
        id: 'A_fund', name: 'La Mayor', degree: 'VI M', quality: 'mayor', type: 'fundamental',
        notes: ['La', 'Do#', 'Mi'], midis: [45, 49, 52], bassNote: 'La', bassRole: 'raíz',
        int1: '3ª Mayor (4 st)', int2: '5ª Justa (7 st)', intKey: 'fund-int',
        color: 'Estable · brillante · peso completo',
        flavour: 'A Mayor en fundamental. El Do# (fuera de Do diatónico) le da un brillo cromático especial.'
    },

    // B mayor
    {
        id: 'B_inv1', name: 'Si Mayor', degree: 'VII M⁶', quality: 'mayor', type: 'primera',
        notes: ['Re#', 'Fa#', 'Si'], midis: [51, 54, 59], bassNote: 'Re#', bassRole: '3ª',
        int1: '3ª menor (3 st)', int2: '6ª Mayor (9 st)', intKey: 'inv1-int',
        color: 'Suave · brillante · atenúa',
        flavour: 'B Mayor en 1ª inv. Bajo en Re# — completamente cromatico respecto a Do. Fluye con carácter.'
    },
    {
        id: 'B_fund', name: 'Si Mayor', degree: 'VII M', quality: 'mayor', type: 'fundamental',
        notes: ['Si', 'Re#', 'Fa#'], midis: [47, 51, 54], bassNote: 'Si', bassRole: 'raíz',
        int1: '3ª Mayor (4 st)', int2: '5ª Justa (7 st)', intKey: 'fund-int',
        color: 'Estable · brillante · extra-tonal',
        flavour: 'B Mayor en fundamental. Fuera de Do diatónico — color muy llamativo y brillante.'
    },

    // Am
    {
        id: 'Am_fund', name: 'La menor', degree: 'VI m', quality: 'menor', type: 'fundamental',
        notes: ['La', 'Do', 'Mi'], midis: [45, 48, 52], bassNote: 'La', bassRole: 'raíz',
        int1: '3ª menor (3 st)', int2: '5ª Justa (7 st)', intKey: 'fund-int',
        color: 'Estable · oscuro · relativo menor',
        flavour: 'La menor en fundamental. Sombrío y estable — el relativo menor de Do.'
    },
    {
        id: 'Am_inv2', name: 'La menor', degree: 'VI m⁶₄', quality: 'menor', type: 'segunda',
        notes: ['Mi', 'La', 'Do'], midis: [52, 57, 60], bassNote: 'Mi', bassRole: '5ª',
        int1: '4ª Justa (5 st)', int2: '6ª menor (8 st)', intKey: 'inv2-int',
        color: 'Tenso · sombríamente inestable · exponencializa',
        flavour: 'Am en 2ª inv. Bajo en Mi + carácter menor = tensión oscura muy particular.'
    },
    {
        id: 'Am_inv1', name: 'La menor', degree: 'VI m⁶', quality: 'menor', type: 'primera',
        notes: ['Do', 'Mi', 'La'], midis: [48, 52, 57], bassNote: 'Do', bassRole: '3ª',
        int1: '3ª Mayor (4 st)', int2: '6ª Mayor (9 st)', intKey: 'inv1-int',
        color: 'Suave · atenúa · menor ligero',
        flavour: 'Am en 1ª inv. Bajo en Do alivia el peso del menor.'
    },

    // Gm
    {
        id: 'Gm_inv2', name: 'Sol menor', degree: 'V m⁶₄', quality: 'menor', type: 'segunda',
        notes: ['Re', 'Sol', 'Sib'], midis: [50, 55, 58], bassNote: 'Re', bassRole: '5ª',
        int1: '4ª Justa (5 st)', int2: '6ª menor (8 st)', intKey: 'inv2-int',
        color: 'Tenso · oscuro · suspendido',
        flavour: 'Gm en 2ª inv. El Sib es modal — fuera de Do diatónico. Tensión oscura e inusual.'
    },
    {
        id: 'Gm_fund', name: 'Sol menor', degree: 'V m', quality: 'menor', type: 'fundamental',
        notes: ['Sol', 'Sib', 'Re'], midis: [43, 46, 50], bassNote: 'Sol', bassRole: 'raíz',
        int1: '3ª menor (3 st)', int2: '5ª Justa (7 st)', intKey: 'fund-int',
        color: 'Estable · oscuro · modal',
        flavour: 'Sol menor en fundamental. El Sib da color modal oscuro.'
    },

    // F
    {
        id: 'F_inv2', name: 'Fa Mayor', degree: 'IV⁶₄', quality: 'mayor', type: 'segunda',
        notes: ['Do', 'Fa', 'La'], midis: [48, 53, 57], bassNote: 'Do', bassRole: '5ª',
        int1: '4ª Justa (5 st)', int2: '6ª Mayor (9 st)', intKey: 'inv2-int',
        color: 'Tenso · cadencial · inestable',
        flavour: 'F en 2ª inv. Bajo en Do — crea tensión subdominante sobre la nota tónica.'
    },
    {
        id: 'F_fund', name: 'Fa Mayor', degree: 'IV', quality: 'mayor', type: 'fundamental',
        notes: ['Fa', 'La', 'Do'], midis: [53, 57, 60], bassNote: 'Fa', bassRole: 'raíz',
        int1: '3ª Mayor (4 st)', int2: '5ª Justa (7 st)', intKey: 'fund-int',
        color: 'Estable · cálido · subdominante',
        flavour: 'Fa Mayor en fundamental. Cálido y amplio, el IV grado clásico.'
    },
    {
        id: 'F_inv1', name: 'Fa Mayor', degree: 'IV⁶', quality: 'mayor', type: 'primera',
        notes: ['La', 'Do', 'Fa'], midis: [57, 60, 65], bassNote: 'La', bassRole: '3ª',
        int1: '3ª menor (3 st)', int2: '6ª Mayor (9 st)', intKey: 'inv1-int',
        color: 'Suave · fluido · atenúa',
        flavour: 'Fa en 1ª inv. Bajo en La hace la subdominante más ligera y melódica.'
    },

    // D mayor
    {
        id: 'D_fund', name: 'Re Mayor', degree: 'II M', quality: 'mayor', type: 'fundamental',
        notes: ['Re', 'Fa#', 'La'], midis: [50, 54, 57], bassNote: 'Re', bassRole: 'raíz',
        int1: '3ª Mayor (4 st)', int2: '5ª Justa (7 st)', intKey: 'fund-int',
        color: 'Estable · brillante · extra-tonal',
        flavour: 'Re Mayor en fundamental. El Fa# (fuera de Do diatónico) da brillo y carácter.'
    },

    // G mayor
    {
        id: 'G_fund', name: 'Sol Mayor', degree: 'V', quality: 'mayor', type: 'fundamental',
        notes: ['Sol', 'Si', 'Re'], midis: [43, 47, 50], bassNote: 'Sol', bassRole: 'raíz',
        int1: '3ª Mayor (4 st)', int2: '5ª Justa (7 st)', intKey: 'fund-int',
        color: 'Estable · dominante · pide resolver a I',
        flavour: 'V en fundamental. Tensión dominante — pide ir al I.'
    },
    {
        id: 'G_inv1', name: 'Sol Mayor', degree: 'V⁶', quality: 'mayor', type: 'primera',
        notes: ['Si', 'Re', 'Sol'], midis: [47, 50, 55], bassNote: 'Si', bassRole: '3ª',
        int1: '3ª menor (3 st)', int2: '6ª menor (8 st)', intKey: 'inv1-int',
        color: 'Suave · dominante ligero · atenúa',
        flavour: 'G en 1ª inv. Bajo en Si crea línea descendente elegante Si→La hacia I.'
    },

    // Em
    {
        id: 'Em_fund', name: 'Mi menor', degree: 'III m', quality: 'menor', type: 'fundamental',
        notes: ['Mi', 'Sol', 'Si'], midis: [52, 55, 59], bassNote: 'Mi', bassRole: 'raíz',
        int1: '3ª menor (3 st)', int2: '5ª Justa (7 st)', intKey: 'fund-int',
        color: 'Estable · oscuro · íntimo',
        flavour: 'Mi menor en fundamental. El III grado — estable con carácter íntimo.'
    },
];

const INTERVAL_MAP = { 'fund-int': 'fundamental', 'inv1-int': 'primera', 'inv2-int': 'segunda' };
const TYPE_LABELS = { fundamental: 'Posición Fundamental', primera: '1ª Inversión', segunda: '2ª Inversión' };
const COLOR_BY_TYPE = { fundamental: 'var(--fund-acc)', primera: 'var(--inv1-acc)', segunda: 'var(--inv2-acc)' };

// ─── EXPLORER ────────────────────────────────────────────────────
let currentFilter = 'all';

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
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('f-active'));
    btn.classList.add('f-active');
    applyFilter();
    closeDrawer();
}

function applyFilter() {
    CHORDS.forEach(c => {
        const el = document.getElementById('tile-' + c.id);
        if (!el) return;
        const show = currentFilter === 'all'         ? true
                   : currentFilter === 'fundamental' ? c.type === 'fundamental'
                   : currentFilter === 'primera'     ? c.type === 'primera'
                   : currentFilter === 'segunda'     ? c.type === 'segunda'
                   : currentFilter === 'mayor'       ? c.quality === 'mayor'
                   :                                   c.quality === 'menor';
        el.classList.toggle('hidden', !show);
    });
}

function openTile(id) {
    const c = CHORDS.find(x => x.id === id);
    if (!c) return;
    playChord(c.midis, true);
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

    const drawer = document.getElementById('detailDrawer');
    drawer.classList.add('open');
    drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeDrawer() { document.getElementById('detailDrawer').classList.remove('open'); }

// ─── QUIZ ─────────────────────────────────────────────────────────
let current = null, roundNum = 0;
let scores = { s1: [0, 0], s2: [0, 0], s3: [0, 0] };
let phase = 'idle';

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function startRound() {
    current = rand(CHORDS); roundNum++; phase = 'step1';
    document.getElementById('playHint').textContent = 'escuchando… ↺ para repetir';
    document.getElementById('repeatBtn').disabled = false;
    document.getElementById('revealPanel').classList.remove('visible');
    document.getElementById('intervalReveal').classList.remove('visible');
    ['step1', 'step2', 'step3'].forEach(id => {
        const el = document.getElementById(id);
        el.classList.remove('active', 'done');
        el.querySelectorAll('.choice-btn').forEach(b => { b.classList.remove('selected-correct', 'selected-wrong', 'reveal-correct'); b.disabled = false; });
    });
    ['sc1', 'sc2', 'sc3'].forEach(id => {
        document.getElementById(id).textContent = id.slice(-1);
        document.getElementById(id).style.background = 'var(--ink)';
    });
    document.getElementById('step1').classList.add('active');
    document.getElementById('scoreRound').textContent = '#' + roundNum;
    const pb = document.getElementById('playBtn');
    pb.classList.add('ringing'); setTimeout(() => pb.classList.remove('ringing'), 400);
    playChord(current.midis, true);
}

function repeatChord() { if (current) playChord(current.midis, false); }
function nextRound() { startRound(); }

function markStep(n, correct) {
    const sc = document.getElementById('sc' + n);
    sc.textContent = correct ? '✓' : '✗';
    sc.style.background = correct ? 'var(--correct)' : 'var(--wrong)';
    scores['s' + n][0] += correct ? 1 : 0; scores['s' + n][1] += 1;
    updateScoreUI();
}

function answerStep1(answer) {
    const correct = answer === current.quality; markStep(1, correct);
    const btns = document.getElementById('step1').querySelectorAll('.choice-btn');
    btns.forEach(b => b.disabled = true);
    btns[answer === 'mayor' ? 0 : 1].classList.add(correct ? 'selected-correct' : 'selected-wrong');
    if (!correct) btns[current.quality === 'mayor' ? 0 : 1].classList.add('reveal-correct');
    document.getElementById('step1').classList.replace('active', 'done');
    document.getElementById('step2').classList.add('active'); phase = 'step2';
}

function answerStep2(answer) {
    const correct = answer === current.type; markStep(2, correct);
    const order = ['fundamental', 'primera', 'segunda'];
    const btns = document.getElementById('step2').querySelectorAll('.choice-btn');
    btns.forEach((b, i) => { b.disabled = true; if (order[i] === current.type && !correct) b.classList.add('reveal-correct'); });
    btns[order.indexOf(answer)].classList.add(correct ? 'selected-correct' : 'selected-wrong');
    document.getElementById('step2').classList.replace('active', 'done');
    document.getElementById('step3').classList.add('active'); phase = 'step3';
}

function answerStep3(answer) {
    const correct = INTERVAL_MAP[answer] === current.type; markStep(3, correct);
    const order = ['fund-int', 'inv1-int', 'inv2-int'];
    const btns = document.getElementById('step3').querySelectorAll('.choice-btn');
    btns.forEach((b, i) => { b.disabled = true; if (order[i] === current.intKey && !correct) b.classList.add('reveal-correct'); });
    btns[order.indexOf(answer)].classList.add(correct ? 'selected-correct' : 'selected-wrong');
    document.getElementById('iBasNote').textContent = current.bassNote + ' (es la ' + current.bassRole + ')';
    document.getElementById('iMidNote').textContent = current.notes[1];
    document.getElementById('iTopNote').textContent = current.notes[2];
    document.getElementById('iInt1').textContent = current.int1 + ' → ' + current.bassNote + ' a ' + current.notes[1];
    document.getElementById('iInt2').textContent = current.int2 + ' → ' + current.bassNote + ' a ' + current.notes[2];
    document.getElementById('intervalReveal').classList.add('visible');
    document.getElementById('step3').classList.replace('active', 'done');
    showReveal(); phase = 'done';
}

function showReveal() {
    document.getElementById('revName').textContent = current.name + ' — ' + TYPE_LABELS[current.type];
    document.getElementById('revSub').textContent = current.flavour;
    document.getElementById('revPills').innerHTML = [
        { t: current.degree, a: true },
        { t: current.quality === 'mayor' ? 'Mayor' : 'Menor', a: false },
        { t: current.color, a: false },
        { t: 'Bajo: ' + current.bassNote + ' (' + current.bassRole + ')', a: true },
    ].map(p => `<span class="rev-pill ${p.a ? 'acc' : ''}">${p.t}</span>`).join('');
    document.getElementById('revealPanel').classList.add('visible');
}

function updateScoreUI() {
    [1, 2, 3].forEach(i => {
        const [c, t] = scores['s' + i];
        document.getElementById('s' + i + 'Score').textContent = c + '/' + t;
    });
    const tc = scores.s1[0] + scores.s2[0] + scores.s3[0];
    const tt = scores.s1[1] + scores.s2[1] + scores.s3[1];
    document.getElementById('totalScore').textContent = tc + '/' + tt;
}

// ─── INIT ─────────────────────────────────────────────────────────
buildTiles();
