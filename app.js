// ─── TAB ─────────────────────────────────────────────────────────
function switchTab(name) {
    ['aprender', 'explorar', 'practicar', 'grados', 'dictado', 'intervalos'].forEach((n, i) => {
        document.querySelectorAll('.tab-btn')[i].classList.toggle('active', n === name);
        document.getElementById('tab-' + n).classList.toggle('active', n === name);
    });
    if (name === 'practicar') { updateInvProgress(); updatePosProgress(); }
    if (name === 'grados')    { updateGradosProgress(); updateProgProgress(); updateFuncionProgress(); updateCadenciaProgress(); updateModalProgress(); updateCompletarProgress(); }
    if (name === 'dictado')   { updateDictProgress(); }
}

// ─── AUDIO ───────────────────────────────────────────────────────
const AC = window.AudioContext || window.webkitAudioContext;
let ac;
let masterOut = null;
let masterGain = null;
let activeNodes = [];
let userVolume = parseFloat(localStorage.getItem('oido_volume') ?? '0.8');

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
        masterGain.gain.value = userVolume;
        comp.connect(masterGain);
        masterGain.connect(lim);
        masterOut = comp;
    }
    if (ac.state === 'suspended') ac.resume();
    if (ac.state === 'closed') {
        // Safari puede cerrar el contexto tras larga inactividad en segundo plano
        ac = null; masterOut = null; masterGain = null;
        return ctx();
    }
    return ac;
}

function stopAllNodes() {
    // Silencia instantáneamente todo el grafo de audio
    if (masterGain && ac) {
        masterGain.gain.cancelScheduledValues(ac.currentTime);
        masterGain.gain.setValueAtTime(0, ac.currentTime);
        masterGain.gain.linearRampToValueAtTime(userVolume, ac.currentTime + 0.02);
    }
    activeNodes.forEach(n => {
        try { n.disconnect(); } catch(e) {}
        try { n.stop(0); }    catch(e) {}
    });
    activeNodes = [];
}

function setMasterVolume(val) {
    userVolume = parseFloat(val);
    localStorage.setItem('oido_volume', userVolume);
    if (masterGain && ac) {
        masterGain.gain.cancelScheduledValues(ac.currentTime);
        masterGain.gain.setValueAtTime(userVolume, ac.currentTime);
    }
    document.getElementById('volValue').textContent = Math.round(userVolume * 100) + '%';
}

function initVolSlider() {
    const slider = document.getElementById('volSlider');
    if (!slider) return;
    slider.value = userVolume;
    document.getElementById('volValue').textContent = Math.round(userVolume * 100) + '%';
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

// ─── FEEDBACK PEDAGÓGICO ──────────────────────────────────────────
const QUALITY_FEEDBACK = {
    'mayor→menor': 'Mayor: la 3ª Mayor (4 st) lo hace brillante y abierto. Menor: 3ª menor (3 st) — un semitono abajo, más oscuro y tenso.',
    'menor→mayor': 'Menor: la 3ª menor (3 st) da ese color oscuro y cerrado. Mayor: 3ª Mayor (4 st) — más brillante y estable.',
};

const POS_FEEDBACK = {
    'fundamental→primera': '1ª Inversión: la 3ª está en el bajo — suena más ligero y fluido que la Fundamental (raíz en el bajo).',
    'fundamental→segunda': '2ª Inversión: la 5ª en el bajo genera una 4ª muy inestable — buscá esa flotación tensa.',
    'primera→fundamental': 'Fundamental: la raíz en el bajo da peso y reposo sólido — más cerrado que la 1ª Inversión (3ª en el bajo).',
    'primera→segunda': '2ª Inversión: 4ª en el bajo, más inestable y flotante que la 1ª Inversión (3ª en el bajo).',
    'segunda→fundamental': 'Fundamental: peso sólido, la raíz en el bajo — sin esa 4ª inestable de la 2ª Inversión.',
    'segunda→primera': '1ª Inversión: 3ª en el bajo, suave y fluida — menos tensa que la 2ª Inversión (4ª en el bajo).',
};

function showFeedbackTip(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.add('visible');
}
function hideFeedbackTip(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('visible');
}

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
    hideFeedbackTip('invFeedback');
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
    if (!correct) {
        btns[current.quality === 'mayor' ? 0 : 1].classList.add('reveal-correct');
        showFeedbackTip('invFeedback', QUALITY_FEEDBACK[answer + '→' + current.quality] || '');
    } else { hideFeedbackTip('invFeedback'); }
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
    if (!correct) {
        showFeedbackTip('invFeedback', POS_FEEDBACK[answer + '→' + current.type] || '');
    } else { hideFeedbackTip('invFeedback'); }
    document.getElementById('step2').classList.replace('active', 'done');
    document.getElementById('step3').classList.add('active'); phase = 'step3';
}

