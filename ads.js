// Firebase-ni CDN orqali import qilish
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDdDnuUlqaHyMYc0vKOmjLFxFSTmWh3gIw",
  authDomain: "sample-firebase-ai-app-955f2.firebaseapp.com",
  projectId: "sample-firebase-ai-app-955f2",
  storageBucket: "sample-firebase-ai-app-955f2.firebasestorage.app",
  messagingSenderId: "310796131581",
  appId: "1:310796131581:web:8cb51b40c06bb83e94f294"
};

// Firebase-ni ishga tushirish
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Foydalanuvchi holatini tekshirish
onAuthStateChanged(auth, (user) => {
    const userEmailElem = document.getElementById('user-email');
    if (user) {
        userEmailElem.innerText = user.email; // Emailni ko'rsatish
    } else {
        // Tizimga kirmagan bo'lsa, index.html ga qaytarish
        window.location.href = 'index.html';
    }
});

// Chiqish tugmasi mantiqi
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = 'index.html';
        }).catch((error) => {
            console.error("Chiqishda xato:", error);
        });
    });
}

// Reklama beruvchi sahifasiga o'tish
const advertiserCard = document.getElementById('advertiser-card');
if (advertiserCard) {
    advertiserCard.addEventListener('click', () => {
        window.location.href = 'advertiser.html';
    });
}

// Reklama oluvchi sahifasiga o'tish
const publisherCard = document.getElementById('publisher-card');
if (publisherCard) {
    publisherCard.addEventListener('click', () => {
        window.location.href = 'publisher.html';
    });
}
