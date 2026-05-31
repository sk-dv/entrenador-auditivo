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

