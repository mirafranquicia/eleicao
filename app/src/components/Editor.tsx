"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};
import { DEFAULT_PALETTE, PALETTES } from "@/lib/palettes";
import { FORMATS, getFormat, type FormatId } from "@/lib/formats";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import { hasBlockedWord } from "@/lib/filter";
import { useLicense } from "@/lib/useLicense";
import { canShareFiles, shareTo, type ShareTarget } from "@/lib/share";
import {
  clampTransform,
  exportScene,
  renderScene,
  type PhotoTransform,
  type Scene,
} from "@/lib/render";

export default function Editor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [transform, setTransform] = useState<PhotoTransform>({ zoom: 1, offsetX: 0, offsetY: 0 });
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [formatId, setFormatId] = useState<FormatId>("perfil");
  const [paletteId, setPaletteId] = useState(DEFAULT_PALETTE.id);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const license = useLicense();
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverMsg, setRecoverMsg] = useState<string | null>(null);
  const [recoverBusy, setRecoverBusy] = useState(false);

  const submitRecover = useCallback(async () => {
    setRecoverBusy(true);
    setRecoverMsg(null);
    try {
      setRecoverMsg(await license.recover(recoverEmail));
    } catch (e) {
      setRecoverMsg(e instanceof Error ? e.message : "erro ao recuperar");
    } finally {
      setRecoverBusy(false);
    }
  }, [license, recoverEmail]);

  const palette = PALETTES.find((p) => p.id === paletteId) ?? DEFAULT_PALETTE;
  const template = getTemplate(templateId);
  const isVoto = template.category === "voto";
  const nameBlocked = useMemo(() => hasBlockedWord(name), [name]);

  const scene: Scene = useMemo(
    () => ({
      image,
      transform,
      templateId,
      formatId,
      params: { name, number, palette },
      watermark: !license.licensed,
    }),
    [image, transform, templateId, formatId, name, number, palette, license.licensed]
  );

  // Re-renderiza o preview a cada mudança
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = requestAnimationFrame(() => renderScene(canvas, scene));
    // garante que a fonte carregada seja usada no canvas
    document.fonts?.ready.then(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => renderScene(canvas, scene));
    });
    return () => cancelAnimationFrame(raf);
  }, [scene]);

  // ------------------------------------------------------------------
  // Upload — a foto vira um object URL local; nada é enviado a servidor
  // ------------------------------------------------------------------
  const onFile = useCallback((file: File | undefined | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage((prev) => {
        if (prev) URL.revokeObjectURL(prev.src);
        return img;
      });
      setTransform({ zoom: 1, offsetX: 0, offsetY: 0 });
    };
    img.src = url;
  }, []);

  // ------------------------------------------------------------------
  // Gestos: arrastar (1 dedo/mouse) e pinça (2 dedos); roda do mouse
  // ------------------------------------------------------------------
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDist = useRef(0);

  const toCanvasScale = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return 1;
    const rect = canvas.getBoundingClientRect();
    return getFormat(formatId).w / rect.width;
  }, [formatId]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!image) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  }, [image]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!image || !pointers.current.has(e.pointerId)) return;
      const prev = pointers.current.get(e.pointerId)!;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const k = toCanvasScale();

      if (pointers.current.size === 1) {
        const dx = (e.clientX - prev.x) * k;
        const dy = (e.clientY - prev.y) * k;
        setTransform((t) =>
          clampTransform(scene, { ...t, offsetX: t.offsetX + dx, offsetY: t.offsetY + dy })
        );
      } else if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist.current > 0) {
          const ratio = dist / pinchDist.current;
          setTransform((t) => clampTransform(scene, { ...t, zoom: t.zoom * ratio }));
        }
        pinchDist.current = dist;
      }
    },
    [image, scene, toCanvasScale]
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinchDist.current = 0;
  }, []);

  // Zoom pela roda do mouse sem rolar a página (listener não-passivo)
  const sceneRef = useRef(scene);
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      setTransform((t) => clampTransform(sceneRef.current, { ...t, zoom: t.zoom * factor }));
    };
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, [image]);

  // ------------------------------------------------------------------
  // Download / compartilhar
  // ------------------------------------------------------------------
  // Menu nativo de compartilhamento disponível? (celular, em geral). No servidor é sempre false.
  const nativeShare = useSyncExternalStore(noopSubscribe, canShareFiles, () => false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const share = useCallback(
    async (target: ShareTarget) => {
      if (nameBlocked || !image) return;
      setBusy(true);
      setShareMsg(null);
      try {
        await document.fonts?.ready;
        const blob = await exportScene(scene);
        const file = new File([blob], `votocard-${formatId}.png`, { type: "image/png" });
        setShareMsg(await shareTo(target, file, window.location.origin));
      } catch (e) {
        setShareMsg(e instanceof Error ? e.message : "Falha ao gerar a imagem");
      } finally {
        setBusy(false);
      }
    },
    [scene, formatId, nameBlocked, image]
  );
  const exportDisabled = busy || nameBlocked || !image;

  const format = getFormat(formatId);
  const votoTemplates = TEMPLATES.filter((t) => t.category === "voto");
  const civicaTemplates = TEMPLATES.filter((t) => t.category === "civica");

  return (
    <div className="flex w-full flex-col gap-5 lg:flex-row lg:items-start">
      {/* Preview */}
      <div className="flex flex-1 flex-col items-center gap-3">
        <div
          className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 shadow-sm"
          style={{ aspectRatio: `${format.w} / ${format.h}` }}
        >
          <canvas
            ref={canvasRef}
            className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-label="Prévia da sua imagem com moldura"
          />
        </div>
        {image && (
          <p className="text-center text-xs text-zinc-500">
            Arraste para posicionar · pinça ou roda do mouse para zoom
          </p>
        )}
        <div className="flex w-full max-w-md items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
          >
            {image ? "Trocar foto" : "📷 Escolher minha foto"}
          </button>
          <button
            type="button"
            onClick={() => share("download")}
            disabled={exportDisabled}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? "Gerando…" : "⬇️ Baixar imagem"}
          </button>
        </div>

        {/* Compartilhar nas redes */}
        <div className="w-full max-w-md">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Compartilhar
          </p>
          <div className={`grid gap-2 ${nativeShare ? "grid-cols-4" : "grid-cols-3"}`}>
            <button
              type="button"
              onClick={() => share("whatsapp")}
              disabled={exportDisabled}
              className="flex flex-col items-center gap-1 rounded-xl bg-[#25D366] px-2 py-3 text-xs font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
            >
              <WhatsAppIcon />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => share("instagram")}
              disabled={exportDisabled}
              className="flex flex-col items-center gap-1 rounded-xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] px-2 py-3 text-xs font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
            >
              <InstagramIcon />
              Instagram
            </button>
            <button
              type="button"
              onClick={() => share("copy")}
              disabled={exportDisabled}
              className="flex flex-col items-center gap-1 rounded-xl border border-zinc-300 bg-white px-2 py-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              <span className="text-xl leading-6">📋</span>
              Copiar
            </button>
            {nativeShare && (
              <button
                type="button"
                onClick={() => share("native")}
                disabled={exportDisabled}
                className="flex flex-col items-center gap-1 rounded-xl border border-zinc-300 bg-white px-2 py-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50"
              >
                <span className="text-xl leading-6">↗️</span>
                Mais
              </button>
            )}
          </div>
          {!image && (
            <p className="mt-2 text-center text-xs text-zinc-500">Escolha uma foto para baixar ou compartilhar.</p>
          )}
          {shareMsg && (
            <p className="mt-2 rounded-lg bg-zinc-100 px-3 py-2 text-center text-xs text-zinc-700" role="status">
              {shareMsg}
            </p>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <p className="text-center text-xs text-emerald-700">
          🔒 Sua foto não sai do seu celular — todo o processamento acontece aqui, no seu navegador.
        </p>

        {/* Desbloqueio (pagamento único, sem cadastro) */}
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
          {license.licensed ? (
            <p className="text-center font-semibold text-emerald-800">
              ✅ Desbloqueado — suas imagens saem em HD e sem marca d&apos;água.
            </p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-900">Remover a marca d&apos;água</p>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    HD + todos os templates, válido até o fim das eleições. Pagamento único via Pix ou cartão — sem cadastro.
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-bold text-white">
                  R$ 12,90
                </span>
              </div>
              <button
                type="button"
                onClick={license.buy}
                disabled={license.checking}
                className="mt-3 w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-400 disabled:opacity-50"
              >
                {license.checking ? "Verificando…" : "Desbloquear por R$ 12,90"}
              </button>
              {license.error && (
                <p className="mt-2 text-center text-xs text-red-700">{license.error}</p>
              )}
              {recoverOpen ? (
                <form
                  className="mt-3 border-t border-amber-200 pt-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submitRecover();
                  }}
                >
                  <label className="text-xs font-medium text-zinc-700" htmlFor="recover-email">
                    E-mail usado no pagamento
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      id="recover-email"
                      type="email"
                      required
                      value={recoverEmail}
                      onChange={(e) => setRecoverEmail(e.target.value)}
                      placeholder="voce@exemplo.com"
                      className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={recoverBusy}
                      className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {recoverBusy ? "Enviando…" : "Reenviar link"}
                    </button>
                  </div>
                  {recoverMsg && <p className="mt-2 text-xs text-zinc-700">{recoverMsg}</p>}
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setRecoverOpen(true)}
                  className="mt-2 w-full text-center text-xs text-zinc-600 underline-offset-2 hover:underline"
                >
                  Já paguei e não desbloqueou? Recuperar por e-mail
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="flex w-full flex-col gap-5 lg:max-w-sm">
        {/* Formato */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-zinc-700">Formato</legend>
          <div className="flex gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormatId(f.id)}
                className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition ${
                  formatId === f.id
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Molduras */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-zinc-700">Moldura</legend>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Declaração de voto
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {votoTemplates.map((t) => (
              <TemplateChip
                key={t.id}
                label={t.label}
                active={templateId === t.id}
                onClick={() => setTemplateId(t.id)}
              />
            ))}
          </div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
            Cívicas
          </p>
          <div className="flex flex-wrap gap-2">
            {civicaTemplates.map((t) => (
              <TemplateChip
                key={t.id}
                label={t.label}
                active={templateId === t.id}
                onClick={() => setTemplateId(t.id)}
              />
            ))}
          </div>
        </fieldset>

        {/* Candidato */}
        {isVoto && (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-sm font-semibold text-zinc-700">Seu candidato</legend>
            <div>
              <label htmlFor="cand-name" className="mb-1 block text-xs text-zinc-500">
                Nome
              </label>
              <input
                id="cand-name"
                type="text"
                value={name}
                maxLength={24}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Maria Silva"
                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 ${
                  nameBlocked ? "border-red-500 bg-red-50" : "border-zinc-300 bg-white"
                }`}
              />
              {nameBlocked && (
                <p className="mt-1 text-xs text-red-600">
                  Esse texto contém termos não permitidos.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="cand-number" className="mb-1 block text-xs text-zinc-500">
                Número
              </label>
              <input
                id="cand-number"
                type="text"
                inputMode="numeric"
                value={number}
                maxLength={5}
                onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex.: 13123"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500"
              />
            </div>
          </fieldset>
        )}

        {/* Cores */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-zinc-700">Cores</legend>
          <div className="flex flex-wrap gap-2">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.label}
                aria-label={`Paleta ${p.label}`}
                onClick={() => setPaletteId(p.id)}
                className={`h-9 w-9 rounded-full border-2 transition ${
                  paletteId === p.id ? "scale-110 border-zinc-900" : "border-transparent"
                }`}
                style={{
                  background: `linear-gradient(135deg, ${p.accent} 50%, ${p.accent2} 50%)`,
                }}
              />
            ))}
          </div>
        </fieldset>

        {/* Zoom (controle acessível além dos gestos) */}
        {image && (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-zinc-700">Zoom da foto</legend>
            <input
              type="range"
              min={1}
              max={5}
              step={0.01}
              value={transform.zoom}
              onChange={(e) =>
                setTransform((t) =>
                  clampTransform(scene, { ...t, zoom: Number(e.target.value) })
                )
              }
              className="w-full accent-emerald-600"
            />
          </fieldset>
        )}
      </div>
    </div>
  );
}

function TemplateChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
      }`}
    >
      {label}
    </button>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.1-1.3c1.5.8 3.1 1.3 4.9 1.3 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3C4 15.1 3.8 13.6 3.8 12c0-4.5 3.7-8.2 8.2-8.2s8.2 3.7 8.2 8.2-3.7 8.2-8.2 8.2z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
