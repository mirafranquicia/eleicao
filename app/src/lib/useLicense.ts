"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "votocard.license";

export type LicenseState = {
  /** true = exporta HD sem marca d'água */
  licensed: boolean;
  /** enquanto confirma pagamento ou valida licença salva */
  checking: boolean;
  error: string | null;
  /** abre o Stripe Checkout */
  buy: () => Promise<void>;
  /** reenvia o link de desbloqueio para o e-mail usado na compra */
  recover: (email: string) => Promise<string>;
};

/**
 * Estado do desbloqueio sem conta: a licença (token assinado pelo servidor)
 * fica em localStorage. Ao voltar do checkout com ?session_id=, troca o id
 * pela licença em /api/unlock (com polling curto para Pix).
 */
export function useLicense(): LicenseState {
  const [licensed, setLicensed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get("session_id");

    async function validateStored() {
      const token = localStorage.getItem(STORAGE_KEY);
      if (!token) return false;
      const res = await fetch(`/api/unlock?license=${encodeURIComponent(token)}`);
      const data = (await res.json()) as { valid: boolean };
      if (!data.valid) localStorage.removeItem(STORAGE_KEY);
      return data.valid;
    }

    async function redeem(id: string) {
      // Pix: a confirmação pode levar alguns segundos; tenta por ~30s.
      for (let i = 0; i < 10 && !cancelled; i++) {
        const res = await fetch("/api/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: id }),
        });
        if (res.ok) {
          const { license } = (await res.json()) as { license: string };
          localStorage.setItem(STORAGE_KEY, license);
          return true;
        }
        if (res.status !== 402) {
          const { error } = await res.json().catch(() => ({ error: "falha ao confirmar" }));
          throw new Error(error);
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
      throw new Error("pagamento ainda não confirmado — recarregue em instantes");
    }

    (async () => {
      try {
        let ok = await validateStored();
        if (!ok && sessionId) {
          ok = await redeem(sessionId);
          // limpa o session_id da URL sem recarregar
          url.searchParams.delete("session_id");
          window.history.replaceState({}, "", url.toString());
        }
        if (!cancelled) setLicensed(ok);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "erro ao validar licença");
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const buy = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/checkout", { method: "POST" });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "checkout indisponível" }));
      setError(error);
      return;
    }
    const { url } = (await res.json()) as { url: string };
    window.location.assign(url);
  }, []);

  const recover = useCallback(async (email: string) => {
    const res = await fetch("/api/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    if (!res.ok) throw new Error(data.error ?? "não foi possível recuperar agora");
    return data.message ?? "Se houver uma compra com esse e-mail, o link foi enviado.";
  }, []);

  return { licensed, checking, error, buy, recover };
}
