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
    if (window.FB) window.FB.pushCustom(progs, cargarCustomSeqs());
    mergeCustomProgs();
    buildProgRef();
    renderCustomProgList();
}

function deleteCustomProg(id) {
    const progs = cargarCustomProgs().filter(p => p.id !== id);
    localStorage.setItem(CLAVE_CUSTOM_PROGS, JSON.stringify(progs));
    if (window.FB) window.FB.pushCustom(progs, cargarCustomSeqs());
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

