// ─── GRADOS TONALES (en Do Mayor) ────────────────────────────────
// Los 6 acordes diatónicos de Do Mayor: I II III IV V VI
// Todos en posición fundamental, en registro medio
const DEGREES = [
    {
        num: 'I', name: 'Tónica', quality: 'mayor', funcion: 'tonica',
        subfuncion: 'tonica_principal', subfuncionLabel: 'Tónica Principal',
        movNatural: ['IV', 'V', 'VI'],
        movNaturalDesc: 'es el hogar — puede partir hacia cualquier función',
        chordName: 'Do Mayor', notes: ['Do', 'Mi', 'Sol'], midis: [60, 64, 67],
        feeling: '"Llegué. Reposo absoluto."',
        desc: 'La base de todo. El hogar tonal. Cualquier frase musical se siente completa cuando llega aquí.',
        color: '#4caf7d',
        prog: 'I → IV → V → I — la progresión más clásica',
        ref: '"Las Mañanitas" y "Cielito Lindo" terminan siempre en este acorde',
        qualityLabel: 'Mayor'
    },
    {
        num: 'II', name: 'Supertónica', quality: 'menor', funcion: 'subdominante',
        subfuncion: 'subdominante_modal', subfuncionLabel: 'Subdominante Modal',
        movNatural: ['V', 'IV'],
        movNaturalDesc: 'II → V → I es la cadencia del jazz y el bolero',
        chordName: 'Re menor', notes: ['Re', 'Fa', 'La'], midis: [62, 65, 69],
        feeling: '"Puente íntimo. Quiero moverme."',
        desc: 'Acorde menor sobre la segunda nota. Subdominante suave — sin el tritono del IV. Muy común en cadencias y en la progresión II-V-I.',
        color: '#c4886e',
        prog: 'I → II → V → I — cadencia con supertónica',
        ref: '"Cielito Lindo" pasa por el II en el verso · cadencia II-V-I muy usada en bolero',
        qualityLabel: 'menor'
    },
    {
        num: 'III', name: 'Mediante', quality: 'menor', funcion: 'tonica',
        subfuncion: 'mediador', subfuncionLabel: 'Mediador',
        movNatural: ['VI', 'IV'],
        movNaturalDesc: 'media entre tónica y dominante — comparte notas con I y V',
        chordName: 'Mi menor', notes: ['Mi', 'Sol', 'Si'], midis: [52, 55, 59],
        feeling: '"Íntimo. Un poco oscuro."',
        desc: 'Acorde menor sobre la tercera nota. Comparte dos notas con el I (Mi, Sol) y dos con el V (Sol, Si). Ambiguo y expresivo — puede ir al VI o al IV.',
        color: '#9b8ec4',
        prog: 'I → III → VI — movimiento hacia el relativo menor',
        ref: '"El Rey" (José Alfredo) — el III aparece en el puente antes del IV',
        qualityLabel: 'menor'
    },
    {
        num: 'IV', name: 'Subdominante', quality: 'mayor', funcion: 'subdominante',
        subfuncion: 'subdominante_tonal', subfuncionLabel: 'Subdominante Tonal',
        movNatural: ['V', 'I'],
        movNaturalDesc: 'IV → V (tensión creciente) o IV → I (cadencia plagal, el "amén")',
        chordName: 'Fa Mayor', notes: ['Fa', 'La', 'Do'], midis: [53, 57, 60],
        feeling: '"Me alejo del centro."',
        desc: 'Cálido y amplio. Subdominante fuerte — crea el tritono con el VII. Lleva al V con urgencia o regresa al I con calidez.',
        color: '#d4aa3e',
        prog: 'I → IV → V → I · I → IV → I (plagal "amén")',
        ref: '"La Bamba" — el IV es el segundo acorde de toda la canción',
        qualityLabel: 'Mayor'
    },
    {
        num: 'V', name: 'Dominante', quality: 'mayor', funcion: 'dominante',
        subfuncion: 'dominante_tonal', subfuncionLabel: 'Dominante Tonal',
        movNatural: ['I', 'VI'],
        movNaturalDesc: 'V → I (cadencia auténtica) o V → VI (cadencia rota — sorpresa)',
        chordName: 'Sol Mayor', notes: ['Sol', 'Si', 'Re'], midis: [55, 59, 62],
        feeling: '"Tengo que resolver. Ahora."',
        desc: 'La tensión más fuerte de la tonalidad. El Si (sensible) pide subir al Do. Dominante tonal — la gravedad de toda la armonía.',
        color: '#e07a3a',
        prog: 'V → I: cadencia auténtica, la más conclusiva',
        ref: '"Himno Nacional" — cada final de frase cae de V a I',
        qualityLabel: 'Mayor'
    },
    {
        num: 'VI', name: 'Superdominante', quality: 'menor', funcion: 'tonica',
        subfuncion: 'tonica_relativa', subfuncionLabel: 'Tónica Relativa',
        movNatural: ['IV', 'II'],
        movNaturalDesc: 'VI → IV → V → I — el camino de la "progresión del pop"',
        chordName: 'La menor', notes: ['La', 'Do', 'Mi'], midis: [57, 60, 64],
        feeling: '"Nostalgia. El lado oscuro."',
        desc: 'El relativo menor de Do. Reposo oscuro pero estable. Es la tónica del modo menor de la misma escala.',
        color: '#6abfb0',
        prog: 'I → V → VI → IV — la "progresión del pop"',
        ref: '"La Cucaracha" pasa por este acorde · "Bésame Mucho" lo usa como punto de partida',
        qualityLabel: 'menor'
    },
];

