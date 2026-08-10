import { NextRequest, NextResponse } from "next/server";
import { createAIClient } from "@/lib/ai-client";
import { checkRateLimit, recordRequest } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, needsExplanation } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Bitte gib eine Beschreibung ein." },
        { status: 400 }
      );
    }

    // Rate Limiting (funktioniert auch ohne Datenbank)
    const userEmail = request.headers.get("x-user-email");
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;

    // User-ID anhand Email finden (falls vorhanden)
    let userId: string | null = null;
    if (userEmail) {
      try {
        const { prisma } = await import("@/lib/prisma");
        const user = await prisma.user.findUnique({
          where: { email: userEmail },
          select: { id: true, isPro: true },
        });
        if (user) {
          userId = user.id;
          // Wenn Pro, kein Rate Limit
          if (user.isPro) {
            // Request trotzdem speichern, aber kein Limit
            try {
              await recordRequest(userId, ipAddress, userAgent);
            } catch (error) {
              // Ignoriere Fehler
            }
            // Direkt zur KI-Generierung
            const aiClient = createAIClient();
            const result = await aiClient.generateFormula(prompt, needsExplanation || false);
            return NextResponse.json({
              success: true,
              formula: result.formula,
              explanation: result.explanation,
              remaining: Infinity,
              limit: Infinity,
            });
          }
        }
      } catch (error) {
        // DB-Fehler: Weiter mit normalem Rate Limiting
        console.warn("Error finding user by email:", error);
      }
    }

    let rateLimit;
    try {
      rateLimit = await checkRateLimit(userId || null, ipAddress, userAgent);
    } catch (error) {
      // Fallback: Erlaube Request wenn Rate Limiting fehlschlägt
      console.warn("Rate limit check failed, allowing request:", error);
      rateLimit = { allowed: true, remaining: 5, limit: 5 };
    }

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "LIMIT_REACHED",
          message: "Du hast dein Tageslimit erreicht.",
          remaining: 0,
          limit: rateLimit.limit,
        },
        { status: 429 }
      );
    }

    // KI-Formel generieren
    const aiClient = createAIClient();
    const result = await aiClient.generateFormula(prompt, needsExplanation || false);

    // Request speichern (funktioniert auch ohne Datenbank - ignoriert Fehler)
    try {
      await recordRequest(userId || null, ipAddress, userAgent);
    } catch (error) {
      // Ignoriere Fehler beim Speichern
      console.warn("Failed to record request:", error);
    }

    return NextResponse.json({
      success: true,
      formula: result.formula,
      explanation: result.explanation,
      remaining: rateLimit.remaining - 1,
      limit: rateLimit.limit,
    });
  } catch (error: any) {
    console.error("Generate API Error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuche es erneut." },
      { status: 500 }
    );
  }
}

