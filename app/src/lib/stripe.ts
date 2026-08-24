// Cliente Stripe do VotoCard. A conta Stripe é compartilhada entre os apps da
// Mira (Cortes, VotoCard...): tudo que criamos leva metadata.app = "votocard"
// para separar relatórios e para cada app ignorar eventos dos outros.
import Stripe from "stripe";

export const APP_TAG = "votocard";

/** Preço do desbloqueio em centavos (R$ 12,90, ver planejamento §2). */
export const UNLOCK_PRICE_CENTS = 1290;

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY não configurada");
    client = new Stripe(key);
  }
  return client;
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
