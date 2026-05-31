// ─── FEEDBACK PEDAGÓGICO ──────────────────────────────────────────
const QUALITY_FEEDBACK = {
    'mayor→menor': 'Era Menor. La 3ª menor (3 st) es un semitono más chica — eso es lo que lo vuelve oscuro y cerrado. Mayor tiene 3ª Mayor (4 st): un semitono más grande, brillante y abierto.',
    'menor→mayor': 'Era Mayor. La 3ª Mayor (4 st) es un semitono más grande — brillante y abierto. Menor tiene 3ª menor (3 st): un semitono menos, más oscuro y denso.',
};

const POS_FEEDBACK = {
    'fundamental→primera': 'Era 1ª Inversión: la 3ª en el bajo reemplaza a la raíz — eso alivia el peso y hace fluir el acorde. Fundamental tiene la raíz en el bajo: más sólido y conclusivo.',
    'fundamental→segunda': 'Era 2ª Inversión: la 5ª en el bajo genera una 4ª Justa hacia arriba — el intervalo más inestable. Buscá esa sensación de flotación y urgencia, muy diferente al reposo de la Fundamental.',
    'primera→fundamental': 'Era Fundamental: la raíz en el bajo ancla el acorde — peso sólido, ya llegó. 1ª Inversión tiene la 3ª en el bajo: más ligera. Acá debías sentir que el acorde no va a ningún lado.',
    'primera→segunda': 'Era 2ª Inversión: la 4ª Justa desde el bajo crea inestabilidad — suspendido, necesita seguir. 1ª Inversión es más suave (3ª en el bajo, sin esa 4ª tensa).',
    'segunda→fundamental': 'Era Fundamental: raíz en el bajo, reposo sólido y conclusivo — sin la 4ª tensa de la 2ª Inversión. Fundamental ya llegó, no pide nada.',
    'segunda→primera': 'Era 1ª Inversión: la 3ª en el bajo, suave y fluida. 2ª Inversión tiene la 4ª Justa desde el bajo — mucho más tensa. La 1ª es "del medio": fluye pero no suspende.',
};

const ROOT_HINT = {
    fundamental: 'pista: en posición fundamental, la raíz es la nota más grave (el bajo)',
    primera:     'pista: en 1ª inversión, la raíz es la nota más aguda',
    segunda:     'pista: en 2ª inversión, la raíz es la nota del medio',
};

function shouldShowRootHint(type) {
    const det = (cargarProgreso().detalle || {}).raiz || {};
    const [ok, tot] = det[type] || [0, 0];
    if (tot < 5) return true;
    return (ok / tot) < 0.75;
}

const POS_CORRECT_FEEDBACK = {
    'fundamental': '✓ Raíz en el bajo — la 5ª Justa arriba completa el acorde sin tensión. El ancla más sólida.',
    'primera':     '✓ La 3ª en el bajo es lo que lo hace ligero y fluido — la raíz ya no manda.',
    'segunda':     '✓ La 4ª Justa desde el bajo es el intervalo más inestable — reconociste esa urgencia.',
};

const REV_INSIGHT = {
    'fundamental': 'La <strong>raíz en el bajo</strong> ancla el acorde. La <strong>5ª Justa</strong> arriba completa sin tensión. El oído descansa — nada pide continuar.',
    'primera':     'La <strong>3ª en el bajo</strong> desplaza a la raíz. Sin ese ancla, el acorde flota y fluye. La <strong>6ª</strong> arriba abre más que la 5ª — menos conclusivo.',
    'segunda':     'La <strong>4ª Justa desde el bajo</strong> es el intervalo más inestable en este contexto. El oído la percibe suspendida — pide resolución y amplifica la energía.',
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
    buildRootButtons();
    const pb = document.getElementById('playBtn');
    pb.classList.add('ringing'); setTimeout(() => pb.classList.remove('ringing'), 400);
    playChord(current.midis, playMode === 'arp' ? ARP_DELAYS[0] : 0);
}

function buildRootButtons() {
    const notes = [...current.notes];
    for (let i = notes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [notes[i], notes[j]] = [notes[j], notes[i]];
    }
    const row = document.getElementById('rootChoiceRow');
    if (row) row.innerHTML = notes.map(n =>
        `<button class="choice-btn" onclick="answerStep3('${n}')">${n}</button>`
    ).join('');
    const hintEl = document.getElementById('rootHint');
    if (hintEl) {
        if (shouldShowRootHint(current.type)) {
            hintEl.textContent = ROOT_HINT[current.type];
            hintEl.classList.add('visible');
        } else {
            hintEl.textContent = '';
            hintEl.classList.remove('visible');
        }
    }
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
    } else {
        showFeedbackTip('invFeedback', POS_CORRECT_FEEDBACK[current.type] || '');
    }
    document.getElementById('step2').classList.replace('active', 'done');
    document.getElementById('step3').classList.add('active'); phase = 'step3';
}

function answerStep3(answer) {
    hideFeedbackTip('invFeedback');
    const correct = answer === current.root; markStep(3, correct);
    registrarDetalle('raiz', current.type, correct);
    const btns = document.getElementById('rootChoiceRow').querySelectorAll('.choice-btn');
    btns.forEach(b => {
        b.disabled = true;
        if (b.textContent === current.root && !correct) b.classList.add('reveal-correct');
    });
    const answeredBtn = [...btns].find(b => b.textContent === answer);
    if (answeredBtn) answeredBtn.classList.add(correct ? 'selected-correct' : 'selected-wrong');
    document.getElementById('iBasNote').textContent = current.bassNote + ' (es la ' + current.bassRole + ')';
    document.getElementById('iMidNote').textContent = current.notes[1];
    document.getElementById('iTopNote').textContent = current.notes[2];
    document.getElementById('iInt1').textContent = current.int1 + ' → ' + current.bassNote + ' a ' + current.notes[1];
    document.getElementById('iInt2').textContent = current.int2 + ' → ' + current.bassNote + ' a ' + current.notes[2];
    document.getElementById('iInt1Why').textContent = current.int1Why || '';
    document.getElementById('iInt2Why').textContent = current.int2Why || '';
    document.getElementById('intervalReveal').classList.add('visible');
    document.getElementById('step3').classList.replace('active', 'done');
    showReveal(); phase = 'done';
}

function showReveal() {
    document.getElementById('revName').textContent = current.name + ' — ' + TYPE_LABELS[current.type];
    document.getElementById('revSub').textContent = current.flavour;
    const insightEl = document.getElementById('revInsight');
    if (insightEl) insightEl.innerHTML = REV_INSIGHT[current.type] || '';
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

