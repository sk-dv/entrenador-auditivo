// ─── BANCO DE SECUENCIAS PROPIAS ──────────────────────────────────
const CLAVE_CUSTOM_SEQS = 'oido_custom_seqs_v1';
const CSEQ_MAX = 10;

const CSEQ_LABEL = { fundamental: 'Fund.', primera: '1ª Inv.', segunda: '2ª Inv.' };
const CSEQ_CHIP_CLASS = { fundamental: 'cseq-chip-fund', primera: 'cseq-chip-inv1', segunda: 'cseq-chip-inv2' };
const CSEQ_QUALITY_LABEL = { ambos: 'Mayor y menor', mayor: 'Solo mayor', menor: 'Solo menor' };

let cseqBuilder = [];       // posiciones del builder actual
let cseqBuilderQuality = 'ambos';
let seqCustomPositions = null;  // null → adaptativo, array → secuencia fija
let seqCustomQuality   = null;

function cargarCustomSeqs() {
    try { return JSON.parse(localStorage.getItem(CLAVE_CUSTOM_SEQS)) || []; }
    catch { return []; }
}

function setCseqQuality(q, btn) {
    cseqBuilderQuality = q;
    document.querySelectorAll('.cseq-q-btn').forEach(b => b.classList.remove('cq-active'));
    btn.classList.add('cq-active');
}

function cseqAdd(type) {
    if (cseqBuilder.length >= CSEQ_MAX) return;
    cseqBuilder.push(type);
    renderCseqPreview();
}

function cseqRemoveLast() {
    cseqBuilder.pop();
    renderCseqPreview();
}

function renderCseqPreview() {
    const prev = document.getElementById('cseqPreview');
    const count = document.getElementById('cseqCount');
    const saveBtn = document.getElementById('cseqSaveBtn');
    if (prev) prev.innerHTML = cseqBuilder.length === 0
        ? '—'
        : cseqBuilder.map(t =>
            `<span class="cseq-chip ${CSEQ_CHIP_CLASS[t]}">${CSEQ_LABEL[t]}</span>`
          ).join('');
    if (count) count.textContent = cseqBuilder.length + '/' + CSEQ_MAX;
    if (saveBtn) saveBtn.disabled = cseqBuilder.length < 2;
}

function cseqChipsHtml(positions) {
    return positions.map(t =>
        `<span class="cseq-chip ${CSEQ_CHIP_CLASS[t]}">${CSEQ_LABEL[t]}</span>`
    ).join('');
}

function cseqSubmit() {
    const nameEl = document.getElementById('cseqName');
    const name = nameEl ? nameEl.value.trim() : '';
    if (!name || cseqBuilder.length < 2) return;
    const seqs = cargarCustomSeqs();
    seqs.push({
        id: 'cseq_' + Date.now(),
        name,
        quality: cseqBuilderQuality,
        positions: [...cseqBuilder]
    });
    localStorage.setItem(CLAVE_CUSTOM_SEQS, JSON.stringify(seqs));
    if (window.FB) window.FB.pushCustom(cargarCustomProgs(), seqs);
    cseqBuilder = [];
    if (nameEl) nameEl.value = '';
    renderCseqPreview();
    renderCseqList();
}

function deleteCseq(id) {
    const seqs = cargarCustomSeqs().filter(s => s.id !== id);
    localStorage.setItem(CLAVE_CUSTOM_SEQS, JSON.stringify(seqs));
    if (window.FB) window.FB.pushCustom(cargarCustomProgs(), seqs);
    renderCseqList();
}

function playCseq(id) {
    const seq = cargarCustomSeqs().find(s => s.id === id);
    if (!seq) return;
    // Configurar calidad y posiciones fijas, luego iniciar ronda
    seqCustomPositions = seq.positions;
    seqCustomQuality   = seq.quality;
    // Sincronizar botones de calidad visualmente
    const qMap = { ambos: 0, mayor: 1, menor: 2 };
    document.querySelectorAll('.seq-quality-btn').forEach((b, i) => {
        b.classList.toggle('sq-active', i === (qMap[seq.quality] ?? 0));
    });
    seqQuality = seq.quality;
    // Scroll al play button y empezar
    document.getElementById('seqPlayBtn').scrollIntoView({ behavior: 'smooth', block: 'center' });
    startSeqRound();
}

function renderCseqList() {
    const container = document.getElementById('cseqList');
    if (!container) return;
    const seqs = cargarCustomSeqs();
    if (seqs.length === 0) {
        container.innerHTML = '<span class="custom-prog-empty">sin secuencias guardadas</span>';
        return;
    }
    container.innerHTML = seqs.map(s => `
        <div class="cseq-item">
            <div class="cseq-item-info">
                <span class="cseq-item-name">${s.name}</span>
                <span class="cseq-item-quality">${CSEQ_QUALITY_LABEL[s.quality] || s.quality} · ${s.positions.length} acordes</span>
                <div class="cseq-item-chips">${cseqChipsHtml(s.positions)}</div>
            </div>
            <div class="cseq-item-actions">
                <button class="cseq-play-btn" onclick="playCseq('${s.id}')">▶ tocar</button>
                <button class="cseq-del-btn" onclick="deleteCseq('${s.id}')">✕</button>
            </div>
        </div>`
    ).join('');
}

function initCseq() {
    renderCseqPreview();
    renderCseqList();
}

