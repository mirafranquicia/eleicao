import { drawWatermark, getTemplate, type TemplateParams } from "./templates";
import { getFormat, type FormatId } from "./formats";

// Transformação da foto controlada pelo usuário (pan/zoom).
// zoom é relativo ao "cover" (1 = foto cobrindo exatamente o quadro);
// offsetX/offsetY em pixels do espaço de exportação (1080 de largura).
export type PhotoTransform = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type Scene = {
  image: HTMLImageElement | null;
  transform: PhotoTransform;
  templateId: string;
  formatId: FormatId;
  params: TemplateParams;
  watermark: boolean;
};

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 5;

export function clampTransform(scene: Scene, t: PhotoTransform): PhotoTransform {
  const { image } = scene;
  const { w, h } = getFormat(scene.formatId);
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, t.zoom));
  if (!image) return { zoom, offsetX: 0, offsetY: 0 };
  const s = Math.max(w / image.naturalWidth, h / image.naturalHeight) * zoom;
  const maxX = Math.max(0, (image.naturalWidth * s - w) / 2);
  const maxY = Math.max(0, (image.naturalHeight * s - h) / 2);
  return {
    zoom,
    offsetX: Math.min(maxX, Math.max(-maxX, t.offsetX)),
    offsetY: Math.min(maxY, Math.max(-maxY, t.offsetY)),
  };
}

/** Desenha a cena completa (foto + moldura + marca d'água) no canvas dado. */
export function renderScene(canvas: HTMLCanvasElement, scene: Scene) {
  const { w, h } = getFormat(scene.formatId);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingQuality = "high";

  if (scene.image) {
    const img = scene.image;
    const t = clampTransform(scene, scene.transform);
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * t.zoom;
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    ctx.drawImage(img, (w - dw) / 2 + t.offsetX, (h - dh) / 2 + t.offsetY, dw, dh);
  } else {
    // placeholder quando ainda não há foto
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#e2e8f0");
    grad.addColorStop(1, "#cbd5e1");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const u = Math.min(w, h) / 1000;
    ctx.font = `600 ${38 * u}px "Geist", "Segoe UI", Arial, sans-serif`;
    ctx.fillText("Sua foto aparece aqui", w / 2, h / 2 - 30 * u);
    ctx.font = `400 ${28 * u}px "Geist", "Segoe UI", Arial, sans-serif`;
    ctx.fillText("Ela não sai do seu celular 🔒", w / 2, h / 2 + 30 * u);
  }

  const template = getTemplate(scene.templateId);
  template.draw(ctx, w, h, scene.params);

  if (scene.watermark) drawWatermark(ctx, w, h, template.wm);
}

/** Exporta a cena como Blob PNG na resolução final. */
export function exportScene(scene: Scene): Promise<Blob> {
  const canvas = document.createElement("canvas");
  renderScene(canvas, scene);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Falha ao gerar a imagem"));
    }, "image/png");
  });
}
