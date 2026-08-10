import { prisma } from "./prisma";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

const FREE_USER_DAILY_LIMIT = 3;

/**
 * Prüft Rate Limit für einen Nutzer
 * Kombiniert IP-Adresse und User-ID falls vorhanden
 * Funktioniert auch ohne Datenbank (Fallback-Modus)
 */
export async function checkRateLimit(
  userId: string | null,
  ipAddress: string | null,
  userAgent: string | null
): Promise<RateLimitResult> {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    // Wenn User eingeloggt ist und Pro, kein Limit
    if (userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { isPro: true },
        });

        if (user?.isPro) {
          return { allowed: true, remaining: Infinity, limit: Infinity };
        }

        // Zähle Requests des Users heute
        const userRequestCount = await prisma.request.count({
          where: {
            userId,
            createdAt: { gte: startOfDay },
          },
        });

        if (userRequestCount >= FREE_USER_DAILY_LIMIT) {
          return {
            allowed: false,
            remaining: 0,
            limit: FREE_USER_DAILY_LIMIT,
          };
        }

        return {
          allowed: true,
          remaining: FREE_USER_DAILY_LIMIT - userRequestCount - 1,
          limit: FREE_USER_DAILY_LIMIT,
        };
      } catch (error) {
        // Datenbank-Fehler: Fallback - erlaube Request
        console.warn("Database error in checkRateLimit, using fallback:", error);
        return { allowed: true, remaining: FREE_USER_DAILY_LIMIT, limit: FREE_USER_DAILY_LIMIT };
      }
    }

    // Für nicht eingeloggte Nutzer: IP-basiertes Limit
    if (ipAddress) {
      try {
        const ipRequestCount = await prisma.request.count({
          where: {
            ipAddress,
            createdAt: { gte: startOfDay },
          },
        });

        if (ipRequestCount >= FREE_USER_DAILY_LIMIT) {
          return {
            allowed: false,
            remaining: 0,
            limit: FREE_USER_DAILY_LIMIT,
          };
        }

        return {
          allowed: true,
          remaining: FREE_USER_DAILY_LIMIT - ipRequestCount - 1,
          limit: FREE_USER_DAILY_LIMIT,
        };
      } catch (error) {
        // Datenbank-Fehler: Fallback - erlaube Request
        console.warn("Database error in checkRateLimit, using fallback:", error);
        return { allowed: true, remaining: FREE_USER_DAILY_LIMIT, limit: FREE_USER_DAILY_LIMIT };
      }
    }

    // Fallback: Erlaube, aber ohne Tracking
    return { allowed: true, remaining: FREE_USER_DAILY_LIMIT, limit: FREE_USER_DAILY_LIMIT };
  } catch (error) {
    // Allgemeiner Fallback bei jedem Fehler
    console.warn("Error in checkRateLimit, using fallback:", error);
    return { allowed: true, remaining: FREE_USER_DAILY_LIMIT, limit: FREE_USER_DAILY_LIMIT };
  }
}

/**
 * Speichert eine Request für Rate Limiting
 * Funktioniert auch ohne Datenbank (ignoriert Fehler stillschweigend)
 */
export async function recordRequest(
  userId: string | null,
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  try {
    await prisma.request.create({
      data: {
        userId: userId || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    // Datenbank-Fehler: Stillschweigend ignorieren (Fallback-Modus)
    // Rate Limiting läuft dann nur über Browser-Storage
    console.warn("Database error in recordRequest, ignoring:", error);
  }
}