// ─── GRADOS EN LA MENOR NATURAL (referencia) ─────────────────────
// Solo para la tabla de funciones — no se quizzan
const DEGREES_MENOR = [
    { num:'i',   chordName:'La menor',  quality:'menor', subfuncion:'tonica_principal',      subfuncionLabel:'Tónica',                label:'Tónica',          sub:'(menor)',            color:'#4caf7d' },
    { num:'II°', chordName:'Si dim',    quality:'menor', subfuncion:'dominante_modulatoria', subfuncionLabel:'Dominante Modulatoria', label:'Dom. Modulatoria', sub:'(disminuido)',        color:'#c0392b' },
    { num:'III', chordName:'Do Mayor',  quality:'mayor', subfuncion:'tonica_relativa',       subfuncionLabel:'Tónica Relativa',       label:'Tónica',          sub:'Relativa (Mayor)',    color:'#6abfb0' },
    { num:'iv',  chordName:'Re menor',  quality:'menor', subfuncion:'subdominante_modal',    subfuncionLabel:'Subdominante Modal',    label:'Subdominante',    sub:'modal (menor)',       color:'#c4886e' },
    { num:'v',   chordName:'Mi menor',  quality:'menor', subfuncion:'dominante_modal',       subfuncionLabel:'Dominante Modal',       label:'Dominante',       sub:'modal (menor)',       color:'#c88850' },
    { num:'VI',  chordName:'Fa Mayor',  quality:'mayor', subfuncion:'subdominante_tonal',    subfuncionLabel:'Subdominante Tonal',    label:'Subdominante',    sub:'Tonal (Mayor)',       color:'#d4aa3e' },
    { num:'VII', chordName:'Sol Mayor', quality:'mayor', subfuncion:'mediador',              subfuncionLabel:'Mediador',              label:'Mediador',        sub:'(Mayor)',             color:'#9b8ec4' },
];

let currentDegree = null, degRound = 0;
let degScores = [0, 0];
let degPhase = 'idle';
let degRepeatCount = 0;

