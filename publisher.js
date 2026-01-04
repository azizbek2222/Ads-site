import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, set, onValue, update, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

const modal = document.getElementById("app-modal");
const openBtn = document.getElementById("open-app-modal");
const closeBtn = document.getElementById("close-modal");
const appForm = document.getElementById("add-app-form");
const list = document.getElementById("apps-list");

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Admin topishi uchun emailni bazaga saqlash
        await update(ref(db, `publishers/${user.uid}`), {
            email: user.email.toLowerCase()
        });

        onValue(ref(db, `publishers/${user.uid}/balance`), (snapshot) => {
            const balance = snapshot.val() || 0;
            document.getElementById('pub-balance').innerText = `$${balance.toFixed(4)}`;
        });
        loadUserApps(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

function loadUserApps(uid) {
    onValue(ref(db, 'publisher_apps'), (snapshot) => {
        list.innerHTML = "";
        const data = snapshot.val();
        let count = 0;
        if (data) {
            for (let id in data) {
                if (data[id].ownerId === uid) {
                    count++;
                    const earnings = data[id].earnings || 0;
                    const code = `<script type="module" src="https://adsero.vercel.app/sdk.js" data-app-id="${id}"></script>`;
                    list.innerHTML += `
                        <div class="app-card">
                            <div class="app-card-header">
                                <h4>${data[id].name}</h4>
                                <span class="id-badge">ID: ${id}</span>
                            </div>
                            <div class="app-stats">
                                <div class="stat-item">
                                    <small>Project Profit</small>
                                    <span class="earnings-text">$${earnings.toFixed(4)}</span>
                                </div>
                            </div>
                            <p class="sdk-label">SDK code:</p>
                            <div class="sdk-box"><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></div>
                        </div>`;
                }
            }
        }
        if (count === 0) list.innerHTML = '<p>No projects found.</p>';
    });
}

appForm.onsubmit = (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const name = document.getElementById('app-name').value;
    const newRef = push(ref(db, 'publisher_apps'));
    set(newRef, { ownerId: user.uid, name: name, earnings: 0, createdAt: Date.now() })
    .then(() => { modal.style.display = "none"; appForm.reset(); });
};

openBtn.onclick = () => modal.style.display = "flex";
closeBtn.onclick = () => modal.style.display = "none";
document.getElementById('logout-btn').onclick = () => signOut(auth);
