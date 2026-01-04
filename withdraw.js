import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, onValue, update, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

onAuthStateChanged(auth, (user) => {
    if (user) {
        onValue(ref(db, `publishers/${user.uid}/balance`), (snap) => {
            currentBalance = snap.val() || 0;
            document.getElementById('current-pub-balance').innerText = `$${currentBalance.toFixed(4)}`;
        });
    } else {
        window.location.href = 'index.html';
    }
});

document.getElementById('withdraw-form').onsubmit = async (e) => {
    e.preventDefault();
    
    const walletInput = document.getElementById('wallet-address');
    const amountInput = document.getElementById('withdraw-amount');
    
    const wallet = walletInput.value.trim();
    const amountStr = amountInput.value.trim();
    const amount = parseFloat(amountStr);
    const user = auth.currentUser;

    // 1. Maydonlarni to'ldirilganligini tekshirish (Maxsus xabarlar)
    if (wallet === "") {
        alert("Please enter your TON wallet address!"); // Maxsus xabar
        walletInput.focus();
        return;
    }

    if (amountStr === "") {
        alert("Please enter the amount you wish to withdraw.!"); // Maxsus xabar
        amountInput.focus();
        return;
    }

    // 2. Minimal miqdorni tekshirish
    if (amount < 100) {
        alert("The minimum withdrawal amount is $100.!");
        return;
    }

    // 3. Balansni tekshirish
    if (amount > currentBalance) {
        alert("There are not enough funds in your balance.!");
        return;
    }

    const requestData = {
        uid: user.uid,
        email: user.email,
        amount: amount,
        wallet: wallet,
        status: "pending",
        timestamp: Date.now()
    };

    try {
        // So'rovni yuborish
        await push(ref(db, 'withdraw_requests'), requestData);
        
        // Balansdan ayirish
        await update(ref(db, `publishers/${user.uid}`), {
            balance: increment(-amount)
        });
        
        alert("Withdrawal request sent successfully!");
        window.location.href = 'publisher.html';
    } catch (err) {
        alert("An error occurred.: " + err.message);
    }
};