function buildDegreeRef() {
    document.getElementById('degRefGrid').innerHTML = DEGREES.map(d => `
<div class="deg-card" style="--deg-col:${d.color}">
    <div class="deg-num-badge" style="color:${d.color}">${d.num}</div>
    <div class="deg-chord-name">${d.chordName}</div>
    <div class="deg-quality-tag ${d.quality === 'mayor' ? 'dq-mayor' : 'dq-menor'}">${d.qualityLabel}</div>
    <div class="deg-subfuncion-chip">${d.subfuncionLabel}</div>
    <div class="deg-fn-name">${d.name}</div>
    <div class="deg-feeling">${d.feeling}</div>
    <div class="deg-notes-row">${d.notes.join(' · ')}</div>
    <div class="deg-prog-hint">${d.prog}</div>
    <div class="deg-mov-hint">→ ${d.movNatural.join(', ')}: ${d.movNaturalDesc}</div>
    <div class="deg-ref-song">${d.ref}</div>
</div>`).join('');

    document.getElementById('degBtnGrid').innerHTML = DEGREES.map(d =>
        `<button class="deg-btn" data-deg="${d.num}" style="--deg-color:${d.color}" onclick="answerDegree('${d.num}')">
    <span class="deg-btn-num">${d.num}</span>
    <span class="deg-btn-chord">${d.chordName}</span>
    <span class="deg-btn-quality ${d.quality === 'mayor' ? 'dq-mayor' : 'dq-menor'}">${d.qualityLabel}</span>
</button>`
    ).join('');
}

// El contexto tonal: Do Mayor arpegiado suave, luego el acorde misterio
function playDegreeContext(degData, arpInterval) {
    stopAllNodes();
    const now = ctx().currentTime + 0.05;
    const step = 0.13;
    // Contexto Do-Mi-Sol (gain más bajo para distinguirlo del acorde misterio)
    [60, 64, 67].forEach((m, i) => playNote(m, now + i * step, 0.95, 0.10));
    // Pausa + acorde misterio (más fuerte para destacar)
    const offset = now + 3 * step + 0.55;
    degData.midis.forEach((m, i) =>
        playNote(m, offset + (arpInterval ? i * arpInterval : 0), 2.2, 0.07)
    );
}

function startDegreeRound() {
    hideFeedbackTip('gradFeedback');
    currentDegree = pickAdaptiveDegree(); degRound++; degPhase = 'answering';
    degRepeatCount = 0;
    document.getElementById('degPlayHint').textContent = 'escuchando…';
    document.getElementById('degRepeatBtn').disabled = false;
    document.getElementById('degRevealPanel').classList.remove('visible');
    document.querySelectorAll('.deg-btn').forEach(b => {
        b.classList.remove('selected-correct', 'selected-wrong', 'reveal-correct');
        b.disabled = false;
    });
    document.getElementById('degRound').textContent = '#' + degRound;
    const btn = document.getElementById('degPlayBtn');
    btn.classList.add('ringing'); setTimeout(() => btn.classList.remove('ringing'), 400);

    const delay = playMode === 'arp' ? ARP_DELAYS[0] : 0;
    playDegreeContext(currentDegree, delay);

    setTimeout(() => {
        if (degPhase === 'answering')
            document.getElementById('degPlayHint').textContent = '¿qué grado tonal es?';
    }, 1800);
}

function repeatDegree() {
    if (!currentDegree) return;
    degRepeatCount++;
    const delay = playMode === 'arp' ? ARP_DELAYS[degRepeatCount % ARP_DELAYS.length] : 0;
    playDegreeContext(currentDegree, delay);
    if (playMode === 'arp') {
        const looped = (degRepeatCount % ARP_DELAYS.length) === 0;
        const tempo = TEMPO_NAMES[degRepeatCount % TEMPO_NAMES.length];
        document.getElementById('degPlayHint').textContent = looped ? 'arpegiado · allegro ↺' : `arpegiado · ${tempo}`;
    }
}