function answerStep3(answer) {
    hideFeedbackTip('invFeedback');
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
    updateInvProgress(); renderHistorial('inversiones');
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
// Los 6 acordes diatónicos de Do Mayor: I II III IV V VI
// Todos en posición fundamental, en registro medio
const DEGREES = [
    {
        num: 'I', name: 'Tónica', quality: 'mayor', funcion: 'tonica',
        chordName: 'Do Mayor', notes: ['Do', 'Mi', 'Sol'], midis: [60, 64, 67],
        feeling: '"Llegué. Reposo absoluto."',
        desc: 'La base de todo. El hogar tonal. Cualquier frase musical se siente completa cuando llega aquí.',
        color: '#4caf7d',
        prog: 'I → IV → V → I — la progresión más clásica',
        ref: '"Las Mañanitas" y "Cielito Lindo" terminan siempre en este acorde',
        qualityLabel: 'Mayor'
    },
    {
        num: 'II', name: 'Supertónica', quality: 'menor', funcion: 'subdominante',
        chordName: 'Re menor', notes: ['Re', 'Fa', 'La'], midis: [62, 65, 69],
        feeling: '"Puente íntimo. Quiero moverme."',
        desc: 'Acorde menor sobre la segunda nota. Tiene una tensión suave que pide resolver hacia el V o el IV. Muy común en cadencias y en la progresión II-V-I del jazz.',
        color: '#c4886e',
        prog: 'I → II → V → I — cadencia con supertónica',
        ref: '"Cielito Lindo" pasa por el II en el verso · cadencia II-V-I muy usada en bolero',
        qualityLabel: 'menor'
    },
    {
        num: 'III', name: 'Mediante', quality: 'menor', funcion: 'tonica',
        chordName: 'Mi menor', notes: ['Mi', 'Sol', 'Si'], midis: [52, 55, 59],
        feeling: '"Íntimo. Un poco oscuro."',
        desc: 'Acorde menor sobre la tercera nota. Comparte dos notas con el I (Mi, Sol) y dos con el V (Sol, Si). Ambiguo y expresivo.',
        color: '#9b8ec4',
        prog: 'I → III → IV — movimiento descendente con emoción',
        ref: '"El Rey" (José Alfredo) — el III aparece en el puente antes del IV',
        qualityLabel: 'menor'
    },
    {
        num: 'IV', name: 'Subdominante', quality: 'mayor', funcion: 'subdominante',
        chordName: 'Fa Mayor', notes: ['Fa', 'La', 'Do'], midis: [53, 57, 60],
        feeling: '"Me alejo del centro."',
        desc: 'Cálido y amplio. Tensión de salida — lleva al V con urgencia o regresa al I con calidez (cadencia plagal "amén").',
        color: '#d4aa3e',
        prog: 'I → IV → V → I · I → IV → I (plagal "amén")',
        ref: '"La Bamba" — el IV es el segundo acorde de toda la canción',
        qualityLabel: 'Mayor'
    },
    {
        num: 'V', name: 'Dominante', quality: 'mayor', funcion: 'dominante',
        chordName: 'Sol Mayor', notes: ['Sol', 'Si', 'Re'], midis: [55, 59, 62],
        feeling: '"Tengo que resolver. Ahora."',
        desc: 'La tensión más fuerte de la tonalidad. El Si (sensible) pide subir al Do. Motor de toda la armonía tonal.',
        color: '#e07a3a',
        prog: 'V → I: cadencia auténtica, la más conclusiva',
        ref: '"Himno Nacional" — cada final de frase cae de V a I',
        qualityLabel: 'Mayor'
    },
    {
        num: 'VI', name: 'Superdominante', quality: 'menor', funcion: 'tonica',
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
    hideFeedbackTip('gradFeedback');
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
    if (!correct) {
        const answeredDeg = DEGREES.find(x => x.num === num);
        const tip = `Era ${d.num} — ${d.chordName}: ${d.feeling}` +
            (answeredDeg ? ` (confundiste con ${answeredDeg.num} — ${answeredDeg.chordName}: ${answeredDeg.feeling})` : '');
        showFeedbackTip('gradFeedback', tip);
    }
    document.getElementById('degRevTitle').textContent = `${d.num} — ${d.chordName}`;
    document.getElementById('degRevQuality').textContent = d.qualityLabel;
    document.getElementById('degRevQuality').className = 'deg-rev-quality ' + (d.quality === 'mayor' ? 'dq-mayor' : 'dq-menor');
    document.getElementById('degRevFeeling').textContent = d.feeling;
    document.getElementById('degRevDesc').textContent = d.desc;
    document.getElementById('degRevProg').textContent = d.prog;
    document.getElementById('degRevealPanel').classList.add('visible');
    document.getElementById('degScore').textContent = `${degScores[0]}/${degScores[1]}`;
    guardarRonda('grados', degScores[0], degScores[1]);
    updateGradosProgress(); renderHistorial('grados');
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
    // Circulares — empiezan y terminan en I
    { id:'circ3a', name:'Ida y Vuelta', chords:['I','V','I'],
      feeling:'Breve · conclusiva · afirmativa',
      desc:'La resolución más directa: tensión dominante que regresa a casa. Base de infinitas canciones tradicionales.',
      songs:['"Las Mañanitas" — célula final', '"Cielito Lindo" — cierre de copla'],
      color:'#4caf7d', weight:3 },
    { id:'circ3b', name:'El Abrazo Plagal', chords:['I','IV','I'],
      feeling:'Cálida · reposada · litúrgica',
      desc:'Sale a la subdominante y regresa suavemente. El "amén" completo: apertura y cierre en la tónica.',
      songs:['"Amén" tradicional', '"Alabaré" — estribillo'],
      color:'#d4aa3e', weight:3 },
    { id:'circ4a', name:'El Ciclo Completo', chords:['I','VI','IV','I'],
      feeling:'Nostálgica · circular · reposada',
      desc:'Gira por el relativo menor y la subdominante antes de regresar al reposo. El ciclo melancólico cerrado.',
      songs:['"El Reloj" — verso completo', '"Sabor a Mí" — cierre de frase'],
      color:'#6abfb0', weight:4 },
    { id:'circ5a', name:'La Romantica', chords:['I','VI','IV','V','I'],
      feeling:'Romántica · completa · bolero clásico',
      desc:'El arco completo del bolero: parte de la tónica, pasa por nostalgia y calidez, genera tensión y resuelve. Ciclo redondo.',
      songs:['"Bésame Mucho" — ciclo completo', '"Sabor a Mí"', '"Perfidia"'],
      color:'#e07a3a', weight:4 },
    { id:'circ5b', name:'Con Mediante', chords:['I','III','IV','V','I'],
      feeling:'Expresiva · colorida · cerrada',
      desc:'El III menor da profundidad antes de abrirse al IV y tensionarse en el V — el arco completo con color extra.',
      songs:['"El Rey" (José Alfredo) — frase completa', 'Corrido ranchero'],
      color:'#9b8ec4', weight:3 },
];

// ─── CADENCIAS ────────────────────────────────────────────────────
// midisSeq: array de arrays MIDI — permite inversiones sin tocar DEGREES
const CADENCE_TYPES = [
    { id: 'aut_perf', name: 'Auténtica Perfecta', short: 'V → I',
      chords: ['V','I'],
      midisSeq: [[55,59,62],[60,64,67]],   // V fund → I fund
      feeling: 'Cierre total · resolución absoluta',
      desc: 'El V (Sol) en estado fundamental resuelve al I (Do) también en fundamental. El Si (sensible) asciende al Do. El cierre más sólido de la armonía tonal.',
      songs: ['"Himno Nacional" — cierre de cada frase', '"Las Mañanitas" — nota final'],
      weight: 4 },
    { id: 'aut_imp', name: 'Auténtica Imperfecta', short: 'V → I⁶',
      chords: ['V','I⁶'],
      midisSeq: [[55,59,62],[64,67,72]],   // V fund → I en 1ª inversión (Mi en el bajo)
      feeling: 'Resolución abierta · punto y seguido',
      desc: 'El V resuelve al I, pero el I está en primera inversión (Mi en el bajo). Hay resolución, pero la frase queda abierta — como un punto y seguido, no un punto final.',
      songs: ['"Cielito Lindo" — cierre interno de frase'],
      weight: 3 },
    { id: 'plagal', name: 'Plagal', short: 'IV → I',
      chords: ['IV','I'],
      midisSeq: [[53,57,60],[60,64,67]],
      feeling: 'Cálida · suave · "amén"',
      desc: 'El IV (Fa) cede al I (Do) sin pasar por el V. Más suave que la auténtica. El reposo litúrgico — el "amén" al final del himno.',
      songs: ['"Amén" en himnos religiosos', '"La Bamba" — reposo final'],
      weight: 3 },
    { id: 'rota', name: 'Rota / Evitada', short: 'V → VI',
      chords: ['V','VI'],
      midisSeq: [[55,59,62],[57,60,64]],
      feeling: 'Sorpresa · engaño · continúa',
      desc: 'Esperabas el I pero llegó el VI menor. El dominante elude la resolución — la música decide seguir narrando. También llamada "cadencia de engaño".',
      songs: ['"Bésame Mucho" — el giro dramático del verso'],
      weight: 3 },
    { id: 'semi', name: 'Semicadencia', short: 'X → V',
      chords: ['I','V'],
      midisSeq: [[60,64,67],[55,59,62]],
      feeling: 'Suspendida · pregunta sin respuesta',
      desc: 'Termina en el V — queda flotando. La mitad de una cadencia: la pregunta que espera su respuesta. Típica al final de la primera frase de una pieza.',
      songs: ['"Las Mañanitas" — la primera frase termina aquí', '"Cielito Lindo" — primer corte'],
      weight: 3 },
];

// ─── PROGRESIONES MODALES VS TONALES ──────────────────────────────
const MODAL_PROGS = [
    // TONAL — tensión-resolución clara, sensible o función de dominante
    { id: 'ton_v_i',  isModal: false,
      chords: ['V','I'],   midisSeq: [[55,59,62],[60,64,67]],
      answer: 'tonal',
      desc: 'Sol Mayor → Do Mayor: el Si (sensible) "tira" hacia el Do. Resolución obligada.',
      why: 'La sensible (Si→Do) y la quinta del V crean la gravedad tonal clásica.' },
    { id: 'ton_iv_i', isModal: false,
      chords: ['IV','I'],  midisSeq: [[53,57,60],[60,64,67]],
      answer: 'tonal',
      desc: 'Fa Mayor → Do Mayor: el IV cede al I. Cadencia plagal — el "amén" del sistema tonal.',
      why: 'El Fa del IV resuelve hacia el Mi del I por semitono descendente.' },
    { id: 'ton_ii_v', isModal: false,
      chords: ['II','V'],  midisSeq: [[62,65,69],[55,59,62]],
      answer: 'tonal',
      desc: 'Re menor → Sol Mayor: pre-dominante al dominante. La jerarquía tonal en acción.',
      why: 'El Re m "empuja" hacia el Sol M. Movimiento con función y dirección obligada.' },
    { id: 'ton_iv_v', isModal: false,
      chords: ['IV','V'],  midisSeq: [[53,57,60],[55,59,62]],
      answer: 'tonal',
      desc: 'Fa Mayor → Sol Mayor: subdominante al dominante. Tensión creciente que pide resolución al I.',
      why: 'La dirección IV→V→(I) es de las más fuertes de la armonía tonal.' },
    // MODAL — movimiento libre, sin polo de atracción ni sensible
    { id: 'mod_ii_vi', isModal: true,
      chords: ['II','VI'], midisSeq: [[62,65,69],[57,60,64]],
      answer: 'modal',
      desc: 'Re menor → La menor: dos acordes menores sin urgencia entre sí. El movimiento es libre.',
      why: 'Sin sensible, sin función de dominante — ninguno "tira" del otro con obligación.' },
    { id: 'mod_vi_iv', isModal: true,
      chords: ['VI','IV'], midisSeq: [[57,60,64],[53,57,60]],
      answer: 'modal',
      desc: 'La menor → Fa Mayor: cambio de color, no de función. Ninguno demanda resolución.',
      why: 'La menor no tiene función de dominante sobre Fa Mayor. Solo movimiento de color.' },
    { id: 'mod_iv_iii', isModal: true,
      chords: ['IV','III'], midisSeq: [[53,57,60],[52,55,59]],
      answer: 'modal',
      desc: 'Fa Mayor → Mi menor: descenso libre. El Mi m no tiene función de dominante.',
      why: 'El Mi menor nunca actúa como dominante en este contexto. Movimiento modal descendente.' },
    { id: 'mod_vi_ii', isModal: true,
      chords: ['VI','II'], midisSeq: [[57,60,64],[62,65,69]],
      answer: 'modal',
      desc: 'La menor → Re menor: movimiento entre dos acordes menores. El oído no siente gravedad.',
      why: 'Ambos menores, sin sensible ni función de dominante entre ellos.' },
];

// ─── AUDIO — MIDI SEQUENCE ────────────────────────────────────────
// Toca un array de arrays MIDI (permite acordes en inversión sin depender de DEGREES)
function playMidiSequence(midisArray, arpInterval) {
    stopAllNodes();
    const a = ctx(), now = a.currentTime + 0.05;
    let offset = 0;
    midisArray.forEach(chordMidis => {
        const noteCount = chordMidis.length;
        const chordSpread = arpInterval ? noteCount * arpInterval : 0;
        chordMidis.forEach((m, i) =>
            playNote(m, now + offset + (arpInterval ? i * arpInterval : 0), 1.7, 0.07)
        );
        offset += (arpInterval ? chordSpread + 0.5 : 0) + 2.1;
    });
}

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
    const sections = ['grados','progresiones','funciones','cadencias','modalidad','completar'];
    const btnIds   = ['gmGrados','gmProg','gmFunc','gmCad','gmModal','gmComp'];
    sections.forEach((s, i) => {
        document.getElementById(s + 'Section').style.display = mode === s ? '' : 'none';
        document.getElementById(btnIds[i]).classList.toggle('gm-active', mode === s);
    });
    if (mode === 'grados')       updateGradosProgress();
    if (mode === 'progresiones') updateProgProgress();
    if (mode === 'funciones')    updateFuncionProgress();
    if (mode === 'cadencias')    updateCadenciaProgress();
    if (mode === 'modalidad')    updateModalProgress();
    if (mode === 'completar')    updateCompletarProgress();
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

function buildProgChordPreviews() {
    const container = document.getElementById('progChordPreviews');
    if (!container || !currentProg) return;
    container.innerHTML = currentProg.chords.map((_, i) =>
        `<button class="prog-chord-preview-btn" onclick="playProgChordAt(${i})">acorde ${i + 1}</button>`
    ).join('');
    container.style.display = 'flex';
}

function playProgChordAt(i) {
    if (!currentProg) return;
    const num = currentProg.chords[i];
    const d = DEGREES.find(x => x.num === num);
    if (!d) return;
    stopAllNodes();
    const a = ctx(), now = a.currentTime + 0.05;
    d.midis.forEach((m, j) => playNote(m, now + j * 0.12, 1.5));
}

function startProgRound() {
    hideFeedbackTip('progFeedback');
    currentProg = weightedPick(adaptiveWeights(PROGRESSIONS, 'progresiones', p => p.id));
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

    buildProgChordPreviews();

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
    registrarDetalle('progresiones', currentProg.id, correct);

    const slot = document.getElementById('ps' + progSlot);
    slot.textContent = expected;
    slot.classList.remove('ps-active');
    slot.classList.add(correct ? 'ps-correct' : 'ps-wrong');
    if (!correct) {
        slot.setAttribute('title', `Tu respuesta: ${num}`);
        const clickedBtn = document.querySelector(`#progBtnGrid .deg-btn[data-deg="${num}"]`);
        if (clickedBtn) { clickedBtn.classList.add('selected-wrong'); clickedBtn.disabled = true; }
        const expDeg = DEGREES.find(d => d.num === expected);
        const ansDeg = DEGREES.find(d => d.num === num);
        if (expDeg) {
            const tip = `Acorde ${progSlot + 1}: era ${expected} (${expDeg.chordName}) — ${expDeg.feeling}` +
                (ansDeg ? ` · no ${num} (${ansDeg.chordName}: ${ansDeg.feeling})` : '');
            showFeedbackTip('progFeedback', tip);
        }
    } else {
        hideFeedbackTip('progFeedback');
        const clickedBtn = document.querySelector(`#progBtnGrid .deg-btn[data-deg="${num}"]`);
        if (clickedBtn) { clickedBtn.classList.add('selected-correct'); clickedBtn.disabled = true; }
    }

    progSlot++;
    document.getElementById('progScore').textContent = `${progScores[0]}/${progScores[1]}`;

    if (progSlot >= currentProg.chords.length) {
        progPhase = 'done';
        setTimeout(showProgReveal, 400);
    } else {
        // Re-habilitar todos los botones para el siguiente slot
        document.querySelectorAll('#progBtnGrid .deg-btn').forEach(b => {
            b.disabled = false;
            b.classList.remove('selected-correct', 'selected-wrong');
        });
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
    updateProgProgress(); renderHistorial('progresiones');
}

// ─── FUNCIONES (Tónica / Subdominante / Dominante) ───────────────
const FUNC_NAMES = { tonica: 'Tónica', subdominante: 'Subdominante', dominante: 'Dominante' };

let currentFuncionDeg = null, funcionRound = 0;
let funcionScores = [0, 0];
let funcionPhase = 'idle';
let funcionRepeatCount = 0;

function startFuncionRound() {
    hideFeedbackTip('funcFeedback');
    currentFuncionDeg = pickAdaptiveDegree();
    funcionRound++; funcionPhase = 'answering';
    funcionRepeatCount = 0;
    document.getElementById('funcPlayHint').textContent = 'escuchando…';
    document.getElementById('funcRepeatBtn').disabled = false;
    document.getElementById('funcRevealPanel').classList.remove('visible');
    document.querySelectorAll('.func-btn').forEach(b => {
        b.classList.remove('selected-correct', 'selected-wrong', 'reveal-correct');
        b.disabled = false;
    });
    document.getElementById('funcRound').textContent = '#' + funcionRound;
    const btn = document.getElementById('funcPlayBtn');
    btn.classList.add('ringing'); setTimeout(() => btn.classList.remove('ringing'), 400);
    const delay = playMode === 'arp' ? ARP_DELAYS[0] : 0;
    playDegreeContext(currentFuncionDeg, delay);
    setTimeout(() => {
        if (funcionPhase === 'answering')
            document.getElementById('funcPlayHint').textContent = '¿qué función cumple este acorde?';
    }, 1800);
}

function repeatFuncion() {
    if (!currentFuncionDeg) return;
    funcionRepeatCount++;
    const delay = playMode === 'arp' ? ARP_DELAYS[funcionRepeatCount % ARP_DELAYS.length] : 0;
    playDegreeContext(currentFuncionDeg, delay);
    if (playMode === 'arp') {
        const looped = (funcionRepeatCount % ARP_DELAYS.length) === 0;
        const tempo = TEMPO_NAMES[funcionRepeatCount % TEMPO_NAMES.length];
        document.getElementById('funcPlayHint').textContent = looped ? 'arpegiado · allegro ↺' : `arpegiado · ${tempo}`;
    }
}

function answerFuncion(funcion) {
    if (funcionPhase !== 'answering') return;
    funcionPhase = 'done';
    const correct = funcion === currentFuncionDeg.funcion;
    funcionScores[1]++;
    if (correct) funcionScores[0]++;
    registrarDetalle('funciones', currentFuncionDeg.num, correct);

    document.querySelectorAll('.func-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.func === currentFuncionDeg.funcion && !correct) b.classList.add('reveal-correct');
    });
    document.querySelector(`.func-btn[data-func="${funcion}"]`).classList.add(correct ? 'selected-correct' : 'selected-wrong');

    if (!correct) {
        showFeedbackTip('funcFeedback',
            `Era ${FUNC_NAMES[currentFuncionDeg.funcion]} — ${currentFuncionDeg.num} (${currentFuncionDeg.chordName}) tiene función de ${FUNC_NAMES[currentFuncionDeg.funcion].toLowerCase()}`);
    }
    const d = currentFuncionDeg;
    document.getElementById('funcRevDeg').textContent = `${d.num} — ${d.chordName}`;
    document.getElementById('funcRevFuncion').textContent = FUNC_NAMES[d.funcion];
    document.getElementById('funcRevFuncion').className = 'func-rev-label func-rev-' + d.funcion;
    document.getElementById('funcRevDesc').textContent = d.desc;
    document.getElementById('funcRevealPanel').classList.add('visible');
    document.getElementById('funcScore').textContent = `${funcionScores[0]}/${funcionScores[1]}`;
    guardarRonda('funciones', funcionScores[0], funcionScores[1]);
    updateFuncionProgress(); renderHistorial('funciones');
}

// ─── CADENCIAS ────────────────────────────────────────────────────
let currentCadencia = null, cadenciaRound = 0;
let cadenciaScores = [0, 0];
let cadenciaPhase = 'idle';
let cadenciaRepeatCount = 0;

function startCadenciaRound() {
    hideFeedbackTip('cadFeedback');
    currentCadencia = weightedPick(adaptiveWeights(CADENCE_TYPES, 'cadencias', c => c.id));
    cadenciaRound++; cadenciaPhase = 'answering';
    cadenciaRepeatCount = 0;
    document.getElementById('cadPlayHint').textContent = 'escuchando…';
    document.getElementById('cadRepeatBtn').disabled = false;
    document.getElementById('cadRevealPanel').classList.remove('visible');
    document.querySelectorAll('.cad-btn').forEach(b => {
        b.classList.remove('selected-correct', 'selected-wrong', 'reveal-correct');
        b.disabled = false;
    });
    document.getElementById('cadRound').textContent = '#' + cadenciaRound;
    const btn = document.getElementById('cadPlayBtn');
    btn.classList.add('ringing'); setTimeout(() => btn.classList.remove('ringing'), 400);
    const delay = playMode === 'arp' ? ARP_DELAYS[0] : 0;
    playMidiSequence(currentCadencia.midisSeq, delay);
    setTimeout(() => {
        if (cadenciaPhase === 'answering')
            document.getElementById('cadPlayHint').textContent = '¿qué tipo de cadencia es?';
    }, currentCadencia.midisSeq.length * 2200 + 300);
}

function repeatCadencia() {
    if (!currentCadencia) return;
    cadenciaRepeatCount++;
    const delay = playMode === 'arp' ? ARP_DELAYS[cadenciaRepeatCount % ARP_DELAYS.length] : 0;
    playMidiSequence(currentCadencia.midisSeq, delay);
    if (playMode === 'arp') {
        const looped = (cadenciaRepeatCount % ARP_DELAYS.length) === 0;
        const tempo = TEMPO_NAMES[cadenciaRepeatCount % TEMPO_NAMES.length];
        document.getElementById('cadPlayHint').textContent = looped ? 'arpegiado · allegro ↺' : `arpegiado · ${tempo}`;
    }
}

function answerCadencia(typeId) {
    if (cadenciaPhase !== 'answering') return;
    cadenciaPhase = 'done';
    const correct = typeId === currentCadencia.id;
    cadenciaScores[1]++;
    if (correct) cadenciaScores[0]++;
    registrarDetalle('cadencias', currentCadencia.id, correct);

    document.querySelectorAll('.cad-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.cad === currentCadencia.id && !correct) b.classList.add('reveal-correct');
    });
    document.querySelector(`.cad-btn[data-cad="${typeId}"]`).classList.add(correct ? 'selected-correct' : 'selected-wrong');

    if (!correct) {
        const wrongCad = CADENCE_TYPES.find(c => c.id === typeId);
        showFeedbackTip('cadFeedback',
            `Era ${currentCadencia.name} (${currentCadencia.chords.join(' → ')})` +
            (wrongCad ? ` — no ${wrongCad.name}` : ''));
    }
    const c = currentCadencia;
    document.getElementById('cadRevTitle').textContent = c.name;
    document.getElementById('cadRevChords').textContent = c.chords.join(' → ');
    document.getElementById('cadRevFeeling').textContent = c.feeling;
    document.getElementById('cadRevDesc').textContent = c.desc;
    document.getElementById('cadRevSongs').innerHTML = c.songs.map(s => `<span class="prog-song-pill">${s}</span>`).join('');
    document.getElementById('cadRevealPanel').classList.add('visible');
    document.getElementById('cadScore').textContent = `${cadenciaScores[0]}/${cadenciaScores[1]}`;
    guardarRonda('cadencias', cadenciaScores[0], cadenciaScores[1]);
    updateCadenciaProgress(); renderHistorial('cadencias');
}

// ─── MODAL vs TONAL ───────────────────────────────────────────────
let currentModal = null, modalRound = 0;
let modalScores = [0, 0];
let modalPhase = 'idle';
let modalRepeatCount = 0;

function startModalRound() {
    hideFeedbackTip('modalFeedback');
    currentModal = weightedPick(adaptiveWeights(MODAL_PROGS, 'modalidad', m => m.id));
    modalRound++; modalPhase = 'answering';
    modalRepeatCount = 0;
    document.getElementById('modalPlayHint').textContent = 'escuchando…';
    document.getElementById('modalRepeatBtn').disabled = false;
    document.getElementById('modalRevealPanel').classList.remove('visible');
    document.querySelectorAll('.modal-btn').forEach(b => {
        b.classList.remove('selected-correct', 'selected-wrong', 'reveal-correct');
        b.disabled = false;
    });
    document.getElementById('modalRound').textContent = '#' + modalRound;
    const btn = document.getElementById('modalPlayBtn');
    btn.classList.add('ringing'); setTimeout(() => btn.classList.remove('ringing'), 400);
    const delay = playMode === 'arp' ? ARP_DELAYS[0] : 0;
    playMidiSequence(currentModal.midisSeq, delay);
    setTimeout(() => {
        if (modalPhase === 'answering')
            document.getElementById('modalPlayHint').textContent = '¿sientes resolución obligada (tonal) o movimiento libre (modal)?';
    }, currentModal.midisSeq.length * 2200 + 300);
}

function repeatModal() {
    if (!currentModal) return;
    modalRepeatCount++;
    const delay = playMode === 'arp' ? ARP_DELAYS[modalRepeatCount % ARP_DELAYS.length] : 0;
    playMidiSequence(currentModal.midisSeq, delay);
    if (playMode === 'arp') {
        const looped = (modalRepeatCount % ARP_DELAYS.length) === 0;
        const tempo = TEMPO_NAMES[modalRepeatCount % TEMPO_NAMES.length];
        document.getElementById('modalPlayHint').textContent = looped ? 'arpegiado · allegro ↺' : `arpegiado · ${tempo}`;
    }
}

function answerModal(answer) {
    if (modalPhase !== 'answering') return;
    modalPhase = 'done';
    const correct = answer === currentModal.answer;
    modalScores[1]++;
    if (correct) modalScores[0]++;
    registrarDetalle('modalidad', currentModal.id, correct);

    document.querySelectorAll('.modal-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.modal === currentModal.answer && !correct) b.classList.add('reveal-correct');
    });
    document.querySelector(`.modal-btn[data-modal="${answer}"]`).classList.add(correct ? 'selected-correct' : 'selected-wrong');

    if (!correct) {
        showFeedbackTip('modalFeedback',
            `Era ${currentModal.answer === 'tonal' ? 'Tonal' : 'Modal'} — ${currentModal.desc}`);
    }
    const m = currentModal;
    document.getElementById('modalRevTitle').textContent = m.answer === 'tonal' ? 'Sistema Tonal' : 'Sistema Modal';
    document.getElementById('modalRevChords').textContent = m.chords.join(' → ');
    document.getElementById('modalRevDesc').textContent = m.desc;
    document.getElementById('modalRevWhy').textContent = m.why;
    document.getElementById('modalRevealPanel').classList.add('visible');
    document.getElementById('modalScore').textContent = `${modalScores[0]}/${modalScores[1]}`;
    guardarRonda('modalidad', modalScores[0], modalScores[1]);
    updateModalProgress(); renderHistorial('modalidad');
}

