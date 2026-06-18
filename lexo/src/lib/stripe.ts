import Stripe from "stripe";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(apiKey, {
      apiVersion: "2026-05-27.dahlia",
    });
  }
  return _stripe;
}

// Lazy proxy: the Stripe client is only instantiated on first property access
// (at runtime), never at module evaluation. This prevents the production build
// from failing to "collect page data" when STRIPE_SECRET_KEY is absent.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});
