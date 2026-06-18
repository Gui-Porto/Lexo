import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";

function planFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_PRICE_ESSENCIAL) return "essencial";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  return "trial";
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        const orgId = cs.metadata?.organizationId;
        if (!orgId || !cs.subscription) break;

        const sub = await stripe.subscriptions.retrieve(cs.subscription as string);
        const priceId = sub.items.data[0]?.price.id ?? "";

        await db.organization.update({
          where: { id: orgId },
          data: {
            plan: planFromPriceId(priceId),
            stripeSubscriptionId: sub.id,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price.id ?? "";
        const plan = planFromPriceId(priceId);

        await db.organization.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { plan },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await db.organization.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { plan: "trial", stripeSubscriptionId: null },
        });
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
