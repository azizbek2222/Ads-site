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

// Global o'zgaruvchilar
let currentBalance = 0;

// Modal elementlari
const modal = document.getElementById("ad-modal");
const openBtn = document.getElementById("open-modal");
const closeBtn = document.querySelector(".close");
const adForm = document.getElementById("add-ad-form");

if (openBtn) openBtn.onclick = () => modal.style.display = "block";
if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; };

// Foydalanuvchi holatini tekshirish
onAuthStateChanged(auth, (user) => {
    if (user) {
        // --- YANGI QISM: Emailni bazaga yozish (Admin panel qidirishi uchun) ---
        const userRef = ref(db, 'advertisers/' + user.uid);
        update(userRef, {
            email: user.email.toLowerCase(),
            uid: user.uid
        });
        // -------------------------------------------------------------------

        loadBalance(user.uid);
        loadUserAds(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

// Balansni yuklash
function loadBalance(uid) {
    const balanceRef = ref(db, `advertisers/${uid}/balance`);
    onValue(balanceRef, (snapshot) => {
        currentBalance = snapshot.val() || 0;
        document.getElementById('user-balance').innerText = `$${currentBalance.toFixed(2)}`;
    });
}

// Reklamalarni yuklash
function loadUserAds(uid) {
    const adsRef = ref(db, 'ads');
    onValue(adsRef, (snapshot) => {
        const adsGrid = document.getElementById('ads-grid');
        if (!adsGrid) return;
        adsGrid.innerHTML = '';
        const data = snapshot.val();
        
        let hasAds = false;
        if (data) {
            for (let id in data) {
                if (data[id].ownerId === uid) {
                    hasAds = true;
                    adsGrid.innerHTML += `
                        <div class="ad-card">
                            <img src="${data[id].image}" alt="ad">
                            <div class="ad-card-body">
                                <h4>${data[id].title}</h4>
                                <p>Byudjet: $${data[id].budget.toFixed(2)}</p>
                                <span class="ad-status" style="background:${data[id].status === 'active' ? '#e8f5e9' : '#ffebee'}">
                                    ${data[id].status}
                                </span>
                            </div>
                        </div>
                    `;
                }
            }
        }
        if (!hasAds) adsGrid.innerHTML = '<p id="no-ads">Hozircha reklamalar yo\'q.</p>';
    });
}

// Yangi reklama qo'shish (Tekshiruv bilan)
adForm.onsubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const adBudget = parseFloat(document.getElementById('ad-budget').value);

    if (adBudget > currentBalance) {
        alert(`Xatolik: Balans yetarli emas! Sizda $${currentBalance.toFixed(2)} bor.`);
        return;
    }

    if (adBudget <= 0) {
        alert("Byudjet 0 dan katta bo'lishi kerak!");
        return;
    }

    const newAd = {
        ownerId: user.uid,
        title: document.getElementById('ad-title').value,
        image: document.getElementById('ad-image').value,
        url: document.getElementById('ad-url').value,
        budget: adBudget,
        status: "active",
        views: 0,
        clicks: 0,
        createdAt: Date.now()
    };

    try {
        const adsRef = ref(db, 'ads');
        const newAdRef = push(adsRef);
        await set(newAdRef, newAd);

        const userBalanceRef = ref(db, `advertisers/${user.uid}`);
        await update(userBalanceRef, {
            balance: increment(-adBudget)
        });

        modal.style.display = "none";
        adForm.reset();
        alert("Reklama muvaffaqiyatli qo'shildi!");

    } catch (error) {
        alert("Xatolik yuz berdi: " + error.message);
    }
};

// Chiqish
document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.href = 'index.html');
