import { NextResponse } from "next/server";
import { issueLicense, verifyLicense } from "@/lib/license";
import { APP_TAG, stripe, stripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Troca um checkout session_id pago pela licença assinada.
 * Pode ser chamado quantas vezes quiser com o mesmo session_id (recuperação
 * da licença em outro aparelho) — a licença é determinística para a sessão.
 */
export async function POST(req: Request) {
  if (!stripeEnabled()) {
    return NextResponse.json({ error: "pagamento ainda não configurado" }, { status: 503 });
  }
  const { sessionId } = (await req.json().catch(() => ({}))) as { sessionId?: string };
  if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return NextResponse.json({ error: "session_id inválido" }, { status: 400 });
  }

  const session = await stripe().checkout.sessions.retrieve(sessionId);
  if (session.metadata?.app !== APP_TAG) {
    return NextResponse.json({ error: "sessão de outro produto" }, { status: 400 });
  }
  // Pix pode ficar alguns segundos em "unpaid" após o usuário voltar; o
  // cliente faz polling enquanto receber 402.
  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "pagamento ainda não confirmado" }, { status: 402 });
  }

  return NextResponse.json({ license: issueLicense(session.id) });
}

/** Valida uma licença guardada no navegador (usado ao abrir o app). */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("license");
  const payload = verifyLicense(token);
  return NextResponse.json({ valid: payload !== null, exp: payload?.exp ?? null });
}