// ─── COMPLETAR PROGRESIÓN ─────────────────────────────────────────
function getCompletarPool() {
    return PROGRESSIONS.filter(p => p.chords.length >= 3);
}

let currentCompletar = null, completarRound = 0;
let completarScores = [0, 0];
let completarPhase = 'idle';
let completarRepeatCount = 0;

function buildCompBtns() {
    const el = document.getElementById('compBtnGrid');
    if (!el) return;
    el.innerHTML = DEGREES.map(d =>
        `<button class="deg-btn" data-deg="${d.num}" style="--deg-color:${d.color}" onclick="answerCompletar('${d.num}')">
    <span class="deg-btn-num">${d.num}</span>
    <span class="deg-btn-chord">${d.chordName}</span>
    <span class="deg-btn-quality ${d.quality === 'mayor' ? 'dq-mayor' : 'dq-menor'}">${d.qualityLabel}</span>
</button>`
    ).join('');
}

function startCompletarRound() {
    hideFeedbackTip('compFeedback');
    const pool = getCompletarPool();
    currentCompletar = weightedPick(adaptiveWeights(pool, 'completar', p => p.id));
    completarRound++; completarPhase = 'answering';
    completarRepeatCount = 0;

    const prefix = currentCompletar.chords.slice(0, -1);
    document.getElementById('compPlayHint').textContent = 'escuchando…';
    document.getElementById('compRepeatBtn').disabled = false;
    document.getElementById('compRevealPanel').classList.remove('visible');
    document.querySelectorAll('#compBtnGrid .deg-btn').forEach(b => {
        b.classList.remove('selected-correct', 'selected-wrong', 'reveal-correct');
        b.disabled = false;
    });
    document.getElementById('compRound').textContent = '#' + completarRound;

    // Mostrar slots: los conocidos con su numeral, el misterio con "?"
    document.getElementById('compSlots').innerHTML = currentCompletar.chords.map((ch, i) => {
        const isLast = i === currentCompletar.chords.length - 1;
        return `<div class="prog-slot ${isLast ? 'ps-active comp-mystery' : 'comp-known'}" id="cps${i}">${isLast ? '?' : ch}</div>`;
    }).join('');

    const btn = document.getElementById('compPlayBtn');
    btn.classList.add('ringing'); setTimeout(() => btn.classList.remove('ringing'), 400);

    // Tocar solo el prefijo (sin el último acorde)
    playProgression(prefix, playMode === 'arp' ? ARP_DELAYS[0] : 0);

    setTimeout(() => {
        if (completarPhase === 'answering')
            document.getElementById('compPlayHint').textContent = '¿qué acorde completa la secuencia?';
    }, prefix.length * 2200 + 300);
}

