// ─── TAB ─────────────────────────────────────────────────────────
function switchTab(name) {
    ['aprender', 'explorar', 'practicar', 'grados', 'dictado', 'intervalos'].forEach((n, i) => {
        document.querySelectorAll('.tab-btn')[i].classList.toggle('active', n === name);
        document.getElementById('tab-' + n).classList.toggle('active', n === name);
    });
    if (name === 'practicar') { updateInvProgress(); updatePosProgress(); }
    if (name === 'grados')    { updateProgresivoProg(); updateGradosProgress(); updateProgProgress(); updateFuncionProgress(); updateCadenciaProgress(); updateModalProgress(); updateCompletarProgress(); }
    if (name === 'dictado')   { updateDictProgress(); }
    if (name === 'intervalos') { updateIntProgress(); }
}

// ─── AUDIO ───────────────────────────────────────────────────────
// Capa fina sobre window.__engine (js/audio-engine.js, type=module).
// Firmas públicas conservadas: playNote, playChord, playMidiSequence,
// stopAllNodes, setMasterVolume, mfreq, ctx.
let userVolume = parseFloat(localStorage.getItem('oido_volume') ?? '0.8');

function ctx()       { return window.__engine.context(); }
function mfreq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

function stopAllNodes()      { window.__engine && window.__engine.stop(); }

function setMasterVolume(val) {
    userVolume = parseFloat(val);
    localStorage.setItem('oido_volume', userVolume);
    window.__engine && window.__engine.setVolume(userVolume);
    document.getElementById('volValue').textContent = Math.round(userVolume * 100) + '%';
}

function initVolSlider() {
    const slider = document.getElementById('volSlider');
    if (!slider) return;
    slider.value = userVolume;
    document.getElementById('volValue').textContent = Math.round(userVolume * 100) + '%';
}

function playNote(midi, start, dur, gain = 0.12) {
    window.__engine.note(midi, start, dur, gain);
}

// arpInterval = 0 → simultáneo; > 0 → tiempo entre notas (arpegio)
function playChord(midis, arpInterval) {
    stopAllNodes();
    const now = ctx().currentTime + 0.05;
    midis.forEach((m, i) => playNote(m, now + (arpInterval ? i * arpInterval : 0), 1.8));
}
