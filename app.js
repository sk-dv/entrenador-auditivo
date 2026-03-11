// ─── TAB ─────────────────────────────────────────────────────────
function switchTab(name) {
    ['aprender', 'explorar', 'practicar', 'grados', 'dictado'].forEach((n, i) => {
        document.querySelectorAll('.tab-btn')[i].classList.toggle('active', n === name);
        document.getElementById('tab-' + n).classList.toggle('active', n === name);
    });
}

// ─── AUDIO ───────────────────────────────────────────────────────
const AC = window.AudioContext || window.webkitAudioContext;
let ac;
let masterOut = null;
let masterGain = null;
let activeNodes = [];

function ctx() {
    if (!ac) {
        ac = new AC();
        const lim = ac.createDynamicsCompressor();
        lim.threshold.value = -3;
        lim.knee.value = 0;
        lim.ratio.value = 20;
        lim.attack.value = 0.001;
        lim.release.value = 0.05;
        lim.connect(ac.destination);

        const comp = ac.createDynamicsCompressor();
        comp.threshold.value = -24;
        comp.knee.value = 12;
        comp.ratio.value = 4;
        comp.attack.value = 0.005;
        comp.release.value = 0.2;

        masterGain = ac.createGain();
        masterGain.gain.value = 1;
        comp.connect(masterGain);
        masterGain.connect(lim);
        masterOut = comp;
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
}

function stopAllNodes() {
    // Silencia instantáneamente todo el grafo de audio
    if (masterGain && ac) {
        masterGain.gain.cancelScheduledValues(ac.currentTime);
        masterGain.gain.setValueAtTime(0, ac.currentTime);
        masterGain.gain.linearRampToValueAtTime(1, ac.currentTime + 0.02);
    }
    activeNodes.forEach(n => {
        try { n.disconnect(); } catch(e) {}
        try { n.stop(0); }    catch(e) {}
    });
    activeNodes = [];
}

function mfreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

function playNote(midi, start, dur, gain = 0.12) {
    const a = ctx(), o = a.createOscillator(), g = a.createGain();
    o.type = 'sine';
    o.frequency.value = mfreq(midi);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.04);
    g.gain.setValueAtTime(gain, start + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.connect(g); g.connect(masterOut);
    o.start(start); o.stop(start + dur + 0.1);
    activeNodes.push(o, g);
}

// arpInterval = 0 → simultáneo; > 0 → tiempo entre notas (arpegio)
function playChord(midis, arpInterval) {
    stopAllNodes();
    const a = ctx(), now = a.currentTime + 0.05;
    midis.forEach((m, i) => playNote(m, now + (arpInterval ? i * arpInterval : 0), 1.8));
}

// ─── CHORD DATA — INVERSIONES ─────────────────────────────────────
const NOTAS = ['Do', 'Do#', 'Re', 'Mib', 'Mi', 'Fa', 'Fa#', 'Sol', 'Lab', 'La', 'Sib', 'Si'];
const BASE_MIDI = 48; // Do3

function generarAcordes() {
    const INT_INFO = {
        mayor: {
            fundamental: { int1: '3ª Mayor (4 st)', int2: '5ª Justa (7 st)',  intKey: 'fund-int', color: 'Estable · sólido · conclusivo' },
            primera:     { int1: '3ª menor (3 st)', int2: '6ª Mayor (9 st)',  intKey: 'inv1-int', color: 'Suave · fluido · atenúa' },
            segunda:     { int1: '4ª Justa (5 st)', int2: '6ª Mayor (9 st)', intKey: 'inv2-int', color: 'Tenso · suspendido · exponencializa' },
        },
        menor: {
            fundamental: { int1: '3ª menor (3 st)', int2: '5ª Justa (7 st)',  intKey: 'fund-int', color: 'Estable · oscuro · peso completo' },
            primera:     { int1: '3ª Mayor (4 st)', int2: '6ª menor (8 st)', intKey: 'inv1-int', color: 'Suave · atenúa · menor ligero' },
            segunda:     { int1: '4ª Justa (5 st)', int2: '6ª menor (8 st)', intKey: 'inv2-int', color: 'Tenso · sombríamente inestable' },
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

// ─── QUIZ — INVERSIONES ───────────────────────────────────────────
let current = null, roundNum = 0;
let scores = { s1: [0, 0], s2: [0, 0], s3: [0, 0] };
let phase = 'idle';

// Modos de reproducción (compartido entre Practicar y Grados)
let playMode = 'simul'; // 'simul' | 'arp'
let repeatCount = 0;
// Velocidades del arpegio — cicla de vuelta al inicio tras el último paso
const ARP_DELAYS  = [0.09, 0.14, 0.20, 0.28, 0.38, 0.50];
const TEMPO_NAMES = ['allegro', 'andante', 'moderato', 'lento', 'adagio', 'largo'];

function setPlayMode(mode) {
    playMode = mode;
    document.querySelectorAll('.mode-btn-simul').forEach(b => b.classList.toggle('m-active', mode === 'simul'));
    document.querySelectorAll('.mode-btn-arp').forEach(b => b.classList.toggle('m-active', mode === 'arp'));
}

function getArpDelay() {
    // Cicla de vuelta a allegro después del último paso
    return ARP_DELAYS[repeatCount % ARP_DELAYS.length];
}

function getTempoName() {
    return TEMPO_NAMES[repeatCount % TEMPO_NAMES.length];
}

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ─── SELECCIÓN ADAPTATIVA ─────────────────────────────────────────
// Peso inverso a la precisión: si fallas más en X, X aparece más
function adaptiveWeights(items, detalleMod, keyFn) {
    const det = (cargarProgreso().detalle || {})[detalleMod] || {};
    return items.map(item => {
        const [ok, tot] = det[keyFn(item)] || [0, 0];
        const weight = tot < 5 ? 0.8 : Math.max(0.1, 1 - ok / tot);
        return { item, weight };
    });
}

function weightedPick(weighted) {
    const total = weighted.reduce((s, x) => s + x.weight, 0);
    let r = Math.random() * total;
    for (const x of weighted) { r -= x.weight; if (r <= 0) return x.item; }
    return weighted[weighted.length - 1].item;
}

function pickAdaptiveDegree() {
    return weightedPick(adaptiveWeights(DEGREES, 'grados', d => d.num));
}

function pickAdaptiveChord() {
    // Primero elige tipo (fund/primera/segunda) por peso, luego acorde al azar dentro del tipo
    const types = ['fundamental', 'primera', 'segunda'];
    const det = (cargarProgreso().detalle || {}).inversiones || {};
    const typeW = types.map(t => {
        const [ok, tot] = det[t] || [0, 0];
        return { item: t, weight: tot < 5 ? 0.8 : Math.max(0.1, 1 - ok / tot) };
    });
    const chosenType = weightedPick(typeW);
    return rand(CHORDS.filter(c => c.type === chosenType));
}

function pickAdaptiveDictadoNote() {
    const det = (cargarProgreso().detalle || {}).dictado || {};
    const weighted = dictadoSet.notes.map(n => {
        const [ok, tot] = det[n] || [0, 0];
        return { item: n, weight: tot < 5 ? 0.8 : Math.max(0.1, 1 - ok / tot) };
    });
    return weightedPick(weighted);
}

function startRound() {
    current = pickAdaptiveChord(); roundNum++; phase = 'step1';
    repeatCount = 0;
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
    playChord(current.midis, playMode === 'arp' ? ARP_DELAYS[0] : 0);
}

function repeatChord() {
    if (!current) return;
    repeatCount++;
    playChord(current.midis, playMode === 'arp' ? getArpDelay() : 0);
    if (playMode === 'arp') {
        const looped = (repeatCount % ARP_DELAYS.length) === 0;
        const hint = looped ? 'arpegiado · allegro ↺' : `arpegiado · ${getTempoName()}`;
        document.getElementById('playHint').textContent = hint;
    }
}

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
    registrarDetalle('inversiones', current.type, correct);
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
    guardarRonda('inversiones', scores.s1[0]+scores.s2[0]+scores.s3[0], scores.s1[1]+scores.s2[1]+scores.s3[1]);
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

// ─── GRADOS TONALES (en Do Mayor) ────────────────────────────────
// Los 5 acordes diatónicos de Do Mayor: I III IV V VI
// Todos en posición fundamental, en registro medio
const DEGREES = [
    {
        num: 'I', name: 'Tónica', quality: 'mayor',
        chordName: 'Do Mayor', notes: ['Do', 'Mi', 'Sol'], midis: [60, 64, 67],
        feeling: '"Llegué. Reposo absoluto."',
        desc: 'La base de todo. El hogar tonal. Cualquier frase musical se siente completa cuando llega aquí.',
        color: '#4caf7d',
        prog: 'I → IV → V → I — la progresión más clásica',
        ref: '"Las Mañanitas" y "Cielito Lindo" terminan siempre en este acorde',
        qualityLabel: 'Mayor'
    },
    {
        num: 'II', name: 'Supertónica', quality: 'menor',
        chordName: 'Re menor', notes: ['Re', 'Fa', 'La'], midis: [62, 65, 69],
        feeling: '"Puente íntimo. Quiero moverme."',
        desc: 'Acorde menor sobre la segunda nota. Tiene una tensión suave que pide resolver hacia el V o el IV. Muy común en cadencias y en la progresión II-V-I del jazz.',
        color: '#c4886e',
        prog: 'I → II → V → I — cadencia con supertónica',
        ref: '"Cielito Lindo" pasa por el II en el verso · cadencia II-V-I muy usada en bolero',
        qualityLabel: 'menor'
    },
    {
        num: 'III', name: 'Mediante', quality: 'menor',
        chordName: 'Mi menor', notes: ['Mi', 'Sol', 'Si'], midis: [52, 55, 59],
        feeling: '"Íntimo. Un poco oscuro."',
        desc: 'Acorde menor sobre la tercera nota. Comparte dos notas con el I (Mi, Sol) y dos con el V (Sol, Si). Ambiguo y expresivo.',
        color: '#9b8ec4',
        prog: 'I → III → IV — movimiento descendente con emoción',
        ref: '"El Rey" (José Alfredo) — el III aparece en el puente antes del IV',
        qualityLabel: 'menor'
    },
    {
        num: 'IV', name: 'Subdominante', quality: 'mayor',
        chordName: 'Fa Mayor', notes: ['Fa', 'La', 'Do'], midis: [53, 57, 60],
        feeling: '"Me alejo del centro."',
        desc: 'Cálido y amplio. Tensión de salida — lleva al V con urgencia o regresa al I con calidez (cadencia plagal "amén").',
        color: '#d4aa3e',
        prog: 'I → IV → V → I · I → IV → I (plagal "amén")',
        ref: '"La Bamba" — el IV es el segundo acorde de toda la canción',
        qualityLabel: 'Mayor'
    },
    {
        num: 'V', name: 'Dominante', quality: 'mayor',
        chordName: 'Sol Mayor', notes: ['Sol', 'Si', 'Re'], midis: [55, 59, 62],
        feeling: '"Tengo que resolver. Ahora."',
        desc: 'La tensión más fuerte de la tonalidad. El Si (sensible) pide subir al Do. Motor de toda la armonía tonal.',
        color: '#e07a3a',
        prog: 'V → I: cadencia auténtica, la más conclusiva',
        ref: '"Himno Nacional" — cada final de frase cae de V a I',
        qualityLabel: 'Mayor'
    },
    {
        num: 'VI', name: 'Superdominante', quality: 'menor',
        chordName: 'La menor', notes: ['La', 'Do', 'Mi'], midis: [57, 60, 64],
        feeling: '"Nostalgia. El lado oscuro."',
        desc: 'El relativo menor de Do. Oscuro pero estable. Base de la progresión I-V-VI-IV (pop, rock, bolero).',
        color: '#6abfb0',
        prog: 'I → V → VI → IV — la "progresión del pop"',
        ref: '"La Cucaracha" pasa por este acorde · "Bésame Mucho" lo usa como punto de partida',
        qualityLabel: 'menor'
    },
];

let currentDegree = null, degRound = 0;
let degScores = [0, 0];
let degPhase = 'idle';
let degRepeatCount = 0;

function buildDegreeRef() {
    document.getElementById('degRefGrid').innerHTML = DEGREES.map(d => `
<div class="deg-card" style="--deg-col:${d.color}">
    <div class="deg-num-badge" style="color:${d.color}">${d.num}</div>
    <div class="deg-chord-name">${d.chordName}</div>
    <div class="deg-quality-tag ${d.quality === 'mayor' ? 'dq-mayor' : 'dq-menor'}">${d.qualityLabel}</div>
    <div class="deg-fn-name">${d.name}</div>
    <div class="deg-feeling">${d.feeling}</div>
    <div class="deg-notes-row">${d.notes.join(' · ')}</div>
    <div class="deg-prog-hint">${d.prog}</div>
    <div class="deg-ref-song">${d.ref}</div>
</div>`).join('');

    document.getElementById('degBtnGrid').innerHTML = DEGREES.map(d =>
        `<button class="deg-btn" data-deg="${d.num}" style="--deg-color:${d.color}" onclick="answerDegree('${d.num}')">
    <span class="deg-btn-num">${d.num}</span>
    <span class="deg-btn-chord">${d.chordName}</span>
    <span class="deg-btn-quality ${d.quality === 'mayor' ? 'dq-mayor' : 'dq-menor'}">${d.qualityLabel}</span>
</button>`
    ).join('');
}

// El contexto tonal: Do Mayor arpegiado suave, luego el acorde misterio
function playDegreeContext(degData, arpInterval) {
    stopAllNodes();
    const a = ctx(), now = a.currentTime + 0.05;
    const step = 0.13;
    // Contexto: Do-Mi-Sol (gain más bajo para distinguirlo del acorde misterio)
    [60, 64, 67].forEach((m, i) => {
        const o = a.createOscillator(), g = a.createGain();
        o.type = 'sine'; o.frequency.value = mfreq(m);
        g.gain.setValueAtTime(0, now + i * step);
        g.gain.linearRampToValueAtTime(0.10, now + i * step + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * step + 0.9);
        o.connect(g); g.connect(masterOut);
        o.start(now + i * step); o.stop(now + i * step + 1.0);
        activeNodes.push(o, g);
    });
    // Pausa + acorde misterio (más fuerte para destacar)
    const offset = now + 3 * step + 0.55;
    degData.midis.forEach((m, i) =>
        playNote(m, offset + (arpInterval ? i * arpInterval : 0), 2.2, 0.07)
    );
}

function startDegreeRound() {
    currentDegree = pickAdaptiveDegree(); degRound++; degPhase = 'answering';
    degRepeatCount = 0;
    document.getElementById('degPlayHint').textContent = 'escuchando…';
    document.getElementById('degRepeatBtn').disabled = false;
    document.getElementById('degRevealPanel').classList.remove('visible');
    document.querySelectorAll('.deg-btn').forEach(b => {
        b.classList.remove('selected-correct', 'selected-wrong', 'reveal-correct');
        b.disabled = false;
    });
    document.getElementById('degRound').textContent = '#' + degRound;
    const btn = document.getElementById('degPlayBtn');
    btn.classList.add('ringing'); setTimeout(() => btn.classList.remove('ringing'), 400);

    const delay = playMode === 'arp' ? ARP_DELAYS[0] : 0;
    playDegreeContext(currentDegree, delay);

    setTimeout(() => {
        if (degPhase === 'answering')
            document.getElementById('degPlayHint').textContent = '¿qué grado tonal es?';
    }, 1800);
}

function repeatDegree() {
    if (!currentDegree) return;
    degRepeatCount++;
    const delay = playMode === 'arp' ? ARP_DELAYS[degRepeatCount % ARP_DELAYS.length] : 0;
    playDegreeContext(currentDegree, delay);
    if (playMode === 'arp') {
        const looped = (degRepeatCount % ARP_DELAYS.length) === 0;
        const tempo = TEMPO_NAMES[degRepeatCount % TEMPO_NAMES.length];
        document.getElementById('degPlayHint').textContent = looped ? 'arpegiado · allegro ↺' : `arpegiado · ${tempo}`;
    }
}

function answerDegree(num) {
    if (degPhase !== 'answering') return;
    degPhase = 'done';
    const correct = num === currentDegree.num;
    degScores[1]++;
    if (correct) degScores[0]++;
    registrarDetalle('grados', currentDegree.num, correct);

    document.querySelectorAll('.deg-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.deg === currentDegree.num && !correct) b.classList.add('reveal-correct');
    });
    document.querySelector(`.deg-btn[data-deg="${num}"]`).classList.add(correct ? 'selected-correct' : 'selected-wrong');

    const d = currentDegree;
    document.getElementById('degRevTitle').textContent = `${d.num} — ${d.chordName}`;
    document.getElementById('degRevQuality').textContent = d.qualityLabel;
    document.getElementById('degRevQuality').className = 'deg-rev-quality ' + (d.quality === 'mayor' ? 'dq-mayor' : 'dq-menor');
    document.getElementById('degRevFeeling').textContent = d.feeling;
    document.getElementById('degRevDesc').textContent = d.desc;
    document.getElementById('degRevProg').textContent = d.prog;
    document.getElementById('degRevealPanel').classList.add('visible');
    document.getElementById('degScore').textContent = `${degScores[0]}/${degScores[1]}`;
    guardarRonda('grados', degScores[0], degScores[1]);
}

// ─── PROGRESIONES ────────────────────────────────────────────────
const PROGRESSIONS = [
    // 2-chord cadences
    { id:'aut2', name:'Cadencia Auténtica', chords:['V','I'],
      feeling:'Resolución absoluta · cierre definitivo',
      desc:'La cadencia más conclusiva de la armonía tonal. El V resuelve al I — la tensión más fuerte se libera de golpe.',
      songs:['"Himno Nacional" — cierre de cada frase', '"Las Mañanitas" — nota final'],
      color:'#e07a3a', weight:5 },
    { id:'plag2', name:'Cadencia Plagal', chords:['IV','I'],
      feeling:'Cálida · suave · "amén"',
      desc:'El cierre meditativo y cálido. Menos urgente que la auténtica — típica de himnos y cierres litúrgicos.',
      songs:['"Amén" en himnos religiosos', '"La Bamba" — reposo final'],
      color:'#d4aa3e', weight:4 },
    { id:'semi2', name:'Semicadencia', chords:['I','V'],
      feeling:'Suspendida · pregunta sin respuesta',
      desc:'Termina en el V — queda flotando. Es como una pregunta musical. La frase pide continuación.',
      songs:['"Las Mañanitas" — la primera frase termina aquí'],
      color:'#7eb8d4', weight:4 },
    { id:'rota2', name:'Cadencia Rota', chords:['V','VI'],
      feeling:'Sorpresa · evasión · continúa',
      desc:'Esperabas el I pero llegó el VI menor. El compositor evade la resolución — la música quiere seguir.',
      songs:['"Bésame Mucho" — el giro dramático del verso'],
      color:'#9b8ec4', weight:3 },
    // 3-chord
    { id:'cad3', name:'Cadencia Completa', chords:['IV','V','I'],
      feeling:'Conclusiva · preparada · clásica',
      desc:'La cadencia auténtica precedida por la subdominante. Fórmula clásica al cerrar frases musicales.',
      songs:['"Himno Nacional" — cada cierre de verso', '"Cielito Lindo" — al final'],
      color:'#e07a3a', weight:5 },
    { id:'tens3', name:'Tensión Progresiva', chords:['I','IV','V'],
      feeling:'Ascendente · con dirección · incompleta',
      desc:'Sale de la tónica, avanza al IV y llega al V. Pide resolver al I — la progresión que empuja hacia adelante.',
      songs:['"La Bamba" — primera mitad del ciclo'],
      color:'#4caf7d', weight:4 },
    { id:'rel3', name:'Con el Relativo', chords:['I','VI','V'],
      feeling:'Con sombra · hacia la tensión',
      desc:'Pasa por el relativo menor antes de llegar al dominante. Le da un tono más expresivo y dramático.',
      songs:['"Bésame Mucho" — inicio del verso'],
      color:'#6abfb0', weight:3 },
    { id:'iv6v3', name:'Subdominante a Dominante', chords:['VI','IV','V'],
      feeling:'Oscura · creciente · incompleta',
      desc:'Empieza desde el relativo menor, pasa por el IV cálido y llega al V tenso. Pide resolver al I.',
      songs:['"La Llorona" (sección)'],
      color:'#9b8ec4', weight:3 },
    // 4-chord
    { id:'basic4', name:'La Básica', chords:['I','IV','V','I'],
      feeling:'Directa · completa · reposada',
      desc:'La progresión más fundamental de la música tonal. Sale de casa, avanza, crea tensión y regresa. El ciclo perfecto.',
      songs:['"La Bamba"', '"Guantanamera"', 'Blues en mayor'],
      color:'#4caf7d', weight:5 },
    { id:'pop4', name:'La del Pop', chords:['I','V','VI','IV'],
      feeling:'Emotiva · épica · universal',
      desc:'La progresión más grabada del pop moderno. El VI da el giro emocional antes de caer al IV cálido.',
      songs:['"No Woman No Cry" (Bob Marley)', '"Vivir mi Vida" (Marc Anthony)', '"Let It Be" (Beatles)'],
      color:'#e07a3a', weight:5 },
    { id:'bolero4', name:'La del Bolero', chords:['I','VI','IV','V'],
      feeling:'Nostálgica · romántica · circular',
      desc:'El sonido del bolero latinoamericano y el rock de los 50. El VI menor da el toque de nostalgia característico.',
      songs:['"El Reloj" (Los Panchos)', '"Bésame Mucho"', '"Stand By Me"'],
      color:'#6abfb0', weight:4 },
    { id:'desc4', name:'Con el Mediante', chords:['I','III','IV','V'],
      feeling:'Expresiva · colorida · ascendente',
      desc:'El III menor da un color íntimo y oscuro antes de abrirse al IV y tensionarse en el V.',
      songs:['"El Rey" (José Alfredo Jiménez) — puente', 'Corrido tradicional'],
      color:'#9b8ec4', weight:3 },
    { id:'dark4', name:'Empieza Oscuro', chords:['VI','IV','I','V'],
      feeling:'Oscura · ascendente · emotiva',
      desc:'Comienza desde el relativo menor, avanza hacia la luminosidad del I y se tensiona con el V. Circular y emotiva.',
      songs:['"La Llorona" (variante)', '"Oye Como Va" (Santana) — sección'],
      color:'#9b8ec4', weight:3 },
];

function weightedRand(arr) {
    const total = arr.reduce((sum, x) => sum + x.weight, 0);
    let r = Math.random() * total;
    for (const x of arr) { r -= x.weight; if (r <= 0) return x; }
    return arr[arr.length - 1];
}

function toggleGradosRef() {
    const grid = document.getElementById('degRefGrid');
    const btn  = document.getElementById('toggleRefBtn');
    const hidden = grid.classList.toggle('ref-hidden');
    btn.textContent = hidden ? 'ver referencia ↓' : 'ocultar referencia ↑';
}

function toggleProgRef() {
    const grid = document.getElementById('progRefGrid');
    const btn  = document.getElementById('toggleProgRefBtn');
    const hidden = grid.classList.toggle('ref-hidden');
    btn.textContent = hidden ? 'ver referencia ↓' : 'ocultar referencia ↑';
}

function switchGradosMode(mode) {
    document.getElementById('gradosSection').style.display = mode === 'grados' ? '' : 'none';
    document.getElementById('progresionesSection').style.display = mode === 'progresiones' ? '' : 'none';
    document.getElementById('gmGrados').classList.toggle('gm-active', mode === 'grados');
    document.getElementById('gmProg').classList.toggle('gm-active', mode === 'progresiones');
}

function buildProgRef() {
    document.getElementById('progRefGrid').innerHTML = PROGRESSIONS.map(p =>
        `<div class="prog-tile" onclick="playAndShowProg('${p.id}')" id="ptile-${p.id}" style="--prog-col:${p.color}">
    <div class="pt-color-strip"></div>
    <div class="pt-name">${p.name}</div>
    <div class="pt-chords">${p.chords.join(' → ')}</div>
    <div class="pt-feeling">${p.feeling}</div>
    <div class="pt-songs">${p.songs.slice(0,2).map(s => `<span>${s}</span>`).join('')}</div>
</div>`
    ).join('');
}

// ─── PROGRESIONES PERSONALIZADAS ──────────────────────────────────
const CLAVE_CUSTOM_PROGS = 'oido_custom_progs_v1';
let customProgBuilder = [];

function cargarCustomProgs() {
    try { return JSON.parse(localStorage.getItem(CLAVE_CUSTOM_PROGS)) || []; }
    catch { return []; }
}

function mergeCustomProgs() {
    // Eliminar custom anteriores del array, luego re-insertar los guardados
    for (let i = PROGRESSIONS.length - 1; i >= 0; i--) {
        if (PROGRESSIONS[i].isCustom) PROGRESSIONS.splice(i, 1);
    }
    cargarCustomProgs().forEach(p => PROGRESSIONS.push({ ...p, isCustom: true }));
}

function guardarYMergeCustomProg(name, chords) {
    const progs = cargarCustomProgs();
    progs.push({
        id: 'custom_' + Date.now(), name: name.trim(), chords,
        weight: 3, feeling: '', desc: 'Progresión personalizada.',
        songs: [], color: '#8b7355'
    });
    localStorage.setItem(CLAVE_CUSTOM_PROGS, JSON.stringify(progs));
    mergeCustomProgs();
    buildProgRef();
    renderCustomProgList();
}

function deleteCustomProg(id) {
    const progs = cargarCustomProgs().filter(p => p.id !== id);
    localStorage.setItem(CLAVE_CUSTOM_PROGS, JSON.stringify(progs));
    mergeCustomProgs();
    buildProgRef();
    renderCustomProgList();
}

function customBuilderToggle(num) {
    if (customProgBuilder.length >= 8) return;
    customProgBuilder.push(num);
    renderCustomBuilderPreview();
}

function customBuilderRemoveLast() {
    customProgBuilder.pop();
    renderCustomBuilderPreview();
}

function renderCustomBuilderPreview() {
    const preview = document.getElementById('customProgPreview');
    const count   = document.getElementById('customProgCount');
    const saveBtn = document.getElementById('customProgSaveBtn');
    if (preview) preview.textContent = customProgBuilder.length > 0 ? customProgBuilder.join(' → ') : '—';
    if (count)   count.textContent   = customProgBuilder.length + '/8';
    if (saveBtn) saveBtn.disabled    = customProgBuilder.length < 2;
}

function submitCustomProg() {
    const nameEl = document.getElementById('customProgName');
    const name = nameEl ? nameEl.value.trim() : '';
    if (!name || customProgBuilder.length < 2) return;
    guardarYMergeCustomProg(name, [...customProgBuilder]);
    customProgBuilder = [];
    if (nameEl) nameEl.value = '';
    renderCustomBuilderPreview();
}

function renderCustomProgList() {
    const container = document.getElementById('customProgList');
    if (!container) return;
    const progs = cargarCustomProgs();
    if (progs.length === 0) {
        container.innerHTML = '<span class="custom-prog-empty">sin progresiones guardadas</span>';
        return;
    }
    container.innerHTML = progs.map(p => `
        <div class="custom-prog-item">
            <div class="cpi-info">
                <span class="cpi-name">${p.name}</span>
                <span class="cpi-chords">${p.chords.join(' → ')}</span>
            </div>
            <button class="cpi-delete-btn" onclick="deleteCustomProg('${p.id}')">✕</button>
        </div>`
    ).join('');
}

function buildCustomDegPicker() {
    const el = document.getElementById('customDegPicker');
    if (!el) return;
    el.innerHTML = DEGREES.map(d =>
        `<button class="deg-btn" style="--deg-color:${d.color}" onclick="customBuilderToggle('${d.num}')">
            <span class="deg-btn-num">${d.num}</span>
            <span class="deg-btn-chord">${d.chordName}</span>
            <span class="deg-btn-quality ${d.quality==='mayor'?'dq-mayor':'dq-menor'}">${d.qualityLabel}</span>
        </button>`
    ).join('');
}

function initCustomProgs() {
    mergeCustomProgs();
    buildCustomDegPicker();
    renderCustomBuilderPreview();
    renderCustomProgList();
}

function playAndShowProg(id) {
    const p = PROGRESSIONS.find(x => x.id === id);
    if (!p) return;
    const tile = document.getElementById('ptile-' + id);
    tile.classList.add('playing');
    setTimeout(() => tile.classList.remove('playing'), 400);
    playProgression(p.chords, playMode === 'arp' ? ARP_DELAYS[0] : 0);
}

function playProgression(chordNums, arpInterval) {
    stopAllNodes();
    const a = ctx(), now = a.currentTime + 0.05;
    let offset = 0;
    chordNums.forEach(num => {
        const deg = DEGREES.find(d => d.num === num);
        const noteCount = deg.midis.length;
        const chordSpread = arpInterval ? noteCount * arpInterval : 0;
        deg.midis.forEach((m, i) =>
            playNote(m, now + offset + (arpInterval ? i * arpInterval : 0), 1.7, 0.07)
        );
        offset += (arpInterval ? chordSpread + 0.5 : 0) + 2.1;
    });
}

// Progression quiz state
let currentProg = null, progRound = 0;
let progScores = [0, 0];
let progSlot = 0;
let progPhase = 'idle';
let progRepeatCount = 0;

function buildProgBtns() {
    document.getElementById('progBtnGrid').innerHTML = DEGREES.map(d =>
        `<button class="deg-btn" data-deg="${d.num}" style="--deg-color:${d.color}" onclick="answerProg('${d.num}')">
    <span class="deg-btn-num">${d.num}</span>
    <span class="deg-btn-chord">${d.chordName}</span>
    <span class="deg-btn-quality ${d.quality === 'mayor' ? 'dq-mayor' : 'dq-menor'}">${d.qualityLabel}</span>
</button>`
    ).join('');
}

function startProgRound() {
    currentProg = weightedRand(PROGRESSIONS);
    progRound++;
    progSlot = 0;
    progPhase = 'answering';
    progRepeatCount = 0;

    document.getElementById('progPlayHint').textContent = 'escuchando…';
    document.getElementById('progRepeatBtn').disabled = false;
    document.getElementById('progRevealPanel').classList.remove('visible');
    document.getElementById('progRound').textContent = '#' + progRound;

    // Build slots
    document.getElementById('progSlots').innerHTML = currentProg.chords.map((_, i) =>
        `<div class="prog-slot ${i === 0 ? 'ps-active' : ''}" id="ps${i}">?</div>`
    ).join('');

    // Reset buttons
    document.querySelectorAll('#progBtnGrid .deg-btn').forEach(b => {
        b.disabled = false;
        b.classList.remove('selected-correct', 'selected-wrong', 'reveal-correct');
    });

    const btn = document.getElementById('progPlayBtn');
    btn.classList.add('ringing'); setTimeout(() => btn.classList.remove('ringing'), 400);

    playProgression(currentProg.chords, playMode === 'arp' ? ARP_DELAYS[0] : 0);

    setTimeout(() => {
        if (progPhase === 'answering')
            document.getElementById('progPlayHint').textContent = `identifica el acorde ${progSlot + 1} de ${currentProg.chords.length}`;
    }, currentProg.chords.length * 2200 + 500);
}

function repeatProg() {
    if (!currentProg) return;
    progRepeatCount++;
    const delay = playMode === 'arp' ? ARP_DELAYS[progRepeatCount % ARP_DELAYS.length] : 0;
    playProgression(currentProg.chords, delay);
    if (playMode === 'arp') {
        const looped = (progRepeatCount % ARP_DELAYS.length) === 0;
        const tempo = TEMPO_NAMES[progRepeatCount % TEMPO_NAMES.length];
        document.getElementById('progPlayHint').textContent = looped ? 'arpegiado · allegro ↺' : `arpegiado · ${tempo}`;
    }
}

function answerProg(num) {
    if (progPhase !== 'answering') return;
    const expected = currentProg.chords[progSlot];
    const correct = num === expected;
    progScores[1]++;
    if (correct) progScores[0]++;

    const slot = document.getElementById('ps' + progSlot);
    slot.textContent = expected;
    slot.classList.remove('ps-active');
    slot.classList.add(correct ? 'ps-correct' : 'ps-wrong');
    if (!correct) {
        slot.setAttribute('title', `Tu respuesta: ${num}`);
        const clickedBtn = document.querySelector(`#progBtnGrid .deg-btn[data-deg="${num}"]`);
        if (clickedBtn) { clickedBtn.classList.add('selected-wrong'); clickedBtn.disabled = true; }
    } else {
        const clickedBtn = document.querySelector(`#progBtnGrid .deg-btn[data-deg="${num}"]`);
        if (clickedBtn) { clickedBtn.classList.add('selected-correct'); clickedBtn.disabled = true; }
    }

    progSlot++;
    document.getElementById('progScore').textContent = `${progScores[0]}/${progScores[1]}`;

    if (progSlot >= currentProg.chords.length) {
        progPhase = 'done';
        setTimeout(showProgReveal, 400);
    } else {
        document.getElementById('ps' + progSlot).classList.add('ps-active');
        document.getElementById('progPlayHint').textContent = `identifica el acorde ${progSlot + 1} de ${currentProg.chords.length}`;
    }
}

function showProgReveal() {
    const p = currentProg;
    document.getElementById('progRevTitle').textContent = p.name;
    document.getElementById('progRevChords').textContent = p.chords.join(' → ');
    document.getElementById('progRevFeeling').textContent = p.feeling;
    document.getElementById('progRevDesc').textContent = p.desc;
    document.getElementById('progRevSongs').innerHTML = p.songs.map(s =>
        `<span class="prog-song-pill">${s}</span>`
    ).join('');
    document.getElementById('progRevealPanel').classList.add('visible');
    guardarRonda('progresiones', progScores[0], progScores[1]);
}

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
    data[modulo].push({ ts: Date.now(), c: correctas, t: total, pct: Math.round(correctas / total * 100) });
    if (data[modulo].length > 50) data[modulo] = data[modulo].slice(-50);
    localStorage.setItem(CLAVE_PROGRESO, JSON.stringify(data));
    renderHistorial(modulo);
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
    ['inversiones','grados','progresiones','dictado'].forEach(renderHistorial);
}

// ─── DICTADO ISÓCRONO ─────────────────────────────────────────────
const DICTADO_SETS = [
    { id:'do5',  label:'Do Mayor',  armadura:'sin alteraciones',        notes:['Do','Re','Mi','Fa','Sol'],    midis:[60,62,64,65,67] },
    { id:'sol5', label:'Sol Mayor', armadura:'1♯ (Fa#)',                notes:['Sol','La','Si','Do','Re'],   midis:[67,69,71,72,74] },
    { id:'fa5',  label:'Fa Mayor',  armadura:'1♭ (Sib)',                notes:['Fa','Sol','La','Sib','Do'],  midis:[65,67,69,70,72] },
    { id:'sib5', label:'Sib Mayor', armadura:'2♭ (Sib, Mib)',           notes:['Sib','Do','Re','Mib','Fa'], midis:[70,72,74,75,77] },
    { id:'mib5', label:'Mib Mayor', armadura:'3♭ (Sib, Mib, Lab)',      notes:['Mib','Fa','Sol','Lab','Sib'],midis:[75,77,79,80,82] },
    { id:'re5',  label:'Re Mayor',  armadura:'2♯ (Fa#, Do#)',           notes:['Re','Mi','Fa#','Sol','La'],  midis:[62,64,66,67,69] },
];

const DICTADO_TEMPOS = [
    { id:'lento',  interval:1.6  },
    { id:'normal', interval:1.1  },
    { id:'rapido', interval:0.75 },
];

const DICTADO_LENGTH = 10;

let dictadoSet       = DICTADO_SETS[0];
let dictadoTempo     = DICTADO_TEMPOS[0];
let dictadoSeq       = [];
let dictadoSlot      = 0;
let dictadoPhase     = 'idle';   // 'idle' | 'playing' | 'answering' | 'done'
let dictadoAnswers   = [];
let dictadoRoundNum  = 0;
let dictadoScores    = [0, 0];   // [cumulative correct, cumulative total]
let dictadoTimers    = [];

function buildDictadoKeyboard() {
    const grid = document.getElementById('dictadoKeyboard');
    if (!grid) return;
    grid.innerHTML = dictadoSet.notes.map(n =>
        `<button class="dict-key-btn" data-note="${n}" onclick="answerDictado('${n}')">${n}</button>`
    ).join('');
    document.querySelectorAll('.dict-key-btn').forEach(b => b.disabled = true);
}

function updateDictadoNotesList() {
    const el = document.getElementById('dictNotesList');
    if (!el) return;
    el.innerHTML = `notas: <strong>${dictadoSet.notes.join(' · ')}</strong><span class="dict-armadura">${dictadoSet.armadura}</span>`;
}

function selectDictadoSet(id, el) {
    dictadoSet = DICTADO_SETS.find(s => s.id === id) || DICTADO_SETS[0];
    document.querySelectorAll('.dict-set-btn').forEach(b => b.classList.remove('ds-active'));
    el.classList.add('ds-active');
    buildDictadoKeyboard();
    updateDictadoNotesList();
    resetDictadoRound();
}

function selectDictadoTempo(id, el) {
    dictadoTempo = DICTADO_TEMPOS.find(t => t.id === id) || DICTADO_TEMPOS[0];
    document.querySelectorAll('.dict-tempo-btn').forEach(b => b.classList.remove('ds-active'));
    el.classList.add('ds-active');
}

function resetDictadoRound() {
    dictadoTimers.forEach(clearTimeout);
    dictadoTimers = [];
    stopAllNodes();
    dictadoPhase = 'idle';
    dictadoSlot  = 0;
    dictadoSeq   = [];
    dictadoAnswers = [];
    document.getElementById('dictadoSlots').innerHTML = Array(DICTADO_LENGTH).fill(0)
        .map((_, i) => `<div class="dict-slot" id="dslot${i}">?</div>`).join('');
    document.getElementById('dictadoRevealPanel').classList.remove('visible');
    document.getElementById('dictadoPlayHint').textContent = 'toca para escuchar la secuencia';
    document.getElementById('dictadoRepeatBtn').disabled = true;
    document.getElementById('dictadoScore').textContent = '—';
    document.querySelectorAll('.dict-key-btn').forEach(b => b.disabled = true);
}

function startDictadoRound() {
    dictadoSeq = Array.from({length: DICTADO_LENGTH}, () => pickAdaptiveDictadoNote());
    dictadoAnswers = [];
    dictadoSlot    = 0;
    dictadoRoundNum++;
    dictadoPhase   = 'playing';
    dictadoTimers.forEach(clearTimeout);
    dictadoTimers  = [];

    document.getElementById('dictadoRoundVal').textContent = '#' + dictadoRoundNum;
    document.getElementById('dictadoScore').textContent = '—';
    document.getElementById('dictadoRevealPanel').classList.remove('visible');
    document.getElementById('dictadoRepeatBtn').disabled = true;
    document.querySelectorAll('.dict-key-btn').forEach(b => b.disabled = true);
    document.getElementById('dictadoSlots').innerHTML = Array(DICTADO_LENGTH).fill(0)
        .map((_, i) => `<div class="dict-slot" id="dslot${i}">?</div>`).join('');

    const pb = document.getElementById('dictadoPlayBtn');
    pb.classList.add('ringing'); setTimeout(() => pb.classList.remove('ringing'), 400);
    playDictadoSequence();
}

function playDictadoSequence() {
    dictadoTimers.forEach(clearTimeout);
    dictadoTimers = [];
    stopAllNodes();

    const iv = dictadoTempo.interval;
    const a  = ctx();

    // Schedule all note audio (gain reducido para evitar distorsión en notas agudas)
    dictadoSeq.forEach((note, i) => {
        const midi = dictadoSet.midis[dictadoSet.notes.indexOf(note)];
        playNote(midi, a.currentTime + 0.05 + i * iv, iv * 0.75, 0.13);
    });

    // Visual: pulse each slot as it plays
    document.querySelectorAll('.dict-slot').forEach(s => s.classList.remove('ds-playing', 'ds-active'));
    dictadoSeq.forEach((_, i) => {
        const t = setTimeout(() => {
            document.querySelectorAll('.dict-slot').forEach(s => s.classList.remove('ds-playing'));
            const sl = document.getElementById('dslot' + i);
            if (sl && !sl.classList.contains('ds-correct') && !sl.classList.contains('ds-wrong'))
                sl.classList.add('ds-playing');
        }, 50 + i * iv * 1000);
        dictadoTimers.push(t);
    });

    // After all notes → reveal first note as gift, user starts from slot 1
    const tEnd = setTimeout(() => {
        document.querySelectorAll('.dict-slot').forEach(s => s.classList.remove('ds-playing'));
        // Regalo: la nota 1 se revela automáticamente
        const sl0 = document.getElementById('dslot0');
        if (sl0) { sl0.textContent = dictadoSeq[0]; sl0.classList.add('ds-given'); }
        dictadoSlot  = 1;
        dictadoAnswers.push({ note: dictadoSeq[0], expected: dictadoSeq[0], correct: true, given: true });
        dictadoPhase = 'answering';
        document.getElementById('dictadoPlayHint').textContent = 'identifica la nota 2 de 10';
        document.getElementById('dictadoRepeatBtn').disabled = false;
        document.getElementById('dictadoScore').textContent = '—/' + (DICTADO_LENGTH - 1);
        document.querySelectorAll('.dict-key-btn').forEach(b => b.disabled = false);
        const second = document.getElementById('dslot1');
        if (second) second.classList.add('ds-active');
    }, 50 + DICTADO_LENGTH * iv * 1000 + 400);
    dictadoTimers.push(tEnd);

    document.getElementById('dictadoPlayHint').textContent = 'escuchando…';
}

function repeatDictado() {
    if (!dictadoSeq.length) return;
    dictadoSlot    = 0;
    dictadoAnswers = [];
    dictadoPhase   = 'playing';
    document.getElementById('dictadoRepeatBtn').disabled = true;
    document.getElementById('dictadoScore').textContent = '—';
    document.querySelectorAll('.dict-key-btn').forEach(b => b.disabled = true);
    document.getElementById('dictadoSlots').innerHTML = Array(DICTADO_LENGTH).fill(0)
        .map((_, i) => `<div class="dict-slot" id="dslot${i}">?</div>`).join('');
    playDictadoSequence();
}

function answerDictado(note) {
    if (dictadoPhase !== 'answering') return;
    const expected = dictadoSeq[dictadoSlot];
    const correct  = note === expected;
    dictadoAnswers.push({ note, expected, correct });
    registrarDetalle('dictado', expected, correct);

    const sl = document.getElementById('dslot' + dictadoSlot);
    sl.textContent = expected;
    sl.classList.remove('ds-active');
    sl.classList.add(correct ? 'ds-correct' : 'ds-wrong');
    if (!correct) sl.title = 'tu respuesta: ' + note;

    // Brief audio feedback: replay the correct note
    const midi = dictadoSet.midis[dictadoSet.notes.indexOf(expected)];
    playNote(midi, ctx().currentTime + 0.02, 0.45, 0.13);

    dictadoSlot++;
    const answered = dictadoAnswers.filter(a => !a.given);
    const ok = answered.filter(a => a.correct).length;
    document.getElementById('dictadoScore').textContent = ok + '/' + answered.length;

    if (dictadoSlot >= DICTADO_LENGTH) {
        dictadoPhase = 'done';
        setTimeout(showDictadoReveal, 400);
    } else {
        const next = document.getElementById('dslot' + dictadoSlot);
        if (next) next.classList.add('ds-active');
        document.getElementById('dictadoPlayHint').textContent =
            `identifica la nota ${dictadoSlot + 1} de ${DICTADO_LENGTH}`;
    }
}

function showDictadoReveal() {
    // Solo contamos las 9 notas que el usuario respondió (la primera fue regalada)
    const answered = dictadoAnswers.filter(a => !a.given);
    const ok  = answered.filter(a => a.correct).length;
    const tot = answered.length;
    const pct = Math.round(ok / tot * 100);
    dictadoScores[0] += ok;
    dictadoScores[1] += tot;

    document.getElementById('dictadoRevPercent').textContent = `${ok}/${tot} — ${pct}%`;
    document.getElementById('dictadoRevMsg').textContent =
        pct === 100 ? '¡Perfecto! Oído impecable.' :
        pct >= 80   ? 'Muy bien. Casi perfecto.' :
        pct >= 50   ? 'Buen intento. La práctica hace al maestro.' :
                      'Sigue escuchando, va a mejorar.';
    document.getElementById('dictadoTotal').textContent =
        dictadoScores[0] + '/' + dictadoScores[1];
    document.getElementById('dictadoRevealPanel').classList.add('visible');
    guardarRonda('dictado', ok, tot);
}

function initDictado() {
    buildDictadoKeyboard();
    updateDictadoNotesList();
    resetDictadoRound();
}

// ─── ANÁLISIS DE PROGRESO ─────────────────────────────────────────
function openAnalysis() {
    renderAnalysis();
    document.getElementById('analysisModalBg').classList.add('open');
}

function closeAnalysis() {
    document.getElementById('analysisModalBg').classList.remove('open');
}

function renderAccBar(label, ok, tot) {
    if (tot < 5) {
        return `<div class="am-bar-row">
            <span class="am-bar-label">${label}</span>
            <span class="am-bar-nodata">sin datos</span>
        </div>`;
    }
    const pct = Math.round(ok / tot * 100);
    const col = pct >= 80 ? 'var(--correct)' : pct >= 50 ? '#d4aa3e' : 'var(--wrong)';
    return `<div class="am-bar-row">
        <span class="am-bar-label">${label}</span>
        <div class="am-bar-track"><div class="am-bar-fill" style="width:${pct}%;background:${col}"></div></div>
        <span class="am-bar-pct" style="color:${col}">${pct}%</span>
        <span class="am-bar-count">(${ok}/${tot})</span>
    </div>`;
}

function renderAnalysis() {
    const det = (cargarProgreso().detalle) || {};
    const gdet = det.grados || {};
    const idet = det.inversiones || {};
    const ddet = det.dictado || {};

    // Grados
    document.getElementById('amGrados').innerHTML =
        DEGREES.map(d => renderAccBar(`${d.num} — ${d.name}`, ...(gdet[d.num]||[0,0]))).join('');

    // Inversiones
    const invLabels = { fundamental:'Fundamental', primera:'1ª Inversión', segunda:'2ª Inversión' };
    document.getElementById('amInversiones').innerHTML =
        ['fundamental','primera','segunda'].map(k => renderAccBar(invLabels[k], ...(idet[k]||[0,0]))).join('');

    // Dictado — solo notas usadas (tot > 0)
    const usedNotes = Object.keys(DETALLE_DEFAULTS.dictado).filter(k => (ddet[k]||[0,0])[1] > 0);
    document.getElementById('amDictado').innerHTML = usedNotes.length === 0
        ? '<span class="am-nodata-msg">Practicá dictado para ver datos aquí.</span>'
        : usedNotes.map(k => renderAccBar(k, ...(ddet[k]||[0,0]))).join('');

    // Recomendaciones
    const items = [];
    DEGREES.forEach(d => { const [ok,tot]=gdet[d.num]||[0,0]; if(tot>=5) items.push({label:`Grado ${d.num}`,pct:ok/tot}); });
    usedNotes.forEach(k => { const [ok,tot]=ddet[k]||[0,0]; if(tot>=5) items.push({label:`Nota ${k} (dictado)`,pct:ok/tot}); });
    ['fundamental','primera','segunda'].forEach(k => { const [ok,tot]=idet[k]||[0,0]; if(tot>=5) items.push({label:invLabels[k],pct:ok/tot}); });
    items.sort((a,b) => a.pct-b.pct);
    const weak   = items.filter(x => x.pct < 0.80).slice(0,3);
    const strong = items.filter(x => x.pct >= 0.85);
    const recEl  = document.getElementById('amRecom');
    if (items.length === 0) {
        recEl.innerHTML = '<span class="am-nodata-msg">Hacé más ejercicios para ver recomendaciones.</span>';
    } else {
        let html = '';
        if (weak.length) {
            html += '<div class="am-recom-block"><div class="am-recom-head">Para trabajar:</div>';
            html += weak.map(x => {
                const pct = Math.round(x.pct*100);
                const col = pct>=50?'#d4aa3e':'var(--wrong)';
                return `<div class="am-recom-item"><span class="am-recom-label">${x.label}</span><span class="am-recom-pct" style="color:${col}">${pct}%</span></div>`;
            }).join('');
            html += '</div>';
        }
        if (strong.length) {
            html += '<div class="am-recom-block"><div class="am-recom-head">Tus puntos fuertes:</div>';
            html += strong.slice(0,3).map(x =>
                `<div class="am-recom-item am-recom-strong"><span class="am-recom-label">${x.label}</span><span class="am-recom-pct" style="color:var(--correct)">${Math.round(x.pct*100)}%</span></div>`
            ).join('');
            html += '</div>';
        }
        recEl.innerHTML = html;
    }
}

// ─── INIT ─────────────────────────────────────────────────────────
buildTiles();
buildDegreeRef();
buildProgBtns();
initCustomProgs();   // merge custom progs into PROGRESSIONS antes de buildProgRef
buildProgRef();
initDictado();
initHistoriales();