function repeatCompletar() {
    if (!currentCompletar) return;
    completarRepeatCount++;
    const prefix = currentCompletar.chords.slice(0, -1);
    const delay = playMode === 'arp' ? ARP_DELAYS[completarRepeatCount % ARP_DELAYS.length] : 0;
    playProgression(prefix, delay);
    if (playMode === 'arp') {
        const looped = (completarRepeatCount % ARP_DELAYS.length) === 0;
        const tempo = TEMPO_NAMES[completarRepeatCount % TEMPO_NAMES.length];
        document.getElementById('compPlayHint').textContent = looped ? 'arpegiado · allegro ↺' : `arpegiado · ${tempo}`;
    }
}

function answerCompletar(num) {
    if (completarPhase !== 'answering') return;
    completarPhase = 'done';
    const mystery = currentCompletar.chords[currentCompletar.chords.length - 1];
    const correct = num === mystery;
    completarScores[1]++;
    if (correct) completarScores[0]++;
    registrarDetalle('completar', currentCompletar.id, correct);

    document.querySelectorAll('#compBtnGrid .deg-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.deg === mystery && !correct) b.classList.add('reveal-correct');
    });
    document.querySelector(`#compBtnGrid .deg-btn[data-deg="${num}"]`).classList.add(correct ? 'selected-correct' : 'selected-wrong');

    const lastSlot = document.getElementById('cps' + (currentCompletar.chords.length - 1));
    lastSlot.textContent = mystery;
    lastSlot.classList.remove('ps-active', 'comp-mystery');
    lastSlot.classList.add(correct ? 'ps-correct' : 'ps-wrong');

    if (!correct) {
        const expDeg = DEGREES.find(d => d.num === mystery);
        const ansDeg = DEGREES.find(d => d.num === num);
        showFeedbackTip('compFeedback',
            `Era ${mystery} (${expDeg ? expDeg.chordName : ''})` +
            (ansDeg ? ` — no ${num} (${ansDeg.chordName})` : ''));
    }

    // Tocar la progresión completa para confirmar
    setTimeout(() => playProgression(currentCompletar.chords, playMode === 'arp' ? ARP_DELAYS[0] : 0), 500);

    const c = currentCompletar;
    document.getElementById('compRevTitle').textContent = c.name;
    document.getElementById('compRevChords').textContent = c.chords.join(' → ');
    document.getElementById('compRevFeeling').textContent = c.feeling;
    document.getElementById('compRevDesc').textContent = c.desc;
    document.getElementById('compRevSongs').innerHTML = c.songs.map(s => `<span class="prog-song-pill">${s}</span>`).join('');
    document.getElementById('compRevealPanel').classList.add('visible');
    document.getElementById('compScore').textContent = `${completarScores[0]}/${completarScores[1]}`;
    guardarRonda('completar', completarScores[0], completarScores[1]);
    updateCompletarProgress(); renderHistorial('completar');
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
    ['inversiones','grados','progresiones','dictado','posicion','intervalos',
     'funciones','cadencias','modalidad','completar'].forEach(m => {
        renderHistorial(m);
        renderRacha(m);
    });
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
    hideFeedbackTip('dictFeedback');
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
    if (!correct) {
        sl.title = 'tu respuesta: ' + note;
        const midiExp = dictadoSet.midis[dictadoSet.notes.indexOf(expected)];
        const midiAns = dictadoSet.midis[dictadoSet.notes.indexOf(note)];
        const diff = midiExp - midiAns;
        const dir = diff > 0 ? `${diff} semitono(s) más arriba` : `${Math.abs(diff)} semitono(s) más abajo`;
        showFeedbackTip('dictFeedback', `Era ${expected}, dijiste ${note} — estaba ${dir} de lo que escuchaste.`);
    } else { hideFeedbackTip('dictFeedback'); }

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
    updateDictProgress(); renderHistorial('dictado');
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
    const data = cargarProgreso();
    const det  = data.detalle || {};
    const gdet = det.grados || {};
    const idet = det.inversiones || {};
    const pdet = det.posicion || {};
    const ddet = det.dictado || {};
    const prdet = det.progresiones || {};

    // Grados
    document.getElementById('amGrados').innerHTML =
        DEGREES.map(d => renderAccBar(`${d.num} — ${d.name}`, ...(gdet[d.num]||[0,0]))).join('');

    // Inversiones (quiz completo)
    const invLabels = { fundamental:'Fundamental', primera:'1ª Inversión', segunda:'2ª Inversión' };
    document.getElementById('amInversiones').innerHTML =
        ['fundamental','primera','segunda'].map(k => renderAccBar(invLabels[k], ...(idet[k]||[0,0]))).join('');

    // Solo posición
    document.getElementById('amPosicion').innerHTML =
        ['fundamental','primera','segunda'].map(k => renderAccBar(invLabels[k], ...(pdet[k]||[0,0]))).join('');

    // Progresiones — solo las practicadas
    const progUsed = PROGRESSIONS.filter(p => (prdet[p.id]||[0,0])[1] > 0);
    document.getElementById('amProgresiones').innerHTML = progUsed.length === 0
        ? '<span class="am-nodata-msg">Practicá progresiones para ver datos aquí.</span>'
        : progUsed.map(p => renderAccBar(p.name, ...(prdet[p.id]||[0,0]))).join('');

    // Dictado — solo notas usadas (tot > 0)
    const usedNotes = Object.keys(DETALLE_DEFAULTS.dictado).filter(k => (ddet[k]||[0,0])[1] > 0);
    document.getElementById('amDictado').innerHTML = usedNotes.length === 0
        ? '<span class="am-nodata-msg">Practicá dictado para ver datos aquí.</span>'
        : usedNotes.map(k => renderAccBar(k, ...(ddet[k]||[0,0]))).join('');

    // Rachas
    const streaks = data.streak || {};
    const rachaLabels = { inversiones:'Inversiones', grados:'Grados', progresiones:'Progresiones', dictado:'Dictado', posicion:'Solo posición' };
    document.getElementById('amRachas').innerHTML = Object.entries(rachaLabels).map(([k, label]) => {
        const s = streaks[k] || { current: 0, best: 0 };
        if (s.best === 0) return `<div class="am-bar-row"><span class="am-bar-label">${label}</span><span class="am-bar-nodata">sin datos</span></div>`;
        const currBadge = s.current >= 3 ? `<span class="racha-fire" style="margin-left:0.5rem;font-size:0.65rem">${s.current} activa</span>` : '';
        return `<div class="am-bar-row"><span class="am-bar-label">${label}</span><span class="am-bar-pct" style="color:var(--ink)">mejor: ${s.best}</span>${currBadge}</div>`;
    }).join('');

    // Recomendaciones (todas las fuentes)
    const items = [];
    DEGREES.forEach(d => { const [ok,tot]=gdet[d.num]||[0,0]; if(tot>=5) items.push({label:`Grado ${d.num}`,pct:ok/tot}); });
    usedNotes.forEach(k => { const [ok,tot]=ddet[k]||[0,0]; if(tot>=5) items.push({label:`Nota ${k} (dictado)`,pct:ok/tot}); });
    ['fundamental','primera','segunda'].forEach(k => { const [ok,tot]=idet[k]||[0,0]; if(tot>=5) items.push({label:invLabels[k]+' (quiz)',pct:ok/tot}); });
    ['fundamental','primera','segunda'].forEach(k => { const [ok,tot]=pdet[k]||[0,0]; if(tot>=5) items.push({label:invLabels[k]+' (posición)',pct:ok/tot}); });
    progUsed.forEach(p => { const [ok,tot]=prdet[p.id]||[0,0]; if(tot>=5) items.push({label:p.name+' (prog)',pct:ok/tot}); });
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

