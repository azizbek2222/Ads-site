import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, update, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

// URL dan referal ID ni olish
const urlParams = new URLSearchParams(window.location.search);
const referrerId = urlParams.get('ref');
if (referrerId) {
    localStorage.setItem('pending_referrer', referrerId);
}

const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('error-message');
const toggleLink = document.getElementById('toggle-link');
const authTitle = document.getElementById('auth-title');
const mainBtn = document.getElementById('main-btn');

let isLogin = true;

toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    authTitle.innerText = isLogin ? "Xush kelibsiz" : "Ro'yxatdan o'tish";
    mainBtn.innerText = isLogin ? "Tizimga kirish" : "Ro'yxatdan o'tish";
    toggleLink.innerText = isLogin ? "Ro'yxatdan o'tish" : "Tizimga kirish";
});

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    if (isLogin) {
        signInWithEmailAndPassword(auth, email, password)
            .then(() => window.location.href = 'ads.html')
            .catch(err => errorMsg.innerText = "Xato: " + err.message);
    } else {
        createUserWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                const savedRef = localStorage.getItem('pending_referrer');
                
                // Bazada foydalanuvchi profilini yaratish
                const userPath = `users/${user.uid}`;
                const userData = {
                    email: email,
                    uid: user.uid,
                    referredBy: savedRef || null,
                    createdAt: Date.now()
                };

                await set(ref(db, userPath), userData);

                // Agar referal orqali kelgan bo'lsa, taklif qilgan odamning hisoblagichini oshirish
                if (savedRef) {
                    await update(ref(db, `users/${savedRef}/referralStats`), {
                        count: increment(1)
                    });
                    localStorage.removeItem('pending_referrer');
                }

                window.location.href = 'ads.html';
            })
            .catch(err => errorMsg.innerText = "Xato: " + err.message);
    }
});