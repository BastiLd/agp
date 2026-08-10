// Funktion für das mobile Menü und die Navigation
document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    // Mobiles Menü ein- und ausblenden
    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Einfache Seitenumschaltung (Seiten-Logik)
    const navLinks = document.querySelectorAll('[data-page]');
    const pages = document.querySelectorAll('.page-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');

            pages.forEach(page => {
                if (page.id === targetPage) {
                    page.classList.remove('hidden');
                } else {
                    page.classList.add('hidden');
                }
            });

            // Schließe das mobile Menü nach Klick automatisch
            if (mobileMenu) {
                mobileMenu.classList.add('hidden');
            }
        });
    });
});