// ─── PRACTICAR — MODE SELECTOR ────────────────────────────────────
let practicarMode = 'completo';

function switchPracticarMode(mode) {
    practicarMode = mode;
    ['completo', 'posicion'].forEach(m => {
        document.getElementById(m + 'Section').style.display = m === mode ? '' : 'none';
        const key = 'pm' + m.charAt(0).toUpperCase() + m.slice(1);
        document.getElementById(key).classList.toggle('pm-active', m === mode);
    });
    if (mode === 'posicion') { updatePosProgress(); renderHistorial('posicion'); }
    if (mode === 'completo') { updateInvProgress(); renderHistorial('inversiones'); }
}

// ─── SOLO POSICIÓN — secuencia de 10 acordes ──────────────────────
let seqQuality = 'ambos';
let seqChords = [];
let seqIndex = 0;
let seqCorrect = 0;
let seqPhase = 'idle';
let seqRepeatCount = 0;
const SEQ_LENGTH = 10;

const SEQ_TYPE_SHORT = { fundamental: 'Fund.', primera: '1ª Inv.', segunda: '2ª Inv.' };

// Tips pedagógicos por tipo de posición
const POS_TIPS = {
    fundamental: 'Fundamental — buscá estabilidad y peso: el bajo es la raíz, el acorde suena "completo y en casa". Distancia desde el bajo: 3ª + 5ª.',
    primera:     '1ª Inversión — buscá suavidad y fluidez: el bajo es la 3ª, el peso se alivia. Distancia desde el bajo: 3ª + 6ª.',
    segunda:     '2ª Inversión — buscá tensión e inestabilidad: el bajo es la 5ª, genera una 4ª inestable. Distancia desde el bajo: 4ª + 6ª.',
};

function setSeqQuality(q, btn) {
    seqQuality = q;
    document.querySelectorAll('.seq-quality-btn').forEach(b => b.classList.remove('sq-active'));
    btn.classList.add('sq-active');
}

function getSeqPool() {
    if (seqQuality === 'ambos') return CHORDS;
    return CHORDS.filter(c => c.quality === seqQuality);
}

// Selección adaptativa o desde secuencia personalizada
function buildSeqChords() {
    const pool = getSeqPool();

    if (seqCustomPositions) {
        // Modo custom: cada slot tiene posición fija, acorde al azar de esa posición
        seqChords = seqCustomPositions.map(type => {
            const filtered = pool.filter(c => c.type === type);
            return rand(filtered.length ? filtered : pool);
        });
        seqCustomPositions = null; // resetear tras construir (una sola vuelta con esa secuencia)
        seqCustomQuality   = null;
        return;
    }

    // Modo adaptativo: tipos con peor precisión aparecen más
    const types = ['fundamental', 'primera', 'segunda'];
    const det = (cargarProgreso().detalle || {}).posicion || {};
    const typeW = types.map(t => {
        const [ok, tot] = det[t] || [0, 0];
        const weight = tot < 5 ? 0.8 : Math.max(0.15, 1 - ok / tot);
        return { item: t, weight };
    });
    seqChords = Array.from({ length: SEQ_LENGTH }, () => {
        const chosenType = weightedPick(typeW);
        const filtered = pool.filter(c => c.type === chosenType);
        return rand(filtered.length ? filtered : pool);
    });
}

