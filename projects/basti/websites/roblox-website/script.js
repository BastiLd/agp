// Warte, bis das gesamte HTML-Dokument geladen ist
document.addEventListener('DOMContentLoaded', () => {

    // Finde den Burger-Menü-Button und das Navigationsmenü
    const burgerMenu = document.querySelector('.burger-menu');
    const navLinks = document.querySelector('.nav-links');

    // Überprüfe, ob beide Elemente gefunden wurden
    if (burgerMenu && navLinks) {
        // Füge einen Klick-Event-Listener zum Burger-Menü hinzu
        burgerMenu.addEventListener('click', () => {
            // Tausche die 'active'-Klasse auf dem Navigationsmenü
            // Dies steuert das Ein- und Ausblenden (gesteuert über CSS)
            navLinks.classList.toggle('active');

            // Optional: Ändere das Icon von Burger zu 'X' und zurück
            const icon = burgerMenu.querySelector('i');
            if (icon.classList.contains('fa-bars')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

});
