// Firebase-ni CDN orqali import qilish (bu eng oson yo'li)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('error-message');
const toggleLink = document.getElementById('toggle-link');
const authTitle = document.getElementById('auth-title');
const mainBtn = document.getElementById('main-btn');

let isLogin = true;

// Rejimni almashtirish
toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    authTitle.innerText = isLogin ? "Xush kelibsiz" : "Ro'yxatdan o'tish";
    mainBtn.innerText = isLogin ? "Tizimga kirish" : "Ro'yxatdan o'tish";
    toggleLink.innerText = isLogin ? "Ro'yxatdan o'tish" : "Tizimga kirish";
    errorMsg.innerText = ""; // Xatoni tozalash
});

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;

    if (isLogin) {
        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                window.location.href = 'ads.html';
            })
            .catch(err => {
                errorMsg.innerText = "Kirishda xato: " + err.message;
            });
    } else {
        createUserWithEmailAndPassword(auth, email, password)
            .then(() => {
                window.location.href = 'ads.html';
            })
            .catch(err => {
                errorMsg.innerText = "Ro'yxatdan o'tishda xato: " + err.message;
            });
    }
});