function answerDegree(num) {
    if (degPhase !== 'answering') return;
    degPhase = 'done';
    const correct = num === currentDegree.num;
    degScores[1]++;
    if (correct) degScores[0]++;
    registrarDetalle('grados', currentDegree.num, correct);

    document.querySelectorAll('.deg-btn').forEach(b => {
        b.disabled = true;
        if (b.dataset.deg === currentDegree.num && !correct) b.classList.add('reveal-correct');
    });
    document.querySelector(`.deg-btn[data-deg="${num}"]`).classList.add(correct ? 'selected-correct' : 'selected-wrong');

    const d = currentDegree;
    if (!correct) {
        const answeredDeg = DEGREES.find(x => x.num === num);
        const tip = `Era ${d.num} — ${d.chordName}: ${d.feeling}` +
            (answeredDeg ? ` (confundiste con ${answeredDeg.num} — ${answeredDeg.chordName}: ${answeredDeg.feeling})` : '');
        showFeedbackTip('gradFeedback', tip);
    }
    document.getElementById('degRevTitle').textContent = `${d.num} — ${d.chordName}`;
    document.getElementById('degRevQuality').textContent = d.subfuncionLabel;
    document.getElementById('degRevQuality').className = 'deg-rev-quality ' + (d.quality === 'mayor' ? 'dq-mayor' : 'dq-menor');
    document.getElementById('degRevFeeling').textContent = d.feeling;
    document.getElementById('degRevDesc').textContent = d.desc;
    document.getElementById('degRevProg').textContent = d.prog;
    document.getElementById('degRevMov').textContent = `va naturalmente a: ${d.movNatural.join(' → ')} — ${d.movNaturalDesc}`;
    document.getElementById('degRevealPanel').classList.add('visible');
    document.getElementById('degScore').textContent = `${degScores[0]}/${degScores[1]}`;
    guardarRonda('grados', degScores[0], degScores[1]);
    updateGradosProgress(); renderHistorial('grados');
}

