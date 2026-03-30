import { initializeApp }          from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, GoogleAuthProvider,
         signInWithRedirect, getRedirectResult, signOut,
         onAuthStateChanged }        from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, doc,
         getDoc, setDoc }            from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = window.FIREBASE_CONFIG;

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const CLAVE = 'oido_armonico_v1';

// Procesa el resultado del redirect de Google al volver a la página
getRedirectResult(auth).catch(console.error);

// ─── Helpers Firestore ────────────────────────────────────────────
async function progresoRef(uid) {
    return doc(db, 'usuarios', uid, 'progreso', 'datos');
}

async function cargarDesdeFirestore(uid) {
    const snap = await getDoc(await progresoRef(uid));
    return snap.exists() ? snap.data() : null;
}

async function guardarEnFirestore(uid, data) {
    await setDoc(await progresoRef(uid), data);
}

// ─── Sync: Firestore → localStorage + refresca UI ─────────────────
async function syncToLocal(uid) {
    const remoto = await cargarDesdeFirestore(uid);
    if (!remoto) return;

    // Fusión conservadora: por cada módulo toma el historial más largo
    let local = {};
    try { local = JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch {}
    const fusionado = { ...remoto };
    for (const k of Object.keys(local)) {
        if (Array.isArray(local[k]) && Array.isArray(remoto[k])) {
            fusionado[k] = local[k].length > remoto[k].length ? local[k] : remoto[k];
        }
    }

    localStorage.setItem(CLAVE, JSON.stringify(fusionado));
    refrescarUI();
}

function refrescarUI() {
    ['initHistoriales', 'updateInvProgress', 'updatePosProgress',
     'updateGradosProgress', 'updateProgProgress', 'updateDictProgress'
    ].forEach(fn => { if (typeof window[fn] === 'function') window[fn](); });
}

// ─── API pública ──────────────────────────────────────────────────
window.FB = {
    /** Login con Google o cierra sesión si ya está autenticado */
    toggle() {
        if (auth.currentUser) return signOut(auth);
        return signInWithRedirect(auth, new GoogleAuthProvider());
    },
    /** Sube los datos de progreso a Firestore (fire-and-forget) */
    push(data) {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        guardarEnFirestore(uid, data).catch(console.error);
    }
};

// ─── Auth state ───────────────────────────────────────────────────
onAuthStateChanged(auth, async user => {
    const btn      = document.getElementById('authBtn');
    const nameEl   = document.getElementById('authUser');
    const avatarEl = document.getElementById('authAvatar');

    if (user) {
        if (btn)      btn.textContent       = 'Salir';
        if (nameEl)   nameEl.textContent    = user.displayName?.split(' ')[0] ?? '';
        if (avatarEl) avatarEl.src          = user.photoURL ?? '';
        if (avatarEl) avatarEl.style.display = 'inline';
        await syncToLocal(user.uid);
    } else {
        if (btn)      btn.textContent        = 'Iniciar sesión';
        if (nameEl)   nameEl.textContent     = '';
        if (avatarEl) avatarEl.style.display = 'none';
    }
});
