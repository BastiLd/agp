const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const natural = require('natural');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Hilfsfunktion zum Extrahieren des Textes von einer Webseite
async function extractTextFromUrl(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Entferne Scripts, Styles und andere nicht-relevante Elemente
    $('script, style, nav, footer, header').remove();
    
    // Extrahiere den Text aus dem Body
    const text = $('body').text()
      .replace(/\s+/g, ' ')
      .trim();
    
    return text;
  } catch (error) {
    console.error(`Fehler beim Abrufen von ${url}:`, error.message);
    return '';
  }
}

// Hilfsfunktion zum Vergleichen von Texten
function compareTexts(text1, text2) {
  const tokenizer = new natural.WordTokenizer();
  const tfidf = new natural.TfIdf();
  
  // Tokenize beide Texte
  const tokens1 = tokenizer.tokenize(text1.toLowerCase());
  const tokens2 = tokenizer.tokenize(text2.toLowerCase());
  
  // Füge beide Texte zum TF-IDF hinzu
  tfidf.addDocument(tokens1);
  tfidf.addDocument(tokens2);
  
  // Berechne die Ähnlichkeit
  let similarity = 0;
  tokens1.forEach(token => {
    if (tokens2.includes(token)) {
      similarity++;
    }
  });
  
  return similarity / Math.max(tokens1.length, tokens2.length);
}

// API-Endpunkt für die Verifizierung
app.post('/api/verify', async (req, res) => {
  try {
    const { aiResponse, sourceUrls, secondAiResponse } = req.body;
    
    if (!aiResponse || !sourceUrls) {
      return res.status(400).json({ error: 'AI-Antwort und Quellen-URLs sind erforderlich' });
    }

    // Extrahiere Sätze aus der AI-Antwort
    const sentences = aiResponse.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Verarbeite jede Quelle
    const results = {
      verified: false,
      message: '',
      details: {
        totalSources: sourceUrls.length,
        matchedSources: 0,
        unmatchedSources: [],
        matchedContent: [],
        unmatchedContent: []
      }
    };

    // Verarbeite jede Quelle
    for (const url of sourceUrls) {
      const sourceContent = await extractTextFromUrl(url);
      
      if (!sourceContent) {
        results.details.unmatchedSources.push(url);
        continue;
      }

      // Überprüfe jeden Satz
      const matchingSentences = sentences.filter(sentence => {
        const similarity = compareTexts(sentence, sourceContent);
        return similarity > 0.7; // Schwellenwert für Ähnlichkeit
      });

      if (matchingSentences.length > 0) {
        results.details.matchedSources++;
        matchingSentences.forEach(text => {
          results.details.matchedContent.push({
            text,
            source: url
          });
        });
      } else {
        results.details.unmatchedSources.push(url);
      }
    }

    // Finde nicht übereinstimmende Inhalte
    const allMatchedText = results.details.matchedContent.map(m => m.text);
    sentences.forEach(sentence => {
      if (!allMatchedText.includes(sentence)) {
        results.details.unmatchedContent.push({
          text: sentence,
          reason: 'Keine Übereinstimmung in den angegebenen Quellen gefunden'
        });
      }
    });

    // Setze Verifizierungsstatus und Nachricht
    results.verified = results.details.matchedSources > 0;
    results.message = results.verified
      ? `Übereinstimmende Inhalte in ${results.details.matchedSources} von ${results.details.totalSources} Quellen gefunden.`
      : 'Keine übereinstimmenden Inhalte in den angegebenen Quellen gefunden.';

    // Wenn eine zweite AI-Antwort vorhanden ist, vergleiche beide
    if (secondAiResponse) {
      const secondSentences = secondAiResponse.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const comparisonResults = {
        commonContent: [],
        uniqueToFirst: [],
        uniqueToSecond: []
      };

      // Finde gemeinsame Inhalte
      sentences.forEach(sentence => {
        if (secondSentences.some(s => compareTexts(sentence, s) > 0.7)) {
          comparisonResults.commonContent.push(sentence);
        } else {
          comparisonResults.uniqueToFirst.push(sentence);
        }
      });

      // Finde einzigartige Inhalte in der zweiten Antwort
      secondSentences.forEach(sentence => {
        if (!sentences.some(s => compareTexts(sentence, s) > 0.7)) {
          comparisonResults.uniqueToSecond.push(sentence);
        }
      });

      results.comparison = comparisonResults;
    }

    res.json(results);
  } catch (error) {
    console.error('Verifizierungsfehler:', error);
    res.status(500).json({ error: 'Ein Fehler ist bei der Verifizierung aufgetreten' });
  }
});

// Starte den Server
app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
}); 