// ─── PANEL DE PROGRESO ADAPTATIVO (genérico) ──────────────────────
// items: array de claves, labels: {key: texto}, tips: {key: texto pedagógico}
// minSamples: mínimo de respuestas para considerar el dato
function renderAdapPanel(module, items, labels, tips, barsId, focusId, minSamples = 3) {
    const det = (cargarProgreso().detalle || {})[module] || {};

    document.getElementById(barsId).innerHTML = items.map(k => {
        const [ok, tot] = det[k] || [0, 0];
        if (tot === 0) return `<div class="adap-row">
            <span class="adap-label">${labels[k]}</span>
            <span class="adap-nodata">sin datos aún</span>
        </div>`;
        const pct = Math.round(ok / tot * 100);
        const col = pct >= 80 ? 'var(--correct)' : pct >= 50 ? '#d4aa3e' : 'var(--wrong)';
        return `<div class="adap-row">
            <span class="adap-label">${labels[k]}</span>
            <div class="adap-track"><div class="adap-fill" style="width:${pct}%;background:${col}"></div></div>
            <span class="adap-pct" style="color:${col}">${pct}%</span>
            <span class="adap-count">(${ok}/${tot})</span>
        </div>`;
    }).join('');

    const focusEl = document.getElementById(focusId);
    const withData = items.filter(k => (det[k] || [0, 0])[1] >= minSamples);
    if (withData.length === 0) {
        focusEl.textContent = 'Hacé algunos ejercicios para ver recomendaciones.';
        return;
    }
    const sorted = [...withData].sort((a, b) => {
        const pa = (det[a][0] || 0) / det[a][1];
        const pb = (det[b][0] || 0) / det[b][1];
        return pa - pb;
    });
    const weakest = sorted[0];
    const pctW = Math.round((det[weakest][0] || 0) / det[weakest][1] * 100);
    const allGood = pctW >= 80;
    const tip = tips[weakest] || '';
    focusEl.innerHTML = allGood
        ? `<strong>¡Excelente!</strong> Dominás todo lo practicado. El sistema sigue alternando para consolidar.`
        : `<strong>La próxima ronda prioriza:</strong> ${labels[weakest]} — ${tip} <em>(precisión: ${pctW}%)</em>`;
}

// Actualizadores por sección
function updatePosProgress() {
    renderAdapPanel(
        'posicion',
        ['fundamental', 'primera', 'segunda'],
        { fundamental: 'Fundamental', primera: '1ª Inversión', segunda: '2ª Inversión' },
        POS_TIPS,
        'posProgBars', 'posFocusHint'
    );
}

function updateInvProgress() {
    renderAdapPanel(
        'inversiones',
        ['fundamental', 'primera', 'segunda'],
        { fundamental: 'Fundamental', primera: '1ª Inversión', segunda: '2ª Inversión' },
        POS_TIPS,
        'invProgBars', 'invFocusHint'
    );
}

function updateGradosProgress() {
    const gradosTips = {
        I:   'Tónica — buscá reposo absoluto, el acorde más estable. "Llegué."',
        II:  'Supertónica — tensión suave y puente. Menor, pide moverse hacia V o IV.',
        III: 'Mediante — oscuro e íntimo, comparte notas con I y V. Ambiguo.',
        IV:  'Subdominante — cálido y amplio, se aleja del centro. "Me voy."',
        V:   'Dominante — la tensión más fuerte, el Si pide resolver al Do. "Ahora."',
        VI:  'Superdominante — el relativo menor, nostálgico y oscuro pero estable.',
    };
    renderAdapPanel(
        'grados',
        ['I', 'II', 'III', 'IV', 'V', 'VI'],
        { I: 'I — Do M', II: 'II — Re m', III: 'III — Mi m', IV: 'IV — Fa M', V: 'V — Sol M', VI: 'VI — La m' },
        gradosTips,
        'gradosProgBars', 'gradosFocusHint'
    );
}

function updateProgProgress() {
    const det = (cargarProgreso().detalle || {}).progresiones || {};
    // Mostrar solo las progresiones con datos, ordenadas de peor a mejor (máx 6)
    const withData = PROGRESSIONS
        .filter(p => (det[p.id] || [0, 0])[1] >= 2)
        .sort((a, b) => {
            const pa = (det[a.id][0] || 0) / det[a.id][1];
            const pb = (det[b.id][0] || 0) / det[b.id][1];
            return pa - pb;
        })
        .slice(0, 6);

    if (withData.length === 0) {
        document.getElementById('progProgBars').innerHTML = '';
        document.getElementById('progFocusHint').textContent = 'Hacé algunos ejercicios para ver recomendaciones.';
        return;
    }
    const items = withData.map(p => p.id);
    const labels = Object.fromEntries(withData.map(p => [p.id, p.name]));
    const tips = Object.fromEntries(withData.map(p => [p.id, p.chords.join(' → ')]));
    renderAdapPanel('progresiones', items, labels, tips, 'progProgBars', 'progFocusHint', 2);
}

function updateFuncionProgress() {
    const tips = {
        I:   'Tónica — reposo, hogar. I, III, VI son tónica.',
        II:  'Subdominante — alejamiento, preparación. II y IV.',
        III: 'Tónica — comparte notas con I y V. Ambiguo.',
        IV:  'Subdominante — cálida, se aleja del centro.',
        V:   'Dominante — máxima tensión. Solo el V.',
        VI:  'Tónica — el relativo menor, oscuro pero estable.',
    };
    renderAdapPanel(
        'funciones',
        ['I','II','III','IV','V','VI'],
        { I:'I — Do M', II:'II — Re m', III:'III — Mi m', IV:'IV — Fa M', V:'V — Sol M', VI:'VI — La m' },
        tips, 'funcProgBars', 'funcFocusHint'
    );
}

function updateCadenciaProgress() {
    const labels = {
        aut_perf: 'Aut. Perfecta',
        aut_imp:  'Aut. Imperfecta',
        plagal:   'Plagal',
        rota:     'Rota',
        semi:     'Semicadencia',
    };
    const tips = {
        aut_perf: 'V→I ambos en fundamental. El cierre más sólido.',
        aut_imp:  'V→I con I en inversión — resuelve pero deja abierto.',
        plagal:   'IV→I — el "amén" cálido, sin pasar por V.',
        rota:     'V→VI — el dominante que engaña al oído.',
        semi:     'X→V — termina en tensión, pregunta sin respuesta.',
    };
    renderAdapPanel(
        'cadencias',
        CADENCE_TYPES.map(c => c.id),
        labels, tips, 'cadProgBars', 'cadFocusHint'
    );
}

function updateModalProgress() {
    const el   = document.getElementById('modalProgBars');
    const hint = document.getElementById('modalFocusHint');
    if (!el || !hint) return;
    const hist = (cargarProgreso()['modalidad'] || []).slice(-10);
    el.innerHTML = '';
    if (hist.length === 0) { hint.textContent = 'Presioná ▶ para empezar.'; return; }
    const avg = Math.round(hist.reduce((s, x) => s + x.pct, 0) / hist.length);
    hint.innerHTML = avg >= 80
        ? '<strong>¡Excelente!</strong> Tu oído distingue bien tonal vs. modal.'
        : avg >= 60
        ? `Promedio ${avg}% — escuchá la sensible (Si→Do) como señal de sistema tonal.`
        : `Promedio ${avg}% — tonal = atracción obligada, modal = movimiento libre.`;
}

function updateCompletarProgress() {
    const det = (cargarProgreso().detalle || {}).completar || {};
    const pool = getCompletarPool();
    const withData = pool
        .filter(p => (det[p.id] || [0,0])[1] >= 2)
        .sort((a, b) => {
            const pa = (det[a.id][0]||0) / det[a.id][1];
            const pb = (det[b.id][0]||0) / det[b.id][1];
            return pa - pb;
        }).slice(0, 6);
    if (withData.length === 0) {
        document.getElementById('compProgBars').innerHTML = '';
        document.getElementById('compFocusHint').textContent = 'Presioná ▶ para empezar.';
        return;
    }
    const items  = withData.map(p => p.id);
    const labels = Object.fromEntries(withData.map(p => [p.id, p.name]));
    const tips   = Object.fromEntries(withData.map(p => [p.id, p.chords.join(' → ')]));
    renderAdapPanel('completar', items, labels, tips, 'compProgBars', 'compFocusHint', 2);
}

function updateDictProgress() {
    const notes = dictadoSet.notes;
    const noteTips = Object.fromEntries(notes.map(n => [n, `nota ${n} — escuchala como parte del pentacordio`]));
    const noteLabels = Object.fromEntries(notes.map(n => [n, n]));
    renderAdapPanel('dictado', notes, noteLabels, noteTips, 'dictProgBars', 'dictFocusHint', 3);
}

function renderSeqSlots() {
    document.getElementById('seqSlots').innerHTML = seqChords.map((_, i) =>
        `<div class="seq-slot" id="seq-slot-${i}">
            <span class="seq-slot-num">${i + 1}</span>
            <span class="seq-slot-ans" id="seq-slot-ans-${i}">?</span>
        </div>`
    ).join('');
}

function activateSeqSlot(i) {
    document.querySelectorAll('.seq-slot').forEach((s, j) => {
        s.classList.toggle('seq-active', j === i);
    });
    document.querySelectorAll('.seq-choice-btn').forEach(b => {
        b.classList.remove('selected-correct', 'selected-wrong', 'reveal-correct');
        b.disabled = false;
    });
    seqRepeatCount = 0;
    document.getElementById('seqStepTitle').textContent = `¿Qué posición es? — acorde ${i + 1} de ${seqChords.length}`;
}

function startSeqRound() {
    hideFeedbackTip('posFeedback');
    buildSeqChords();
    seqIndex = 0; seqCorrect = 0; seqPhase = 'answering';
    seqRepeatCount = 0;
    renderSeqSlots();
    activateSeqSlot(0);
    document.getElementById('seqRevealPanel').classList.remove('visible');
    document.getElementById('seqRepeatBtn').disabled = false;
    const btn = document.getElementById('seqPlayBtn');
    btn.classList.add('ringing'); setTimeout(() => btn.classList.remove('ringing'), 400);
    playChord(seqChords[0].midis, playMode === 'arp' ? ARP_DELAYS[0] : 0);
    document.getElementById('seqPlayHint').textContent = `acorde 1 de ${seqChords.length}`;
}

function repeatSeq() {
    if (seqPhase !== 'answering' || !seqChords[seqIndex]) return;
    seqRepeatCount++;
    playChord(seqChords[seqIndex].midis, playMode === 'arp' ? ARP_DELAYS[seqRepeatCount % ARP_DELAYS.length] : 0);
}

