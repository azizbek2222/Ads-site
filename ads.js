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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
    const userEmailElem = document.getElementById('user-email');
    if (user) {
        userEmailElem.innerText = user.email;
    } else {
        window.location.href = 'index.html';
    }
});

// Logout
document.getElementById('logout-btn')?.addEventListener('click', () => {
    signOut(auth).then(() => { window.location.href = 'index.html'; });
});

// Navigation
document.getElementById('advertiser-card')?.addEventListener('click', () => {
    window.location.href = 'advertiser.html';
});

document.getElementById('publisher-card')?.addEventListener('click', () => {
    window.location.href = 'publisher.html';
});

document.getElementById('withdraw-page-btn')?.addEventListener('click', () => {
    window.location.href = 'withdraw.html';
});

// --- Referral Mini App Logic ---
const refModal = document.getElementById('referral-modal');
const openRefBtn = document.getElementById('referral-open-btn');
const closeRefBtn = document.getElementById('close-referral');

openRefBtn.onclick = () => {
    refModal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Orqadagi scrollni to'xtatadi
};

closeRefBtn.onclick = () => {
    refModal.style.display = 'none';
    document.body.style.overflow = 'auto';
};

window.onclick = (event) => {
    if (event.target == refModal) {
        refModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};