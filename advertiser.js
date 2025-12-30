import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

// Modal elementlari
const modal = document.getElementById("ad-modal");
const openBtn = document.getElementById("open-modal");
const closeBtn = document.getElementsByClassName("close")[0];
const adForm = document.getElementById("add-ad-form");

// Modalni ochish/yopish
openBtn.onclick = () => modal.style.display = "block";
closeBtn.onclick = () => modal.style.display = "none";

// Foydalanuvchi ma'lumotlarini yuklash
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadUserAds(user.uid);
    } else {
        window.location.href = 'index.html';
    }
});

// Reklamalarni Realtime Database'dan o'qish
function loadUserAds(uid) {
    const adsRef = ref(db, 'ads');
    onValue(adsRef, (snapshot) => {
        const adsGrid = document.getElementById('ads-grid');
        adsGrid.innerHTML = '';
        const data = snapshot.val();
        
        let hasAds = false;
        for (let id in data) {
            if (data[id].ownerId === uid) {
                hasAds = true;
                adsGrid.innerHTML += `
                    <div class="ad-card">
                        <img src="${data[id].image}" alt="ad">
                        <div class="ad-card-body">
                            <h4>${data[id].title}</h4>
                            <p>Byudjet: $${data[id].budget}</p>
                            <span class="ad-status">${data[id].status}</span>
                        </div>
                    </div>
                `;
            }
        }
        if (!hasAds) adsGrid.innerHTML = '<p>Hozircha reklamalar yo\'q.</p>';
    });
}

// Yangi reklama qo'shish
adForm.onsubmit = (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    
    const newAd = {
        ownerId: user.uid,
        title: document.getElementById('ad-title').value,
        image: document.getElementById('ad-image').value,
        url: document.getElementById('ad-url').value,
        budget: parseFloat(document.getElementById('ad-budget').value),
        status: "active",
        views: 0
    };

    const adsRef = ref(db, 'ads');
    const newAdRef = push(adsRef);
    set(newAdRef, newAd).then(() => {
        modal.style.display = "none";
        adForm.reset();
        alert("Reklama muvaffaqiyatli qo'shildi!");
    });
};

// Logout
document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.href = 'index.html');
