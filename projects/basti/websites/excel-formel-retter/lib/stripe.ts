import Stripe from "stripe";
import { prisma } from "./prisma";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY ist nicht gesetzt");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-11-17.clover" as any,
  typescript: true,
});

export const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY || "price_monthly_placeholder",
  yearly: process.env.STRIPE_PRICE_ID_YEARLY || "price_yearly_placeholder",
  lifetime: process.env.STRIPE_PRICE_ID_LIFETIME || "price_lifetime_placeholder",
};

export async function createCheckoutSession(
  priceId: string,
  planType: "monthly" | "yearly" | "lifetime",
  customerEmail?: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer_email: customerEmail || undefined,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: planType === "lifetime" ? "payment" : "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}?canceled=true`,
    metadata: {
      planType,
    },
  });

  return session.url || "";
}

export async function createCustomerPortalSession(customerId: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
  });

  return session.url || "";
}

