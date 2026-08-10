import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, PRICE_IDS } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  planType: z.enum(["monthly", "yearly", "lifetime"]),
  email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planType, email } = checkoutSchema.parse(body);

    const priceId = PRICE_IDS[planType as keyof typeof PRICE_IDS];
    if (!priceId || priceId.includes("placeholder")) {
      return NextResponse.json(
        { error: "Preis-ID nicht konfiguriert" },
        { status: 500 }
      );
    }

    const sessionUrl = await createCheckoutSession(priceId, planType, email);

    return NextResponse.json({ url: sessionUrl });
  } catch (error: any) {
    console.error("Checkout API Error:", error);
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

