/**
 * Sauber gekapselter KI-Client
 * Unterstützt OpenAI und Google Gemini
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export interface AIClientConfig {
  apiKey: string;
  model: string;
  provider: "openai" | "gemini";
  baseURL?: string;
}

export interface AIClientResponse {
  formula: string;
  explanation?: string;
}

export class AIClient {
  private config: AIClientConfig;

  constructor(config: AIClientConfig) {
    this.config = config;
  }

  async generateFormula(userPrompt: string, needsExplanation: boolean = false): Promise<AIClientResponse> {
    const systemPrompt = `Du bist ein Experte für Excel- und Google-Sheets-Formeln. Antworte standardmäßig nur mit der passenden Formel in der richtigen Syntax ohne weitere Erklärung. Wenn der Nutzer explizit nach einer Erklärung fragt, gib zuerst die Formel, danach eine kurze Erklärung in maximal 3 Sätzen.`;

    const userMessage = needsExplanation
      ? `${userPrompt}\n\nBitte gib auch eine kurze Erklärung.`
      : userPrompt;

    try {
      if (this.config.provider === "gemini") {
        return await this.generateWithGemini(systemPrompt, userMessage, needsExplanation);
      } else {
        return await this.generateWithOpenAI(systemPrompt, userMessage, needsExplanation);
      }
    } catch (error) {
      console.error("AI Client Error:", error);
      throw error;
    }
  }

  private async generateWithGemini(
    systemPrompt: string,
    userMessage: string,
    needsExplanation: boolean
  ): Promise<AIClientResponse> {
    const genAI = new GoogleGenerativeAI(this.config.apiKey);
    const fullPrompt = `${systemPrompt}\n\n${userMessage}`;

    // Liste von Modellen zum Ausprobieren (kostenlose Modelle zuerst)
    // Für kostenlose Stufe: gemini-pro sollte funktionieren
    const modelsToTry = [
      this.config.model, // Zuerst das konfigurierte Modell
      "gemini-pro", // Standard kostenloses Modell
      "gemini-1.5-flash",
      "gemini-1.5-pro",
    ];

    // Versuche verschiedene Modelle mit der Library
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const content = response.text().trim();

        if (!content) {
          throw new Error("Keine Antwort von Gemini erhalten");
        }

        // Parse response
        if (needsExplanation || content.includes("\n\n")) {
          const parts = content.split("\n\n");
          return {
            formula: parts[0] || content,
            explanation: parts.slice(1).join("\n\n").substring(0, 300),
          };
        }

        return { formula: content };
      } catch (error: any) {
        // Wenn 404 oder "not found", versuche nächstes Modell
        if (
          error.status === 404 ||
          error.message?.includes("404") ||
          error.message?.includes("not found") ||
          error.message?.includes("is not found")
        ) {
          console.warn(`Model ${modelName} not found (${error.message}), trying next...`);
          continue;
        }
        // Bei anderen Fehlern, werfe den Fehler weiter (außer beim letzten Modell)
        if (modelName === modelsToTry[modelsToTry.length - 1]) {
          throw error;
        }
        console.warn(`Error with model ${modelName}:`, error.message);
        continue;
      }
    }

    // Wenn alle Modelle fehlgeschlagen sind, versuche REST API als Fallback
    console.warn("Library failed, trying REST API directly...");
    return await this.generateWithGeminiREST(systemPrompt, userMessage, needsExplanation);
  }

  private async generateWithGeminiREST(
    systemPrompt: string,
    userMessage: string,
    needsExplanation: boolean
  ): Promise<AIClientResponse> {
    const fullPrompt = `${systemPrompt}\n\n${userMessage}`;
    
    // Versuche REST API mit verschiedenen API-Versionen
    const apiVersions = ["v1", "v1beta"];
    const modelsToTry = ["gemini-pro", "models/gemini-pro"];

    for (const apiVersion of apiVersions) {
      for (const modelName of modelsToTry) {
        try {
          const cleanModelName = modelName.replace("models/", "");
          const response = await fetch(
            `https://generativelanguage.googleapis.com/${apiVersion}/models/${cleanModelName}:generateContent?key=${this.config.apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: fullPrompt,
                      },
                    ],
                  },
                ],
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 404) {
              continue; // Versuche nächstes Modell/Version
            }
            throw new Error(
              `Gemini API Error (${response.status}): ${errorData.error?.message || response.statusText}`
            );
          }

          const data = await response.json();
          const content =
            data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

          if (!content) {
            throw new Error("Keine Antwort von Gemini erhalten");
          }

          // Parse response
          if (needsExplanation || content.includes("\n\n")) {
            const parts = content.split("\n\n");
            return {
              formula: parts[0] || content,
              explanation: parts.slice(1).join("\n\n").substring(0, 300),
            };
          }

          return { formula: content };
        } catch (error: any) {
          if (error.message?.includes("404") || error.message?.includes("not found")) {
            continue; // Versuche nächstes Modell/Version
          }
          // Bei anderen Fehlern, weiter werfen
          if (apiVersion === apiVersions[apiVersions.length - 1] && modelName === modelsToTry[modelsToTry.length - 1]) {
            throw error;
          }
        }
      }
    }

    // Wenn alles fehlgeschlagen ist
    throw new Error(
      "Kein funktionierendes Gemini-Modell gefunden. Bitte prüfe:\n" +
      "1. Ist dein GEMINI_API_KEY gültig?\n" +
      "2. Ist die Generative AI API in deinem Google Cloud Projekt aktiviert?\n" +
      "3. Hast du die kostenlose Stufe aktiviert?"
    );
  }

  private async generateWithOpenAI(
    systemPrompt: string,
    userMessage: string,
    needsExplanation: boolean
  ): Promise<AIClientResponse> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "KI-API Fehler");
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim() || "";

    if (needsExplanation || content.includes("\n\n")) {
      const parts = content.split("\n\n");
      return {
        formula: parts[0] || content,
        explanation: parts.slice(1).join("\n\n").substring(0, 300),
      };
    }

    return { formula: content };
  }
}

// Factory-Funktion für einfache Verwendung
export function createAIClient(): AIClient {
  const provider = (process.env.AI_PROVIDER || "openai") as "openai" | "gemini";

  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    // Standard-Modell: gemini-pro (kostenlos verfügbar)
    const model = process.env.AI_MODEL || "gemini-pro";

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY ist nicht gesetzt");
    }

    return new AIClient({ apiKey, model, provider: "gemini" });
  } else {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.AI_MODEL || "gpt-4o-mini";

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY ist nicht gesetzt");
    }

    return new AIClient({ apiKey, model, provider: "openai" });
  }
}