function answerSeq(type) {
    if (seqPhase !== 'answering') return;
    const c = seqChords[seqIndex];
    const correct = type === c.type;
    if (correct) seqCorrect++;

    const order = ['fundamental', 'primera', 'segunda'];
    const btns = document.querySelectorAll('.seq-choice-btn');
    btns.forEach((b, i) => {
        b.disabled = true;
        if (order[i] === c.type && !correct) b.classList.add('reveal-correct');
    });
    btns[order.indexOf(type)].classList.add(correct ? 'selected-correct' : 'selected-wrong');
    if (!correct) {
        showFeedbackTip('posFeedback', POS_FEEDBACK[type + '→' + c.type] || '');
    } else { hideFeedbackTip('posFeedback'); }

    const slot = document.getElementById(`seq-slot-${seqIndex}`);
    document.getElementById(`seq-slot-ans-${seqIndex}`).textContent = SEQ_TYPE_SHORT[c.type];
    slot.classList.remove('seq-active');
    slot.classList.add(correct ? 'seq-correct' : 'seq-wrong');

    registrarDetalle('posicion', c.type, correct);

    seqIndex++;
    const total = seqChords.length;
    if (seqIndex >= total) {
        seqPhase = 'done';
        document.getElementById('seqRepeatBtn').disabled = true;
        document.getElementById('seqPlayHint').textContent = 'secuencia completa';
        document.getElementById('seqStepTitle').textContent = 'resultado final';

        const pct = Math.round(seqCorrect / total * 100);
        document.getElementById('seqRevScore').textContent = `${seqCorrect}/${total} — ${pct}%`;
        document.getElementById('seqRevMsg').textContent =
            pct === 100 ? '¡Perfecto! Oído impecable.' :
            pct >= 80   ? '¡Muy bien! Seguí así.' :
            pct >= 60   ? 'Buen trabajo, seguí practicando.' :
                          'Sigue escuchando, el oído se entrena.';

        document.getElementById('seqRevealList').innerHTML = seqChords.map((ch, i) => {
            const wasCorrect = document.getElementById(`seq-slot-${i}`).classList.contains('seq-correct');
            return `<div class="seq-reveal-row ${wasCorrect ? 'sr-correct' : 'sr-wrong'}">
                <span class="seq-reveal-num">${i + 1}.</span>
                <span class="seq-reveal-chord">${ch.name}</span>
                <span class="seq-reveal-mark">${TYPE_LABELS[ch.type]}</span>
                <span class="seq-reveal-mark">${wasCorrect ? '✓' : '✗'}</span>
            </div>`;
        }).join('');

        document.getElementById('seqRevealPanel').classList.add('visible');
        guardarRonda('posicion', seqCorrect, total);
        updatePosProgress();
        renderHistorial('posicion');
    } else {
        setTimeout(() => {
            activateSeqSlot(seqIndex);
            playChord(seqChords[seqIndex].midis, playMode === 'arp' ? ARP_DELAYS[0] : 0);
            document.getElementById('seqPlayHint').textContent = `acorde ${seqIndex + 1} de ${total}`;
        }, 700);
    }
}

// ─── BANCO DE SECUENCIAS PROPIAS ──────────────────────────────────
const CLAVE_CUSTOM_SEQS = 'oido_custom_seqs_v1';
const CSEQ_MAX = 10;

const CSEQ_LABEL = { fundamental: 'Fund.', primera: '1ª Inv.', segunda: '2ª Inv.' };
const CSEQ_CHIP_CLASS = { fundamental: 'cseq-chip-fund', primera: 'cseq-chip-inv1', segunda: 'cseq-chip-inv2' };
const CSEQ_QUALITY_LABEL = { ambos: 'Mayor y menor', mayor: 'Solo mayor', menor: 'Solo menor' };

let cseqBuilder = [];       // posiciones del builder actual
let cseqBuilderQuality = 'ambos';
let seqCustomPositions = null;  // null → adaptativo, array → secuencia fija
let seqCustomQuality   = null;

function cargarCustomSeqs() {
    try { return JSON.parse(localStorage.getItem(CLAVE_CUSTOM_SEQS)) || []; }
    catch { return []; }
}

function setCseqQuality(q, btn) {
    cseqBuilderQuality = q;
    document.querySelectorAll('.cseq-q-btn').forEach(b => b.classList.remove('cq-active'));
    btn.classList.add('cq-active');
}

function cseqAdd(type) {
    if (cseqBuilder.length >= CSEQ_MAX) return;
    cseqBuilder.push(type);
    renderCseqPreview();
}

function cseqRemoveLast() {
    cseqBuilder.pop();
    renderCseqPreview();
}

function renderCseqPreview() {
    const prev = document.getElementById('cseqPreview');
    const count = document.getElementById('cseqCount');
    const saveBtn = document.getElementById('cseqSaveBtn');
    if (prev) prev.innerHTML = cseqBuilder.length === 0
        ? '—'
        : cseqBuilder.map(t =>
            `<span class="cseq-chip ${CSEQ_CHIP_CLASS[t]}">${CSEQ_LABEL[t]}</span>`
          ).join('');
    if (count) count.textContent = cseqBuilder.length + '/' + CSEQ_MAX;
    if (saveBtn) saveBtn.disabled = cseqBuilder.length < 2;
}

function cseqChipsHtml(positions) {
    return positions.map(t =>
        `<span class="cseq-chip ${CSEQ_CHIP_CLASS[t]}">${CSEQ_LABEL[t]}</span>`
    ).join('');
}

function cseqSubmit() {
    const nameEl = document.getElementById('cseqName');
    const name = nameEl ? nameEl.value.trim() : '';
    if (!name || cseqBuilder.length < 2) return;
    const seqs = cargarCustomSeqs();
    seqs.push({
        id: 'cseq_' + Date.now(),
        name,
        quality: cseqBuilderQuality,
        positions: [...cseqBuilder]
    });
    localStorage.setItem(CLAVE_CUSTOM_SEQS, JSON.stringify(seqs));
    cseqBuilder = [];
    if (nameEl) nameEl.value = '';
    renderCseqPreview();
    renderCseqList();
}

function deleteCseq(id) {
    const seqs = cargarCustomSeqs().filter(s => s.id !== id);
    localStorage.setItem(CLAVE_CUSTOM_SEQS, JSON.stringify(seqs));
    renderCseqList();
}

function playCseq(id) {
    const seq = cargarCustomSeqs().find(s => s.id === id);
    if (!seq) return;
    // Configurar calidad y posiciones fijas, luego iniciar ronda
    seqCustomPositions = seq.positions;
    seqCustomQuality   = seq.quality;
    // Sincronizar botones de calidad visualmente
    const qMap = { ambos: 0, mayor: 1, menor: 2 };
    document.querySelectorAll('.seq-quality-btn').forEach((b, i) => {
        b.classList.toggle('sq-active', i === (qMap[seq.quality] ?? 0));
    });
    seqQuality = seq.quality;
    // Scroll al play button y empezar
    document.getElementById('seqPlayBtn').scrollIntoView({ behavior: 'smooth', block: 'center' });
    startSeqRound();
}

function renderCseqList() {
    const container = document.getElementById('cseqList');
    if (!container) return;
    const seqs = cargarCustomSeqs();
    if (seqs.length === 0) {
        container.innerHTML = '<span class="custom-prog-empty">sin secuencias guardadas</span>';
        return;
    }
    container.innerHTML = seqs.map(s => `
        <div class="cseq-item">
            <div class="cseq-item-info">
                <span class="cseq-item-name">${s.name}</span>
                <span class="cseq-item-quality">${CSEQ_QUALITY_LABEL[s.quality] || s.quality} · ${s.positions.length} acordes</span>
                <div class="cseq-item-chips">${cseqChipsHtml(s.positions)}</div>
            </div>
            <div class="cseq-item-actions">
                <button class="cseq-play-btn" onclick="playCseq('${s.id}')">▶ tocar</button>
                <button class="cseq-del-btn" onclick="deleteCseq('${s.id}')">✕</button>
            </div>
        </div>`
    ).join('');
}

function initCseq() {
    renderCseqPreview();
    renderCseqList();
}

// ─── INTERVALOS ───────────────────────────────────────────────────
const ALL_INTERVALS = [
    { id: 'm2', name: '2ª menor', semis: 1  },
    { id: 'M2', name: '2ª Mayor', semis: 2  },
    { id: 'm3', name: '3ª menor', semis: 3  },
    { id: 'M3', name: '3ª Mayor', semis: 4  },
    { id: 'P4', name: '4ª Justa', semis: 5  },
    { id: 'TT', name: 'Tritono',  semis: 6  },
    { id: 'P5', name: '5ª Justa', semis: 7  },
    { id: 'm6', name: '6ª menor', semis: 8  },
    { id: 'M6', name: '6ª Mayor', semis: 9  },
    { id: 'm7', name: '7ª menor', semis: 10 },
    { id: 'M7', name: '7ª Mayor', semis: 11 },
    { id: 'P8', name: 'Octava',   semis: 12 },
];

const INT_MIDI_LOW  = 48; // Do3
const INT_MIDI_HIGH = 72; // Do5 (2 octavas)
const INT_ROUND_LEN = 10;

let intDirection  = 'asc';
let intActiveBank = new Set(ALL_INTERVALS.map(iv => iv.id)); // todos activos por defecto
let intTestSeq    = [];   // [{iv, rootMidi, result}]
let intTestIndex  = 0;
let intTestPhase  = 'idle'; // 'idle' | 'answering' | 'done'
let intRoundNum   = 0;
let intTotalOk    = 0;
let intTotalTot   = 0;

