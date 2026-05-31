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

function updateIntProgress() {
    const INT_TIPS = {
        m2: 'Muy disonante y tenso — pensá en el inicio de "Jaws" (tiburón).',
        M2: 'Sonido de escala, stepwise — "Happy Birthday" empieza con una 2ª Mayor.',
        m3: 'Oscuro y melancólico — "Smoke on the Water", primeras dos notas del riff.',
        M3: 'Brillante y mayor — "When the Saints Go Marching In" empieza con una 3ª Mayor.',
        P4: 'Suena a himno o llamada — "El Himno Nacional" sube una 4ª al inicio.',
        TT: 'El más tenso e inestable — "The Simpsons" tema principal usa tritono.',
        P5: 'Abierto y estable — "Star Wars" empieza con una 5ª Justa ascendente.',
        m6: 'Suave y melancólico — "El Reloj" de Roberto Cantoral contiene 6ªs menores.',
        M6: 'Cálido y cantabile — "My Bonnie Lies Over the Ocean" sube una 6ª Mayor.',
        m7: 'Bluesy y tenso — el intro de "Somewhere" de West Side Story.',
        M7: 'Muy disonante, choca casi con la octava — "Take On Me" de A-ha.',
        P8: 'Puro y estable — la misma nota una octava arriba, "Somewhere Over the Rainbow".',
    };
    const items = ALL_INTERVALS.map(iv => iv.id);
    const labels = Object.fromEntries(ALL_INTERVALS.map(iv => [iv.id, iv.name]));
    renderAdapPanel('intervalos', items, labels, INT_TIPS, 'intProgBars', 'intFocusHint', 3);
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
    updateIntProgress();
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
    updateIntProgress();
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

