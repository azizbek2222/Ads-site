import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, set, onValue, update, increment, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Admin topishi uchun emailni bazaga saqlash
        await update(ref(db, `advertisers/${user.uid}`), {
            email: user.email.toLowerCase()
        });

        onValue(ref(db, `advertisers/${user.uid}/balance`), (snapshot) => {
            currentBalance = snapshot.val() || 0;
            document.getElementById('user-balance').innerText = `$${currentBalance.toFixed(2)}`;
        });
        loadUserAds(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

function loadUserAds(uid) {
    onValue(ref(db, 'ads'), (snapshot) => {
        adsList.innerHTML = "";
        const data = snapshot.val();
        let count = 0;

        if (data) {
            for (let id in data) {
                if (data[id].ownerId === uid) {
                    count++;
                    const ad = data[id];
                    const adCard = document.createElement('div');
                    adCard.className = 'ad-card';
                    adCard.innerHTML = `
                        <img src="${ad.image}" alt="Ad Image" style="width:100%; height:120px; object-fit:cover; border-radius:8px;">
                        <div class="ad-card-body">
                            <h4>${ad.title}</h4>
                            <div class="ad-stats-mini">
                                <span><i class="fas fa-eye"></i> ${ad.views || 0}</span>
                                <span><i class="fas fa-mouse-pointer"></i> ${ad.clicks || 0}</span>
                            </div>
                            <p>Budget: <strong>$${ad.budget.toFixed(2)}</strong></p>
                            <div class="ad-status ${ad.status}">${ad.status}</div>
                            <button class="btn-topup" onclick="openTopUp('${id}')" style="margin-top:10px; width:100%;">Top up</button>
                        </div>
                    `;
                    adsList.appendChild(adCard);
                }
            }
        }
        if (count === 0) adsList.innerHTML = "<p>Sizda hali reklamalar yo'q.</p>";
    });
}

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
        image: document.getElementById('ad-image').value,
        url: document.getElementById('ad-url').value,
        budget: adBudget,
        views: 0,
        clicks: 0,
        status: "active",
        createdAt: Date.now()
    };

    try {
        const newAdRef = push(ref(db, 'ads'));
        await set(newAdRef, newAd);
        await update(ref(db, `advertisers/${user.uid}`), { balance: increment(-adBudget) });
        
        adModal.style.display = "none";
        adForm.reset();
        alert("Reklama yaratildi!");
    } catch (err) { alert(err.message); }
};

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
        await update(ref(db, `ads/${adId}`), { budget: increment(extraAmount), status: "active" });
        await update(ref(db, `advertisers/${user.uid}`), { balance: increment(-extraAmount) });
        topUpModal.style.display = "none";
        topUpForm.reset();
        alert("Byudjet yangilandi!");
    } catch (err) { alert(err.message); }
};

window.openModal = (id) => document.getElementById(id).style.display = "flex";
window.closeModal = (id) => document.getElementById(id).style.display = "none";
window.openTopUp = (adId) => {
    document.getElementById('target-ad-id').value = adId;
    openModal('top-up-modal');
};

document.getElementById('open-ad-modal').onclick = () => openModal('ad-modal');
document.getElementById('logout-btn').onclick = () => signOut(auth);