// ─── PROGRESIONES ────────────────────────────────────────────────
const PROGRESSIONS = [
    // 2-chord cadences
    { id:'aut2', name:'Cadencia Auténtica', chords:['V','I'],
      feeling:'Resolución absoluta · cierre definitivo',
      desc:'La cadencia más conclusiva de la armonía tonal. El V resuelve al I — la tensión más fuerte se libera de golpe.',
      songs:['"Himno Nacional" — cierre de cada frase', '"Las Mañanitas" — nota final'],
      color:'#e07a3a', weight:5 },
    { id:'plag2', name:'Cadencia Plagal', chords:['IV','I'],
      feeling:'Cálida · suave · "amén"',
      desc:'El cierre meditativo y cálido. Menos urgente que la auténtica — típica de himnos y cierres litúrgicos.',
      songs:['"Amén" en himnos religiosos', '"La Bamba" — reposo final'],
      color:'#d4aa3e', weight:4 },
    { id:'semi2', name:'Semicadencia', chords:['I','V'],
      feeling:'Suspendida · pregunta sin respuesta',
      desc:'Termina en el V — queda flotando. Es como una pregunta musical. La frase pide continuación.',
      songs:['"Las Mañanitas" — la primera frase termina aquí'],
      color:'#7eb8d4', weight:4 },
    { id:'rota2', name:'Cadencia Rota', chords:['V','VI'],
      feeling:'Sorpresa · evasión · continúa',
      desc:'Esperabas el I pero llegó el VI menor. El compositor evade la resolución — la música quiere seguir.',
      songs:['"Bésame Mucho" — el giro dramático del verso'],
      color:'#9b8ec4', weight:3 },
    // 3-chord
    { id:'cad3', name:'Cadencia Completa', chords:['IV','V','I'],
      feeling:'Conclusiva · preparada · clásica',
      desc:'La cadencia auténtica precedida por la subdominante. Fórmula clásica al cerrar frases musicales.',
      songs:['"Himno Nacional" — cada cierre de verso', '"Cielito Lindo" — al final'],
      color:'#e07a3a', weight:5 },
    { id:'tens3', name:'Tensión Progresiva', chords:['I','IV','V'],
      feeling:'Ascendente · con dirección · incompleta',
      desc:'Sale de la tónica, avanza al IV y llega al V. Pide resolver al I — la progresión que empuja hacia adelante.',
      songs:['"La Bamba" — primera mitad del ciclo'],
      color:'#4caf7d', weight:4 },
    { id:'rel3', name:'Con el Relativo', chords:['I','VI','V'],
      feeling:'Con sombra · hacia la tensión',
      desc:'Pasa por el relativo menor antes de llegar al dominante. Le da un tono más expresivo y dramático.',
      songs:['"Bésame Mucho" — inicio del verso'],
      color:'#6abfb0', weight:3 },
    { id:'iv6v3', name:'Subdominante a Dominante', chords:['VI','IV','V'],
      feeling:'Oscura · creciente · incompleta',
      desc:'Empieza desde el relativo menor, pasa por el IV cálido y llega al V tenso. Pide resolver al I.',
      songs:['"La Llorona" (sección)'],
      color:'#9b8ec4', weight:3 },
    // 4-chord
    { id:'basic4', name:'La Básica', chords:['I','IV','V','I'],
      feeling:'Directa · completa · reposada',
      desc:'La progresión más fundamental de la música tonal. Sale de casa, avanza, crea tensión y regresa. El ciclo perfecto.',
      songs:['"La Bamba"', '"Guantanamera"', 'Blues en mayor'],
      color:'#4caf7d', weight:5 },
    { id:'pop4', name:'La del Pop', chords:['I','V','VI','IV'],
      feeling:'Emotiva · épica · universal',
      desc:'La progresión más grabada del pop moderno. El VI da el giro emocional antes de caer al IV cálido.',
      songs:['"No Woman No Cry" (Bob Marley)', '"Vivir mi Vida" (Marc Anthony)', '"Let It Be" (Beatles)'],
      color:'#e07a3a', weight:5 },
    { id:'bolero4', name:'La del Bolero', chords:['I','VI','IV','V'],
      feeling:'Nostálgica · romántica · circular',
      desc:'El sonido del bolero latinoamericano y el rock de los 50. El VI menor da el toque de nostalgia característico.',
      songs:['"El Reloj" (Los Panchos)', '"Bésame Mucho"', '"Stand By Me"'],
      color:'#6abfb0', weight:4 },
    { id:'desc4', name:'Con el Mediante', chords:['I','III','IV','V'],
      feeling:'Expresiva · colorida · ascendente',
      desc:'El III menor da un color íntimo y oscuro antes de abrirse al IV y tensionarse en el V.',
      songs:['"El Rey" (José Alfredo Jiménez) — puente', 'Corrido tradicional'],
      color:'#9b8ec4', weight:3 },
    { id:'dark4', name:'Empieza Oscuro', chords:['VI','IV','I','V'],
      feeling:'Oscura · ascendente · emotiva',
      desc:'Comienza desde el relativo menor, avanza hacia la luminosidad del I y se tensiona con el V. Circular y emotiva.',
      songs:['"La Llorona" (variante)', '"Oye Como Va" (Santana) — sección'],
      color:'#9b8ec4', weight:3 },
    // Circulares — empiezan y terminan en I
    { id:'circ3a', name:'Ida y Vuelta', chords:['I','V','I'],
      feeling:'Breve · conclusiva · afirmativa',
      desc:'La resolución más directa: tensión dominante que regresa a casa. Base de infinitas canciones tradicionales.',
      songs:['"Las Mañanitas" — célula final', '"Cielito Lindo" — cierre de copla'],
      color:'#4caf7d', weight:3 },
    { id:'circ3b', name:'El Abrazo Plagal', chords:['I','IV','I'],
      feeling:'Cálida · reposada · litúrgica',
      desc:'Sale a la subdominante y regresa suavemente. El "amén" completo: apertura y cierre en la tónica.',
      songs:['"Amén" tradicional', '"Alabaré" — estribillo'],
      color:'#d4aa3e', weight:3 },
    { id:'circ4a', name:'El Ciclo Completo', chords:['I','VI','IV','I'],
      feeling:'Nostálgica · circular · reposada',
      desc:'Gira por el relativo menor y la subdominante antes de regresar al reposo. El ciclo melancólico cerrado.',
      songs:['"El Reloj" — verso completo', '"Sabor a Mí" — cierre de frase'],
      color:'#6abfb0', weight:4 },
    { id:'circ5a', name:'La Romantica', chords:['I','VI','IV','V','I'],
      feeling:'Romántica · completa · bolero clásico',
      desc:'El arco completo del bolero: parte de la tónica, pasa por nostalgia y calidez, genera tensión y resuelve. Ciclo redondo.',
      songs:['"Bésame Mucho" — ciclo completo', '"Sabor a Mí"', '"Perfidia"'],
      color:'#e07a3a', weight:4 },
    { id:'circ5b', name:'Con Mediante', chords:['I','III','IV','V','I'],
      feeling:'Expresiva · colorida · cerrada',
      desc:'El III menor da profundidad antes de abrirse al IV y tensionarse en el V — el arco completo con color extra.',
      songs:['"El Rey" (José Alfredo) — frase completa', 'Corrido ranchero'],
      color:'#9b8ec4', weight:3 },
];

