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

