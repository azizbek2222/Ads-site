import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, set, onValue, update, increment, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase konfiguratsiyasi
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

let currentBalance = 0;

const adModal = document.getElementById("ad-modal");
const topUpModal = document.getElementById("top-up-modal");
const adForm = document.getElementById("add-ad-form");
const topUpForm = document.getElementById("top-up-form");
const adsList = document.getElementById("ads-list");

// Foydalanuvchi holati va Balansni tekshirish
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Balansni real vaqtda kuzatish
        onValue(ref(db, `advertisers/${user.uid}/balance`), (snapshot) => {
            currentBalance = snapshot.val() || 0;
            document.getElementById('user-balance').innerText = `$${currentBalance.toFixed(2)}`;
        });
        // Foydalanuvchi reklamalarini yuklash
        loadUserAds(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

// Reklamalarni yuklash funksiyasi
function loadUserAds(uid) {
    onValue(ref(db, 'ads'), (snapshot) => {
        adsList.innerHTML = "";
        const data = snapshot.val();
        let count = 0;

        for (let id in data) {
            if (data[id].ownerId === uid) {
                count++;
                const ad = data[id];
                const adCard = document.createElement('div');
                adCard.className = 'ad-card';
                adCard.innerHTML = `
                    <img src="${ad.img}" alt="Ad Image">
                    <div class="ad-card-body">
                        <h4>${ad.title}</h4>
                        <div class="ad-stats-mini">
                            <span><i class="fas fa-eye"></i> ${ad.views || 0}</span>
                            <span><i class="fas fa-mouse-pointer"></i> ${ad.clicks || 0}</span>
                        </div>
                        <p>Budget: <strong>$${ad.budget.toFixed(2)}</strong></p>
                        <div class="ad-status ${ad.status}">${ad.status}</div>
                        <button class="btn-topup" onclick="openTopUp('${id}')">Top up</button>
                    </div>
                `;
                adsList.appendChild(adCard);
            }
        }
        if (count === 0) adsList.innerHTML = "<p>Sizda hali reklamalar yo'q.</p>";
    });
}

// Yangi reklama yaratish va Referal bonus
adForm.onsubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const adBudget = parseFloat(document.getElementById('ad-budget').value);

    if (adBudget > currentBalance) {
        alert("Xato: Balansingizda mablag' yetarli emas!");
        return;
    }

    const newAd = {
        ownerId: user.uid,
        title: document.getElementById('ad-title').value,
        img: document.getElementById('ad-image').value,
        url: document.getElementById('ad-url').value,
        budget: adBudget,
        views: 0,
        clicks: 0,
        status: "active",
        createdAt: Date.now()
    };

    try {
        // 1. Reklamani bazaga qo'shish
        const newAdRef = push(ref(db, 'ads'));
        await set(newAdRef, newAd);

        // 2. Advertiser balansidan pul yechish
        await update(ref(db, `advertisers/${user.uid}`), { 
            balance: increment(-adBudget) 
        });

        // 3. REFERAL TIZIMI: 2% Bonusni hisoblash
        const userSnap = await get(ref(db, `users/${user.uid}`));
        const userData = userSnap.val();

        if (userData && userData.referredBy) {
            const bonus = adBudget * 0.02; // 2% komissiya
            const referrerId = userData.referredBy;

            // Taklif qilgan odamning (Referrer) hisobiga pul tushirish
            await update(ref(db, `advertisers/${referrerId}`), { 
                balance: increment(bonus) 
            });
            
            // Referal statistikasini yangilash
            await update(ref(db, `users/${referrerId}/referralStats`), { 
                advEarned: increment(bonus) 
            });
        }

        adModal.style.display = "none";
        adForm.reset();
        alert("Reklama muvaffaqiyatli yaratildi va 2% referal bonus o'tkazildi!");
    } catch (err) {
        alert("Xato: " + err.message);
    }
};

// Byudjetni to'ldirish (Top up)
topUpForm.onsubmit = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const adId = document.getElementById('target-ad-id').value;
    const extraAmount = parseFloat(document.getElementById('extra-budget').value);

    if (extraAmount > currentBalance) {
        alert("Xato: Balans yetarli emas!");
        return;
    }

    try {
        await update(ref(db, `ads/${adId}`), { 
            budget: increment(extraAmount),
            status: "active" 
        });
        await update(ref(db, `advertisers/${user.uid}`), { 
            balance: increment(-extraAmount) 
        });

        topUpModal.style.display = "none";
        topUpForm.reset();
        alert("Reklama byudjeti yangilandi!");
    } catch (err) {
        alert("Xato: " + err.message);
    }
};

// Global funksiyalar (Modal oynalar uchun)
window.openModal = (id) => document.getElementById(id).style.display = "flex";
window.closeModal = (id) => document.getElementById(id).style.display = "none";
window.openTopUp = (adId) => {
    document.getElementById('target-ad-id').value = adId;
    openModal('top-up-modal');
};

document.getElementById('open-ad-modal').onclick = () => openModal('ad-modal');
document.getElementById('logout-btn').onclick = () => signOut(auth);
document.getElementById('exchange-btn').onclick = () => window.location.href = 'exchange.html';