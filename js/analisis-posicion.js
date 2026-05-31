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

