// ─── TABLA DE FUNCIONES (Mayor + menor natural) ───────────────────
function buildFuncionTable() {
    const el = document.getElementById('tablaFuncionesGrid');
    if (!el) return;

    const SF_COL = {
        tonica_principal:      '#4caf7d',
        tonica_relativa:       '#6abfb0',
        mediador:              '#9b8ec4',
        subdominante_tonal:    '#d4aa3e',
        subdominante_modal:    '#c4886e',
        dominante_tonal:       '#e07a3a',
        dominante_modal:       '#c88850',
        dominante_modulatoria: '#c0392b',
    };

    const mayorDeg = [
        { num:'I',   sf:'tonica_principal',   label:'Tónica',       sub:'Principal' },
        { num:'II',  sf:'subdominante_modal',  label:'Subdominante', sub:'Modal (menor)' },
        { num:'III', sf:'mediador',            label:'Mediador',     sub:'(menor)' },
        { num:'IV',  sf:'subdominante_tonal',  label:'Subdominante', sub:'Tonal (Mayor)' },
        { num:'V',   sf:'dominante_tonal',     label:'Dominante',    sub:'Tonal (Mayor)' },
        { num:'VI',  sf:'tonica_relativa',     label:'Tónica',       sub:'Relativa (menor)' },
        { num:'VII', sf:'dominante_tonal',     label:'Sensible/',    sub:'Dominante (dim)' },
    ];

    const menorDeg = [
        { num:'i',   sf:'tonica_principal',      label:'Tónica',       sub:'(menor)' },
        { num:'II°', sf:'dominante_modulatoria', label:'Dom.',         sub:'Modulatoria (dim)' },
        { num:'III', sf:'tonica_relativa',       label:'Tónica',       sub:'Relativa (Mayor)' },
        { num:'iv',  sf:'subdominante_modal',    label:'Subdominante', sub:'modal (menor)' },
        { num:'v',   sf:'dominante_modal',       label:'Dominante',    sub:'modal (menor)' },
        { num:'VI',  sf:'subdominante_tonal',    label:'Subdominante', sub:'Tonal (Mayor)' },
        { num:'VII', sf:'mediador',              label:'Mediador',     sub:'(Mayor)' },
    ];

    const renderCell = (d) => {
        const col = SF_COL[d.sf] || '#999';
        const r = parseInt(col.slice(1,3),16), g = parseInt(col.slice(3,5),16), b = parseInt(col.slice(5,7),16);
        const bgAlpha = `rgba(${r},${g},${b},0.18)`;
        const borderCol = `rgba(${r},${g},${b},0.5)`;
        return `<td class="tf-cell" style="background:${bgAlpha};border-color:${borderCol}">
            <div class="tf-deg">${d.num}</div>
            <div class="tf-func">${d.label}</div>
            <div class="tf-sub">${d.sub}</div>
        </td>`;
    };

    el.innerHTML = `<table class="tabla-funciones">
        <thead>
            <tr>
                <th class="tf-mode-label"></th>
                ${['I','II','III','IV','V','VI','VII'].map(h => `<th class="tf-header">${h}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            <tr><td class="tf-mode-label">Mayor</td>${mayorDeg.map(renderCell).join('')}</tr>
            <tr><td class="tf-mode-label">menor nat.</td>${menorDeg.map(renderCell).join('')}</tr>
        </tbody>
    </table>`;
}

function toggleTablaFunciones() {
    const grid = document.getElementById('tablaFuncionesGrid');
    const btn  = document.getElementById('toggleTablaBtn');
    const hidden = grid.classList.toggle('ref-hidden');
    btn.textContent = hidden ? 'ver tabla de funciones ↓' : 'ocultar tabla ↑';
}

// ─── PROGRESIVO — EJERCICIO POR NIVELES ───────────────────────────
const PROG_NIVELES = [
    { num:1, label:'Nivel 1', grados:['I','V'],               desc:'I vs. V — máximo contraste',   hint:'Reposo absoluto vs. tensión máxima. Los dos polos.' },
    { num:2, label:'Nivel 2', grados:['I','IV','V'],           desc:'I · IV · V — el triángulo',    hint:'Las tres funciones esenciales de toda armonía tonal.' },
    { num:3, label:'Nivel 3', grados:['I','IV','V','VI'],      desc:'I · IV · V · VI',              hint:'Agrega la tónica relativa — el acorde oscuro y estable.' },
    { num:4, label:'Nivel 4', grados:['I','II','III','IV','V','VI'], desc:'Los 6 grados', hint:'El sistema completo — todos los matices diatónicos.' },
];

const CLAVE_PROG_NIVEL = 'oido_progresivo_nivel';
let progNivelMax    = 1;
let progNivelActual = 1;
let nivelesCurrentDeg = null;
let nivelesPhase      = 'idle';
let nivelesScores     = [0, 0];
let nivelesRoundNum   = 0;
let nivelesRepCount   = 0;
let nivelesHistory    = [];

function loadProgNivel() {
    try {
        const saved = parseInt(localStorage.getItem(CLAVE_PROG_NIVEL)) || 1;
        progNivelMax = Math.min(Math.max(1, saved), 4);
    } catch { progNivelMax = 1; }
    progNivelActual = progNivelMax;
}

function saveProgNivel(n) {
    localStorage.setItem(CLAVE_PROG_NIVEL, String(n));
}

function switchNivel(n) {
    if (n > progNivelMax) return;
    progNivelActual = n;
    nivelesPhase = 'idle';
    nivelesHistory = [];
    buildNivelesBtns();
    renderNivelInfo();
    updateProgresivoProg();
    document.getElementById('nivelesPlayHint').textContent = 'toca para escuchar un grado tonal';
    document.getElementById('nivelesRepeatBtn').disabled = true;
    document.getElementById('nivelesRevealPanel').classList.remove('visible');
    document.querySelectorAll('.nivel-btn').forEach((b, i) => {
        const num = i + 1;
        b.classList.toggle('n-active', num === n);
        b.classList.toggle('n-unlocked', num <= progNivelMax && num !== n);
        b.classList.toggle('n-locked', num > progNivelMax);
    });
}

function renderNivelInfo() {
    const nivel = PROG_NIVELES[progNivelActual - 1];
    const el = document.getElementById('nivelesInfo');
    if (!el) return;
    const nextUnlock = progNivelActual < 4
        ? `<span class="nivel-info-unlock">Desbloquea Nivel ${progNivelActual + 1} con ≥75% en las últimas 10 respuestas</span>`
        : `<span class="nivel-info-unlock" style="color:var(--correct)">Nivel máximo desbloqueado</span>`;
    el.innerHTML = `<div class="nivel-info-block">
        <span class="nivel-info-label">${nivel.label} — ${nivel.desc}</span>
        <span class="nivel-info-hint">${nivel.hint}</span>
        ${nextUnlock}
    </div>`;
}

function buildNivelesBtns() {
    const nivel = PROG_NIVELES[progNivelActual - 1];
    const container = document.getElementById('nivelesBtnGrid');
    if (!container) return;
    const activeDeg = DEGREES.filter(d => nivel.grados.includes(d.num));
    container.innerHTML = activeDeg.map(d =>
        `<button class="deg-btn" data-deg="${d.num}" style="--deg-color:${d.color}" onclick="answerNiveles('${d.num}')">
            <span class="deg-btn-num">${d.num}</span>
            <span class="deg-btn-chord">${d.chordName}</span>
            <span class="deg-btn-quality ${d.quality === 'mayor' ? 'dq-mayor' : 'dq-menor'}">${d.qualityLabel}</span>
        </button>`
    ).join('');
}

function initNivelesBtns() {
    loadProgNivel();
    buildNivelesBtns();
    renderNivelInfo();
    updateProgresivoProg();
    const hist = cargarProgreso()['progresivo'] || [];
    if (hist.length > 0) {
        nivelesScores[0] = hist.reduce((s, x) => s + x.c, 0);
        nivelesScores[1] = hist.reduce((s, x) => s + x.t, 0);
        nivelesRoundNum  = hist.length;
        document.getElementById('nivelesRound').textContent = '#' + nivelesRoundNum;
        document.getElementById('nivelesScore').textContent = nivelesScores[0] + '/' + nivelesScores[1];
    }
    renderHistorial('progresivo');
    renderRacha('progresivo');
    document.querySelectorAll('.nivel-btn').forEach((b, i) => {
        const num = i + 1;
        b.classList.toggle('n-active', num === progNivelActual);
        b.classList.toggle('n-unlocked', num <= progNivelMax && num !== progNivelActual);
        b.classList.toggle('n-locked', num > progNivelMax);
    });
}

function startNivelesRound() {
    hideFeedbackTip('nivelesFeedback');
    const nivel = PROG_NIVELES[progNivelActual - 1];
    const available = DEGREES.filter(d => nivel.grados.includes(d.num));
    nivelesCurrentDeg = weightedPick(adaptiveWeights(available, 'grados', d => d.num));
    nivelesRoundNum++;
    nivelesPhase  = 'answering';
    nivelesRepCount = 0;

    document.getElementById('nivelesPlayHint').textContent = 'escuchando…';
    document.getElementById('nivelesRepeatBtn').disabled = false;
    document.getElementById('nivelesRevealPanel').classList.remove('visible');
    document.querySelectorAll('#nivelesBtnGrid .deg-btn').forEach(b => {
        b.classList.remove('selected-correct', 'selected-wrong', 'reveal-correct');
        b.disabled = false;
    });
    document.getElementById('nivelesRound').textContent = '#' + nivelesRoundNum;
    const btn = document.getElementById('nivelesPlayBtn');
    btn.classList.add('ringing'); setTimeout(() => btn.classList.remove('ringing'), 400);

    const delay = playMode === 'arp' ? ARP_DELAYS[0] : 0;
    playDegreeContext(nivelesCurrentDeg, delay);
    setTimeout(() => {
        if (nivelesPhase === 'answering')
            document.getElementById('nivelesPlayHint').textContent = '¿qué grado tonal es?';
    }, 1800);
}

function repeatNiveles() {
    if (!nivelesCurrentDeg) return;
    nivelesRepCount++;
    const delay = playMode === 'arp' ? ARP_DELAYS[nivelesRepCount % ARP_DELAYS.length] : 0;
    playDegreeContext(nivelesCurrentDeg, delay);
    if (playMode === 'arp') {
        const looped = (nivelesRepCount % ARP_DELAYS.length) === 0;
        const tempo = TEMPO_NAMES[nivelesRepCount % TEMPO_NAMES.length];
        document.getElementById('nivelesPlayHint').textContent = looped ? 'arpegiado · allegro ↺' : `arpegiado · ${tempo}`;
    }
}

function answerNiveles(num) {
    if (nivelesPhase !== 'answering') return;
    nivelesPhase = 'done';
    const correct = num === nivelesCurrentDeg.num;
    nivelesScores[1]++;
    if (correct) nivelesScores[0]++;
    registrarDetalle('grados', nivelesCurrentDeg.num, correct);

    nivelesHistory.push(correct);
    if (nivelesHistory.length > 10) nivelesHistory.shift();

    document.querySelectorAll('#nivelesBtnGrid .deg-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.deg === nivelesCurrentDeg.num && !correct) b.classList.add('reveal-correct');
    });
    document.querySelector(`#nivelesBtnGrid .deg-btn[data-deg="${num}"]`)
        .classList.add(correct ? 'selected-correct' : 'selected-wrong');

    const d = nivelesCurrentDeg;
    if (!correct) {
        const answeredDeg = DEGREES.find(x => x.num === num);
        const tip = `Era ${d.num} — ${d.chordName}: ${d.feeling}` +
            (answeredDeg ? ` (confundiste con ${answeredDeg.num} — ${answeredDeg.chordName}: ${answeredDeg.feeling})` : '');
        showFeedbackTip('nivelesFeedback', tip);
    }
    document.getElementById('nivelesRevTitle').textContent   = `${d.num} — ${d.chordName}`;
    document.getElementById('nivelesRevQuality').textContent = d.subfuncionLabel;
    document.getElementById('nivelesRevQuality').className   = 'deg-rev-quality ' + (d.quality === 'mayor' ? 'dq-mayor' : 'dq-menor');
    document.getElementById('nivelesRevFeeling').textContent = d.feeling;
    document.getElementById('nivelesRevDesc').textContent    = d.desc;
    document.getElementById('nivelesRevMov').textContent     = `va a: ${d.movNatural.join(' → ')} — ${d.movNaturalDesc}`;
    document.getElementById('nivelesRevealPanel').classList.add('visible');
    document.getElementById('nivelesScore').textContent = `${nivelesScores[0]}/${nivelesScores[1]}`;

    const recentOk  = nivelesHistory.filter(Boolean).length;
    const recentTot = nivelesHistory.length;
    const recentPct = recentTot > 0 ? Math.round(recentOk / recentTot * 100) : 0;
    document.getElementById('nivelesRecent').textContent =
        recentTot < 10 ? `${recentTot}/10` : `${recentPct}%`;

    guardarRonda('progresivo', nivelesScores[0], nivelesScores[1]);
    updateProgresivoProg();
    renderHistorial('progresivo');
    checkNivelUnlock();
}

