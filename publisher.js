// Firebase modullarini to'g'ri URL orqali import qilamiz
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDdDnuUlqaHyMYc0vKOmjLFxFSTmWh3gIw",
  authDomain: "sample-firebase-ai-app-955f2.firebaseapp.com",
  databaseURL: "https://sample-firebase-ai-app-955f2-default-rtdb.firebaseio.com", // RTDB manzili to'g'riligini tekshiring
  projectId: "sample-firebase-ai-app-955f2",
  storageBucket: "sample-firebase-ai-app-955f2.firebasestorage.app",
  messagingSenderId: "310796131581",
  appId: "1:310796131581:web:8cb51b40c06bb83e94f294"
};

// Firebase-ni ishga tushirish
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Elementlarni olish
const modal = document.getElementById("app-modal");
const openBtn = document.getElementById("open-app-modal");
const closeBtn = document.querySelector(".close");
const appForm = document.getElementById("add-app-form");

// Modalni ochish va yopish
if (openBtn) openBtn.onclick = () => modal.style.display = "block";
if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };

// Foydalanuvchi holatini tekshirish
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Foydalanuvchi tizimda:", user.uid);
        loadUserApps(user.uid);
        loadBalance(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

// Balansni yuklash
function loadBalance(uid) {
    const balanceRef = ref(db, 'publishers/' + uid + '/balance');
    onValue(balanceRef, (snapshot) => {
        const balance = snapshot.val() || 0;
        const balanceElem = document.getElementById('pub-balance');
        if (balanceElem) balanceElem.innerText = `$${balance.toFixed(2)}`;
    });
}

// Ilovalarni yuklash
function loadUserApps(uid) {
    const appsRef = ref(db, 'publisher_apps');
    onValue(appsRef, (snapshot) => {
        const appsList = document.getElementById('apps-list');
        if (!appsList) return;
        
        appsList.innerHTML = '';
        const data = snapshot.val();
        
        let hasApps = false;
        if (data) {
            for (let id in data) {
                if (data[id].ownerId === uid) {
                    hasApps = true;
                    // SDK kodi GitHub manzili bilan
                    const sdkCode = `<script type="module" src="https://azizbek2222.github.io/ads/sdk.js" data-app-id="${id}"></script>`;
                    
                    appsList.innerHTML += `
                        <div class="app-card">
                            <h4>${data[id].name} <span class="id-badge">ID: ${id}</span></h4>
                            <p>Ushbu kodni botingizning HTML fayliga joylang:</p>
                            <div class="sdk-box">
                                <code>${sdkCode.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code>
                            </div>
                        </div>
                    `;
                }
            }
        }
        if (!hasApps) appsList.innerHTML = '<p>Hozircha ilovalar qo\'shilmagan.</p>';
    });
}

// Yangi loyiha qo'shish funksiyasi
if (appForm) {
    appForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        const appNameInput = document.getElementById('app-name');
        
        if (!user) {
            alert("Siz tizimga kirmagansiz!");
            return;
        }

        const appName = appNameInput.value;
        console.log("Loyiha qo'shilmoqda:", appName);

        const newAppRef = push(ref(db, 'publisher_apps'));
        set(newAppRef, {
            ownerId: user.uid,
            name: appName,
            createdAt: Date.now()
        })
        .then(() => {
            console.log("Loyiha muvaffaqiyatli qo'shildi");
            modal.style.display = "none";
            appForm.reset();
        })
        .catch((error) => {
            console.error("Xatolik yuz berdi:", error);
            alert("Xatolik: " + error.message);
        });
    });
}

// Chiqish
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.onclick = () => signOut(auth).then(() => window.location.href = 'index.html');
}
