# AKTENZEICHEN UNGELÖST — Änderungen v3.0

Vollständige Liste aller Neuerungen gegenüber der ersten Fassung.

---

## A · Fälle und Inhalte (1–46)

1. Von 2 auf **20 Fälle** erweitert
2. Fälle aus **12 Ländern** statt nur Deutschland
3. Deutschland: 8 Fälle
4. Österreich, Schweiz, Niederlande, Belgien ergänzt
5. Großbritannien, Irland, Island, Norwegen ergänzt
6. Frankreich, Italien, Spanien ergänzt
7. **194 Ermittlungshinweise** insgesamt (vorher 18)
8. **113 Verdächtige** mit vollständiger Biografie
9. **53 Aktendokumente** als Faksimile
10. **272 Quell-Links**, jeder einzeln geprüft
11. Jeder Hinweis hat jetzt eine **anklickbare Quelle**
12. Mischung aus bekannten und unbekannten Fällen (Feld `famous`)
13. Fall-Längen eingeführt: kurz (6 Hinweise), mittel (10), lang (14)
14. Geschätzte Spieldauer je Fall (~16 / ~26 / ~38 Min)
15. Vierstufige Schwierigkeit statt dreistufig
16. Schwierigkeitsbezeichnungen: leicht / machbar / knifflig / sehr schwer
17. **Ausführliches Opfer-Dossier** je Fall (180–280 Wörter)
18. **„Der letzte gesicherte Tag"** als eigene Zeitachse je Fall
19. Opfer-Informationen aus den Hinweisen entfernt — sie gehören ins Dossier
20. Hinweise sind jetzt ausschließlich **Ermittlungsergebnisse**
21. Hinweistexte von ~60 auf 120–200 Wörter verlängert
22. Neue Hinweis-Kategorien: `digital` (Handy/GPS/Funkzelle) und `alibi`
23. Jeder Fall nutzt mindestens 5 verschiedene Kategorien
24. Verdächtigen-Biografien mit „was dafür und was dagegen spricht"
25. Verdächtige haben jetzt eine benannte **Stellung** (Rolle) im Fall
26. **Polizei-Verdachtsverlauf** (`policeTrack`) für jeden Fall
27. 4–6 Verdachtsstationen je Fall, inklusive falscher Fährten
28. Teaser-Text je Fall fürs Auswahlmenü
29. Untertitel je Fall zur sachlichen Einordnung
30. Ländercode-Kürzel für die Fallkarten
31. Gerichtsangabe und Aktenzeichen je Fall
32. Urteilsstatus je Fall (rechtskräftig seit / nicht rechtskräftig)
33. Wörtliches Zitat aus der Urteilsbegründung je Fall
34. Auflösungstexte von ~120 auf 200–300 Wörter erweitert
35. Fall Berlin-Zehlendorf komplett neu geschrieben
36. Fall Klipphausen durch die tiefer recherchierte Fassung ersetzt
37. Neu: Mordfall Mülheimer Insel (Köln 2024) mit **drei Angeklagten in drei Rollen**
38. Faktenfehler korrigiert: „über 80 Stichwunden" → tatsächlich drei Stiche
39. Faktenfehler korrigiert: „Selbstanzeige" → Festnahme am Tatort
40. Faktenfehler korrigiert: „joggt im Treppenhaus" → Laufstrecke auf der Straße
41. Unbelegte Details aus den Hinweisen entfernt (z.B. „kein Raubgut fehlt")
42. Verteidigungsvortrag wird jetzt als solcher gekennzeichnet, nicht als Tatsache
43. Fall Frederike von Möhlmann geprüft und **verworfen** — Wiederaufnahme vom BVerfG gekippt, der Mann bleibt freigesprochen
44. Regel eingeführt: Freigesprochene erscheinen nie als Täter
45. Regel eingeführt: zu Unrecht Verdächtigte nur mit Rollenbezeichnung
46. Alle Falldaten in `cases.json` ausgelagert und dokumentiert

## B · Startseite und Navigation (47–74)

47. **Startseiten-Hub** mit sechs Bereichen statt zwei Buttons
48. Kachel „Turnier · Zwei Ermittler"
49. Kachel „Solo-Training"
50. Kachel „Fall-Archiv"
51. Kachel „Statistik"
52. Kachel „Einstellungen"
53. Kachel „Spielregeln"
54. Live-Zahlenleiste auf der Startseite (Fälle, Hinweise, Länder, Dokumente, Verdächtige)
55. Zahlen werden aus den Daten berechnet, nicht hart geschrieben
56. Hover-Effekt mit Farbbalken an jeder Kachel
57. „Klassiker"-Marke an der Turnier-Kachel
58. Versionsstempel sichtbar auf der Startseite
59. Einheitlicher Seitenkopf mit Zurück-Button auf allen Unterseiten
60. Schritt-Anzeige („Schritt 2 von 4") in der Turnier-Strecke
61. Skip-Link „Zum Inhalt springen" für Tastaturnutzer
62. `<main>`-Landmark für Screenreader
63. Neue Seite: Fall-Archiv
64. Neue Seite: Fall-Detailansicht
65. Neue Seite: Statistik
66. Neue Seite: globale Einstellungen
67. Direktlink zu einem Fall über `?case=<id>`
68. Fortschrittsbalken unter der Kopfzeile während des Spiels
69. Rundenanzeige in der Kopfzeile bei Best-of-Turnieren
70. Raumcode-Anzeige in der Kopfzeile im Zwei-Geräte-Modus
71. Abbrechen-Button in der Kopfzeile mit Rückfrage
72. Führender Spieler wird im Punktestand hervorgehoben
73. Regelwerk von 6 auf 7 Abschnitte erweitert
74. Regeln beschreiben jetzt auch Dokumente und Verdachtsverlauf

## C · Fall-Archiv (75–96)

75. Durchstöberbares Archiv aller Fälle
76. Volltextsuche über Titel, Ort, Land, Gericht, Stichworte, Opfername
77. Filter nach Land
78. Filter nach Spieldauer
79. Filter nach Schwierigkeit
80. Filter nach Jahrzehnt
81. Filter nach Einzeltäter / mehrere Beteiligte
82. Filter nach bekannten / unbekannten Fällen
83. Sortierung nach Land
84. Sortierung nach Jahr
85. Sortierung nach Schwierigkeit
86. Sortierung nach Länge
87. Sortierung nach Titel
88. „Filter zurücksetzen"-Button
89. Trefferzähler („12 von 20 Fällen")
90. Leerzustand mit Hinweis, wenn kein Fall passt
91. Detailansicht mit komplettem Dossier
92. Detailansicht mit vollständigem Personenkreis
93. Detailansicht mit allen Hinweisen — hinter Spoiler-Sperre
94. Detailansicht mit Auflösung — hinter separater Spoiler-Sperre
95. Detailansicht mit Ermittlungsverlauf der Polizei
96. „Diesen Fall spielen"-Button direkt aus dem Archiv

## D · Dokumente und PDFs (97–124)

97. **Faksimile-Renderer** für Aktendokumente
98. Behörden-Briefkopf mit Absender
99. Aktenzeichen und Datum rechtsbündig
100. Zentrierter Dokumenttitel zwischen Linien
101. Zweispaltige Feldtabelle (Einsatzort, Meldung, Sachbearbeiter …)
102. Fließtext im Behördenton, im Blocksatz gesetzt
103. Unterschriftenzeile mit Linie
104. Doppelt umrandeter Stempel, leicht gedreht
105. Perforationskante am oberen Rand
106. **Schwärzungen** werden als echte schwarze Balken gerendert
107. Schwärzungen mit `aria-label` für Screenreader
108. Sechs Dokumenttypen: Polizeibericht, Rechtsmedizin, Gerichtsprotokoll, Vernehmung, Gutachten, Presseausschnitt
109. Dokumentvorschauen als Karten mit Typ, Titel, Behörde
110. Gesperrte Dokumente sind ausgegraut mit Schlosssymbol
111. Anzeige „ab Hinweis N" an gesperrten Dokumenten
112. Dokumente schalten sich mit dem Spielfortschritt frei
113. Hinweis-Meldung bei neu freigeschaltetem Dokument
114. Eigener Reiter „Akte" im Spielbrett
115. Zähler im Reiter zeigt freigeschaltete Dokumente
116. Vollbild-Ansicht für Dokumente
117. Dokumente drucken
118. **Echte Gerichts-PDFs** eingebettet
119. Zweistufiger Fallback: lokale Kopie → Original-URL → Hinweistext mit Link
120. `download-pdfs.ps1` lädt die PDFs einmalig herunter
121. Heruntergeladene PDFs werden automatisch bevorzugt angezeigt
122. Eigener Ordner `docs/` für die Originaldokumente
123. PDF-Karten optisch von Faksimile unterschieden
124. Dokumente auch im Archiv und im Endscreen verfügbar

## E · Spielmodi (125–146)

125. **Solo-Trainingsmodus** neu
126. Solo zählt für die persönliche Statistik
127. **Best-of-3-Turnier** neu
128. **Best-of-5-Turnier** neu
129. Rundenzähler über mehrere Fälle
130. Rundensiege werden getrennt von Punkten gezählt
131. „Runde N starten"-Button am Rundenende
132. Turnier vorzeitig beenden möglich
133. Formatwahl auf der Modusseite
134. Zwei-Geräte-Modus überträgt jetzt auch Format und Rundenstand
135. Zwei-Geräte-Modus überträgt Spieloptionen an den Gast
136. **Schwerer Modus**: keine Verdächtigen-Biografien während des Spiels
137. Schwerer Modus blendet den Polizei-Verdachtsverlauf aus
138. **Blindwertung**: Punktestand bleibt bis zum Rundenende verborgen
139. Polizei-Verdachtsanzeige einzeln abschaltbar
140. Aktendokumente einzeln abschaltbar
141. „Fair losen": findet zwei Fälle mit gleicher Schwierigkeit, Länge und Täterzahl
142. „Zufall"-Button respektiert die gesetzten Filter
143. Filter auch in der Fallauswahl verfügbar
144. Bereits gelöste Fälle sind in der Auswahl markiert
145. Solo-Modus blendet den zweiten Punktestand aus
146. Fallauswahl zeigt im Zwei-Geräte-Modus, was der Mitspieler gewählt hat

## F · Spielbrett (147–178)

147. **Skip-Button** an jeder Akte
148. Skip-Regel: frei / kostet 0,1 Punkte / gesperrt
149. Skip-Kosten werden erst vom Gewinn abgezogen, nie ins Minus
150. Tastenkürzel `S` zum Skippen
151. Vierter Reiter „Akte" für Dokumente
152. Zähler an den Reitern (Hinweise, Dokumente, Verdächtige)
153. Reiter horizontal scrollbar auf schmalen Displays
154. **Hinweise anheften** per Reißzwecke
155. Angeheftete Hinweise bekommen einen farbigen Rahmen
156. **Verdächtige markieren** per Fahnensymbol
157. Markierte Verdächtige bekommen einen Farbbalken
158. Zeichenzähler am Notizblock
159. Notizen überleben den Wechsel zwischen Reitern
160. Polizei-Verdachtsanzeige über jeder Akte
161. Verdachtsanzeige aktualisiert sich mit jedem Hinweis
162. Fortschrittsbalken in der Kopfzeile
163. Schwierigkeitsangabe in der Akten-Kopfzeile
164. Timer-Ring wechselt in den letzten 20 Sekunden die Farbe
165. Tickgeräusch in den letzten 5 Sekunden
166. Pause friert die Timer korrekt ein und rechnet sie danach weiter
167. Pause-Symbol wechselt zwischen Pause und Play
168. Hinweiskarten fliegen leicht gedreht ein
169. „NEU"-Markierung blinkt fünfmal und verschwindet dann
170. Ermittlungsskizzen als Inline-SVG in Hinweisen
171. Quellenzeile in jeder Hinweiskarte mit Link
172. Zitate in Hinweisen abgesetzt dargestellt
173. Kategoriefarben für alle neun Hinweisarten
174. Warnhinweis im Briefing bei Fällen mit mehreren Beteiligten
175. Briefing enthält jetzt Schwierigkeit und Hinweiszahl
176. Akte im Briefing druckbar
177. Tastenkürzel `A` öffnet das Archiv
178. Tastenkürzel `Esc` schließt Anklage und Dokumentansicht

## G · Anklage und Wertung (179–196)

179. **Rollenzuordnung** bei mehreren Beteiligten (Täter / Helfer)
180. Dreistufiges Antippen: Täter → Helfer → aufheben
181. Rollenwahl entfällt automatisch bei Einzeltäter-Fällen
182. Farbcodierte Zeilen: rot für Täter, gelb für Helfer
183. Rollenetikett an jeder Zeile
184. Wertung: alles richtig = 1,0 Punkte
185. Wertung: Täter richtig, Rollen daneben = 0,7
186. Wertung: nur Mitverurteilten erwischt = 0,4, Akte bleibt offen
187. Wertung: Unschuldiger beschuldigt = 0, Ermittlung beendet
188. Nachbesserung möglich: nach Teiltreffer auf insgesamt 1,0 auffüllbar
189. Ergebnistext benennt konkret, wer richtig und wer falsch war
190. Ergebnistext nennt bei Fehlern die tatsächliche Rollenverteilung
191. Skip-Abzug wird im Ergebnistext ausgewiesen
192. Drei Ergebnissymbole: Haken, Kreuz, Halbkreis
193. Eigener Klang für Treffer, Teiltreffer und Fehlschlag
194. Anklage per Tastenkürzel `1` und `2`
195. Anklage-Dialog per Klick auf den Hintergrund schließbar
196. Schließen-Kreuz in allen Dialogen

## H · Statistik (197–210)

197. **Statistikseite** neu
198. Zähler: bearbeitete Akten
199. Zähler: gelöste Fälle
200. Trefferquote in Prozent
201. Durchschnittliche Hinweiszahl bis zur Lösung
202. Fortschritt „X von 20 Fällen geknackt"
203. **Bestenliste** über alle Spieler
204. Bestenliste sortiert nach Punkten
205. Spalten: Punkte, Akten, Gelöst, Ø Hinweise
206. Tabelle nach Fall: Versuche und Lösungen je Fall
207. Statistik wird lokal gespeichert, verlässt das Gerät nicht
208. Statistik als JSON-Datei exportierbar
209. Statistik einzeln zurücksetzbar
210. Gelöste Fälle werden in Archiv und Auswahl markiert

## I · Design (211–242)

211. **Fünf Themes** statt drei
212. Neues Theme „Blaupause" (technisches Blau mit Orange)
213. Neues Theme „Hoher Kontrast" (Schwarz/Weiß/Gelb)
214. Theme-Wechsel per Taste `T` durch alle fünf
215. **Vier Schriftgrößen** (klein bis sehr groß)
216. Alle Größen relativ zur Basisschrift, nicht in Pixeln
217. Zeilenraster im Papier korrigiert — Text sitzt exakt auf den Linien
218. Zeilenhöhe skaliert mit der Schriftgröße
219. Filmkorn abschaltbar
220. Animationen abschaltbar
221. Signaltöne abschaltbar
222. Einstellungen überleben den Neustart
223. Fallkarten mit Länderkürzel-Plakette
224. Fallkarten mit Schwierigkeitspunkten
225. Fallkarten mit Dauer-Plakette
226. Fallkarten mit Beteiligten-Plakette
227. Fallkarten mit Dokumentenzahl
228. Fallkarten mit „bekannt"-Markierung
229. Fallkarten mit „gelöst"-Markierung
230. Farbbalken links an jeder Fallkarte
231. Auswahlnummer als Kreis auf gewählten Karten
232. Dokumentkarten kippen beim Überfahren leicht
233. Statistikkacheln im eigenen Stil
234. Bestenlisten-Tabelle mit Zeilen-Hover
235. Spoiler-Überdeckung für Hinweise und Auflösung
236. Umschalter (Toggle-Switches) für alle Ja/Nein-Optionen
237. Modal-Kopfzeilen bleiben beim Scrollen stehen
238. Dialoge maximal 93 % der Bildschirmhöhe, dann scrollbar
239. Breite Variante für den Dokument-Dialog
240. Einheitliche Schattentiefen als Variablen
241. Fokusrahmen deutlicher (2,5 px statt 2 px)
242. Druckstil: Kopfzeile, Reiter und Buttons verschwinden

## J · Technik, Barrierefreiheit, Robustheit (243–271)

243. **Service Worker auf Netz-zuerst umgestellt** — Ursache der eingefrorenen alten Version
244. Automatischer Neuladen bei neuer Version
245. Versionsprüfung alle 60 Sekunden
246. Supabase-Anfragen werden nie zwischengespeichert
247. Cache-Name versioniert, alte Caches werden gelöscht
248. Sichtbarer Versionsstempel zur Kontrolle
249. Falldaten in eigene Datei ausgelagert (`cases.js`)
250. Dadurch funktioniert das Spiel weiterhin per Doppelklick ohne Server
251. Hinweisregler passt sich automatisch dem kürzeren Fall an
252. Regler-Maximum wird dynamisch gesetzt
253. Empfehlungstext passt sich der Fallauswahl an
254. Alle Nutzereingaben werden HTML-escaped
255. Namen werden auf 18 Zeichen begrenzt
256. Leere Namen bekommen einen Standardwert
257. Raumcode ohne verwechselbare Zeichen (kein O/0, I/1)
258. Speicherzugriffe in `try/catch` — funktioniert auch bei blockiertem Speicher
259. Netzwerkfehler im Raum-Modus werden abgefangen
260. Klare Fehlermeldung mit Alternativvorschlag, wenn kein Internet
261. `aria-live` am Meldungsband
262. `role="tablist"` und `role="tab"` an den Reitern
263. `aria-label` an allen Symbolbuttons
264. Screenreader-Klasse für versteckte Beschriftungen
265. `prefers-reduced-motion` wird respektiert
266. Alle externen Links mit `rel="noopener noreferrer"`
267. Bestätigungsabfrage vor Datenlöschung
268. Bestätigungsabfrage vor Spielabbruch
269. Automatische Datenprüfung beim Zusammenbau: Täter-IDs, Dossiers, Links
270. 55 automatisierte Tests für Filter, Wertung, Ablauf, Turnier, Statistik
271. README und CHANGELOG neu geschrieben

---

**Summe: 271 Änderungen.**

---

## Nachtrag v3.0.1 (272–280)

272. `push.ps1` neu: committet, pusht und räumt hängengebliebene Git-Sperrdateien selbst weg
273. Alle PowerShell-Skripte auf **reines ASCII** umgestellt
274. Grund: Windows PowerShell 5.1 liest UTF-8-Dateien ohne BOM als ANSI — der Gedankenstrich wurde dabei zu einem typografischen Anführungszeichen und brach die Syntax
275. Alle PowerShell-Skripte mit **UTF-8-BOM** und CRLF gespeichert
276. `deploy.ps1` überarbeitet, Repo-URL voreingestellt, entfernt Sperrdateien vorab
277. `download-pdfs.ps1` verweist am Ende auf `push.ps1` statt auf eine CMD-Befehlszeile
278. README: `del /f` durch `Remove-Item` ersetzt (CMD-Syntax funktioniert in PowerShell nicht)
279. README: Abschnitt zur Git-Sperrdatei ergänzt
280. Statische Syntaxprüfung aller Skripte in die Verifikation aufgenommen

**Summe: 280 Änderungen.**