function setIntDirection(dir, btn) {
    intDirection = dir;
    document.querySelectorAll('.int-dir-btn').forEach(b => b.classList.remove('m-active'));
    if (btn) btn.classList.add('m-active');
}

function buildIntPicker() {
    document.getElementById('intPicker').innerHTML = ALL_INTERVALS.map(iv =>
        `<button class="int-bank-btn ib-active" id="ipick-${iv.id}" onclick="toggleIntPick('${iv.id}',this)">${iv.name}<small>${iv.semis} st</small></button>`
    ).join('');
}

function toggleIntPick(id, btn) {
    if (intActiveBank.has(id)) {
        if (intActiveBank.size <= 2) return;
        intActiveBank.delete(id);
        btn.classList.remove('ib-active');
    } else {
        intActiveBank.add(id);
        btn.classList.add('ib-active');
    }
}

// ── Test ─────────────────────────────────────────────────────────
function startIntTest() {
    const pool = ALL_INTERVALS.filter(iv => intActiveBank.has(iv.id));
    if (pool.length < 1) return;

    // Generar 10 intervalos aleatorios del pool con roots al azar
    intTestSeq = Array.from({ length: INT_ROUND_LEN }, () => {
        const iv       = pool[Math.floor(Math.random() * pool.length)];
        const rootMax  = INT_MIDI_HIGH - iv.semis;
        const rootMidi = INT_MIDI_LOW + Math.floor(Math.random() * (rootMax - INT_MIDI_LOW + 1));
        return { iv, rootMidi, result: null };
    });
    intTestIndex = 0;
    intTestPhase = 'idle';
    intRoundNum++;

    document.getElementById('intRound').textContent = '#' + intRoundNum;
    document.getElementById('intRevealPanel').classList.remove('visible');
    document.getElementById('intSlotsArea').style.display = '';

    // Slots
    document.getElementById('intSeqSlots').innerHTML = intTestSeq.map((_, i) =>
        `<div class="seq-slot" id="int-slot-${i}">
            <div class="seq-slot-num">${i + 1}</div>
            <div class="seq-slot-ans" id="int-slot-ans-${i}">?</div>
        </div>`
    ).join('');

    // Botones de respuesta — todos los del banco activo
    document.getElementById('intAnswerBtns').innerHTML = pool.map(iv =>
        `<button class="deg-btn" id="iabtn-${iv.id}" onclick="answerInt('${iv.id}')">${iv.name}<br><small style="font-size:0.6rem;opacity:0.6">${iv.semis} st</small></button>`
    ).join('');

    intAdvanceToSlot(0);
}

function intAction() {
    // El botón ▶ arranca la ronda si está idle, o repite si ya está en curso
    if (intTestPhase === 'idle' && intTestSeq.length === 0) {
        startIntTest();
    } else {
        startIntTest();
    }
}

function intAdvanceToSlot(i) {
    intTestIndex = i;
    intTestPhase = 'idle';
    document.getElementById('intQuizHint').textContent = `intervalo ${i + 1} de ${INT_ROUND_LEN}`;
    document.querySelectorAll('#intSeqSlots .seq-slot').forEach(s => s.classList.remove('seq-active'));
    const sl = document.getElementById('int-slot-' + i);
    if (sl) sl.classList.add('seq-active');
    document.querySelectorAll('#intAnswerBtns .deg-btn').forEach(b => {
        b.disabled = true;
        b.classList.remove('selected-correct', 'selected-wrong', 'reveal-correct');
    });
    document.getElementById('intRepeatBtn').disabled = true;
    document.getElementById('intPlayHint').textContent = 'escuchando…';

    const pb = document.getElementById('intPlayBtn');
    pb.classList.add('ringing');
    setTimeout(() => pb.classList.remove('ringing'), 400);
    setTimeout(() => intPlayCurrent(), 200);
}

function intPlayCurrent() {
    if (intTestIndex >= intTestSeq.length) return;
    const { iv, rootMidi } = intTestSeq[intTestIndex];
    intPlayAudio(iv, rootMidi);
    intTestPhase = 'answering';
    document.getElementById('intRepeatBtn').disabled = false;
    document.getElementById('intPlayHint').textContent = '¿Qué intervalo escuchás?';
    document.querySelectorAll('#intAnswerBtns .deg-btn').forEach(b => b.disabled = false);
}

function answerInt(id) {
    if (intTestPhase !== 'answering') return;
    intTestPhase = 'done';
    const { iv, rootMidi } = intTestSeq[intTestIndex];
    const correct = id === iv.id;
    intTestSeq[intTestIndex].result = correct;
    registrarDetalle('intervalos', iv.id, correct);

    document.querySelectorAll('#intAnswerBtns .deg-btn').forEach(b => {
        b.disabled = true;
        if (b.id.replace('iabtn-', '') === iv.id && !correct) b.classList.add('reveal-correct');
    });
    const ab = document.getElementById('iabtn-' + id);
    if (ab) ab.classList.add(correct ? 'selected-correct' : 'selected-wrong');

    const sl  = document.getElementById('int-slot-' + intTestIndex);
    const rn  = NOTAS[rootMidi % 12];
    const tn  = NOTAS[(rootMidi + iv.semis) % 12];
    document.getElementById('int-slot-ans-' + intTestIndex).textContent = iv.id;
    sl.classList.remove('seq-active');
    sl.classList.add(correct ? 'seq-correct' : 'seq-wrong');
    sl.title = `${rn} → ${tn}`;

    document.getElementById('intPlayHint').textContent =
        correct ? '¡Correcto!' : `Era: ${iv.name}`;

    const next = intTestIndex + 1;
    if (next >= INT_ROUND_LEN) {
        setTimeout(showIntReveal, 600);
    } else {
        setTimeout(() => intAdvanceToSlot(next), 700);
    }
}

function showIntReveal() {
    const ok  = intTestSeq.filter(x => x.result).length;
    const tot = INT_ROUND_LEN;
    const pct = Math.round(ok / tot * 100);
    intTotalOk  += ok;
    intTotalTot += tot;
    guardarRonda('intervalos', ok, tot);

    document.getElementById('intRevScore').textContent = `${ok}/${tot} — ${pct}%`;
    document.getElementById('intRevMsg').textContent =
        pct === 100 ? '¡Perfecto! Oído impecable.' :
        pct >= 80   ? '¡Muy bien! Seguí así.' :
        pct >= 60   ? 'Buen trabajo, seguí practicando.' :
                      'Seguí escuchando, el oído se entrena.';
    document.getElementById('intRevealList').innerHTML = intTestSeq.map((x, i) => {
        const rn = NOTAS[x.rootMidi % 12];
        const tn = NOTAS[(x.rootMidi + x.iv.semis) % 12];
        return `<div class="seq-reveal-row ${x.result ? 'sr-correct' : 'sr-wrong'}">
            <span class="seq-reveal-num">${i + 1}.</span>
            <span class="seq-reveal-chord">${x.iv.name}</span>
            <span class="seq-reveal-mark">${rn} → ${tn}</span>
            <span class="seq-reveal-mark">${x.result ? '✓' : '✗'}</span>
        </div>`;
    }).join('');
    document.getElementById('intScore').textContent = intTotalOk + '/' + intTotalTot;
    document.getElementById('intRevealPanel').classList.add('visible');
}

function intPlayAudio(iv, rootMidi) {
    stopAllNodes();
    const a = ctx(), now = a.currentTime + 0.05;
    if (intDirection === 'simul') {
        playNote(rootMidi, now, 2.0);
        playNote(rootMidi + iv.semis, now, 2.0);
    } else if (intDirection === 'asc') {
        playNote(rootMidi, now, 1.2);
        playNote(rootMidi + iv.semis, now + 0.45, 1.5);
    } else {
        playNote(rootMidi + iv.semis, now, 1.2);
        playNote(rootMidi, now + 0.45, 1.5);
    }
}

function initIntervalos() {
    buildIntPicker();
    const hist = cargarProgreso()['intervalos'] || [];
    if (hist.length > 0) {
        intTotalOk  = hist.reduce((s, x) => s + x.c, 0);
        intTotalTot = hist.reduce((s, x) => s + x.t, 0);
        intRoundNum = hist.length;
        document.getElementById('intRound').textContent = '#' + intRoundNum;
        document.getElementById('intScore').textContent = intTotalOk + '/' + intTotalTot;
    }
    renderHistorial('intervalos');
    renderRacha('intervalos');
}

// ─── SAFARI AUDIO RECOVERY ───────────────────────────────────────
// Safari suspende el AudioContext en segundo plano.
// Al volver al frente lo reanudamos; si lo cerró, lo limpiamos
// para que ctx() lo recree en el siguiente uso.
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && ac) {
        if (ac.state === 'suspended') ac.resume();
        if (ac.state === 'closed') { ac = null; masterOut = null; masterGain = null; }
    }
});

// ─── INIT ─────────────────────────────────────────────────────────
initVolSlider();
buildTiles();
buildDegreeRef();
buildProgBtns();
initCustomProgs();   // merge custom progs into PROGRESSIONS antes de buildProgRef
buildProgRef();
buildCompBtns();
initDictado();
initHistoriales();
initCseq();
initIntervalos();
// Cargar paneles adaptativos con datos existentes
updateInvProgress();
updatePosProgress();
updateGradosProgress();
updateProgProgress();
updateFuncionProgress();
updateCadenciaProgress();
updateModalProgress();
updateCompletarProgress();
updateDictProgress();
