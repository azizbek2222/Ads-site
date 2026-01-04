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
        this.rewardAmount = 0.0005; 
        this.timerSeconds = 15; // Standart vaqt qat'iy 15 soniya
    }

    async showInterstitial() {
        // Tashqaridan seconds argumenti olib tashlandi
        if (!this.appId) return console.error("Adsero: App ID missing!");
        
        const appSnap = await get(ref(db, `publisher_apps/${this.appId}`));
        if (appSnap.exists()) {
            this.publisherId = appSnap.val().ownerId;
            this.fetchAndShowAd();
        }
    }

    async fetchAndShowAd() {
        const adsSnap = await get(ref(db, 'ads'));
        const ads = adsSnap.val();
        if (!ads) return;

        const activeAds = Object.keys(ads).filter(id => ads[id].status === "active" && ads[id].budget > 0);
        if (activeAds.length === 0) return;

        const adId = activeAds[Math.floor(Math.random() * activeAds.length)];
        this.renderAd(adId, ads[adId]);
    }

    renderAd(adId, ad) {
        let container = document.getElementById('adsero-ad-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'adsero-ad-container';
            document.body.appendChild(container);
        }

        container.innerHTML = `
            <div id="adsero-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:999999; display:flex; align-items:center; justify-content:center;">
                <div style="position:relative; background:white; width:90%; max-width:400px; border-radius:15px; overflow:hidden; text-align:center; font-family:sans-serif;">
                    <div id=\"adsero-timer\" style=\"position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.6); color:white; width:35px; height:35px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; cursor:not-allowed;\">
                        ${this.timerSeconds}
                    </div>
                    <img src="${ad.image}" style="width:100%; height:200px; object-fit:cover;">
                    <div style="padding:20px;">
                        <h3 style="margin:0 0 10px 0; color:#333;">${ad.title}</h3>
                        <button id="adsero-visit-btn" style="background:#0088cc; color:white; border:none; padding:12px 25px; border-radius:8px; font-size:16px; cursor:pointer; width:100%;">Visit Website</button>
                    </div>
                    <div style="padding-bottom:10px;"><small style="color:#999;">Ads by Adsero</small></div>
                </div>
            </div>
        `;

        this.startTimer(adId);

        document.getElementById('adsero-visit-btn').onclick = () => {
            update(ref(db, `ads/${adId}`), { clicks: increment(1) });
            window.open(ad.url, '_blank');
        };
    }

    startTimer(adId) {
        const timerElem = document.getElementById('adsero-timer');
        let timeLeft = this.timerSeconds;

        const countdown = setInterval(() => {
            timeLeft--;
            timerElem.innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(countdown);
                this.enableClose(adId);
            }
        }, 1000);
    }

    enableClose(adId) {
        const timerElem = document.getElementById('adsero-timer');
        timerElem.innerHTML = "&#10006;";
        timerElem.style.cursor = "pointer";
        timerElem.style.background = "#ff4444";
        timerElem.onclick = () => {
            this.trackImpression(adId);
            document.getElementById('adsero-overlay').remove();
        };
    }

    async trackImpression(adId) {
        const refBonus = this.rewardAmount * 0.02;
        const updates = {};
        updates[`ads/${adId}/budget`] = increment(-0.01);
        updates[`ads/${adId}/views`] = increment(1);
        updates[`publishers/${this.publisherId}/balance`] = increment(this.rewardAmount);
        updates[`publisher_apps/${this.appId}/earnings`] = increment(this.rewardAmount);

        try {
            const pubSnap = await get(ref(db, `users/${this.publisherId}`));
            const pubData = pubSnap.val();
            if (pubData && pubData.referredBy) {
                updates[`publishers/${pubData.referredBy}/balance`] = increment(refBonus);
                updates[`users/${pubData.referredBy}/referralStats/pubEarned`] = increment(refBonus);
            }
            await update(ref(db), updates);
        } catch (e) { console.error(e); }
    }
}

window.AdseroSDK = AdseroSDK;