// ─── CADENCIAS ────────────────────────────────────────────────────
// midisSeq: array de arrays MIDI — permite inversiones sin tocar DEGREES
const CADENCE_TYPES = [
    { id: 'aut_perf', name: 'Auténtica Perfecta', short: 'V → I',
      chords: ['V','I'],
      midisSeq: [[55,59,62],[60,64,67]],   // V fund → I fund
      feeling: 'Cierre total · resolución absoluta',
      desc: 'El V (Sol) en estado fundamental resuelve al I (Do) también en fundamental. El Si (sensible) asciende al Do. El cierre más sólido de la armonía tonal.',
      songs: ['"Himno Nacional" — cierre de cada frase', '"Las Mañanitas" — nota final'],
      weight: 4 },
    { id: 'aut_imp', name: 'Auténtica Imperfecta', short: 'V → I⁶',
      chords: ['V','I⁶'],
      midisSeq: [[55,59,62],[64,67,72]],   // V fund → I en 1ª inversión (Mi en el bajo)
      feeling: 'Resolución abierta · punto y seguido',
      desc: 'El V resuelve al I, pero el I está en primera inversión (Mi en el bajo). Hay resolución, pero la frase queda abierta — como un punto y seguido, no un punto final.',
      songs: ['"Cielito Lindo" — cierre interno de frase'],
      weight: 3 },
    { id: 'plagal', name: 'Plagal', short: 'IV → I',
      chords: ['IV','I'],
      midisSeq: [[53,57,60],[60,64,67]],
      feeling: 'Cálida · suave · "amén"',
      desc: 'El IV (Fa) cede al I (Do) sin pasar por el V. Más suave que la auténtica. El reposo litúrgico — el "amén" al final del himno.',
      songs: ['"Amén" en himnos religiosos', '"La Bamba" — reposo final'],
      weight: 3 },
    { id: 'rota', name: 'Rota / Evitada', short: 'V → VI',
      chords: ['V','VI'],
      midisSeq: [[55,59,62],[57,60,64]],
      feeling: 'Sorpresa · engaño · continúa',
      desc: 'Esperabas el I pero llegó el VI menor. El dominante elude la resolución — la música decide seguir narrando. También llamada "cadencia de engaño".',
      songs: ['"Bésame Mucho" — el giro dramático del verso'],
      weight: 3 },
    { id: 'semi', name: 'Semicadencia', short: 'X → V',
      chords: ['I','V'],
      midisSeq: [[60,64,67],[55,59,62]],
      feeling: 'Suspendida · pregunta sin respuesta',
      desc: 'Termina en el V — queda flotando. La mitad de una cadencia: la pregunta que espera su respuesta. Típica al final de la primera frase de una pieza.',
      songs: ['"Las Mañanitas" — la primera frase termina aquí', '"Cielito Lindo" — primer corte'],
      weight: 3 },
];

