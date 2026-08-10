// ============================================================
// Stadt Land Fluss Auto-Fill - PRO MAX VERSION V8 (PERFECT DB)
// ============================================================

(function () {
  'use strict';

  const oldPanel = document.getElementById('slf-autofill-panel');
  if (oldPanel) oldPanel.remove();

  // ============================================================
  // MASSIVE ANSWER DATABASE (Alle Kategorien aus den Bildern!)
  // ============================================================
  const ANSWERS = {
    stadt: { A: ["Amsterdam", "Augsburg", "Aachen"], B: ["Berlin", "Bremen", "Bonn"], C: ["Chicago", "Chemnitz"], D: ["Dresden", "Dortmund"], E: ["Erfurt", "Essen"], F: ["Frankfurt", "Freiburg"], G: ["Genf", "Graz"], H: ["Hamburg", "Hannover"], I: ["Istanbul", "Innsbruck"], J: ["Jakarta", "Jena"], K: ["Köln", "Kassel"], L: ["London", "Leipzig"], M: ["München", "Madrid"], N: ["Nürnberg", "Neapel"], O: ["Oslo", "Oldenburg"], P: ["Paris", "Potsdam"], Q: ["Quedlinburg"], R: ["Rom", "Rostock"], S: ["Stuttgart", "Schwerin"], T: ["Tokio", "Trier"], U: ["Ulm", "Utrecht"], V: ["Venedig", "Vancouver"], W: ["Wien", "Wiesbaden"], X: ["Xanten"], Y: ["Yokohama", "York"], Z: ["Zürich", "Zwickau"] },
    land: { A: ["Australien", "Argentinien"], B: ["Brasilien", "Belgien"], C: ["Chile", "China"], D: ["Deutschland", "Dänemark"], E: ["Ecuador", "Estland"], F: ["Frankreich", "Finnland"], G: ["Griechenland", "Georgien"], H: ["Honduras", "Haiti"], I: ["Irland", "Italien"], J: ["Japan", "Jamaika"], K: ["Kanada", "Kroatien"], L: ["Luxemburg", "Litauen"], M: ["Mexiko", "Malta"], N: ["Norwegen", "Niederlande"], O: ["Österreich", "Oman"], P: ["Portugal", "Polen"], Q: ["Katar"], R: ["Rumänien", "Russland"], S: ["Schweden", "Schweiz"], T: ["Thailand", "Türkei"], U: ["Uruguay", "USA"], V: ["Venezuela", "Vietnam"], W: ["Weißrussland", "Wales"], X: ["Nordmazedonien"], Y: ["Jemen"], Z: ["Zypern", "Simbabwe"] },
    fluss: { A: ["Amazonas", "Altmühl"], B: ["Brahmaputra", "Bode"], C: ["Colorado", "Chester"], D: ["Donau", "Dnjepr"], E: ["Elbe", "Ems"], F: ["Fulda", "Flöha"], G: ["Ganges", "Garonne"], H: ["Havel", "Hudson"], I: ["Isar", "Inn"], J: ["Jordan", "Jade"], K: ["Kongo", "Kyll"], L: ["Lech", "Lahn"], M: ["Main", "Mississippi"], N: ["Nil", "Neckar"], O: ["Oder", "Ohio"], P: ["Po", "Parana"], Q: ["Queich"], R: ["Rhein", "Rhone"], S: ["Seine", "Spree"], T: ["Themse", "Tiber"], U: ["Ural"], V: ["Volga", "Vils"], W: ["Weser", "Wupper"], X: ["Xingu"], Y: ["Yangtze", "Yukon"], Z: ["Zambezi"] },
    tier: { A: ["Adler", "Affe"], B: ["Bär", "Biber"], C: ["Chamäleon"], D: ["Delfin", "Dachs"], E: ["Elefant", "Esel"], F: ["Fuchs", "Frosch"], G: ["Giraffe", "Gepard"], H: ["Hund", "Hase"], I: ["Igel", "Iltis"], J: ["Jaguar"], K: ["Katze", "Kuh"], L: ["Löwe", "Luchs"], M: ["Maus", "Marder"], N: ["Nashorn"], O: ["Otter", "Ochse"], P: ["Pinguin", "Pferd"], Q: ["Qualle"], R: ["Reh", "Rind"], S: ["Schlange", "Schwein"], T: ["Tiger", "Taube"], U: ["Uhu"], V: ["Vogel"], W: ["Wolf", "Wal"], X: ["Xenops"], Y: ["Yak"], Z: ["Zebra", "Ziege"] },
    beruf: { A: ["Arzt", "Anwalt"], B: ["Bäcker", "Bauer"], C: ["Chemiker", "Clown"], D: ["Dachdecker"], E: ["Elektriker"], F: ["Friseur"], G: ["Gärtner"], H: ["Hausmeister"], I: ["Ingenieur"], J: ["Journalist"], K: ["Koch", "Kellner"], L: ["Lehrer"], M: ["Maurer", "Maler"], N: ["Notar"], O: ["Optiker"], P: ["Polizist", "Pilot"], Q: ["Qualitätsprüfer"], R: ["Richter"], S: ["Schreiner", "Schmied"], T: ["Tischler", "Tierarzt"], U: ["Uhrmacher"], V: ["Verkäufer"], W: ["Winzer", "Wirt"], X: ["Xylophonspieler"], Y: ["Yogalehrer"], Z: ["Zahnarzt"] },
    pflanze: { A: ["Ahorn"], B: ["Birke"], C: ["Chrysantheme"], D: ["Distel"], E: ["Eiche"], F: ["Fichte"], G: ["Geranie"], H: ["Haselnuss"], I: ["Iris"], J: ["Jasmin"], K: ["Kaktus"], L: ["Linde"], M: ["Mohn"], N: ["Nelke"], O: ["Orchidee"], P: ["Palme"], Q: ["Quitte"], R: ["Rose"], S: ["Sonnenblume"], T: ["Tulpe"], U: ["Ulme"], V: ["Veilchen"], W: ["Weide"], X: ["Xeranthemum"], Y: ["Yucca"], Z: ["Zeder"] },
    name: { A: ["Anna", "Anton"], B: ["Bastian", "Bernd"], C: ["Christian", "Charlotte"], D: ["Daniel", "David"], E: ["Emil", "Emma"], F: ["Felix", "Florian"], G: ["Gustav", "Gabi"], H: ["Hannah", "Hannes"], I: ["Ida", "Ingo"], J: ["Jonas", "Julia"], K: ["Kevin", "Katharina"], L: ["Lukas", "Lena"], M: ["Max", "Mia"], N: ["Niklas", "Nora"], O: ["Oskar", "Olivia"], P: ["Paul", "Paula"], Q: ["Quirin"], R: ["Robert", "Rita"], S: ["Simon", "Sarah"], T: ["Tim", "Thomas"], U: ["Ulrich", "Ursula"], V: ["Valentin", "Victoria"], W: ["Wilhelm", "Werner"], X: ["Xaver", "Xenia"], Y: ["Yvonne", "Yannick"], Z: ["Zoe", "Zacharias"] },
    film: { A: ["Avatar"], B: ["Batman"], C: ["Casablanca"], D: ["Dune"], E: ["E.T."], F: ["Fight Club"], G: ["Gladiator"], H: ["Harry Potter"], I: ["Inception"], J: ["Joker"], K: ["King Kong"], L: ["Lion King"], M: ["Matrix"], N: ["Nemo"], O: ["Ocean's Eleven"], P: ["Pulp Fiction"], Q: ["Quantum of Solace"], R: ["Rocky"], S: ["Star Wars"], T: ["Titanic"], U: ["Up"], V: ["Venom"], W: ["Wonder Woman"], X: ["X-Men"], Y: ["Yesterday"], Z: ["Zombieland"] },
    farbe: { A: ["Azurblau"], B: ["Blau"], C: ["Cyan"], D: ["Dunkelblau"], E: ["Elfenbein"], F: ["Fuchsia"], G: ["Gelb"], H: ["Hellblau"], I: ["Indigo"], J: ["Jadegrün"], K: ["Karminrot"], L: ["Lila"], M: ["Magenta"], N: ["Neon"], O: ["Orange"], P: ["Pink"], Q: ["Quarzgrau"], R: ["Rot"], S: ["Schwarz"], T: ["Türkis"], U: ["Ultramarin"], V: ["Violett"], W: ["Weiß"], X: ["Xanadu"], Y: ["Yankees-Blau"], Z: ["Zinnoberrot"] },
    gefühl: { A: ["Angst"], B: ["Bedauern"], C: ["Charme"], D: ["Dankbarkeit"], E: ["Ekel", "Euphorie"], F: ["Freude"], G: ["Glück"], H: ["Hass"], I: ["Interesse"], J: ["Jubel"], K: ["Kummer"], L: ["Liebe"], M: ["Mitleid"], N: ["Neid"], O: ["Optimismus"], P: ["Panik"], Q: ["Qual"], R: ["Reue"], S: ["Schmerz", "Stolz"], T: ["Trauer"], U: ["Unruhe"], V: ["Verzweiflung"], W: ["Wut"], X: ["Xenophobie"], Y: ["Yolo-Gefühl"], Z: ["Zweifel"] },
    krankheit: { A: ["Asthma"], B: ["Bronchitis"], C: ["Cholera"], D: ["Diabetes"], E: ["Epilepsie"], F: ["Fieber"], G: ["Grippe"], H: ["Husten"], I: ["Infektion"], J: ["Juckreiz"], K: ["Krebs"], L: ["Leukämie"], M: ["Masern"], N: ["Neurodermitis"], O: ["Osteoporose"], P: ["Pest"], Q: ["Querschnittslähmung"], R: ["Rheuma"], S: ["Schnupfen"], T: ["Tuberkulose"], U: ["Unterzuckerung"], V: ["Verstauchung"], W: ["Windpocken"], X: ["Xerophthalmie"], Y: ["Yersiniose"], Z: ["Zöliakie"] },
    promi: { A: ["Angelina Jolie"], B: ["Brad Pitt"], C: ["Cristiano Ronaldo"], D: ["Dwayne Johnson"], E: ["Eminem"], F: ["Frank Sinatra"], G: ["George Clooney"], H: ["Harrison Ford"], I: ["Idris Elba"], J: ["Justin Bieber"], K: ["Katy Perry"], L: ["Leonardo DiCaprio"], M: ["Madonna"], N: ["Nicolas Cage"], O: ["Oprah Winfrey"], P: ["Paul McCartney"], Q: ["Quentin Tarantino"], R: ["Rihanna"], S: ["Sylvester Stallone"], T: ["Tom Cruise"], U: ["Usher"], V: ["Vin Diesel"], W: ["Will Smith"], X: ["Xzibit"], Y: ["Yoko Ono"], Z: ["Zendaya"] },
    lebensmittel: { A: ["Apfel"], B: ["Brot"], C: ["Champignon"], D: ["Dattel"], E: ["Ei"], F: ["Fisch"], G: ["Gurke"], H: ["Honig"], I: ["Ingwer"], J: ["Joghurt"], K: ["Käse"], L: ["Lachs"], M: ["Milch"], N: ["Nudel"], O: ["Orange"], P: ["Pizza"], Q: ["Quark"], R: ["Reis"], S: ["Salami", "Salat"], T: ["Tomate"], U: ["Udon"], V: ["Vanilleeis"], W: ["Wurst"], X: ["Xanthan"], Y: ["Yamswurzel"], Z: ["Zitrone"] },
    getraenk: { A: ["Apfelsaft"], B: ["Bier"], C: ["Cola"], D: ["Daiquiri"], E: ["Eistee"], F: ["Fanta"], G: ["Gin"], H: ["Heißer Kakao"], I: ["Ingwertee"], J: ["Johannisbeersaft"], K: ["Kaffee"], L: ["Limonade"], M: ["Milch"], N: ["Nektar"], O: ["Orangensaft"], P: ["Pils"], Q: ["Quellwasser"], R: ["Rotwein"], S: ["Saft"], T: ["Tee"], U: ["U-Boot"], V: ["Wodka"], W: ["Wasser"], X: ["Xuxu"], Y: ["Yogi-Tee"], Z: ["Zitronensaft"] },
    hobby: { A: ["Angeln"], B: ["Backen"], C: ["Campen"], D: ["Dart"], E: ["Eislaufen"], F: ["Fußball"], G: ["Gärtnern"], H: ["Handball"], I: ["Inlineskaten"], J: ["Joggen"], K: ["Kochen"], L: ["Lesen"], M: ["Malen"], N: ["Nähen"], O: ["Origami"], P: ["Programmieren"], Q: ["Quizzen"], R: ["Reiten"], S: ["Schwimmen"], T: ["Tanzen"], U: ["Upcycling"], V: ["Volleyball"], W: ["Wandern"], X: ["Xylophon spielen"], Y: ["Yoga"], Z: ["Zaubern"] },
    sportart: { A: ["Aerobic"], B: ["Basketball"], C: ["Curling"], D: ["Dart"], E: ["Eishockey"], F: ["Fußball"], G: ["Golf"], H: ["Handball"], I: ["Inlineskaten"], J: ["Judo"], K: ["Karate"], L: ["Leichtathletik"], M: ["Marathon"], N: ["Nordic Walking"], O: ["Orientierungslauf"], P: ["Parkour"], Q: ["Quidditch"], R: ["Radfahren"], S: ["Schwimmen"], T: ["Tennis"], U: ["Ultimate Frisbee"], V: ["Volleyball"], W: ["Wasserball"], X: ["X-Treme Sports"], Y: ["Yoga"], Z: ["Zehnkampf"] },
    koerperteil: { A: ["Arm"], B: ["Bein"], C: ["Choroid"], D: ["Daumen"], E: ["Ellenbogen"], F: ["Fuß"], G: ["Gesicht"], H: ["Hals"], I: ["Iris"], J: ["Jochbein"], K: ["Kopf"], L: ["Lunge"], M: ["Mund"], N: ["Nase"], O: ["Ohr"], P: ["Po"], Q: ["Quadrizeps"], R: ["Rücken"], S: ["Schulter"], T: ["Taille"], U: ["Unterarm"], V: ["Vene"], W: ["Wade"], X: ["X-Chromosom"], Y: ["Y-Chromosom"], Z: ["Zahn"] },
    schimpfwort: { A: ["Arschloch"], B: ["Bastard"], C: ["Clown"], D: ["Depp"], E: ["Idiot"], F: ["Flasche"], G: ["Gierschlund"], H: ["Hund"], I: ["Idiot"], J: ["Jammerlappen"], K: ["Kackbratze"], L: ["Lappen"], M: ["Miststück"], N: ["Nervensäge"], O: ["Opfer"], P: ["Penner"], Q: ["Quatschkopf"], R: ["Ratte"], S: ["Schlampe"], T: ["Trottel"], U: ["Unmensch"], V: ["Vollidiot"], W: ["Wichser"], X: ["X-Bein"], Y: ["Yeti"], Z: ["Zicke"] },
    computerspiel: { A: ["Assassin's Creed"], B: ["Battlefield"], C: ["Call of Duty"], D: ["Diablo"], E: ["Elden Ring"], F: ["FIFA"], G: ["GTA"], H: ["Halo"], I: ["It Takes Two"], J: ["Just Dance"], K: ["Kingdom Hearts"], L: ["League of Legends"], M: ["Minecraft"], N: ["Need for Speed"], O: ["Overwatch"], P: ["Pokémon"], Q: ["Quake"], R: ["Red Dead Redemption"], S: ["Skyrim"], T: ["Tomb Raider"], U: ["Uncharted"], V: ["Valorant"], W: ["World of Warcraft"], X: ["XCOM"], Y: ["Yakuza"], Z: ["Zelda"] },
    todesursache: { A: ["Autounfall"], B: ["Blutverlust"], C: ["Cholera"], D: ["Drogenüberdosis"], E: ["Ertrinken"], F: ["Feuer"], G: ["Gift"], H: ["Herzinfarkt"], I: ["Infektion"], J: ["Jagdunfall"], K: ["Krebs"], L: ["Leberversagen"], M: ["Mord"], N: ["Nierenversagen"], O: ["Organversagen"], P: ["Pest"], Q: ["Quallenstich"], R: ["Raubtier"], S: ["Schlaganfall"], T: ["Tollwut"], U: ["Unfall"], V: ["Verhungern"], W: ["Wunde"], X: ["Xenon-Vergiftung"], Y: ["Yersinia pestis"], Z: ["Zugunfall"] },
    scheidungsgrund: { A: ["Affäre"], B: ["Betrug"], C: ["Charakterschwäche"], D: ["Diebstahl"], E: ["Eifersucht"], F: ["Fremdgehen"], G: ["Geldprobleme"], H: ["Hass"], I: ["Ignoranz"], J: ["Jähzorn"], K: ["Kinderlosigkeit"], L: ["Lügen"], M: ["Misshandlung"], N: ["Narzissmus"], O: ["Oberflächlichkeit"], P: ["Pornosucht"], Q: ["Qualen"], R: ["Respektlosigkeit"], S: ["Streit"], T: ["Trennung"], U: ["Untreue"], V: ["Verrat"], W: ["Wahnsinn"], X: ["Xenophobie"], Y: ["Yolo-Lebensstil"], Z: ["Zoff"] },
    instrument: { A: ["Akkordeon"], B: ["Bass"], C: ["Cello"], D: ["Dudelsack"], E: ["E-Gitarre"], F: ["Flöte"], G: ["Gitarre"], H: ["Harfe"], I: ["Instrumentalharfe"], J: ["Jagdhorn"], K: ["Klavier"], L: ["Laute"], M: ["Mundharmonika"], N: ["Naturhorn"], O: ["Orgel"], P: ["Posaune"], Q: ["Querflöte"], R: ["Rassel"], S: ["Schlagzeug"], T: ["Trompete"], U: ["Ukulele"], V: ["Violine"], W: ["Waldhorn"], X: ["Xylophon"], Y: ["Yamaha-Keyboard"], Z: ["Zither"] },
    politiker: { A: ["Adenauer"], B: ["Biden"], C: ["Churchill"], D: ["Draghi"], E: ["Erhard"], F: ["Franklin Roosevelt"], G: ["Gorbatschow"], H: ["Helmut Schmidt"], I: ["Ilves"], J: ["John F. Kennedy"], K: ["Kohl"], L: ["Lincoln"], M: ["Merkel"], N: ["Nixon"], O: ["Obama"], P: ["Putin"], Q: ["Quincy Adams"], R: ["Reagan"], S: ["Scholz"], T: ["Trump"], U: ["Ulbricht"], V: ["Van der Bellen"], W: ["Washington"], X: ["Xi Jinping"], Y: ["Yeltsin"], Z: ["Zelenskyj"] },
    marke: { A: ["Apple"], B: ["BMW"], C: ["Coca-Cola"], D: ["Disney"], E: ["Esprit"], F: ["Ford"], G: ["Google"], H: ["H&M"], I: ["IKEA"], J: ["Jeep"], K: ["Kellogg's"], L: ["Lego"], M: ["McDonald's"], N: ["Nike"], O: ["Opel"], P: ["Porsche"], Q: ["Quiksilver"], R: ["Red Bull"], S: ["Samsung"], T: ["Toyota"], U: ["Under Armour"], V: ["Volkswagen"], W: ["Wendy's"], X: ["Xbox"], Y: ["Yamaha"], Z: ["Zara"] },
    
    // DIE NEUEN PERFEKTEN KATEGORIEN
    bauernhof: { A: ["Alpaka", "Acker"], B: ["Bauer", "Bulldog"], C: ["Collie"], D: ["Dung", "Drescher"], E: ["Esel", "Ernte"], F: ["Ferkel", "Feld"], G: ["Gans", "Gülle"], H: ["Heu", "Huhn"], I: ["Iltis"], J: ["Jauche"], K: ["Kuh", "Korn"], L: ["Landwirt"], M: ["Mistgabel", "Mähdrescher"], N: ["Nutztiere"], O: ["Ochse", "Obst"], P: ["Pferd", "Pflug"], Q: ["Quark (selbstgemacht)"], R: ["Rind", "Rechen"], S: ["Schwein", "Scheune"], T: ["Traktor", "Trog"], U: ["Unkraut"], V: ["Vieh", "Vogelscheuche"], W: ["Weide", "Wiese"], X: ["X-Beiniges Pferd"], Y: ["Yak"], Z: ["Ziege", "Zaun"] },
    anmachspruch: { A: ["Also, ich bin neu hier...", "Angst vor mir?"], B: ["Bist du ein Engel?", "Bist du öfter hier?"], C: ["Cool, dich zu sehen."], D: ["Darf ich dich auf einen Drink einladen?"], E: ["Entschuldigung, hast du Feuer?"], F: ["Fühlst du auch diese Spannung?"], G: ["Glaubst du an Liebe auf den ersten Blick?"], H: ["Hast du mal ein Taschentuch?"], I: ["Ich habe meine Nummer verloren..."], J: ["Jemand wie du fehlt mir."], K: ["Kann ich dich nach Hause begleiten?"], L: ["Lust auf einen Drink?"], M: ["Möchtest du tanzen?"], N: ["Na, du?"], O: ["Oft hier?"], P: ["Passt da noch jemand an den Tisch?"], Q: ["Quatsch mich ruhig an."], R: ["Richtig schönes Wetter heute."], S: ["So allein hier?"], T: ["Trinkst du noch was?"], U: ["Und was machst du so?"], V: ["Verrätst du mir deinen Namen?"], W: ["Wo warst du mein ganzes Leben?"], X: ["X-mal schon an dich gedacht."], Y: ["Yeah, lass uns tanzen."], Z: ["Zauberhaft siehst du aus."] },
    chemie: { A: ["Aluminium", "Argon"], B: ["Blei", "Barium"], C: ["Calcium", "Chlor"], D: ["Dysprosium", "Darmstadtium"], E: ["Eisen", "Erbium"], F: ["Fluor", "Francium"], G: ["Gold", "Gallium"], H: ["Helium", "Holmium"], I: ["Iridium", "Iod"], J: ["Jod (Iod)"], K: ["Kalium", "Kupfer"], L: ["Lithium", "Lanthan"], M: ["Magnesium", "Mangan"], N: ["Natrium", "Neon"], O: ["Osmium", "Sauerstoff (Oxygenium)"], P: ["Platin", "Phosphor"], Q: ["Quecksilber"], R: ["Radium", "Rubidium"], S: ["Silber", "Schwefel"], T: ["Titan", "Tellur"], U: ["Uran", "Ununoctium"], V: ["Vanadium"], W: ["Wolfram", "Wasserstoff"], X: ["Xenon"], Y: ["Yttrium"], Z: ["Zink", "Zinn"] },
    cocktail: { A: ["Aperol Spritz", "Alexander"], B: ["Bloody Mary", "Bellini"], C: ["Caipirinha", "Cosmopolitan"], D: ["Daiquiri"], E: ["Espresso Martini"], F: ["French 75"], G: ["Gin Tonic", "Gimlet"], H: ["Hurricane"], I: ["Irish Coffee"], J: ["Jack and Coke"], K: ["Kir Royal", "Kamikaze"], L: ["Long Island Iced Tea"], M: ["Mojito", "Margarita"], N: ["Negroni"], O: ["Old Fashioned"], P: ["Pina Colada", "Planter's Punch"], Q: ["Queens"], R: ["Rusty Nail", "Rob Roy"], S: ["Sex on the Beach"], T: ["Tequila Sunrise"], U: ["U-Boot"], V: ["Vodka Martini"], W: ["Whiskey Sour", "White Russian"], X: ["X-Rated Flirt"], Y: ["Yellow Bird"], Z: ["Zombie"] },
    kuehlschrank: { A: ["Apfelsaft", "Aufschnitt"], B: ["Butter", "Bier"], C: ["Cola", "Cheddar"], D: ["Dressing", "Datteln"], E: ["Eier", "Eistee"], F: ["Fleisch", "Frischkäse"], G: ["Gurken", "Gemüse"], H: ["H-Milch", "Hefe"], I: ["Ingwer"], J: ["Joghurt", "Jalapenos"], K: ["Käse", "Ketchup"], L: ["Lachs", "Limonade"], M: ["Milch", "Margarine"], N: ["Naturjoghurt"], O: ["Orangensaft"], P: ["Pizza (Rest)", "Pesto"], Q: ["Quark"], R: ["Rindfleisch"], S: ["Senf", "Salami", "Sahne"], T: ["Tomaten", "Tzatziki"], U: ["U-Milch"], V: ["Vanillejoghurt"], W: ["Wurst", "Wasser"], X: ["Xylit-Limonade"], Y: ["Yakult"], Z: ["Zitronen", "Zwiebeln"] },
    dinoart: { A: ["Allosaurus", "Ankylosaurus"], B: ["Brachiosaurus", "Baryonyx"], C: ["Ceratosaurus", "Carnotaurus"], D: ["Diplodocus", "Deinonychus"], E: ["Edmontosaurus"], F: ["Fukuiraptor"], G: ["Gallimimus", "Giganotosaurus"], H: ["Hadrosaurus", "Herrerasaurus"], I: ["Iguanodon"], J: ["Juravenator"], K: ["Kentrosaurus"], L: ["Lambeosaurus"], M: ["Megalosaurus", "Microraptor"], N: ["Nodosaurus"], O: ["Oviraptor", "Ouranosaurus"], P: ["Parasaurolophus", "Pteranodon"], Q: ["Qianzhousaurus"], R: ["Raptor", "Rugops"], S: ["Stegosaurus", "Spinosaurus"], T: ["Tyrannosaurus Rex", "Triceratops"], U: ["Utahraptor"], V: ["Velociraptor"], W: ["Wuerhosaurus"], X: ["Xenotarsosaurus"], Y: ["Yinlong"], Z: ["Zuniceratops"] },
    coolness: { A: ["Auto", "Ausstrahlung"], B: ["Bart", "Brille"], C: ["Charisma"], D: ["Designerkleidung"], E: ["Ehrlichkeit", "Erfolg"], F: ["Frisur"], G: ["Geld", "Gitarre spielen"], H: ["Humor", "Haltung"], I: ["Intelligenz", "Ironie"], J: ["Jacke (Leder)"], K: ["Kappe", "Ketten"], L: ["Lederjacke", "Lächeln"], M: ["Motorrad", "Muskeln"], N: ["Narben"], O: ["Outfit"], P: ["Parfüm"], Q: ["Qualität"], R: ["Ringe", "Reichtum"], S: ["Sonnenbrille", "Selbstbewusstsein"], T: ["Tattoos", "Talent"], U: ["Unabhängigkeit"], V: ["Vans"], W: ["Wissen", "Witze"], X: ["X-Faktor"], Y: ["Yacht"], Z: ["Zigarre", "Zaubertricks"] },
    senktcoolness: { A: ["Arroganz"], B: ["Besserwisserei"], C: ["Crocs"], D: ["Dreck", "Dummheit"], E: ["Eifersucht", "Eitelkeit"], F: ["Faulheit"], G: ["Gier"], H: ["Hochwasserhosen", "Hass"], I: ["Ignoranz"], J: ["Jammern"], K: ["Klettverschlussschuhe", "Knauserigkeit"], L: ["Lügen"], M: ["Mundgeruch"], N: ["Nasebohren", "Neid"], O: ["Offene Schnürsenkel"], P: ["Prahlen"], Q: ["Quengeln"], R: ["Rassismus"], S: ["Sandalen mit Socken", "Schweißflecken"], T: ["Taktlosigkeit"], U: ["Ungepflegtheit"], V: ["Verrat"], W: ["Wutausbrüche"], X: ["X-Beine (betonen)"], Y: ["Yeti-Behaarung"], Z: ["Zahnspange (ungewaschen)"] },
    erfundenerberuf: { A: ["Apfelpolierer"], B: ["Bettentester", "Büroklammer-Sortierer"], C: ["Chaosmanager"], D: ["Daumendreher", "Deckenanmarrer"], E: ["Erbsenzähler"], F: ["Fliegenfänger", "Faltenbügler"], G: ["Gedankensammler"], H: ["Himmelstreicher", "Hundefriseur (extrem)"], I: ["Ideenwegwerfer"], J: ["Jammertall-Führer"], K: ["Käselochbohrer", "Kissenaufschüttler"], L: ["Luftschlösser-Architekt", "Lückensucher"], M: ["Mückentöter"], N: ["Nebelspalter"], O: ["Ohrenputzer"], P: ["Pusteblumenzüchter", "Plätzchen-Tester"], Q: ["Quatschmacher"], R: ["Regenbogenschieber"], S: ["Sandzähler", "Schattenparker"], T: ["Traumfänger", "Teppichstreichler"], U: ["Unkraut-Psychologe"], V: ["Vogelstimmen-Imitator"], W: ["Wolkenschieber"], X: ["Xylophon-Stimmer"], Y: ["Yeti-Jäger"], Z: ["Zitronenfalter"] },
    ekelig: { A: ["Achselhaare", "Abfall"], B: ["Blut", "Bakterien"], C: ["Chaos", "Chemieabfall"], D: ["Dreck", "Durchfall"], E: ["Eiter", "Erbrochenes"], F: ["Fäkalien", "Fußpilz"], G: ["Gammelfleisch", "Gestank"], H: ["Haare im Essen", "Hundekot"], I: ["Insekten", "Infektion"], J: ["Jauche"], K: ["Kacke", "Kotze"], L: ["Leichengeruch", "Läuse"], M: ["Maden", "Müll"], N: ["Nasenpopel", "Nagelpilz"], O: ["Ohrenschmalz"], P: ["Popel", "Pickel"], Q: ["Qualm"], R: ["Ratte", "Ranziges Fett"], S: ["Schleim", "Schweiß"], T: ["Toilettenrand"], U: ["Urin", "Ungeziefer"], V: ["Verwesung", "Vomit"], W: ["Würmer", "Wunden"], X: ["X-treme Gerüche"], Y: ["Yersinia-Bakterien"], Z: ["Zecken"] },
    eissorte: { A: ["Amarena", "Apfel"], B: ["Banane", "Blaubeere", "Bounty"], C: ["Caramel", "Cookies", "Cola"], D: ["Drachenfrucht"], E: ["Erdbeere", "Engelblau"], F: ["Feige", "Fior di Latte"], G: ["Grapefruit", "Giotto"], H: ["Haselnuss", "Himbeere"], I: ["Ingwer"], J: ["Joghurt"], K: ["Kirsche", "Karamell", "Kaffee"], L: ["Limette", "Lakritz"], M: ["Mango", "Melone", "Macadamia"], N: ["Nuss", "Nougat"], O: ["Orange", "Oreo"], P: ["Pistazie", "Pfirsich", "Pflaume"], Q: ["Quark"], R: ["Rhabarber", "Rum-Traube"], S: ["Schokolade", "Stracciatella", "Schlumpfeis"], T: ["Tiramisu", "Toffee"], U: ["Ube"], V: ["Vanille", "Veilchen"], W: ["Waldfrucht", "Walnuss"], X: ["Xylit-Zitrone"], Y: ["Yuzu"], Z: ["Zitrone", "Zimt"] },
    englisch: { A: ["Apple", "Ant"], B: ["Book", "Ball", "Boy"], C: ["Cat", "Car", "Cool"], D: ["Dog", "Door", "Desk"], E: ["Elephant", "Egg", "Eye"], F: ["Fish", "Friend", "Fire"], G: ["Girl", "Game", "Good"], H: ["House", "Hello", "Hat"], I: ["Ice", "Idea"], J: ["Jump", "Joke"], K: ["King", "Key", "Kite"], L: ["Love", "Lion", "Lake"], M: ["Money", "Moon", "Mouse"], N: ["Night", "Name", "Nice"], O: ["Orange", "Open", "Ocean"], P: ["Pen", "Pig", "Play"], Q: ["Queen", "Question", "Quick"], R: ["Rain", "Red", "Run"], S: ["Sun", "School", "Smile"], T: ["Time", "Tree", "Train"], U: ["Umbrella", "Uncle", "Use"], V: ["Voice", "Very", "View"], W: ["Water", "Window", "Word"], X: ["Xylophone"], Y: ["Yes", "Yellow", "You"], Z: ["Zebra", "Zoo", "Zero"] },
    elektrisch: { A: ["Akkuschrauber"], B: ["Bohrmaschine", "Backofen"], C: ["Computer"], D: ["Drucker", "Dunstabzugshaube"], E: ["E-Bike", "Eismaschine"], F: ["Fernseher", "Föhn"], G: ["Geschirrspüler", "Gefriertruhe"], H: ["Handy", "Herd"], I: ["Induktionsherd"], J: ["Jukebox"], K: ["Kühlschrank", "Kaffeemaschine"], L: ["Laptop", "Lampe"], M: ["Mikrowelle", "Mixer"], N: ["Nähmaschine", "Netzteil"], O: ["Ofen"], P: ["PlayStation", "PC"], Q: ["Quirl (elektrisch)"], R: ["Radio", "Rasierer"], S: ["Staubsauger", "Smartwatch"], T: ["Toaster", "Tablet"], U: ["Uhr (Smartwatch)"], V: ["Ventilator", "Verstärker"], W: ["Waschmaschine", "Wasserkocher"], X: ["Xbox"], Y: ["Yamaha-Synthesizer"], Z: ["Zahnbürste (elektrisch)"] },
    fabelwesen: { A: ["Alp", "Amor"], B: ["Basilisk", "Banshee"], C: ["Centaur", "Cerberus"], D: ["Drache", "Dämon"], E: ["Einhorn", "Elf"], F: ["Fee"], G: ["Greif", "Gnom"], H: ["Harpyie", "Hydra"], I: ["Ifrit"], J: ["Jinn (Dschinn)"], K: ["Kobold", "Krake"], L: ["Leviathan"], M: ["Meerjungfrau", "Minotaurus"], N: ["Nixe", "Nymphe"], O: ["Ork", "Oger"], P: ["Pegasus", "Phönix"], Q: ["Quetzalcoatl"], R: ["Riese", "Riesenkrake"], S: ["Sphinx", "Sirene"], T: ["Troll", "Teufel"], U: ["Untoter"], V: ["Vampir"], W: ["Werwolf", "Wassergeist"], X: ["Xana"], Y: ["Yeti"], Z: ["Zwerg", "Zentaur"] },
    fortbewegung: { A: ["Auto", "Achterbahn"], B: ["Bus", "Bahn", "Boot"], C: ["Cabrio", "Caravan"], D: ["D-Zug", "Droschke"], E: ["E-Scooter", "Eisenbahn"], F: ["Fahrrad", "Flugzeug", "Fähre"], G: ["Gleitschirm", "Gondel"], H: ["Hubschrauber"], I: ["Inlineskates", "ICE"], J: ["Jet", "Jeep"], K: ["Kutsche", "Kanu"], L: ["LKW", "Luftschiff"], M: ["Motorrad", "Moped"], N: ["Nahverkehrszug"], O: ["Omnibus"], P: ["Porsche", "Pferd"], Q: ["Quad"], R: ["Roller", "Rollstuhl"], S: ["Schiff", "Straßenbahn"], T: ["Taxi", "Traktor", "Tretboot"], U: ["U-Bahn", "U-Boot"], V: ["Van"], W: ["Wohnmobil", "Wagen"], X: ["X-Wing (Star Wars)"], Y: ["Yacht"], Z: ["Zug", "Zeppelin"] },
    grabstein: { A: ["Auf Wiedersehen", "Aus die Maus"], B: ["Bin dann mal weg"], C: ["Ciao", "Chillt jetzt ewig"], D: ["Der Letzte macht das Licht aus", "Das war's"], E: ["Endlich Ruhe", "Ende"], F: ["Feierabend", "Frieden"], G: ["Gute Nacht", "Ging zu schnell"], H: ["Hab ich's nicht gesagt?", "Hier ruht..."], I: ["Ich wusste, das passiert", "In Frieden"], J: ["Jetzt ist Ruhe"], K: ["Keine Werbung einwerfen", "Konnte nicht mehr"], L: ["Lass mich schlafen"], M: ["Macht's gut"], N: ["Nichts geht mehr"], O: ["Ohne mich", "Over"], P: ["Pech gehabt", "Pause"], Q: ["Quält mich nicht mehr"], R: ["Ruhe in Frieden", "Ruhe sanft"], S: ["Schicht im Schacht", "Schlaf gut"], T: ["Tschüss", "Trauert nicht"], U: ["Unten ist es kühler", "Unvergessen"], V: ["Viel Spaß noch"], W: ["Warte auf euch", "Wir sehen uns"], X: ["X.X (Augen zu)"], Y: ["Yolo war gestern"], Z: ["Zu spät", "Zelt abgebrochen"] },
    groesserelefant: { A: ["Auto (LKW)", "Asteroid"], B: ["Blauwal", "Berg"], C: ["Container", "Cloud"], D: ["Dinosaurier"], E: ["Erde"], F: ["Flugzeug"], G: ["Gebäude"], H: ["Haus"], I: ["Insel"], J: ["Jupiter"], K: ["Kontinent"], L: ["Lastwagen"], M: ["Mond", "Meer"], N: ["Nebel (Weltraum)"], O: ["Ozean"], P: ["Planet", "Pyramide"], Q: ["Quasar"], R: ["Riesenrad", "Rakete"], S: ["Schiff", "Sonne"], T: ["Turm"], U: ["Universum"], V: ["Vulkan"], W: ["Wolkenkratzer", "Wal"], X: ["Xing (Gebäude)"], Y: ["Yacht (Superyacht)"], Z: ["Zug", "Zeppelin"] },
    verspaetung: { A: ["Auto kaputt", "Arzttermin"], B: ["Bus verpasst", "Bahn zu spät"], C: ["Chaos auf der Straße"], D: ["Durchfall"], E: ["Eingeschlafen"], F: ["Fahrradplatten"], G: ["Glatteis"], H: ["Hund weggelaufen"], I: ["Im Stau"], J: ["Jacke nicht gefunden"], K: ["Krankheit", "Kind krank"], L: ["Liegengeblieben"], M: ["Mutter angerufen"], N: ["Notfall"], O: ["Oma geholfen"], P: ["Polizeikontrolle"], Q: ["Quarantäne"], R: ["Reifenpanne"], S: ["Stau", "Schlüssel verloren"], T: ["Termin vergessen"], U: ["Unfall", "Uhr stehengeblieben"], V: ["Verschlafen"], W: ["Wecker nicht geklingelt"], X: ["X-Box gespielt"], Y: ["Yogakurs überzogen"], Z: ["Zugausfall", "Zahnarzt"] },
    heulen: { A: ["Angst", "Abschied"], B: ["Bein gebrochen"], C: ["Chaos"], D: ["Depression"], E: ["Einsamkeit"], F: ["Film war traurig"], G: ["Geld verloren"], H: ["Hund gestorben", "Heimweh"], I: ["Insolvenz"], J: ["Jemand gestorben"], K: ["Krankheit", "Kummer"], L: ["Liebeskummer"], M: ["Mobbing"], N: ["Note 6 (Schule)"], O: ["Oma gestorben"], P: ["Pech"], Q: ["Qualen"], R: ["Reue"], S: ["Schmerzen", "Schluss gemacht"], T: ["Tod", "Trauer"], U: ["Unfall"], V: ["Verlust", "Verletzung"], W: ["Wut"], X: ["Xenophobie erlebt"], Y: ["Yolo bereut"], Z: ["Zahnweh", "Zwiebeln schneiden"] },
    schulverweis: { A: ["Alkohol getrunken"], B: ["Betrug", "Boxerei"], C: ["Cheaten"], D: ["Drogen", "Diebstahl"], E: ["Erpressung"], F: ["Feueralarm ausgelöst", "Faulheit"], G: ["Gewalt"], H: ["Hausaufgaben nie gemacht", "Handy"], I: ["Insolenz (Respektlosigkeit)"], J: ["Jähzorn"], K: ["Körperverletzung"], L: ["Lehrer beleidigt", "Lügen"], M: ["Mobbing", "Messer mitgebracht"], N: ["Noten gefälscht"], O: ["Ordnungsverstoß"], P: ["Prügelei", "Pöbeln"], Q: ["Quälen"], R: ["Rauchen", "Randalieren"], S: ["Schwänzen", "Schummeln"], T: ["Treten", "Täuschung"], U: ["Unverschämtheit"], V: ["Vandalismus"], W: ["Waffenbesitz"], X: ["X-Treme Respektlosigkeit"], Y: ["YouTuber beleidigt"], Z: ["Zuspätkommen (immer)"] },
    schreibtisch: { A: ["Akten", "Anspitzer"], B: ["Bleistift", "Buch"], C: ["Computer", "Cola-Dose"], D: ["Drucker"], E: ["Edding"], F: ["Füller", "Festplatte"], G: ["Geodreieck", "Glas"], H: ["Hefter", "Handy"], I: ["iPad"], J: ["Joghurtbecher (leer)"], K: ["Kuli", "Kaffeetasse"], L: ["Locher", "Laptop"], M: ["Maus", "Mauspad"], N: ["Notizblock", "Notizzettel"], O: ["Ordner"], P: ["Papier", "Post-its"], Q: ["Quittungen"], R: ["Radiergummi", "Rechner"], S: ["Stift", "Schere", "Schreibtischlampe"], T: ["Tastatur", "Tasse"], U: ["USB-Stick"], V: ["Visitenkarten"], W: ["Wasserflasche"], X: ["XLR-Mikrofon"], Y: ["Yogitee-Tasse"], Z: ["Zettel", "Zirkel"] },
    ameise: { A: ["Atom"], B: ["Bakterium"], C: ["Chloratom"], D: ["DNA-Strang", "Dreckkrümel"], E: ["Elektron"], F: ["Floh", "Fussel"], G: ["Gen", "Goldstaub"], H: ["Haar", "Hautschuppe"], I: ["Ion"], J: ["Jod-Teilchen"], K: ["Krümel", "Korn"], L: ["Luftmolekül"], M: ["Molekül", "Milbe"], N: ["Neutron", "Nanopartikel"], O: ["Ozon-Molekül"], P: ["Proton", "Pollen", "Pixel"], Q: ["Quark (Physik)"], R: ["Roter Blutkörper"], S: ["Staubkorn", "Sandkorn"], T: ["Tautropfen (kleiner)"], U: ["Uranatom"], V: ["Virus"], W: ["Wassertropfen (Mikro)"], X: ["X-Chromosom"], Y: ["Y-Chromosom"], Z: ["Zelle"] },
    letzte_worte: { A: ["Au!", "Auf Wiedersehen"], B: ["Bis bald"], C: ["Ciao", "Crash!"], D: ["Das war's", "Das brennt"], E: ["Endlich", "Entschuldigung"], F: ["Fertig", "Fuck"], G: ["Gott steh mir bei", "Gute Nacht"], H: ["Halt mein Bier", "Hilfe!"], I: ["Ich liebe dich", "Ich sterbe"], J: ["Jetzt geht's los"], K: ["Kacke", "Kalt hier"], L: ["Licht aus"], M: ["Macht's gut"], N: ["Nicht schießen!"], O: ["Oh nein", "Oops"], P: ["Pass auf!"], Q: ["Quatsch"], R: ["Rette sich wer kann"], S: ["Scheiße", "Schmerz"], T: ["Tschüss", "Tut mir leid"], U: ["Uff", "Ups"], V: ["Verdammt"], W: ["Was passiert jetzt?", "Warum?"], X: ["X_X"], Y: ["Yolo!"], Z: ["Zu spät"] },
    keinkindname: { A: ["Adolf", "Arschloch"], B: ["Batman", "Blödmann"], C: ["Corona", "Chewbacca"], D: ["Dulli", "Dracula"], E: ["Esel", "Error"], F: ["Furz"], G: ["Gollum"], H: ["Hurensohn", "Hitler"], I: ["Idiot", "Ikea"], J: ["Judas", "Joker"], K: ["Kevin", "Kacke"], L: ["Lucifer", "Lappen"], M: ["Müll", "Megatron"], N: ["Niemand", "Nutte"], O: ["Opfer", "Osama"], P: ["Pisser", "Pumuckl"], Q: ["Quasimodo"], R: ["Rambo", "Rotz"], S: ["Satan", "Schlampe"], T: ["Trottel", "Thanos"], U: ["Ugly", "Unfall"], V: ["Voldemort", "Vollidiot"], W: ["Wichser"], X: ["Xenomorph"], Y: ["Yeti"], Z: ["Zicke", "Zero"] },
    nogo_date: { A: ["Arroganz", "Anrufen (Ex)"], B: ["Bohren in der Nase"], C: ["Chauvinismus"], D: ["Dreckige Fingernägel"], E: ["Essen schlingen", "Ex erwähnen"], F: ["Furzen"], G: ["Geld schnorren", "Gähnen (laut)"], H: ["Handy spielen"], I: ["Ignoranz"], J: ["Jammern"], K: ["Knoblauchfahne", "Körpergeruch"], L: ["Lügen"], M: ["Mundgeruch"], N: ["Nasebohren"], O: ["Ohrenschmalz zeigen"], P: ["Prahlen", "Popeln"], Q: ["Quengeln"], R: ["Rülpsen"], S: ["Schmatzen", "Stinken"], T: ["Taktlosigkeit"], U: ["Ungepflegt sein"], V: ["Verspätung (extrem)"], W: ["Witze über Randgruppen"], X: ["X-mal aufs Klo gehen"], Y: ["Yolo-Gehabe"], Z: ["Zähne nicht putzen", "Zuspätkommen"] },
    katastrophe: { A: ["Asteroideneinschlag", "Avalanche (Lawine)"], B: ["Beben", "Blizzard"], C: ["Corona-Pandemie"], D: ["Dürre"], E: ["Erdbeben"], F: ["Feuersturm"], G: ["Gletscherabbruch", "Gewitter"], H: ["Hochwasser", "Hurrikan"], I: ["Insektenplage (Heuschrecken)"], J: ["Jahrhundertflut"], K: ["Kometeneinschlag"], L: ["Lawine"], M: ["Meteoriteneinschlag", "Monsun"], N: ["Naturbrand"], O: ["Orkan"], P: ["Pandemie", "Pest"], Q: ["Quake (Erdbeben)"], R: ["Regenkatastrophe"], S: ["Sturm", "Sandsturm", "Springflut"], T: ["Tsunami", "Tornado"], U: ["Überschwemmung"], V: ["Vulkanausbruch"], W: ["Waldbrand", "Wirbelsturm"], X: ["X-Flare (Sonnensturm)"], Y: ["Yellowstone-Ausbruch"], Z: ["Zyklon"] },
    pizza: { A: ["Ananas", "Artischocken"], B: ["Brokkoli", "Bacon"], C: ["Champignons"], D: ["Dönerfleisch"], E: ["Ei", "Erbsen (selten)"], F: ["Fisch", "Feta"], G: ["Gorgonzola", "Garnelen"], H: ["Hinterschinken", "Hähnchenbrust"], I: ["Italienische Salami"], J: ["Jalapenos"], K: ["Käse", "Knoblauch"], L: ["Lachs", "Lauch"], M: ["Mozzarella", "Mais"], N: ["Nudeln (Makkaroni)"], O: ["Oliven", "Oregano"], P: ["Paprika", "Peperoni", "Pilze"], Q: ["Quark (selten)"], R: ["Rucola", "Rindfleisch"], S: ["Salami", "Schinken", "Spinat"], T: ["Tomaten", "Thunfisch"], U: ["Udon-Nudeln (wtf)"], V: ["Veganer Käse"], W: ["Würstchen", "Waldpilze"], X: ["X-tra Käse"], Y: ["Yellow Peppers (Gelbe Paprika)"], Z: ["Zwiebeln"] },
    rapper: { A: ["Apache 207", "Azad"], B: ["Bushido", "Bausa"], C: ["Capital Bra", "Cro", "Cardi B"], D: ["Drake", "Dr. Dre"], E: ["Eminem", "Eko Fresh"], F: ["Fler", "Farid Bang"], G: ["Gzuz"], H: ["Haftbefehl"], I: ["Ice Cube"], J: ["Jay-Z", "Juju"], K: ["Kanye West", "Kollegah"], L: ["Lil Wayne", "Luciano"], M: ["Marteria", "Mac Miller"], N: ["Nicki Minaj", "Notorious B.I.G."], O: ["Olexesh"], P: ["Post Malone", "Prinz Pi"], Q: ["Quavo"], R: ["RAF Camora", "Rick Ross"], S: ["Snoop Dogg", "Sido", "Shiraz"], T: ["Tupac", "Travis Scott"], U: ["Ufo361"], V: ["Veysel"], W: ["Wu-Tang Clan", "Wiz Khalifa"], X: ["XXXTentacion", "Xzibit"], Y: ["Yung Hurn"], Z: ["Zuna", "Zet"] },
    sehenswuerdigkeit: { A: ["Akropolis", "Alcatraz"], B: ["Big Ben", "Brandenburger Tor"], C: ["Colosseum", "Chinesische Mauer"], D: ["Dom (Kölner)", "Disneyland"], E: ["Eiffelturm"], F: ["Freiheitsstatue", "Frauenkirche"], G: ["Golden Gate Bridge", "Grand Canyon"], H: ["Hollywood Sign"], I: ["Insel Mainau"], J: ["Jungfraujoch"], K: ["Kreml", "Kölner Dom"], L: ["Louvre", "London Eye"], M: ["Machu Picchu", "Mount Everest"], N: ["Niagarafälle", "Neuschwanstein"], O: ["Opernhaus Sydney"], P: ["Pyramiden von Gizeh", "Petersdom"], Q: ["Qutb Minar"], R: ["Reichstag", "Roter Platz"], S: ["Sphinx", "Schiefer Turm von Pisa"], T: ["Taj Mahal", "Tower Bridge"], U: ["Uluru (Ayers Rock)"], V: ["Vatikan", "Versailles"], W: ["Weiße Haus (The White House)", "Walk of Fame"], X: ["Xian Terrakotta-Armee"], Y: ["Yellowstone Nationalpark"], Z: ["Zugspitze", "Zwinger"] },
    superkraft: { A: ["Atmen unter Wasser"], B: ["Beamen"], C: ["Chamäleon-Tarnung"], D: ["Durch Wände gehen"], E: ["Eis-Atem", "Elementarkontrolle"], F: ["Fliegen", "Feuer spucken"], G: ["Gedankenlesen", "Gestaltwandeln"], H: ["Heilung (schnell)"], I: ["Unsichtbarkeit (Invisibility)"], J: ["Jumper (Teleportation)"], K: ["Kraftfeld erzeugen", "Klonen"], L: ["Laseraugen", "Levitation"], M: ["Magnetismus", "Mind Control"], N: ["Nachtsicht"], O: ["Omnipotenz"], P: ["Pflanzenwachstum"], Q: ["Quantensprung"], R: ["Röntgenblick", "Regeneration"], S: ["Superstärke", "Superschnelligkeit", "Zeitreisen"], T: ["Telepathie", "Telekinese"], U: ["Unsichtbarkeit", "Unverwundbarkeit"], V: ["Verwandlung", "Vision in die Zukunft"], W: ["Wetterkontrolle", "Wasserbändigen"], X: ["X-Ray Vision (Röntgenblick)"], Y: ["Yin-Yang Kontrolle (Balance)"], Z: ["Zeitreisen", "Zukunftsvorhersage"] },
    nichttun_essen: { A: ["Abfall", "Ameisen"], B: ["Batterien", "Blei"], C: ["Chemikalien"], D: ["Dreck"], E: ["Erbrochenes"], F: ["Fäkalien", "Fliegen"], G: ["Glas", "Gift"], H: ["Hundekot"], I: ["Insekten"], J: ["Jauche"], K: ["Kot", "Kies"], L: ["Lava"], M: ["Müll", "Maden"], N: ["Nägel"], O: ["Ohrenschmalz"], P: ["Plastik", "Pappe"], Q: ["Quecksilber"], R: ["Rattengift", "Rost"], S: ["Steine", "Sand"], T: ["Tapete"], U: ["Urin"], V: ["Vogelkot"], W: ["Waschmittel"], X: ["Xenon-Gas"], Y: ["Yersinia-Bakterien"], Z: ["Zement"] },
    nichttun_klo: { A: ["Ausruhen"], B: ["Baden"], C: ["Campen"], D: ["Dinieren", "Dating"], E: ["Essen", "Einschlafen"], F: ["Fernsehen", "Frühstücken"], G: ["Grillen"], H: ["Hausaufgaben machen"], I: ["Im Internet surfen (zu lange)"], J: ["Joggen"], K: ["Kochen", "Klavier spielen"], L: ["Lesen (Bücher)"], M: ["Malen", "Musizieren"], N: ["Nähen"], O: ["Operieren"], P: ["Party machen", "Pizza essen"], Q: ["Quiz spielen"], R: ["Rauchen"], S: ["Schlafen", "Singen"], T: ["Tanzen", "Tauchen"], U: ["Umziehen"], V: ["Verstecken spielen"], W: ["Wäsche waschen"], X: ["Xylophon spielen"], Y: ["Yoga"], Z: ["Zähneputzen (aus der Toilette)"] },
    tanzart: { A: ["Ausdruckstanz", "Aerobic-Tanz"], B: ["Ballett", "Breakdance", "Bachata"], C: ["Cha-Cha-Cha", "Charleston"], D: ["Disco", "Dancehall"], E: ["Electro Dance"], F: ["Flamenco", "Foxtrott"], G: ["Gogo-Dance"], H: ["Hip-Hop", "Hula"], I: ["Irish Dance"], J: ["Jazz Dance", "Jive"], K: ["Kizomba", "Krumping"], L: ["Langsamer Walzer", "Line Dance", "Latin"], M: ["Mambo", "Merengue"], N: ["Neoklassisches Ballett"], O: ["Orientalischer Tanz"], P: ["Paso Doble", "Popping"], Q: ["Quickstep"], R: ["Rumba", "Rock 'n' Roll"], S: ["Salsa", "Samba", "Shuffle"], T: ["Tango", "Tap Dance (Stepptanz)"], U: ["Urban Dance"], V: ["Voguing", "Wiener Walzer"], W: ["Walzer", "West Coast Swing"], X: ["X-Step (Line Dance)"], Y: ["YMCA Dance"], Z: ["Zumba", "Zouk"] },
    tutweh: { A: ["Armbruch", "Auge gestochen"], B: ["Beinbruch", "Bienenstich"], C: ["Chilischote im Auge"], D: ["Daumen eingeklemmt"], E: ["Eisprung (manchmal)"], F: ["Finger einklemmen", "Feuer"], G: ["Gegen die Tür laufen", "Genickbruch"], H: ["Herzinfarkt", "Hinfallen", "Haareziehen"], I: ["Injektion (Spritze)"], J: ["Juckreiz (extrem)"], K: ["Kopfschmerzen", "Knochenbruch"], L: ["Liebeskummer", "Leistenbruch"], M: ["Migräne", "Messerstich"], N: ["Nierensteine", "Nadelstich"], O: ["Ohrfeige", "Ohrenschmerzen"], P: ["Peitschenhieb", "Pickel ausdrücken"], Q: ["Quetschung"], R: ["Rückenweh", "Risswunde"], S: ["Schnittwunde", "Sonnenbrand", "Stromschlag"], T: ["Tritt in den Schritt", "Tattoo"], U: ["Umknicken", "Unterleibsschmerzen"], V: ["Verbrennung", "Verstauchung"], W: ["Wespenstich", "Wehen"], X: ["X-Beine korrigieren"], Y: ["Yucatan-Bienenstich"], Z: ["Zahnschmerzen", "Zeh anstoßen"] },
    werbeslogan: { A: ["Alles super!", "Auf diese Steine können Sie bauen"], B: ["Bin ich billig drangekommen", "Because you're worth it"], C: ["Come in and find out"], D: ["Das Auto", "Die tun was", "Da weiß man, was man hat"], E: ["Entdecke die Möglichkeiten"], F: ["Freude am Fahren"], G: ["Gute Preise, Gute Besserung", "Geiz ist geil"], H: ["Haribo macht Kinder froh"], I: ["Ich liebe es (I'm lovin' it)"], J: ["Just do it"], K: ["Keine Kompromisse"], L: ["Länger kauen, länger lachen"], M: ["Macht mobil, bei Arbeit, Sport und Spiel", "Melts in your mouth, not in your hand"], N: ["Nichts ist unmöglich"], O: ["Oft kopiert, nie erreicht"], P: ["Probier's mal mit Gemütlichkeit"], Q: ["Quadratisch. Praktisch. Gut."], R: ["Red Bull verleiht Flügel"], S: ["So wertvoll wie ein kleines Steak"], T: ["Taste the Rainbow"], U: ["Unmögliches möglich machen"], V: ["Vorsprung durch Technik"], W: ["Waschmaschinen leben länger mit Calgon", "Wir geben Ihrer Zukunft ein Zuhause"], X: ["X-treme Erfrischung"], Y: ["Yes we can"], Z: ["Zarte Versuchung", "Zu Risiken und Nebenwirkungen..."] },
    fremdsprache: { A: ["Amour", "Adios", "Amigo"], B: ["Bonjour", "Baguette", "Bravissimo"], C: ["Ciao", "Cerveza", "Croissant"], D: ["Danke (Dank u)", "Despacito"], E: ["Excusez-moi", "Excelente"], F: ["Fiesta", "Fromage"], G: ["Gracias", "Grazie", "Guten Tag"], H: ["Hola", "Hello"], I: ["Inshallah", "I love you"], J: ["Je t'aime", "Jalapeno"], K: ["Konnichiwa", "Karma"], L: ["Love", "Loco"], M: ["Merci", "Mamma mia", "Muchacho"], N: ["Namaste", "Njet"], O: ["Oui", "Olé"], P: ["Por favor", "Pizza", "Pasta"], Q: ["Que pasa"], R: ["Rendezvous"], S: ["Salut", "Si", "Sorry"], T: ["Tschüss (Ciao)", "Thank you"], U: ["Uno"], V: ["Vamos", "Voila"], W: ["Water", "Welcome"], X: ["Xie xie (Danke chin.)"], Y: ["Yes", "Yalla"], Z: ["Zero"] }
  };

  function getRandom(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ============================================================
  // EXAKTES CATEGORY MATCHING (Mit allen 30+ Kategorien)
  // ============================================================
  const CATEGORY_MATCHERS = [
    { patterns: ["stadt", "ort"], key: "stadt" },
    { patterns: ["land", "staat", "nation"], key: "land" },
    { patterns: ["fluss", "gewässer", "bach"], key: "fluss" },
    { patterns: ["tier", "insekt", "säugetier"], key: "tier" },
    { patterns: ["beruf", "job", "arbeit"], key: "beruf" },
    { patterns: ["pflanze", "baum", "blume"], key: "pflanze" },
    { patterns: ["name", "vorname", "mädchenname", "jungenname"], key: "name" },
    { patterns: ["film", "movie", "kino"], key: "film" },
    { patterns: ["farbe", "color"], key: "farbe" },
    { patterns: ["gefühl", "emotion"], key: "gefühl" },
    { patterns: ["krankheit", "leiden", "syndrom"], key: "krankheit" },
    { patterns: ["promi", "star", "schauspieler", "sänger"], key: "promi" },
    { patterns: ["lebensmittel", "essen", "speise", "gericht"], key: "lebensmittel" },
    { patterns: ["getränk", "trinken"], key: "getraenk" },
    { patterns: ["hobby", "freizeit", "beschäftigung"], key: "hobby" },
    { patterns: ["sport", "sportart"], key: "sportart" },
    { patterns: ["körperteil", "organ"], key: "koerperteil" },
    { patterns: ["schimpfwort", "beleidigung"], key: "schimpfwort" },
    { patterns: ["computerspiel", "videospiel", "game"], key: "computerspiel" },
    { patterns: ["todesursache", "todesart"], key: "todesursache" },
    { patterns: ["scheidungsgrund", "trennungsgrund"], key: "scheidungsgrund" },
    { patterns: ["instrument", "musikinstrument"], key: "instrument" },
    { patterns: ["politiker", "präsident", "kanzler"], key: "politiker" },
    { patterns: ["marke", "firma", "unternehmen"], key: "marke" },
    
    // DIE NEUEN BILD-KATEGORIEN
    { patterns: ["bauernhof", "hof", "landwirtschaft"], key: "bauernhof" },
    { patterns: ["anmachspruch", "spruch", "flirten"], key: "anmachspruch" },
    { patterns: ["chemisches element", "chemie", "element"], key: "chemie" },
    { patterns: ["cocktail", "drink", "alkoholisch"], key: "cocktail" },
    { patterns: ["kühlschrank", "fehlen"], key: "kuehlschrank" },
    { patterns: ["dinoart", "dino", "dinosaurier"], key: "dinoart" },
    { patterns: ["erhöht die coolness", "coolness"], key: "coolness" },
    { patterns: ["senkt die coolness"], key: "senktcoolness" },
    { patterns: ["erfundener beruf", "fake beruf"], key: "erfundenerberuf" },
    { patterns: ["etwas ekeliges", "ekelig"], key: "ekelig" },
    { patterns: ["eissorte", "eis"], key: "eissorte" },
    { patterns: ["englisches wort", "englisch"], key: "englisch" },
    { patterns: ["elektrisches gerät", "elektrisch"], key: "elektrisch" },
    { patterns: ["fabelwesen", "fantasie", "mythos"], key: "fabelwesen" },
    { patterns: ["fortbewegungsmittel", "fortbewegung", "fahrzeug"], key: "fortbewegung" },
    { patterns: ["grabsteininschrift", "grabstein", "inschrift"], key: "grabstein" },
    { patterns: ["größer als ein elefant", "elefant"], key: "groesserelefant" },
    { patterns: ["grund für verspätung", "verspätung"], key: "verspaetung" },
    { patterns: ["grund zum heulen", "heulen"], key: "heulen" },
    { patterns: ["grund für schulverweis", "schulverweis"], key: "schulverweis" },
    { patterns: ["gegenstand auf dem schreibtisch", "schreibtisch"], key: "schreibtisch" },
    { patterns: ["kleiner als eine ameise", "ameise"], key: "ameise" },
    { patterns: ["letzte worte", "letzte"], key: "letzte_worte" },
    { patterns: ["namen den man keinem kind", "kind"], key: "keinkindname" },
    { patterns: ["no-go beim ersten date", "date"], key: "nogo_date" },
    { patterns: ["naturkatastrophe", "katastrophe"], key: "katastrophe" },
    { patterns: ["pizzabelag", "pizza"], key: "pizza" },
    { patterns: ["rappername", "rapper"], key: "rapper" },
    { patterns: ["sehenswürdigkeit", "attraktion"], key: "sehenswuerdigkeit" },
    { patterns: ["superkraft", "held"], key: "superkraft" },
    { patterns: ["sollte man nicht essen", "nicht essen"], key: "nichttun_essen" },
    { patterns: ["nicht auf der toilette tun", "toilette"], key: "nichttun_klo" },
    { patterns: ["tanzart", "tanz"], key: "tanzart" },
    { patterns: ["tut weh", "schmerzhaft"], key: "tutweh" },
    { patterns: ["werbeslogan", "slogan", "werbung"], key: "werbeslogan" },
    { patterns: ["fremdsprache", "fremdwort"], key: "fremdsprache" }
  ];

  function matchCategory(categoryLabel) {
    const normalized = categoryLabel.toLowerCase().trim();
    for (const matcher of CATEGORY_MATCHERS) {
      for (const pattern of matcher.patterns) {
        if (normalized.includes(pattern)) return matcher.key;
      }
    }
    return null;
  }

  // ============================================================
  // ULTRA SMART FALLBACK GENERATOR (Für GANZ wilde Kategorien)
  // ============================================================
  function generateCreativeFallback(category, letter) {
    const l = letter.toUpperCase();
    return l + "ding"; // Ultimate fallback if REALLY not found
  }

  function getAnswer(categoryKey, letter) {
    const upperLetter = letter.toUpperCase();
    if (ANSWERS[categoryKey] && ANSWERS[categoryKey][upperLetter]) {
      return getRandom(ANSWERS[categoryKey][upperLetter]);
    }
    // Try to fallback to "stadt" or "name" just so it types SOMETHING if the letter is missing
    if (ANSWERS['name'][upperLetter]) {
       return getRandom(ANSWERS['name'][upperLetter]);
    }
    return null;
  }

  function getGenericAnswer(categoryLabel, letter) {
    const categoryKey = matchCategory(categoryLabel);
    if (categoryKey) {
      const answer = getAnswer(categoryKey, letter);
      if (answer) return { text: answer, isFallback: false };
    }
    return { text: generateCreativeFallback(categoryLabel, letter), isFallback: true };
  }

  // ============================================================
  // DOM INTERACTION & TYPING
  // ============================================================
  const SETTINGS = { typingSpeed: 5, autoSubmitDelay: 500, humanMode: true, stealthMode: false, soundEnabled: true };
  let stats = { wordsFilled: parseInt(localStorage.getItem('slf_words_filled') || '0'), gamesPlayed: parseInt(localStorage.getItem('slf_games_played') || '0') };
  const historyStack = new WeakMap();

  function updateStats(words) {
    stats.wordsFilled += words;
    localStorage.setItem('slf_words_filled', stats.wordsFilled);
    updateStatsUI();
  }

  function getCurrentLetter() {
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      if (el.children.length === 0 || el.tagName === 'SPAN' || el.tagName === 'BADGE') {
        const text = el.textContent.trim();
        const match = text.match(/Buchstabe[:\s]*([A-Za-zÄÖÜäöü])\s*$/i) || text.match(/Letter[:\s]*([A-Za-z])\s*$/i);
        if (match) return match[1].toUpperCase();
      }
    }
    const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
    for (const input of inputs) {
      const match = (input.placeholder || '').match(/mit\s+([A-Za-zÄÖÜäöü])\s*$/i);
      if (match) return match[1].toUpperCase();
    }
    return null;
  }

  const processedInputs = new WeakSet();

  function getInputFields() {
    const results = [];
    const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
    for (const input of inputs) {
      if (input.offsetParent === null && !input.offsetWidth) continue;
      if (input.disabled || input.readOnly) continue;

      let categoryLabel = '';
      const parent = input.parentElement;
      if (parent) {
        const siblings = parent.querySelectorAll('span, label, div, small, b, strong');
        for (const sib of siblings) {
          if (sib !== input && sib.textContent.trim().length > 0 && sib.textContent.trim().length < 80 && !sib.contains(input)) {
            categoryLabel = sib.textContent.trim();
            break;
          }
        }
      }
      if (!categoryLabel && input.placeholder) {
        const match = input.placeholder.match(/^(.+?)(?:\s+mit\s+[A-Za-zÄÖÜäöü])?$/i);
        if (match) categoryLabel = match[1].trim();
      }
      if (categoryLabel) {
        categoryLabel = categoryLabel.replace(/\s+mit\s+[A-Za-zÄÖÜäöü]\s*$/i, '').trim();
      }
      results.push({ input, category: categoryLabel });
      injectInlineButtons(input, categoryLabel);

      if (!processedInputs.has(input)) {
        processedInputs.add(input);
        input.addEventListener('input', () => {
          if (input.classList.contains('slf-warning-field')) {
            input.classList.remove('slf-warning-field');
            const w = input.parentElement.querySelector('.slf-warning-icon');
            if (w) w.remove();
          }
        });
      }
    }
    return results;
  }

  function triggerEnter(input) {
    const events = [
      new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }),
      new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }),
      new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }),
      new Event('input', { bubbles: true }),
      new Event('change', { bubbles: true }),
      new Event('blur', { bubbles: true })
    ];
    events.forEach(e => input.dispatchEvent(e));
  }

  function setInputValue(input, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    try { if (input.__vue__) input.__vue__.$emit('input', value); } catch (e) { }
  }

  async function typeValue(input, value, category) {
    if (!SETTINGS.humanMode) {
      setInputValue(input, value);
      triggerEnter(input);
      return;
    }
    
    input.focus();
    let current = "";
    for (let i = 0; i < value.length; i++) {
      current += value[i];
      setInputValue(input, current);
      await new Promise(r => setTimeout(r, SETTINGS.typingSpeed + Math.random() * 5));
    }
    triggerEnter(input);
    playBeep();
  }

  // ============================================================
  // UI INJECTIONS
  // ============================================================
  function injectInlineButtons(input, category) {
    const parent = input.parentElement;
    parent.style.position = 'relative';
    
    if (!parent.querySelector('.slf-inline-reroll')) {
      const btn = document.createElement('button');
      btn.innerHTML = '🎲';
      btn.className = 'slf-inline-btn slf-inline-reroll';
      btn.onclick = (e) => {
        e.preventDefault();
        const letter = getCurrentLetter();
        if (!letter) return;

        if (!historyStack.has(input)) historyStack.set(input, []);
        historyStack.get(input).push(input.value);

        const result = getGenericAnswer(category, letter);
        if (result && result.text) {
          typeValue(input, result.text, category);
          handleWarningStatus(input, result.isFallback);
        }
      };
      parent.appendChild(btn);
    }
    
    if (!parent.querySelector('.slf-inline-undo')) {
      const undoBtn = document.createElement('button');
      undoBtn.innerHTML = '↩️';
      undoBtn.className = 'slf-inline-btn slf-inline-undo';
      undoBtn.onclick = (e) => {
        e.preventDefault();
        const stack = historyStack.get(input);
        if (stack && stack.length > 0) {
          const prev = stack.pop();
          typeValue(input, prev, category);
          input.classList.remove('slf-warning-field'); 
          const w = input.parentElement.querySelector('.slf-warning-icon');
          if (w) w.remove();
        }
      };
      parent.appendChild(undoBtn);
    }
  }

  function handleWarningStatus(input, isFallback) {
    const parent = input.parentElement;
    if (isFallback) {
      input.classList.add('slf-warning-field');
      if (!parent.querySelector('.slf-warning-icon')) {
        const icon = document.createElement('span');
        icon.className = 'slf-warning-icon';
        icon.innerHTML = '⚠️';
        icon.title = 'Diese Antwort wurde vom KI-Fallback generiert. Bitte prüfen!';
        parent.appendChild(icon);
      }
    } else {
      input.classList.remove('slf-warning-field');
      const w = parent.querySelector('.slf-warning-icon');
      if (w) w.remove();
    }
  }

  function playBeep() {
    if (!SETTINGS.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.05;
      oscillator.start();
      setTimeout(() => oscillator.stop(), 50);
    } catch(e) {}
  }

  // ============================================================
  // MAIN AUTO-FILL
  // ============================================================
  async function autoFill(forceReroll = false) {
    const letter = getCurrentLetter();
    if (!letter) {
      showNotification('❌ Kein Buchstabe!', 'error');
      return { filled: 0 };
    }

    const fields = getInputFields();
    let filled = 0;

    for (const field of fields) {
      const { input, category } = field;
      if (!forceReroll && input.value && input.value.trim().length > 1) continue;
      
      let result = getGenericAnswer(category, letter);
      if (result && result.text) {
        typeValue(input, result.text, category);
        handleWarningStatus(input, result.isFallback);
        filled++;
      }
    }

    if (filled > 0) {
      updateStats(filled);
      showNotification(`✅ ${filled} Felder gefüllt!`, 'success');
      predictScore(filled);
    }
    return { filled };
  }

  async function autoFillAndSubmit() {
    const { filled } = await autoFill(false);
    if (filled > 0) setTimeout(clickDone, SETTINGS.autoSubmitDelay + (SETTINGS.typingSpeed * 10));
  }

  function clickDone() {
    const buttons = document.querySelectorAll('button, .btn, [role="button"]');
    for (const btn of buttons) {
      const text = btn.textContent.trim().toLowerCase();
      if (text.includes('fertig') || text.includes('done') || text.includes('stop')) {
        btn.click();
        showNotification('🏁 Fertig geklickt!', 'success');
        stats.gamesPlayed++;
        localStorage.setItem('slf_games_played', stats.gamesPlayed);
        updateStatsUI();
        return true;
      }
    }
    return false;
  }

  function predictScore(wordsFilled) {
    const score = wordsFilled * 10;
    document.getElementById('slf-status').textContent = `Erwartete Punkte: ~${score} 🎯`;
  }

  // ============================================================
  // HOTKEYS
  // ============================================================
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyF') { e.preventDefault(); autoFill(false); }
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyG') { e.preventDefault(); autoFillAndSubmit(); }
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyH') { e.preventDefault(); document.getElementById('slf-stealth-btn').click(); }
  });

  // ============================================================
  // UI - PANEL
  // ============================================================
  function createPanel() {
    if (document.getElementById('slf-autofill-panel')) return;
    
    const style = document.createElement('style');
    style.innerHTML = `
      .slf-warning-field { border: 2px solid #ff5252 !important; background-color: rgba(255, 82, 82, 0.05) !important; transition: all 0.3s; }
      .slf-warning-icon { position: absolute; right: 76px; top: 50%; transform: translateY(-50%); font-size: 16px; z-index: 10; pointer-events: none; }
    `;
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'slf-autofill-panel';
    panel.className = 'slf-theme-dark';
    panel.innerHTML = `
      <div class="slf-panel-header" id="slf-panel-header">
        <div class="slf-header-logo"><span class="slf-logo-icon">🚀</span><span class="slf-panel-title">SLF GOD MODE V8</span></div>
        <div class="slf-header-actions">
          <button class="slf-icon-btn" id="slf-stealth-btn" title="Stealth Mode (Ctrl+Shift+H)">🥷</button>
          <button class="slf-icon-btn" id="slf-settings-btn" title="Settings">⚙️</button>
        </div>
      </div>
      <div class="slf-panel-body" id="slf-panel-body">
        <div class="slf-letter-display"><span>Buchstabe</span><div id="slf-current-letter">?</div></div>
        <div class="slf-grid-buttons">
          <button class="slf-btn slf-btn-primary" id="slf-fill-btn" title="Ctrl+Shift+F">⚡ Auto-Fill</button>
          <button class="slf-btn slf-btn-secondary" id="slf-reroll-btn">🎲 Alle Neu</button>
        </div>
        <button class="slf-btn slf-btn-submit" id="slf-fill-submit-btn" title="Ctrl+Shift+G">🚀 Fill & Fertig</button>
        <button class="slf-btn slf-btn-done" id="slf-done-btn">🏁 Nur Fertig</button>
        
        <div class="slf-auto-section">
          <label class="slf-toggle-label">
            <input type="checkbox" id="slf-auto-toggle" />
            <span class="slf-toggle-slider"></span>
            <span>Ghost Mode (Auto-Fill)</span>
          </label>
        </div>

        <div class="slf-stats-box">
          <div class="slf-stat"><span class="slf-stat-val" id="slf-stat-words">${stats.wordsFilled}</span><span class="slf-stat-lbl">Wörter</span></div>
          <div class="slf-stat"><span class="slf-stat-val" id="slf-stat-games">${stats.gamesPlayed}</span><span class="slf-stat-lbl">Runden</span></div>
        </div>
        <div class="slf-settings-panel" id="slf-settings-panel" style="display: none;">
          <div class="slf-setting-row"><label>Tipp-Animation</label><input type="checkbox" id="slf-human-mode" checked /></div>
          <div class="slf-setting-row"><label>Sound FX</label><input type="checkbox" id="slf-sound-mode" checked /></div>
        </div>
        <div class="slf-status" id="slf-status">Bereit zum Zerstören 🔥</div>
      </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('slf-fill-btn').onclick = () => autoFill(false);
    document.getElementById('slf-reroll-btn').onclick = () => autoFill(true);
    document.getElementById('slf-fill-submit-btn').onclick = () => autoFillAndSubmit();
    document.getElementById('slf-done-btn').onclick = clickDone;
    
    document.getElementById('slf-stealth-btn').onclick = () => {
      SETTINGS.stealthMode = !SETTINGS.stealthMode;
      panel.style.opacity = SETTINGS.stealthMode ? '0.1' : '1';
    };

    document.getElementById('slf-settings-btn').onclick = () => {
      const s = document.getElementById('slf-settings-panel');
      s.style.display = s.style.display === 'none' ? 'block' : 'none';
    };

    document.getElementById('slf-human-mode').onchange = (e) => SETTINGS.humanMode = e.target.checked;
    document.getElementById('slf-sound-mode').onchange = (e) => SETTINGS.soundEnabled = e.target.checked;
    
    let autoModeInterval = null;
    let lastLetter = null;
    document.getElementById('slf-auto-toggle').onchange = (e) => {
      if (e.target.checked) {
        document.getElementById('slf-status').textContent = '👻 Ghost Mode aktiv';
        autoModeInterval = setInterval(() => {
          const l = getCurrentLetter();
          if (l && l !== lastLetter) {
            lastLetter = l;
            setTimeout(() => autoFill(false), 600);
          } else if (!l) lastLetter = null;
        }, 1000);
      } else {
        clearInterval(autoModeInterval);
        document.getElementById('slf-status').textContent = 'Bereit zum Zerstören 🔥';
      }
    };

    setInterval(updateLetterDisplay, 1000);
  }

  function updateStatsUI() {
    const w = document.getElementById('slf-stat-words');
    const g = document.getElementById('slf-stat-games');
    if (w) w.textContent = stats.wordsFilled;
    if (g) g.textContent = stats.gamesPlayed;
  }

  function updateLetterDisplay() {
    const el = document.getElementById('slf-current-letter');
    if (el) {
      const letter = getCurrentLetter();
      el.textContent = letter || '?';
      el.className = letter ? 'active' : '';
      getInputFields(); 
    }
  }

  function showNotification(message, type = 'info') {
    const t = document.createElement('div');
    t.className = `slf-toast slf-toast-${type}`;
    t.textContent = message;
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.transform = 'translateX(0)'; t.style.opacity = '1'; });
    setTimeout(() => {
      t.style.transform = 'translateX(100%)'; t.style.opacity = '0';
      setTimeout(() => t.remove(), 300);
    }, 2500);
  }

  function init() {
    if (!document.getElementById('slf-autofill-panel')) createPanel();
  }
  
  setInterval(init, 2000);
  init();

})();
