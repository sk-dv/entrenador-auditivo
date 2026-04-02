import { initializeApp }          from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, GoogleAuthProvider,
         signInWithPopup, signOut,
         onAuthStateChanged }        from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, doc,
         getDoc, setDoc }            from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = window.FIREBASE_CONFIG;

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const CLAVE       = 'oido_armonico_v1';
const CLAVE_PROGS = 'oido_custom_progs_v1';
const CLAVE_SEQS  = 'oido_custom_seqs_v1';

// ─── Refs Firestore ───────────────────────────────────────────────
function progresoRef(uid) {
    return doc(db, 'usuarios', uid, 'progreso', 'datos');
}
function customRef(uid) {
    return doc(db, 'usuarios', uid, 'custom', 'datos');
}

// ─── Helpers de progreso ──────────────────────────────────────────
async function cargarDesdeFirestore(uid) {
    const snap = await getDoc(progresoRef(uid));
    return snap.exists() ? snap.data() : null;
}
async function guardarEnFirestore(uid, data) {
    await setDoc(progresoRef(uid), data);
}

// ─── Helpers de custom ────────────────────────────────────────────
async function cargarCustomDesdeFirestore(uid) {
    const snap = await getDoc(customRef(uid));
    return snap.exists() ? snap.data() : null;
}
async function guardarCustomEnFirestore(uid, progs, seqs) {
    await setDoc(customRef(uid), { progs, seqs });
}

// Une dos arrays por id; los ítems locales tienen precedencia en conflicto
function mergeById(local, remote) {
    const ids = new Set(local.map(x => x.id));
    return [...local, ...remote.filter(x => !ids.has(x.id))];
}

function leerCustomLocal() {
    let progs = [], seqs = [];
    try { progs = JSON.parse(localStorage.getItem(CLAVE_PROGS)) || []; } catch {}
    try { seqs  = JSON.parse(localStorage.getItem(CLAVE_SEQS))  || []; } catch {}
    return { progs, seqs };
}

// ─── Sync: Firestore → localStorage + refresca UI ─────────────────
async function syncToLocal(uid) {
    // ── Progreso ──────────────────────────────────────────────────
    const remoto = await cargarDesdeFirestore(uid);
    if (remoto) {
        let local = {};
        try { local = JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch {}
        const fusionado = { ...remoto };
        for (const k of Object.keys(local)) {
            if (Array.isArray(local[k]) && Array.isArray(remoto[k])) {
                fusionado[k] = local[k].length > remoto[k].length ? local[k] : remoto[k];
            }
        }
        localStorage.setItem(CLAVE, JSON.stringify(fusionado));
    }

    // ── Custom progs & seqs (merge bidireccional) ─────────────────
    // Al hacer login, lo que está en local se sube y lo remoto se baja.
    // Así nunca se pierde nada de ningún lado.
    const { progs: localProgs, seqs: localSeqs } = leerCustomLocal();
    const remotoCustom = await cargarCustomDesdeFirestore(uid);

    if (remotoCustom) {
        const mergedProgs = mergeById(localProgs, remotoCustom.progs || []);
        const mergedSeqs  = mergeById(localSeqs,  remotoCustom.seqs  || []);
        localStorage.setItem(CLAVE_PROGS, JSON.stringify(mergedProgs));
        localStorage.setItem(CLAVE_SEQS,  JSON.stringify(mergedSeqs));
        // Si lo local tenía ítems nuevos, subir la fusión al remoto también
        if (mergedProgs.length > (remotoCustom.progs || []).length ||
            mergedSeqs.length  > (remotoCustom.seqs  || []).length) {
            guardarCustomEnFirestore(uid, mergedProgs, mergedSeqs).catch(console.error);
        }
    } else if (localProgs.length > 0 || localSeqs.length > 0) {
        // Primera sesión con datos locales: subir todo sin perder nada
        guardarCustomEnFirestore(uid, localProgs, localSeqs).catch(console.error);
    }

    refrescarCustomUI();
    refrescarUI();
}

function refrescarUI() {
    ['initHistoriales', 'updateInvProgress', 'updatePosProgress',
     'updateGradosProgress', 'updateProgProgress', 'updateDictProgress'
    ].forEach(fn => { if (typeof window[fn] === 'function') window[fn](); });
}

function refrescarCustomUI() {
    if (typeof window.mergeCustomProgs     === 'function') window.mergeCustomProgs();
    if (typeof window.renderCustomProgList === 'function') window.renderCustomProgList();
    if (typeof window.renderCseqList       === 'function') window.renderCseqList();
}

// ─── API pública ──────────────────────────────────────────────────
window.FB = {
    /** Login con Google o cierra sesión si ya está autenticado */
    toggle() {
        if (auth.currentUser) return signOut(auth);
        return signInWithPopup(auth, new GoogleAuthProvider());
    },
    /** Sube datos de progreso a Firestore (fire-and-forget) */
    push(data) {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        guardarEnFirestore(uid, data).catch(console.error);
    },
    /** Sube progresiones y secuencias custom a Firestore (fire-and-forget).
     *  Se llama automáticamente al crear o borrar cualquier ítem custom. */
    pushCustom(progs, seqs) {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        guardarCustomEnFirestore(uid, progs, seqs).catch(console.error);
    },
    /** Sync manual: sube lo que hay en local a Firestore y muestra confirmación.
     *  Útil para forzar backup o recuperarse de un error de red. */
    syncCustomNow() {
        const uid = auth.currentUser?.uid;
        if (!uid) { mostrarToast('Iniciá sesión para sincronizar'); return; }
        const { progs, seqs } = leerCustomLocal();
        guardarCustomEnFirestore(uid, progs, seqs)
            .then(() => mostrarToast('Sincronizado ✓'))
            .catch(() => mostrarToast('Error al sincronizar'));
    }
};

// ─── Auth state ───────────────────────────────────────────────────
onAuthStateChanged(auth, async user => {
    const btn      = document.getElementById('authBtn');
    const nameEl   = document.getElementById('authUser');
    const avatarEl = document.getElementById('authAvatar');
    const syncBtn  = document.getElementById('syncCustomBtn');

    if (user) {
        if (btn)      btn.textContent        = 'Salir';
        if (nameEl)   nameEl.textContent     = user.displayName?.split(' ')[0] ?? '';
        if (avatarEl) avatarEl.src           = user.photoURL ?? '';
        if (avatarEl) avatarEl.style.display = 'inline';
        if (syncBtn)  syncBtn.style.display  = 'inline';
        await syncToLocal(user.uid);
    } else {
        if (btn)      btn.textContent        = 'Iniciar sesión';
        if (nameEl)   nameEl.textContent     = '';
        if (avatarEl) avatarEl.style.display = 'none';
        if (syncBtn)  syncBtn.style.display  = 'none';
    }
});

// ─── Toast ────────────────────────────────────────────────────────
function mostrarToast(msg) {
    let el = document.getElementById('fbToast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'fbToast';
        el.style.cssText = [
            'position:fixed', 'bottom:5rem', 'left:50%', 'transform:translateX(-50%)',
            'background:var(--ink)', 'color:var(--paper)',
            'font-family:IBM Plex Mono,monospace', 'font-size:0.65rem',
            'letter-spacing:0.08em', 'padding:0.5rem 1.1rem',
            'border-radius:3px', 'z-index:9999', 'pointer-events:none', 'transition:opacity 0.4s'
        ].join(';');
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = '0'; }, 2500);
}
