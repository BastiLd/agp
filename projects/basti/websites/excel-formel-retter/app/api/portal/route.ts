import { NextRequest, NextResponse } from "next/server";
import { createCustomerPortalSession } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const portalSchema = z.object({
  userId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = portalSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeId: true },
    });

    if (!user || !user.stripeId) {
      return NextResponse.json(
        { error: "Kein Stripe-Kunde gefunden" },
        { status: 404 }
      );
    }

    const portalUrl = await createCustomerPortalSession(user.stripeId);

    return NextResponse.json({ url: portalUrl });
  } catch (error: any) {
    console.error("Portal API Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Anfrage" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

