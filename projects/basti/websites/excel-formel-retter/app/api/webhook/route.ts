import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook Secret fehlt" },
      { status: 400 }
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Webhook-Verifizierung fehlgeschlagen" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        try {
          const session = event.data.object as any;
          const customerEmail = session.customer_email || session.customer_details?.email;
          const planType = session.metadata?.planType || "monthly";

          if (!customerEmail) {
            console.error("Keine Email in Checkout Session");
            break;
          }

          // User anhand Email finden oder erstellen
          let user = await prisma.user.findUnique({
            where: { email: customerEmail },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: customerEmail,
                stripeId: session.customer,
                isPro: true,
              },
            });
          } else {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                stripeId: session.customer || user.stripeId,
                isPro: true,
              },
            });
          }

          // Subscription erstellen (außer bei Lifetime)
          if (planType !== "lifetime" && session.subscription) {
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription
            );

            await prisma.subscription.upsert({
              where: { stripeSubscriptionId: subscription.id },
              update: {
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              },
              create: {
                userId: user.id,
                stripeCustomerId: subscription.customer as string,
                stripeSubscriptionId: subscription.id,
                stripePriceId: subscription.items.data[0]?.price.id || "",
                status: subscription.status,
                planType,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              },
            });
          } else if (planType === "lifetime") {
            // Lifetime: User bleibt dauerhaft Pro (bereits oben gesetzt)
            // Keine Subscription nötig
          }
        } catch (dbError) {
          console.error("Database error in webhook (checkout.session.completed):", dbError);
          // Webhook wurde empfangen, aber DB-Fehler - trotzdem success zurückgeben
          // damit Stripe den Webhook nicht erneut sendet
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        try {
          const subscription = event.data.object as any;

          const dbSubscription = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: subscription.id },
          });

          if (dbSubscription) {
            await prisma.subscription.update({
              where: { id: dbSubscription.id },
              data: {
                status: subscription.status,
                currentPeriodEnd: subscription.current_period_end
                  ? new Date(subscription.current_period_end * 1000)
                  : null,
              },
            });

            // Wenn Subscription gekündigt, isPro auf false setzen
            if (
              subscription.status === "canceled" ||
              subscription.status === "unpaid"
            ) {
              await prisma.user.update({
                where: { id: dbSubscription.userId },
                data: { isPro: false },
              });
            }
          }
        } catch (dbError) {
          console.error("Database error in webhook (subscription update):", dbError);
          // Webhook wurde empfangen, aber DB-Fehler - trotzdem success zurückgeben
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook-Verarbeitung fehlgeschlagen" },
      { status: 500 }
    );
  }
}

