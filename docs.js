// Koddan nusxa olish funksiyasi
function copyCode(elementId) {
    const codeElement = document.getElementById(elementId);
    const codeText = codeElement.innerText || codeElement.textContent;
    
    navigator.clipboard.writeText(codeText).then(() => {
        const btn = event.target;
        const originalText = btn.innerText;
        
        btn.innerText = "Copied!";
        btn.style.background = "#28a745";
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "";
        }, 2000);
    }).catch(err => {
        console.error('Nusxa olishda xatolik:', err);
    });
}

// Sahifa yuklanganda bajariladigan logikalar
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll (Silliq o'tish)
    document.querySelectorAll('.sidebar nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});
