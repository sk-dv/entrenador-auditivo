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

