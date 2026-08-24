import { NextResponse } from "next/server";
import { APP_TAG, siteUrl, stripe, stripeEnabled, UNLOCK_PRICE_CENTS } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Cria a sessão de Checkout do desbloqueio (pagamento único, Pix + cartão).
 * Sem conta e sem e-mail obrigatório: o recibo é o session_id, que volta na
 * success_url e é trocado pela licença em /api/unlock.
 */
export async function POST() {
  if (!stripeEnabled()) {
    return NextResponse.json({ error: "pagamento ainda não configurado" }, { status: 503 });
  }
  const base = siteUrl();
  const priceId = process.env.STRIPE_PRICE_VOTOCARD_UNLOCK;

  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    // Sem payment_method_types: o Checkout oferece o que estiver ativo no
    // Dashboard (cartão hoje; Pix assim que for habilitado em Settings →
    // Payment methods — sem mudar código).
    line_items: [
      priceId
        ? { price: priceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "brl",
              unit_amount: UNLOCK_PRICE_CENTS,
              product_data: {
                name: "VotoCard — Desbloqueio HD",
                description:
                  "Sem marca d'água, alta resolução e todos os templates até o fim das eleições 2026.",
                metadata: { app: APP_TAG },
              },
            },
          },
    ],
    locale: "pt-BR",
    metadata: { app: APP_TAG, product: "unlock" },
    payment_intent_data: { metadata: { app: APP_TAG, product: "unlock" } },
    success_url: `${base}/?session_id={CHECKOUT_SESSION_ID}#editor`,
    cancel_url: `${base}/#editor`,
  });

  return NextResponse.json({ url: session.url });
}
