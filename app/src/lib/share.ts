/**
 * Compartilhamento da imagem gerada.
 *
 * Realidade das redes: WhatsApp, Instagram, Facebook e X NÃO aceitam uma imagem
 * via link web — só texto/link. O único caminho que entrega o arquivo direto no
 * app é a Web Share API (menu nativo do celular, onde aparecem WhatsApp,
 * Instagram Stories, etc.). No desktop, o melhor que dá para fazer é salvar a
 * imagem e abrir o WhatsApp Web / Instagram com uma dica para anexar.
 */

export type ShareTarget = "download" | "native" | "whatsapp" | "instagram" | "copy";

export const SHARE_TEXT = "Fiz minha foto eleitoral no VotoCard 🗳️";

/** O navegador consegue compartilhar arquivos de imagem pelo menu nativo? */
export function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  try {
    const probe = new File([new Uint8Array(1)], "probe.png", { type: "image/png" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/** Salva o arquivo pelo diálogo de download do navegador. */
export function saveFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // revogar na hora quebra o download em alguns navegadores
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

/** Copia a imagem para a área de transferência (colar direto em qualquer app). */
export async function copyImage(file: File): Promise<boolean> {
  if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) return false;
  try {
    await navigator.clipboard.write([new ClipboardItem({ [file.type]: file })]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Menu nativo de compartilhamento. Retorna:
 *  - "shared"      → o usuário escolheu um app
 *  - "cancelled"   → o usuário fechou o menu
 *  - "unsupported" → o navegador não compartilha arquivos
 */
export async function shareNative(
  file: File,
  text = SHARE_TEXT
): Promise<"shared" | "cancelled" | "unsupported"> {
  if (!canShareFiles()) return "unsupported";
  try {
    await navigator.share({ files: [file], text, title: "VotoCard" });
    return "shared";
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") return "cancelled";
    return "unsupported";
  }
}

function openNewTab(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Executa o compartilhamento no alvo escolhido e devolve uma mensagem curta
 * para mostrar ao usuário (ou null quando não há nada a dizer).
 */
export async function shareTo(target: ShareTarget, file: File, siteUrl: string): Promise<string | null> {
  const text = `${SHARE_TEXT} ${siteUrl}`;

  switch (target) {
    case "download":
      saveFile(file);
      return null;

    case "native": {
      const r = await shareNative(file, text);
      if (r === "unsupported") {
        saveFile(file);
        return "Seu navegador não tem menu de compartilhamento — a imagem foi salva.";
      }
      return null;
    }

    case "copy": {
      const ok = await copyImage(file);
      if (ok) return "Imagem copiada! Cole (Ctrl+V) em qualquer conversa ou app.";
      saveFile(file);
      return "Seu navegador não permite copiar imagem — ela foi salva.";
    }

    case "whatsapp": {
      // No celular, o menu nativo entrega o arquivo direto no WhatsApp.
      const r = await shareNative(file, text);
      if (r !== "unsupported") return null;
      // Desktop: salva e abre o WhatsApp Web; o link wa.me só carrega texto.
      saveFile(file);
      openNewTab(`https://wa.me/?text=${encodeURIComponent(text)}`);
      return "Imagem salva. No WhatsApp, anexe a imagem da sua pasta de Downloads.";
    }

    case "instagram": {
      // No celular, o menu nativo oferece "Instagram → Stories/Feed".
      const r = await shareNative(file, text);
      if (r !== "unsupported") return null;
      // Instagram não tem intent web para imagem: salva e abre o site.
      saveFile(file);
      openNewTab("https://www.instagram.com/");
      return "Imagem salva. No Instagram, crie um post ou story com a imagem da sua pasta de Downloads.";
    }
  }
}
