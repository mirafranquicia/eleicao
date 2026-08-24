// Envio de e-mail transacional via Resend (HTTP puro, sem SDK).
// Sem RESEND_API_KEY, o e-mail é apenas logado no servidor — útil em dev e
// como fallback: o link aparece no log e pode ser mandado manualmente.
import { siteUrl } from "./stripe";

export function unlockLink(sessionId: string): string {
  return `${siteUrl()}/?session_id=${encodeURIComponent(sessionId)}#editor`;
}

export async function sendUnlockEmail(to: string, sessionId: string): Promise<"sent" | "logged"> {
  const link = unlockLink(sessionId);
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "VotoCard <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(`[votocard] e-mail de desbloqueio (sem RESEND_API_KEY) para ${to}: ${link}`);
    return "logged";
  }

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#18181b">
      <p style="font-size:20px;font-weight:800;margin:0 0 16px"><span style="color:#047857">Voto</span>Card</p>
      <p>Pagamento confirmado! Sua licença libera <strong>HD, sem marca d'água e todos os templates</strong> até o fim das eleições 2026.</p>
      <p style="margin:24px 0">
        <a href="${link}" style="background:#f59e0b;color:#18181b;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:12px;display:inline-block">Abrir meu VotoCard desbloqueado</a>
      </p>
      <p style="font-size:13px;color:#52525b">Guarde este e-mail: o mesmo link desbloqueia em qualquer celular ou computador. Se o botão não funcionar, copie e cole:<br><a href="${link}" style="color:#047857;word-break:break-all">${link}</a></p>
      <p style="font-size:12px;color:#a1a1aa;margin-top:32px">Sua foto nunca sai do seu aparelho — o VotoCard só guarda o registro do pagamento no Stripe.</p>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Seu VotoCard está desbloqueado ✅",
      html,
      text: `Pagamento confirmado! Abra este link para desbloquear o VotoCard (HD, sem marca d'água): ${link}`,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
  }
  return "sent";
}
