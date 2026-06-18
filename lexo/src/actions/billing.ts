"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { requireSession } from "@/lib/session";

const BASE_URL = () => process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "http://localhost:3000";

export async function createCheckoutSession(priceId: string): Promise<void> {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") return;

  const org = await db.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { id: true, name: true, stripeCustomerId: true },
  });
  if (!org) return;

  let customerId = org.stripeCustomerId;

  if (!customerId) {
    const adminUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    const customer = await stripe.customers.create({
      name: org.name,
      email: adminUser?.email,
      metadata: { organizationId: org.id },
    });
    customerId = customer.id;
    await db.organization.update({
      where: { id: org.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${BASE_URL()}/planos?success=true`,
    cancel_url: `${BASE_URL()}/planos`,
    metadata: { organizationId: org.id },
  });

  if (checkoutSession.url) redirect(checkoutSession.url);
}

export async function createPortalSession(): Promise<void> {
  const session = await requireSession();

  const org = await db.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { stripeCustomerId: true },
  });
  if (!org?.stripeCustomerId) return;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${BASE_URL()}/planos`,
  });

  redirect(portalSession.url);
}
