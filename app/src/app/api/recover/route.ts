import { NextResponse } from "next/server";
import { sendUnlockEmail } from "@/lib/email";
import { APP_TAG, stripe, stripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * "Já paguei — recuperar por e-mail": procura no Stripe sessões pagas do
 * VotoCard com esse e-mail e reenvia o link de desbloqueio.
 *
 * A resposta é sempre a mesma (200 genérico), exista compra ou não, para
 * não permitir descobrir quem comprou. A licença nunca volta na resposta —
 * só chega na caixa de entrada do dono da compra.
 */
export async function POST(req: Request) {
  if (!stripeEnabled()) {
    return NextResponse.json({ error: "pagamento ainda não configurado" }, { status: 503 });
  }
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  const clean = (email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) || clean.length > 254) {
    return NextResponse.json({ error: "e-mail inválido" }, { status: 400 });
  }

  const sessions = await stripe().checkout.sessions.list({
    customer_details: { email: clean },
    status: "complete",
    limit: 20,
  });
  const paid = sessions.data.find(
    (s) => s.metadata?.app === APP_TAG && s.payment_status === "paid"
  );

  if (paid) {
    try {
      await sendUnlockEmail(clean, paid.id);
    } catch (e) {
      console.error("[votocard] falha ao reenviar e-mail de desbloqueio", e);
      return NextResponse.json({ error: "não foi possível enviar o e-mail agora" }, { status: 502 });
    }
  }

  return NextResponse.json({
    ok: true,
    message: "Se houver uma compra com esse e-mail, o link de desbloqueio foi enviado.",
  });
}
