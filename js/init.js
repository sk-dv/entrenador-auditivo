// ─── INIT ─────────────────────────────────────────────────────────
// Se llama desde bootstrap.js una vez que los partials HTML ya fueron
// inyectados en el DOM (los partials traen los elementos que estas
// funciones consultan, por eso no se ejecuta al cargar el script).
function initApp() {
    initVolSlider();
    buildTiles();
    buildDegreeRef();
    buildFuncionTable();
    buildProgBtns();
    initCustomProgs();   // merge custom progs into PROGRESSIONS antes de buildProgRef
    buildProgRef();
    buildCompBtns();
    initDictado();
    initHistoriales();
    initCseq();
    initIntervalos();
    initNivelesBtns();
    // Cargar paneles adaptativos con datos existentes
    updateInvProgress();
    updatePosProgress();
    updateGradosProgress();
    updateProgresivoProg();
    updateProgProgress();
    updateFuncionProgress();
    updateCadenciaProgress();
    updateModalProgress();
    updateCompletarProgress();
    updateDictProgress();
}
