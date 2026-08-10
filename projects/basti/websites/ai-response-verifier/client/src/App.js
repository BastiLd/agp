import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [aiResponse, setAiResponse] = useState('');
  const [secondAiResponse, setSecondAiResponse] = useState('');
  const [sourceUrls, setSourceUrls] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/verify', {
        aiResponse,
        secondAiResponse,
        sourceUrls: sourceUrls.split('\n').filter(url => url.trim())
      });

      setResult(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            KI-Antwort Verifizierer
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
          <div>
            <label htmlFor="aiResponse" className="block text-sm font-medium text-gray-700 mb-2">
              KI-Antwort
            </label>
            <textarea
              id="aiResponse"
              value={aiResponse}
              onChange={(e) => setAiResponse(e.target.value)}
              className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Fügen Sie hier die KI-Antwort ein..."
              required
            />
          </div>

          <div>
            <label htmlFor="secondAiResponse" className="block text-sm font-medium text-gray-700 mb-2">
              Zweite KI-Antwort (optional)
            </label>
            <textarea
              id="secondAiResponse"
              value={secondAiResponse}
              onChange={(e) => setSecondAiResponse(e.target.value)}
              className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Fügen Sie hier eine zweite KI-Antwort zum Vergleich ein..."
            />
          </div>

          <div>
            <label htmlFor="sourceUrls" className="block text-sm font-medium text-gray-700 mb-2">
              Quellen-URLs (eine pro Zeile)
            </label>
            <textarea
              id="sourceUrls"
              value={sourceUrls}
              onChange={(e) => setSourceUrls(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Fügen Sie hier die Quellen-URLs ein, eine pro Zeile..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Verifizierung läuft...' : 'Antwort verifizieren'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-6">
            <div className="p-4 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-2 text-gray-800">Verifizierungsergebnis</h2>
              <p className={`text-lg ${result.verified ? 'text-green-600' : 'text-red-600'}`}>
                {result.message}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Übereinstimmende Inhalte</h3>
              {result.details.matchedContent.length > 0 ? (
                <ul className="space-y-2">
                  {result.details.matchedContent.map((item, index) => (
                    <li key={index} className="p-2 bg-green-50 rounded">
                      <p className="text-gray-700">{item.text}</p>
                      <p className="text-sm text-gray-500">Quelle: {item.source}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Keine übereinstimmenden Inhalte gefunden.</p>
              )}
            </div>

            {result.details.unmatchedContent.length > 0 && (
              <div className="p-4 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Nicht übereinstimmende Inhalte</h3>
                <ul className="space-y-2">
                  {result.details.unmatchedContent.map((item, index) => (
                    <li key={index} className="p-2 bg-red-50 rounded">
                      <p className="text-gray-700">{item.text}</p>
                      <p className="text-sm text-red-500">{item.reason}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.comparison && (
              <div className="p-4 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Vergleich der KI-Antworten</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Gemeinsame Inhalte</h4>
                    <ul className="space-y-2">
                      {result.comparison.commonContent.map((text, index) => (
                        <li key={index} className="p-2 bg-blue-50 rounded">
                          <p className="text-gray-700">{text}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Einzigartige Inhalte in der ersten Antwort</h4>
                    <ul className="space-y-2">
                      {result.comparison.uniqueToFirst.map((text, index) => (
                        <li key={index} className="p-2 bg-yellow-50 rounded">
                          <p className="text-gray-700">{text}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Einzigartige Inhalte in der zweiten Antwort</h4>
                    <ul className="space-y-2">
                      {result.comparison.uniqueToSecond.map((text, index) => (
                        <li key={index} className="p-2 bg-yellow-50 rounded">
                          <p className="text-gray-700">{text}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 