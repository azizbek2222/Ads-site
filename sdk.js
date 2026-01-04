import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get, update, increment } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
const db = getDatabase(app);

class AdseroSDK {
    constructor() {
        // HTML-dagi <script data-app-id="..."> tegidan ID ni olish
        const scriptTag = document.querySelector('script[data-app-id]');
        this.appId = scriptTag ? scriptTag.getAttribute('data-app-id') : null;
        this.publisherId = null;
        this.rewardAmount = 0.0007; // Har bir ko'rish uchun beriladigan pul
    }

    async showInterstitial(seconds = 15) {
        if (!this.appId) {
            console.error("Adsero SDK: data-app-id topilmadi!");
            return;
        }

        try {
            // 1. Avval loyiha egasini (Publisher UID) aniqlaymiz
            const pubAppSnap = await get(ref(db, `publisher_apps/${this.appId}`));
            if (!pubAppSnap.exists()) {
                console.error("Adsero SDK: Bunday loyiha ID mavjud emas!");
                return;
            }
            this.publisherId = pubAppSnap.val().ownerId;

            // 2. Aktiv reklamani qidirish
            const adsSnap = await get(ref(db, 'ads'));
            if (!adsSnap.exists()) {
                console.log("Adsero SDK: Reklamalar topilmadi.");
                return;
            }

            const adsData = adsSnap.val();
            const activeAds = Object.keys(adsData).filter(id => 
                adsData[id].status === 'active' && adsData[id].budget > 0
            );

            if (activeAds.length === 0) {
                console.log("Adsero SDK: Hozirda aktiv reklama kampaniyalari yo'q.");
                alert("Hozircha reklama mavjud emas.");
                return;
            }

            // Tasodifiy bitta reklamani tanlash
            const randomId = activeAds[Math.floor(Math.random() * activeAds.length)];
            const ad = adsData[randomId];

            // 3. Reklamani ekranda ko'rsatish
            this.createAdOverlay(ad, seconds, randomId);

        } catch (error) {
            console.error("Adsero SDK xatosi:", error);
        }
    }

    createAdOverlay(ad, seconds, adId) {
        // Overlay yaratish
        const overlay = document.createElement('div');
        overlay.id = 'adsero-interstitial';
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.95); z-index: 99999;
            display: flex; justify-content: center; align-items: center;
            font-family: 'Segoe UI', Roboto, sans-serif;
        `;

        overlay.innerHTML = `
            <div style="background: white; width: 90%; max-width: 400px; border-radius: 20px; overflow: hidden; position: relative; text-align: center; padding-bottom: 20px;">
                <div id="adsero-timer" style="position: absolute; top: 15px; right: 15px; background: #0088cc; color: white; width: 35px; height: 35px; border-radius: 50%; line-height: 35px; font-weight: bold; font-size: 14px;">
                    ${seconds}
                </div>
                <img src="${ad.image}" style="width: 100%; height: 200px; object-fit: cover;">
                <div style="padding: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">${ad.title}</h3>
                    <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Advertisement by Adsero Network</p>
                    <button id="adsero-visit-btn" style="background: #28a745; color: white; border: none; padding: 12px 30px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 16px; width: 100%;">
                        Visit Website
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        let timeLeft = seconds;
        const timerElem = document.getElementById('adsero-timer');
        
        const countdown = setInterval(() => {
            timeLeft--;
            timerElem.innerText = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(countdown);
                timerElem.innerText = '✕';
                timerElem.style.cursor = 'pointer';
                timerElem.style.background = '#ff4d4d';
                
                // Vaqt tugagandan keyin yopish imkoniyati
                timerElem.onclick = () => {
                    overlay.remove();
                };

                // Mukofotni hisoblash
                this.trackImpression(adId);
            }
        }, 1000);

        // Reklamaga bosilganda
        document.getElementById('adsero-visit-btn').onclick = () => {
            this.trackClick(adId);
            window.open(ad.url, '_blank');
        };
    }

    async trackImpression(adId) {
        if (!this.publisherId || !this.appId) return;

        const updates = {};
        
        // 1. Reklama beruvchidan pul yechish va ko'rishlar sonini oshirish
        updates[`ads/${adId}/budget`] = increment(-0.01); 
        updates[`ads/${adId}/views`] = increment(1);
        
        // 2. Foydalanuvchining (Publisher) umumiy balansini oshirish
        updates[`publishers/${this.publisherId}/balance`] = increment(this.rewardAmount);
        
        // 3. Aynan shu loyihaning (App) shaxsiy daromadini oshirish
        updates[`publisher_apps/${this.appId}/earnings`] = increment(this.rewardAmount);

        try {
            await update(ref(db), updates);
            console.log("Adsero SDK: Reward processed and project earnings updated.");
        } catch (error) {
            console.error("Adsero SDK Update Error:", error);
        }
    }

    async trackClick(adId) {
        try {
            await update(ref(db, `ads/${adId}`), {
                clicks: increment(1)
            });
        } catch (e) {
            console.error("Adsero SDK Click Track Error:", e);
        }
    }
}

// Global window obyektiga chiqarish
window.AdseroSDK = AdseroSDK;