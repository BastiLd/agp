import { NextResponse } from "next/server";

const PRICES = {
  monthly: 149, // 1.49€ in cents
  yearly: 999, // 9.99€ in cents
  lifetime: 1900, // 19€ in cents
};

export async function POST(request: Request) {
  try {
    const { plan } = await request.json();

    // Validate plan
    if (!plan || !["monthly", "yearly", "lifetime"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    // If no Stripe key, simulate payment for development
    if (!stripeSecretKey) {
      // Return a mock client secret for development
      return NextResponse.json({
        clientSecret: "mock_client_secret_for_development",
        isMock: true,
      });
    }

    // Use real Stripe if key is provided
    const Stripe = require("stripe");
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20.acacia",
      typescript: true,
    });

    const amount = PRICES[plan as keyof typeof PRICES];

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "eur",
      metadata: {
        plan: plan,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}

