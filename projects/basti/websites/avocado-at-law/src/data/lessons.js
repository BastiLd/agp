// Inhalte von "Avocado at Law" 🥑⚖️
// ACHTUNG: Demo-Inhalte zum Ausprobieren - KEINE echte Rechtsberatung!
// Später werden die Inhalte recherchiert und von Jurist:innen geprüft.
//
// Eine Lektion besteht aus "steps" (Schritten). Es gibt zwei Arten:
//   { type: 'info', text: '...' }   -> Avo bringt dir etwas bei (Lern-Karte)
//   { type: 'question', ... }       -> eine Quizfrage zum gerade Gelernten
//
// Vor jeder Frage steht ein 'info'-Schritt, der die Antwort erklärt -
// genau wie bei Duolingo: zuerst lernen, dann üben.

export const lessons = {
  // ---------- Lektion 1 ----------
  'jugendrecht-1': {
    id: 'jugendrecht-1',
    title: 'Deine Rechte ab 14/16/18',
    steps: [
      {
        type: 'info',
        text: 'Hi, ich bin Avo! 🥑 Ich zeig dir, ab welchem Alter du in Österreich was darfst. Ich erkläre dir erst alles – dann fragen wir es gemeinsam ab. Los geht’s!',
      },
      {
        type: 'info',
        text: 'Merk dir: In Österreich darfst du schon mit 16 wählen! 🗳️ Das ist früher als in den meisten anderen Ländern.',
      },
      {
        type: 'question',
        question: 'Ab welchem Alter darfst du in Österreich bei der Nationalratswahl mitwählen?',
        options: ['14 Jahre', '16 Jahre', '18 Jahre', '21 Jahre'],
        correctIndex: 1,
        explanation: 'Genau – mit 16! Österreich hat das Wahlalter besonders früh angesetzt.',
      },
      {
        type: 'info',
        text: 'Nächste Sache: Ab 14 bist du „strafmündig". Das heißt, ab da kannst du vor Gericht zur Verantwortung gezogen werden. Für Jugendliche gilt aber ein eigenes, milderes Jugendstrafrecht.',
      },
      {
        type: 'question',
        question: 'Ab welchem Alter bist du in Österreich „strafmündig"?',
        options: ['12 Jahre', '14 Jahre', '16 Jahre', '18 Jahre'],
        correctIndex: 1,
        explanation: 'Richtig – ab 14. Davor kann man strafrechtlich nicht belangt werden.',
      },
      {
        type: 'info',
        text: 'Und große Sachen wie teure Verträge? Die darfst du erst mit 18 ganz allein unterschreiben. Dann bist du „voll geschäftsfähig". 📝',
      },
      {
        type: 'question',
        question: 'Ab welchem Alter darfst du einen teuren Handyvertrag ganz allein – ohne deine Eltern – unterschreiben?',
        options: ['Mit 7 Jahren', 'Mit 14 Jahren', 'Mit 16 Jahren', 'Mit 18 Jahren'],
        correctIndex: 3,
        explanation: 'Stark! Erst mit 18 bist du voll geschäftsfähig.',
        lawyerMode: {
          casual: 'Mit 18 darfst du alles allein unterschreiben! 🎉',
          formal: 'Mit Vollendung des 18. Lebensjahres tritt die volle Geschäftsfähigkeit ein.',
        },
      },
    ],
  },

  // ---------- Lektion 2 ----------
  konsum: {
    id: 'konsum',
    title: 'Konsumentenschutz',
    steps: [
      {
        type: 'info',
        text: 'Weiter geht’s mit Einkaufen & Online-Shopping! 🛒 Ich zeig dir, welche Rechte du als Käufer:in hast.',
      },
      {
        type: 'info',
        text: 'Wenn du online etwas bestellst, hast du in Österreich meist 14 Tage Zeit, ohne Angabe von Gründen zurückzutreten. 📦',
      },
      {
        type: 'question',
        question: 'Wie lange hast du beim Online-Shopping normalerweise Zeit, ohne Grund zurückzutreten?',
        options: ['Gar keine', '7 Tage', '14 Tage', '100 Tage'],
        correctIndex: 2,
        explanation: 'Genau – 14 Tage! Dieses Rücktrittsrecht gibt’s vor allem beim Online-Kauf.',
      },
      {
        type: 'info',
        text: 'Aber Achtung: Bei Dingen, die schnell verderben (z.B. frische Lebensmittel), gilt dieses Rücktrittsrecht oft NICHT.',
      },
      {
        type: 'question',
        question: 'Bei welchem Online-Kauf gilt das 14-tägige Rücktrittsrecht eher NICHT?',
        options: ['Neue Schuhe', 'Ein T-Shirt', 'Frische Lebensmittel', 'Ein Buch'],
        correctIndex: 2,
        explanation: 'Richtig – bei frischen Lebensmitteln gibt’s meist kein Rücktrittsrecht.',
      },
      {
        type: 'info',
        text: 'Und Abos (z.B. Streaming)? Die hören NICHT von selbst auf – du musst aktiv kündigen. Achte immer auf die Kündigungsfrist! ⏰',
      },
      {
        type: 'question',
        question: 'Was passiert mit einem Abo, wenn du einfach nichts tust?',
        options: [
          'Es endet automatisch',
          'Es läuft weiter und kostet weiter',
          'Es wird billiger',
          'Es pausiert von selbst',
        ],
        correctIndex: 1,
        explanation: 'Genau – ohne Kündigung läuft das Abo weiter und kostet weiter.',
        lawyerMode: {
          casual: 'Abo = läuft weiter, bis du kündigst!',
          formal: 'Ein Dauerschuldverhältnis endet nicht von selbst, sondern erst durch Kündigung.',
        },
      },
    ],
  },
};

// Der Lernpfad: Diese Level erscheinen als runde Kreise (wie bei Duolingo).
// Ob ein Level offen ist, wird im PathScreen berechnet:
// das erste ist offen, das nächste öffnet sich, wenn das vorige geschafft ist.
export const pathLevels = [
  { lessonId: 'jugendrecht-1', title: 'Deine Rechte ab 14/16/18' },
  { lessonId: 'konsum', title: 'Konsumentenschutz' },
  { lessonId: 'job', title: 'Dein erster Job' },
  { lessonId: 'internet', title: 'Handy & Internet' },
  { lessonId: 'wohnen', title: 'Wohnen & Miete' },
];
