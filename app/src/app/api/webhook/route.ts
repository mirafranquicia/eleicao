import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sendUnlockEmail } from "@/lib/email";
import { APP_TAG, stripe, stripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Webhook do Stripe. Único papel: quando um checkout do VotoCard é pago,
 * mandar o link de desbloqueio por e-mail — cobre quem fechou a aba antes
 * de voltar (Pix pendente, por exemplo). A licença em si continua sendo
 * emitida sob demanda em /api/unlock, então não precisamos persistir nada.
 *
 * A conta Stripe é compartilhada com outros apps da Mira: eventos sem
 * metadata.app=votocard são ignorados (200 para o Stripe não reenviar).
 */
export async function POST(req: Request) {
  if (!stripeEnabled()) return NextResponse.json({ error: "stripe desativado" }, { status: 503 });
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET ausente" }, { status: 503 });

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 400 });
  }

  // Pix confirma de forma assíncrona: chega como checkout.session.async_payment_succeeded
  // (o .completed vem antes, ainda unpaid). Cartão vem direto como .completed pago.
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;
    if (session.metadata?.app !== APP_TAG) return NextResponse.json({ ignored: "outro app" });
    if (session.payment_status !== "paid") return NextResponse.json({ ignored: "ainda não pago" });

    const email = session.customer_details?.email;
    if (!email) return NextResponse.json({ ignored: "sem e-mail" });

    try {
      const result = await sendUnlockEmail(email, session.id);
      return NextResponse.json({ ok: true, email: result });
    } catch (e) {
      console.error("[votocard] falha ao enviar e-mail de desbloqueio", e);
      // 500 faz o Stripe reenviar o evento (retry automático por até 3 dias)
      return NextResponse.json({ error: "falha no e-mail" }, { status: 500 });
    }
  }

  return NextResponse.json({ ignored: event.type });
}
