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
        if (!this.appId) return console.error("Adsero: App ID not found!");

        try {
            // 1. Nashriyotchi ma'lumotlarini olish
            const appSnap = await get(ref(db, `publisher_apps/${this.appId}`));
            if (!appSnap.exists()) {
                console.error("Adsero: Invalid App ID!");
                return;
            }
            this.publisherId = appSnap.val().ownerId;

            // 2. Aktiv reklamalarni olish
            const adsSnap = await get(ref(db, 'ads'));
            const adsData = adsSnap.val();
            if (!adsData) return;

            const activeAds = Object.keys(adsData).filter(id => 
                adsData[id].status === 'active' && adsData[id].budget >= 0.01
            );

            if (activeAds.length === 0) {
                console.log("Adsero: There are no active ads yet..");
                return;
            }

            const randomId = activeAds[Math.floor(Math.random() * activeAds.length)];
            const ad = adsData[randomId];

            // 3. To'liq ekranli overlay yaratish
            const overlay = document.createElement('div');
            overlay.id = 'Adsero-overlay';
            overlay.style = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.85); z-index: 10000;
                display: flex; align-items: center; justify-content: center;
                font-family: Arial, sans-serif;
            `;

            overlay.innerHTML = `
                <div style="background: white; width: 90%; max-width: 400px; border-radius: 20px; overflow: hidden; position: relative; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <div id="close-timer" style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.6); color: white; width: 35px; height: 35px; line-height: 35px; border-radius: 50%; font-size: 14px; font-weight: bold;">
                        ${seconds}
                    </div>
                    <img src="${ad.image}" style="width: 100%; height: 250px; object-fit: cover;">
                    <div style="padding: 20px;">
                        <h2 style="margin: 0 0 15px 0; font-size: 22px; color: #333;">${ad.title}</h2>
                        <a href="${ad.url}" target="_blank" id="inter-click-btn" style="display: block; background: #0088cc; color: white; padding: 14px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">View details</a>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Taymer mantiqi
            let timeLeft = seconds;
            const timerElem = document.getElementById('close-timer');
            const interval = setInterval(() => {
                timeLeft--;
                if (timerElem) timerElem.innerText = timeLeft;
                if (timeLeft <= 0) {
                    clearInterval(interval);
                    if (timerElem) {
                        timerElem.innerHTML = '✕';
                        timerElem.style.cursor = 'pointer';
                        timerElem.onclick = () => overlay.remove();
                    }
                }
            }, 1000);

            // 4. Statistikani yangilash
            await this.trackImpression(randomId);

            document.getElementById('inter-click-btn').onclick = () => {
                this.trackClick(randomId);
            };

        } catch (error) {
            console.error("Adsero SDK error:", error);
        }
    }

    async trackImpression(adId) {
        if (!this.publisherId) return;

        const updates = {};
        // Reklama beruvchidan ayirish
        updates[`ads/${adId}/budget`] = increment(-0.01);
        updates[`ads/${adId}/views`] = increment(1);
        
        // Nashriyotchiga (Publisher) qo'shish
        // YO'LNI TEKSHIRING: publisher.js da balans 'publishers/uid/balance' da turibdi
        updates[`publishers/${this.publisherId}/balance`] = increment(0.0007);

        try {
            await update(ref(db), updates);
            console.log("Adsero: Balance updated successfully.");
        } catch (error) {
            console.error("Adsero: An error occurred while updating the balance.!", error);
        }
    }

    async trackClick(adId) {
        try {
            await update(ref(db, `ads/${adId}`), { 
                clicks: increment(1) 
            });
        } catch (error) {
            console.error("Adsero: Click calculation error:", error);
        }
    }
}

window.Adsero = new AdseroSDK();