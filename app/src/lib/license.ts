// Licença de desbloqueio (HD + sem marca d'água + catálogo completo).
//
// Não temos banco nem contas: o servidor só confirma no Stripe que a sessão
// de checkout foi paga e emite um token assinado (HMAC-SHA256) que o navegador
// guarda em localStorage. Verificar o token é só recalcular a assinatura —
// nenhuma consulta externa. Só roda no servidor (usa VOTOCARD_LICENSE_SECRET).
import { createHmac, timingSafeEqual } from "node:crypto";

export const LICENSE_VERSION = 1;

/** Licença vale para a temporada toda; eleições 2026 terminam em outubro. */
export const LICENSE_EXPIRES_AT = Date.UTC(2026, 11, 31); // 31/12/2026

export type LicensePayload = {
  v: number;
  /** checkout session id — serve como recibo e evita emitir duas vezes */
  sid: string;
  exp: number;
};

function secret(): string {
  const s = process.env.VOTOCARD_LICENSE_SECRET;
  if (!s || s.length < 16) {
    throw new Error("VOTOCARD_LICENSE_SECRET ausente ou curta demais (mín. 16 chars)");
  }
  return s;
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function issueLicense(sessionId: string): string {
  const payload: LicensePayload = { v: LICENSE_VERSION, sid: sessionId, exp: LICENSE_EXPIRES_AT };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyLicense(token: string | null | undefined): LicensePayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as LicensePayload;
    if (payload.v !== LICENSE_VERSION || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