function checkNivelUnlock() {
    if (progNivelActual >= 4 || nivelesHistory.length < 10) return;
    const pct = nivelesHistory.filter(Boolean).length / nivelesHistory.length;
    if (pct >= 0.75 && progNivelActual >= progNivelMax) {
        progNivelMax = progNivelActual + 1;
        saveProgNivel(progNivelMax);
        showNivelUnlock(progNivelMax);
        renderNivelInfo();
        document.querySelectorAll('.nivel-btn').forEach((b, i) => {
            const num = i + 1;
            b.classList.toggle('n-locked', num > progNivelMax);
            b.classList.toggle('n-unlocked', num <= progNivelMax && num !== progNivelActual);
        });
    }
}

function showNivelUnlock(nivel) {
    const banner = document.getElementById('nivelesUnlockBanner');
    if (!banner) return;
    const niv = PROG_NIVELES[nivel - 1];
    banner.textContent = `¡Nivel ${nivel} desbloqueado! — ${niv.desc}`;
    banner.style.display = 'block';
    setTimeout(() => { banner.style.display = 'none'; }, 5000);
}

function updateProgresivoProg() {
    const nivel = PROG_NIVELES[progNivelActual - 1];
    const items  = nivel.grados;
    const labels = Object.fromEntries(DEGREES.filter(d => items.includes(d.num)).map(d => [d.num, `${d.num} — ${d.chordName}`]));
    const tips   = {
        I:   'Tónica principal — el hogar. Reposo absoluto.',
        II:  'Subdominante modal — movimiento suave. Va al V o al IV.',
        III: 'Mediador — puente ambiguo. Comparte notas con I y V.',
        IV:  'Subdominante tonal — salida cálida. Va al V (tensión) o al I (amén).',
        V:   'Dominante tonal — máxima tensión. El Si (sensible) pide resolver al Do.',
        VI:  'Tónica relativa — reposo oscuro. El lado melancólico del mayor.',
    };
    renderAdapPanel('grados', items, labels, tips, 'nivelesProgBars', 'nivelesFocusHint', 3);
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
    const sections = ['grados','progresivos','progresiones','funciones','cadencias','modalidad','completar'];
    const btnIds   = ['gmGrados','gmNiveles','gmProg','gmFunc','gmCad','gmModal','gmComp'];
    sections.forEach((s, i) => {
        document.getElementById(s + 'Section').style.display = mode === s ? '' : 'none';
        document.getElementById(btnIds[i]).classList.toggle('gm-active', mode === s);
    });
    if (mode === 'grados')      updateGradosProgress();
    if (mode === 'progresivos') updateProgresivoProg();
    if (mode === 'progresiones') updateProgProgress();
    if (mode === 'funciones')   updateFuncionProgress();
    if (mode === 'cadencias')   updateCadenciaProgress();
    if (mode === 'modalidad')   updateModalProgress();
    if (mode === 'completar')   updateCompletarProgress();
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

