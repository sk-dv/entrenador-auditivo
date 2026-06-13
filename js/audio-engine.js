// ─── AUDIO ENGINE ─────────────────────────────────────────────────
// Motor de audio sobre superdough (Strudel, ESM/CDN). Reemplaza el
// sine + envelope manual conservando las firmas públicas que viven en
// js/audio.js (playNote, playChord, playMidiSequence, stopAllNodes,
// setMasterVolume).
//
// Control de master: tocamos el `destinationGain` interno de superdough
// (channelMerger → destinationGain → ac.destination). Es la única forma
// de que setMasterVolume y stopAllNodes afecten TODO el audio:
// connectToDestination(input) añade rutas paralelas, no redirige.

import {
    superdough,
    initAudioOnFirstClick,
    registerSynthSounds,
    getAudioContext,
    getSuperdoughAudioController,
} from 'https://esm.sh/superdough@1.3.0';

registerSynthSounds();
initAudioOnFirstClick();

let masterReady = false;
let masterGain = null;   // referencia al destinationGain interno

function readVolume() {
    return parseFloat(localStorage.getItem('oido_volume') ?? '0.8');
}

function ensureMaster() {
    if (masterReady) return;
    masterGain = getSuperdoughAudioController().output.destinationGain;
    masterGain.gain.value = readVolume();
    masterReady = true;
}

const engine = {
    note(midi, start, dur, gain = 0.12) {
        ensureMaster();
        superdough(
            {
                s: 'sine',
                note: midi,   // MIDI absoluto (60 = C4)
                gain,
                attack: 0.04,
                decay: 0.06,
                sustain: 1.0,
                release: 0.1,
            },
            start,
            dur,
        );
    },
    stop() {
        if (!masterReady) return;
        const ac = getAudioContext();
        const v = readVolume();
        masterGain.gain.cancelScheduledValues(ac.currentTime);
        masterGain.gain.setValueAtTime(0, ac.currentTime);
        masterGain.gain.linearRampToValueAtTime(v, ac.currentTime + 0.02);
    },
    setVolume(v) {
        if (!masterReady) return;
        const ac = getAudioContext();
        masterGain.gain.cancelScheduledValues(ac.currentTime);
        masterGain.gain.setValueAtTime(v, ac.currentTime);
    },
    context() {
        return getAudioContext();
    },
    resume() {
        const ac = getAudioContext();
        if (ac.state === 'suspended') ac.resume();
    },
};

window.__engine = engine;
window.dispatchEvent(new Event('audio-engine-ready'));