// ─── PROGRESIONES MODALES VS TONALES ──────────────────────────────
const MODAL_PROGS = [
    // TONAL — tensión-resolución clara, sensible o función de dominante
    { id: 'ton_v_i',  isModal: false,
      chords: ['V','I'],   midisSeq: [[55,59,62],[60,64,67]],
      answer: 'tonal',
      desc: 'Sol Mayor → Do Mayor: el Si (sensible) "tira" hacia el Do. Resolución obligada.',
      why: 'La sensible (Si→Do) y la quinta del V crean la gravedad tonal clásica.' },
    { id: 'ton_iv_i', isModal: false,
      chords: ['IV','I'],  midisSeq: [[53,57,60],[60,64,67]],
      answer: 'tonal',
      desc: 'Fa Mayor → Do Mayor: el IV cede al I. Cadencia plagal — el "amén" del sistema tonal.',
      why: 'El Fa del IV resuelve hacia el Mi del I por semitono descendente.' },
    { id: 'ton_ii_v', isModal: false,
      chords: ['II','V'],  midisSeq: [[62,65,69],[55,59,62]],
      answer: 'tonal',
      desc: 'Re menor → Sol Mayor: pre-dominante al dominante. La jerarquía tonal en acción.',
      why: 'El Re m "empuja" hacia el Sol M. Movimiento con función y dirección obligada.' },
    { id: 'ton_iv_v', isModal: false,
      chords: ['IV','V'],  midisSeq: [[53,57,60],[55,59,62]],
      answer: 'tonal',
      desc: 'Fa Mayor → Sol Mayor: subdominante al dominante. Tensión creciente que pide resolución al I.',
      why: 'La dirección IV→V→(I) es de las más fuertes de la armonía tonal.' },
    // MODAL — movimiento libre, sin polo de atracción ni sensible
    { id: 'mod_ii_vi', isModal: true,
      chords: ['II','VI'], midisSeq: [[62,65,69],[57,60,64]],
      answer: 'modal',
      desc: 'Re menor → La menor: dos acordes menores sin urgencia entre sí. El movimiento es libre.',
      why: 'Sin sensible, sin función de dominante — ninguno "tira" del otro con obligación.' },
    { id: 'mod_vi_iv', isModal: true,
      chords: ['VI','IV'], midisSeq: [[57,60,64],[53,57,60]],
      answer: 'modal',
      desc: 'La menor → Fa Mayor: cambio de color, no de función. Ninguno demanda resolución.',
      why: 'La menor no tiene función de dominante sobre Fa Mayor. Solo movimiento de color.' },
    { id: 'mod_iv_iii', isModal: true,
      chords: ['IV','III'], midisSeq: [[53,57,60],[52,55,59]],
      answer: 'modal',
      desc: 'Fa Mayor → Mi menor: descenso libre. El Mi m no tiene función de dominante.',
      why: 'El Mi menor nunca actúa como dominante en este contexto. Movimiento modal descendente.' },
    { id: 'mod_vi_ii', isModal: true,
      chords: ['VI','II'], midisSeq: [[57,60,64],[62,65,69]],
      answer: 'modal',
      desc: 'La menor → Re menor: movimiento entre dos acordes menores. El oído no siente gravedad.',
      why: 'Ambos menores, sin sensible ni función de dominante entre ellos.' },
];

// ─── AUDIO — MIDI SEQUENCE ────────────────────────────────────────
// Toca un array de arrays MIDI (permite acordes en inversión sin depender de DEGREES)
function playMidiSequence(midisArray, arpInterval) {
    stopAllNodes();
    const a = ctx(), now = a.currentTime + 0.05;
    let offset = 0;
    midisArray.forEach(chordMidis => {
        const noteCount = chordMidis.length;
        const chordSpread = arpInterval ? noteCount * arpInterval : 0;
        chordMidis.forEach((m, i) =>
            playNote(m, now + offset + (arpInterval ? i * arpInterval : 0), 1.7, 0.07)
        );
        offset += (arpInterval ? chordSpread + 0.5 : 0) + 2.1;
    });
}

function weightedRand(arr) {
    const total = arr.reduce((sum, x) => sum + x.weight, 0);
    let r = Math.random() * total;
    for (const x of arr) { r -= x.weight; if (r <= 0) return x; }
    return arr[arr.length - 1];
}

