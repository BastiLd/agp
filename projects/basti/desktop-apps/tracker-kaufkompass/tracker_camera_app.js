const fs = require('fs');

const data = JSON.parse(fs.readFileSync('tracker_camera_data.json', 'utf8'));

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n*** Tracker & Kamera Kaufkompass ***\n');
console.log('Es gibt ' + data.length + ' Geräte in dieser Liste.');
console.log('Geben Sie die Nummer eines Geräts ein, um Details anzuzeigen.');
console.log('Oder geben Sie "alle" ein, um alle Geräte aufzuzählen.');
console.log('Zum Beenden geben Sie "exit" ein.\n');

data.forEach((item, idx) => {
  console.log((idx+1) + '. ' + item.Device + ' (' + item.Category + ')');
});

function showItem(index) {
  const item = data[index];
  console.log('\n=== ' + item.Device + ' ===');
  console.log('Kategorie: ' + item.Category);
  console.log('Batterie (Herstellerangabe): ' + item["Battery life claim"]);
  console.log('Batterie (Praxis): ' + item["Real-world battery"]);
  console.log('Netz / Funktionen: ' + item["Wireless/network"]);
  console.log('Preis (ungefähr): ' + item["Price approx (€)"] + ' €');
  console.log('Amazon verfügbar: ' + item["Amazon availability"]);
  console.log('Abo erforderlich: ' + item["Subscription?"]);
  console.log('Präzision/Video: ' + item["Accuracy/video"]);
  console.log('Vorteile: ' + item.Pros);
  console.log('Nachteile: ' + item.Cons);
  console.log('Anmerkungen: ' + item["One-star review / notes"]);
  console.log('\n');
}

function promptUser() {
  readline.question('Ihre Auswahl: ', (answer) => {
    if (!answer) return promptUser();
    if (answer.toLowerCase() === 'exit') {
      console.log('Programm beendet.');
      return readline.close();
    }
    if (answer.toLowerCase() === 'alle') {
      data.forEach((_, i) => showItem(i));
      return promptUser();
    }
    const idx = parseInt(answer) - 1;
    if (isNaN(idx) || idx < 0 || idx >= data.length) {
      console.log('Ungültige Eingabe. Bitte Nummer zwischen 1 und ' + data.length + ' eingeben.');
    } else {
      showItem(idx);
    }
    promptUser();
  });
}

promptUser();
