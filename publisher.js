import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, set, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDdDnuUlqaHyMYc0vKOmjLFxFSTmWh3gIw",
  authDomain: "sample-firebase-ai-app-955f2.firebaseapp.com",
  databaseURL: "https://sample-firebase-ai-app-955f2-default-rtdb.firebaseio.com",
  projectId: "sample-firebase-ai-app-955f2",
  storageBucket: "sample-firebase-ai-app-955f2.firebasestorage.app",
  messagingSenderId: "310796131581",
  appId: "1:310796131581:web:8cb51b40c06bb83e94f294"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// UI Elements
const modal = document.getElementById("app-modal");
const openBtn = document.getElementById("open-app-modal");
const closeBtn = document.querySelector(".close");
const appForm = document.getElementById("add-app-form");
const exchangeBtn = document.getElementById('exchange-btn');

// Modal Logic
if (openBtn) openBtn.onclick = () => modal.style.display = "block";
if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

// Auth State
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userRef = ref(db, 'publishers/' + user.uid);
        update(userRef, { email: user.email.toLowerCase(), uid: user.uid });
        loadUserApps(user.uid);
        loadBalance(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

function loadBalance(uid) {
    onValue(ref(db, `publishers/${uid}/balance`), (snap) => {
        const balance = snap.val() || 0;
        document.getElementById('pub-balance').innerText = `$${balance.toFixed(4)}`;
    });
}

function loadUserApps(uid) {
    onValue(ref(db, 'publisher_apps'), (snapshot) => {
        const list = document.getElementById('apps-list');
        list.innerHTML = '';
        const data = snapshot.val();
        let count = 0;

        if (data) {
            for (let id in data) {
                if (data[id].ownerId === uid) {
                    count++;
                    const code = `<script type="module" src="https://adsero.vercel.app/sdk.js" data-app-id="${id}"></script>`;
                    list.innerHTML += `
                        <div class="app-card">
                            <h4>${data[id].name} <span class="id-badge">ID: ${id}</span></h4>
                            <p style="font-size:13px; color:#666;">Copy and paste this SDK into your HTML:</p>
                            <div class="sdk-box"><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></div>
                        </div>`;
                }
            }
        }
        if (count === 0) list.innerHTML = '<p>No projects found. Add your first app!</p>';
    });
}

appForm.onsubmit = (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const name = document.getElementById('app-name').value;
    const newRef = push(ref(db, 'publisher_apps'));
    set(newRef, { ownerId: user.uid, name: name, createdAt: Date.now() })
        .then(() => { modal.style.display = "none"; appForm.reset(); });
};

if (exchangeBtn) exchangeBtn.onclick = () => window.location.href = 'exchange.html';
document.getElementById('logout-btn').onclick = () => signOut(auth);