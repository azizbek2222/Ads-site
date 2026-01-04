import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get, update, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
const db = getDatabase(app);

class AdseroSDK {
    constructor() {
        const scriptTag = document.querySelector('script[data-app-id]');
        this.appId = scriptTag ? scriptTag.getAttribute('data-app-id') : null;
        this.publisherId = null;
    }

    async showInterstitial(seconds = 15) {
        if (!this.appId) {
            console.error("Adsero: data-app-id topilmadi!");
            return;
        }

        try {
            // 1. Publisher ma'lumotlarini olish
            const pubSnap = await get(ref(db, `publisher_apps/${this.appId}`));
            if (!pubSnap.exists()) {
                console.error("Adsero: Loyiha topilmadi!");
                return;
            }
            this.publisherId = pubSnap.val().ownerId;

            // 2. Aktiv reklamani tanlash
            const adsSnap = await get(ref(db, 'ads'));
            if (!adsSnap.exists()) return;

            const adsData = adsSnap.val();
            const activeAds = Object.keys(adsData).filter(id => adsData[id].status === 'active' && adsData[id].budget > 0);
            
            if (activeAds.length === 0) {
                console.log("Adsero: Aktiv reklamalar mavjud emas.");
                return;
            }

            const randomId = activeAds[Math.floor(Math.random() * activeAds.length)];
            const ad = adsData[randomId];

            // 3. UI yaratish (Reklama oynasi)
            this.createAdOverlay(ad, seconds, randomId);

        } catch (error) {
            console.error("Adsero SDK error:", error);
        }
    }

    createAdOverlay(ad, seconds, adId) {
        const overlay = document.createElement('div');
        overlay.id = 'adsero-overlay';
        overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10000;display:flex;justify-content:center;align-items:center;color:white;font-family:sans-serif;";

        overlay.innerHTML = `
            <div style="background:white; color:black; padding:20px; border-radius:15px; width:90%; max-width:400px; text-align:center; position:relative;">
                <div id="adsero-timer" style="position:absolute; top:10px; right:10px; background:#0088cc; color:white; width:30px; height:30px; border-radius:50%; line-height:30px; font-size:14px;">${seconds}</div>
                <img src="${ad.image}" style="width:100%; border-radius:10px; margin-bottom:15px;">
                <h3>${ad.title}</h3>
                <button id="adsero-click-btn" style="margin-top:15px; background:#28a745; color:white; border:none; padding:12px 25px; border-radius:8px; cursor:pointer; font-weight:bold;">Visit Site</button>
            </div>
        `;

        document.body.appendChild(overlay);

        let timeLeft = seconds;
        const timerElem = document.getElementById('adsero-timer');
        const interval = setInterval(() => {
            timeLeft--;
            timerElem.innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(interval);
                timerElem.innerText = "X";
                timerElem.style.cursor = "pointer";
                timerElem.onclick = () => overlay.remove();
                
                // Vaqt tugagach ko'rilgan deb hisoblash va pul o'tkazish
                this.trackImpression(adId);
            }
        }, 1000);

        document.getElementById('adsero-click-btn').onclick = () => {
            this.trackClick(adId);
            window.open(ad.url, '_blank');
        };
    }

    async trackImpression(adId) {
        if (!this.publisherId) return;

        const updates = {};
        updates[`ads/${adId}/budget`] = increment(-0.01);
        updates[`ads/${adId}/views`] = increment(1);
        updates[`publishers/${this.publisherId}/balance`] = increment(0.0007);
        // Loyihaning o'z daromadini ham yangilash
        updates[`publisher_apps/${this.appId}/earnings`] = increment(0.0007);

        try {
            await update(ref(db), updates);
            console.log("Adsero: Reward processed.");
        } catch (error) {
            console.error("Adsero Update Error:", error);
        }
    }

    async trackClick(adId) {
        update(ref(db, `ads/${adId}`), { clicks: increment(1) });
    }
}

// Global foydalanish uchun window ga biriktiramiz
window.AdseroSDK = AdseroSDK;
