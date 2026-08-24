import type { Palette } from "./palettes";

// ---------------------------------------------------------------------------
// Motor de templates paramétricos.
// Cada template é uma função de desenho pura: recebe o contexto do canvas,
// as dimensões e os parâmetros (nome, número, paleta) e desenha a moldura
// POR CIMA da foto já composta. Nome, número e cor são variáveis — um único
// template atende qualquer candidato do Brasil.
// ---------------------------------------------------------------------------

export type TemplateCategory = "voto" | "civica";

export type TemplateParams = {
  name: string;
  number: string;
  palette: Palette;
};

export type WatermarkSpec = {
  corner?: "tl" | "tr" | "bl" | "br";
  inset?: number; // em unidades u (min(w,h)/1000)
};

export type Template = {
  id: string;
  label: string;
  category: TemplateCategory;
  /** Onde a marca d'água não colide com a arte deste template. */
  wm?: WatermarkSpec;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, p: TemplateParams) => void;
};

const FONT = `"Geist", "Segoe UI", Arial, sans-serif`;

function font(size: number, weight = 900) {
  return `${weight} ${size}px ${FONT}`;
}

// Reduz o tamanho da fonte até o texto caber em maxW.
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
  baseSize: number,
  weight = 900
): number {
  let size = baseSize;
  ctx.font = font(size, weight);
  while (size > 10 && ctx.measureText(text).width > maxW) {
    size *= 0.94;
    ctx.font = font(size, weight);
  }
  return size;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function displayName(p: TemplateParams) {
  return p.name.trim() || "Fulano";
}

function displayNumber(p: TemplateParams) {
  return p.number.trim() || "00";
}

// ---------------------------------------------------------------------------
// Templates — categoria "Declaração de voto"
// ---------------------------------------------------------------------------

const faixaClassica: Template = {
  id: "faixa-classica",
  label: "Faixa clássica",
  category: "voto",
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;
    const bandH = 190 * u;
    const y = h - bandH;

    // faixa
    ctx.fillStyle = p.palette.accent;
    ctx.fillRect(0, y, w, bandH);
    // filete superior
    ctx.fillStyle = p.palette.accent2;
    ctx.fillRect(0, y - 10 * u, w, 10 * u);

    // caixa do número à direita
    const num = displayNumber(p);
    const boxPad = 28 * u;
    ctx.font = font(110 * u);
    const numSize = fitText(ctx, num, 300 * u, 110 * u);
    ctx.font = font(numSize);
    const numW = ctx.measureText(num).width + boxPad * 2;
    const boxH = bandH - 44 * u;
    const boxX = w - numW - 34 * u;
    const boxY = y + (bandH - boxH) / 2;
    ctx.fillStyle = p.palette.on;
    roundRect(ctx, boxX, boxY, numW, boxH, 18 * u);
    ctx.fill();
    ctx.fillStyle = p.palette.accent;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(num, boxX + numW / 2, boxY + boxH / 2 + 4 * u);

    // textos à esquerda
    const name = displayName(p).toUpperCase();
    const maxTextW = boxX - 70 * u;
    ctx.textAlign = "left";
    ctx.fillStyle = p.palette.on;
    ctx.font = font(34 * u, 700);
    ctx.globalAlpha = 0.9;
    ctx.fillText("EU VOTO", 40 * u, y + 58 * u);
    ctx.globalAlpha = 1;
    const nameSize = fitText(ctx, name, maxTextW, 78 * u);
    ctx.font = font(nameSize);
    ctx.fillText(name, 40 * u, y + bandH - 62 * u);
  },
};

const minimalista: Template = {
  id: "minimalista",
  label: "Minimalista",
  category: "voto",
  wm: { inset: 60 },
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;
    const m = 34 * u;

    // borda fina
    ctx.strokeStyle = p.palette.accent;
    ctx.lineWidth = 12 * u;
    roundRect(ctx, m, m, w - m * 2, h - m * 2, 28 * u);
    ctx.stroke();

    // pílula inferior central
    const text = `Eu voto ${displayName(p)} · ${displayNumber(p)}`;
    ctx.font = font(40 * u, 700);
    const size = fitText(ctx, text, w - 200 * u, 40 * u, 700);
    ctx.font = font(size, 700);
    const tw = ctx.measureText(text).width;
    const pillW = tw + 70 * u;
    const pillH = 84 * u;
    const px = (w - pillW) / 2;
    const py = h - m - pillH / 2 - 28 * u;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, px, py, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.strokeStyle = p.palette.accent;
    ctx.lineWidth = 5 * u;
    ctx.stroke();
    ctx.fillStyle = p.palette.accent;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, w / 2, py + pillH / 2 + 2 * u);
  },
};

const vibrante: Template = {
  id: "vibrante",
  label: "Vibrante",
  category: "voto",
  wm: { corner: "bl" },
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;

    // faixa superior em gradiente
    const bandH = 120 * u;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, p.palette.accent);
    grad.addColorStop(1, p.palette.accent2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, bandH);

    const name = displayName(p).toUpperCase();
    const label = `EU VOTO ${name}`;
    ctx.fillStyle = p.palette.on;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const size = fitText(ctx, label, w - 80 * u, 56 * u);
    ctx.font = font(size);
    ctx.fillText(label, w / 2, bandH / 2 + 4 * u);

    // badge circular com o número no canto inferior direito
    const num = displayNumber(p);
    const r = 150 * u;
    const cx = w - r - 40 * u;
    const cy = h - r - 40 * u;
    const grad2 = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    grad2.addColorStop(0, p.palette.accent2);
    grad2.addColorStop(1, p.palette.accent);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad2;
    ctx.fill();
    ctx.lineWidth = 10 * u;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.fillStyle = p.palette.on;
    const numSize = fitText(ctx, num, r * 1.5, 110 * u);
    ctx.font = font(numSize);
    ctx.fillText(num, cx, cy + 6 * u);
  },
};

const sobrio: Template = {
  id: "sobrio",
  label: "Sóbrio (profissional)",
  category: "voto",
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;
    const bandH = 130 * u;
    const y = h - bandH;

    ctx.fillStyle = p.palette.dark;
    ctx.fillRect(0, y, w, bandH);
    ctx.fillStyle = p.palette.accent2;
    ctx.fillRect(0, y, w, 6 * u);

    const text = `Meu voto: ${displayName(p)} — ${displayNumber(p)}`;
    ctx.fillStyle = "#f1f5f9";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const size = fitText(ctx, text, w - 100 * u, 44 * u, 600);
    ctx.font = font(size, 600);
    ctx.fillText(text, w / 2, y + bandH / 2 + 3 * u);
  },
};

const divertido: Template = {
  id: "divertido",
  label: "Divertido",
  category: "voto",
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;

    // adesivo rotacionado no rodapé
    const stickerW = Math.min(720 * u, w - 80 * u);
    const stickerH = 150 * u;
    const cx = w / 2;
    const cy = h - stickerH / 2 - 70 * u;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.05);
    // sombra do adesivo
    ctx.fillStyle = p.palette.accent2;
    roundRect(ctx, -stickerW / 2 + 12 * u, -stickerH / 2 + 12 * u, stickerW, stickerH, 34 * u);
    ctx.fill();
    // adesivo
    ctx.fillStyle = p.palette.accent;
    roundRect(ctx, -stickerW / 2, -stickerH / 2, stickerW, stickerH, 34 * u);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 8 * u;
    ctx.stroke();

    const text = `EU VOTO ${displayName(p).toUpperCase()}`;
    ctx.fillStyle = p.palette.on;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const size = fitText(ctx, text, stickerW - 60 * u, 54 * u);
    ctx.font = font(size);
    ctx.fillText(text, 0, -14 * u);
    ctx.font = font(40 * u, 700);
    ctx.fillText(displayNumber(p), 0, 40 * u);
    ctx.restore();

    // estrelinhas decorativas
    ctx.fillStyle = p.palette.accent2;
    star(ctx, 70 * u, 90 * u, 26 * u);
    star(ctx, w - 90 * u, 140 * u, 18 * u);
    ctx.fillStyle = p.palette.accent;
    star(ctx, w - 60 * u, 70 * u, 14 * u);
  },
};

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

const anelPerfil: Template = {
  id: "anel-perfil",
  label: "Anel de perfil",
  category: "voto",
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 26 * u;

    // anel em gradiente
    const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    grad.addColorStop(0, p.palette.accent);
    grad.addColorStop(1, p.palette.accent2);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 34 * u;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // placa inferior sobre o anel
    const text = `${displayName(p)} ${displayNumber(p)}`;
    ctx.font = font(46 * u, 800);
    const size = fitText(ctx, text, r * 1.4, 46 * u, 800);
    ctx.font = font(size, 800);
    const tw = ctx.measureText(text).width;
    const plateW = tw + 70 * u;
    const plateH = 88 * u;
    const py = cy + r - plateH / 2 - 8 * u;
    ctx.fillStyle = p.palette.accent;
    roundRect(ctx, cx - plateW / 2, py, plateW, plateH, plateH / 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 6 * u;
    ctx.stroke();
    ctx.fillStyle = p.palette.on;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cx, py + plateH / 2 + 2 * u);
  },
};

// ---------------------------------------------------------------------------
// Templates — categoria "Cívicas neutras"
// ---------------------------------------------------------------------------

const vouVotar: Template = {
  id: "vou-votar",
  label: "Eu vou votar",
  category: "civica",
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;
    const bandH = 170 * u;
    const y = h - bandH;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, y, w, bandH);
    ctx.fillStyle = p.palette.accent;
    ctx.fillRect(0, y, w, 8 * u);

    ctx.fillStyle = p.palette.accent;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const size = fitText(ctx, "EU VOU VOTAR ✓", w - 120 * u, 62 * u);
    ctx.font = font(size);
    ctx.fillText("EU VOU VOTAR ✓", w / 2, y + bandH / 2 - 16 * u);
    ctx.fillStyle = "#64748b";
    ctx.font = font(30 * u, 600);
    ctx.fillText("Eleições 2026", w / 2, y + bandH - 34 * u);
  },
};

const voteConsciente: Template = {
  id: "vote-consciente",
  label: "Vote consciente",
  category: "civica",
  wm: { corner: "br", inset: 60 },
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;
    const m = 30 * u;

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 10 * u;
    roundRect(ctx, m, m, w - m * 2, h - m * 2, 24 * u);
    ctx.stroke();

    // selo no topo esquerdo
    const text = "VOTE CONSCIENTE";
    ctx.font = font(40 * u, 800);
    const size = fitText(ctx, text, w - 200 * u, 40 * u, 800);
    ctx.font = font(size, 800);
    const tw = ctx.measureText(text).width;
    const pillW = tw + 60 * u;
    const pillH = 80 * u;
    ctx.fillStyle = p.palette.accent;
    roundRect(ctx, m + 20 * u, m + 20 * u, pillW, pillH, 16 * u);
    ctx.fill();
    ctx.fillStyle = p.palette.on;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, m + 20 * u + pillW / 2, m + 20 * u + pillH / 2 + 2 * u);
  },
};

const democracia: Template = {
  id: "democracia",
  label: "Democracia se exercita",
  category: "civica",
  wm: { corner: "bl" },
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;
    const bandH = 120 * u;

    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, p.palette.dark);
    grad.addColorStop(1, p.palette.accent);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, bandH);

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const size = fitText(ctx, "DEMOCRACIA SE EXERCITA", w - 80 * u, 48 * u);
    ctx.font = font(size);
    ctx.fillText("DEMOCRACIA SE EXERCITA", w / 2, bandH / 2 + 3 * u);

    // urna estilizada no rodapé
    const bx = w / 2;
    const by = h - 90 * u;
    ctx.fillStyle = p.palette.accent;
    roundRect(ctx, bx - 60 * u, by - 34 * u, 120 * u, 68 * u, 12 * u);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bx - 30 * u, by - 8 * u, 60 * u, 8 * u);
  },
};

// ---------------------------------------------------------------------------
// Helpers compartilhados pelos templates da segunda leva
// ---------------------------------------------------------------------------

/** Escurece a base da foto para o texto ficar legível sobre qualquer imagem. */
function fadeBottom(ctx: CanvasRenderingContext2D, w: number, h: number, height: number, color = "#000000") {
  const grad = ctx.createLinearGradient(0, h - height, 0, h);
  grad.addColorStop(0, `${color}00`);
  grad.addColorStop(0.55, `${color}b3`);
  grad.addColorStop(1, `${color}e6`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - height, w, height);
}

/** Converte "#rrggbb" em "rgba(r,g,b,a)". */
function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// --- Voto -------------------------------------------------------------------

const blocosModernos: Template = {
  id: "blocos-modernos",
  label: "Blocos modernos",
  category: "voto",
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;
    const x = 40 * u;
    const pad = 22 * u;
    const maxW = w - 120 * u;

    // três blocos empilhados no canto inferior esquerdo
    const num = displayNumber(p);
    const name = displayName(p).toUpperCase();

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    // bloco 3 (número) — base
    ctx.font = font(64 * u);
    const numSize = fitText(ctx, num, maxW - pad * 2, 64 * u);
    ctx.font = font(numSize);
    const numW = ctx.measureText(num).width + pad * 2;
    const numH = 96 * u;
    const numY = h - 40 * u - numH;

    // bloco 2 (nome)
    const nameSize = fitText(ctx, name, maxW - pad * 2, 74 * u);
    ctx.font = font(nameSize);
    const nameW = ctx.measureText(name).width + pad * 2;
    const nameH = 108 * u;
    const nameY = numY - nameH;

    // bloco 1 (rótulo)
    ctx.font = font(30 * u, 800);
    const labelW = ctx.measureText("EU VOTO").width + pad * 2;
    const labelH = 58 * u;
    const labelY = nameY - labelH;

    ctx.fillStyle = p.palette.accent2;
    ctx.fillRect(x, labelY, labelW, labelH);
    ctx.fillStyle = p.palette.accent;
    ctx.fillRect(x, nameY, nameW, nameH);
    ctx.fillStyle = p.palette.dark;
    ctx.fillRect(x, numY, numW, numH);

    ctx.fillStyle = p.palette.on;
    ctx.font = font(30 * u, 800);
    ctx.fillText("EU VOTO", x + pad, labelY + labelH / 2 + 2 * u);
    ctx.font = font(nameSize);
    ctx.fillText(name, x + pad, nameY + nameH / 2 + 4 * u);
    ctx.fillStyle = "#ffffff";
    ctx.font = font(numSize);
    ctx.fillText(num, x + pad, numY + numH / 2 + 4 * u);
  },
};

const numeroGigante: Template = {
  id: "numero-gigante",
  label: "Número gigante",
  category: "voto",
  wm: { corner: "bl" },
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;
    fadeBottom(ctx, w, h, 460 * u, p.palette.dark);

    const num = displayNumber(p);
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    const numSize = fitText(ctx, num, w - 100 * u, 300 * u);
    ctx.font = font(numSize);
    ctx.shadowColor = rgba(p.palette.accent2, 0.9);
    ctx.shadowBlur = 40 * u;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(num, w - 44 * u, h - 120 * u);
    ctx.shadowBlur = 0;

    // nome em pílula abaixo do número
    const name = `EU VOTO ${displayName(p).toUpperCase()}`;
    ctx.font = font(34 * u, 800);
    const size = fitText(ctx, name, w - 120 * u, 34 * u, 800);
    ctx.font = font(size, 800);
    const tw = ctx.measureText(name).width;
    const pillW = tw + 48 * u;
    const pillH = 64 * u;
    const px = w - 44 * u - pillW;
    const py = h - 100 * u;
    ctx.fillStyle = p.palette.accent;
    roundRect(ctx, px, py, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = p.palette.on;
    ctx.textBaseline = "middle";
    ctx.fillText(name, px + pillW - 24 * u, py + pillH / 2 + 2 * u);
  },
};

const quadro: Template = {
  id: "quadro",
  label: "Quadro",
  category: "voto",
  wm: { corner: "tr", inset: 70 },
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;
    const b = 44 * u; // espessura da moldura
    const bandH = 150 * u;

    // moldura grossa + faixa inferior contínua
    ctx.fillStyle = p.palette.accent;
    ctx.fillRect(0, 0, w, b);
    ctx.fillRect(0, 0, b, h);
    ctx.fillRect(w - b, 0, b, h);
    ctx.fillRect(0, h - bandH, w, bandH);

    // linha interna clara
    ctx.strokeStyle = rgba("#ffffff", 0.8);
    ctx.lineWidth = 3 * u;
    ctx.strokeRect(b - 12 * u, b - 12 * u, w - (b - 12 * u) * 2, h - bandH - b + 24 * u);

    const name = displayName(p).toUpperCase();
    const num = displayNumber(p);
    ctx.fillStyle = p.palette.on;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = font(26 * u, 700);
    ctx.globalAlpha = 0.85;
    ctx.fillText("EU VOTO", w / 2, h - bandH + 34 * u);
    ctx.globalAlpha = 1;
    const line = `${name}  ·  ${num}`;
    const size = fitText(ctx, line, w - b * 2 - 40 * u, 60 * u);
    ctx.font = font(size);
    ctx.fillText(line, w / 2, h - bandH / 2 + 22 * u);
  },
};

const fitaLateral: Template = {
  id: "fita-lateral",
  label: "Fita lateral",
  category: "voto",
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;
    const bandW = 120 * u;

    ctx.fillStyle = p.palette.accent;
    ctx.fillRect(0, 0, bandW, h);
    ctx.fillStyle = p.palette.accent2;
    ctx.fillRect(bandW, 0, 8 * u, h);

    // número em círculo na base da fita
    const num = displayNumber(p);
    const r = 92 * u;
    const cx = bandW / 2 + 30 * u;
    const cy = h - r - 40 * u;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = p.palette.dark;
    ctx.fill();
    ctx.lineWidth = 8 * u;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const numSize = fitText(ctx, num, r * 1.5, 64 * u);
    ctx.font = font(numSize);
    ctx.fillText(num, cx, cy + 4 * u);

    // texto rotacionado subindo pela fita
    const text = `EU VOTO ${displayName(p).toUpperCase()}`;
    ctx.save();
    ctx.translate(bandW / 2, cy - r - 40 * u);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "left";
    ctx.fillStyle = p.palette.on;
    const size = fitText(ctx, text, cy - r - 100 * u, 56 * u);
    ctx.font = font(size);
    ctx.fillText(text, 0, 4 * u);
    ctx.restore();
  },
};

const neon: Template = {
  id: "neon",
  label: "Neon",
  category: "voto",
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;
    fadeBottom(ctx, w, h, 420 * u);

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    // "EU VOTO" fino, com brilho leve
    ctx.font = font(34 * u, 500);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = rgba(p.palette.accent2, 0.9);
    ctx.shadowBlur = 18 * u;
    ctx.fillText("EU VOTO", w / 2, h - 210 * u);

    // nome com contorno neon
    const name = displayName(p).toUpperCase();
    const size = fitText(ctx, name, w - 100 * u, 96 * u);
    ctx.font = font(size);
    ctx.shadowColor = p.palette.accent;
    ctx.shadowBlur = 36 * u;
    ctx.lineWidth = 6 * u;
    ctx.strokeStyle = p.palette.accent;
    ctx.strokeText(name, w / 2, h - 110 * u);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(name, w / 2, h - 110 * u);

    // número
    ctx.font = font(52 * u, 800);
    ctx.shadowColor = p.palette.accent2;
    ctx.shadowBlur = 30 * u;
    ctx.fillStyle = p.palette.accent2;
    ctx.fillText(displayNumber(p), w / 2, h - 40 * u);
    ctx.shadowBlur = 0;
  },
};

const carimbo: Template = {
  id: "carimbo",
  label: "Carimbo",
  category: "voto",
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;

    // selo circular levemente rotacionado no canto superior esquerdo
    const r = 150 * u;
    const cx = r + 50 * u;
    const cy = r + 50 * u;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.18);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = rgba(p.palette.accent, 0.92);
    ctx.fill();
    ctx.lineWidth = 8 * u;
    ctx.strokeStyle = p.palette.on;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r - 22 * u, 0, Math.PI * 2);
    ctx.lineWidth = 3 * u;
    ctx.stroke();

    ctx.fillStyle = p.palette.on;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = font(30 * u, 800);
    ctx.fillText("EU VOTO", 0, -78 * u);
    const num = displayNumber(p);
    const numSize = fitText(ctx, num, r * 1.4, 120 * u);
    ctx.font = font(numSize);
    ctx.fillText(num, 0, 6 * u);
    ctx.font = font(24 * u, 700);
    ctx.fillText("2026", 0, 84 * u);
    ctx.restore();

    // nome em pílula na base
    const name = displayName(p).toUpperCase();
    ctx.font = font(48 * u);
    const size = fitText(ctx, name, w - 160 * u, 48 * u);
    ctx.font = font(size);
    const tw = ctx.measureText(name).width;
    const pillW = tw + 70 * u;
    const pillH = 92 * u;
    const px = (w - pillW) / 2;
    const py = h - pillH - 44 * u;
    ctx.fillStyle = p.palette.dark;
    roundRect(ctx, px, py, pillW, pillH, 20 * u);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, w / 2, py + pillH / 2 + 3 * u);
  },
};

const listras: Template = {
  id: "listras",
  label: "Listras diagonais",
  category: "voto",
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;
    const bandH = 200 * u;
    const skew = 70 * u;

    // duas faixas diagonais sobrepostas no rodapé
    ctx.beginPath();
    ctx.moveTo(0, h - bandH - skew);
    ctx.lineTo(w, h - bandH);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = p.palette.accent2;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, h - bandH - skew + 28 * u);
    ctx.lineTo(w, h - bandH + 28 * u);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = p.palette.accent;
    ctx.fill();

    const name = displayName(p).toUpperCase();
    const num = displayNumber(p);
    ctx.fillStyle = p.palette.on;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = font(30 * u, 700);
    ctx.fillText("EU VOTO", 44 * u, h - bandH + 40 * u);

    // número à direita
    ctx.textAlign = "right";
    const numSize = fitText(ctx, num, 280 * u, 96 * u);
    ctx.font = font(numSize);
    const numW = ctx.measureText(num).width;
    ctx.fillText(num, w - 44 * u, h - bandH / 2 + 26 * u);

    // nome à esquerda
    ctx.textAlign = "left";
    const nameSize = fitText(ctx, name, w - numW - 130 * u, 70 * u);
    ctx.font = font(nameSize);
    ctx.fillText(name, 44 * u, h - bandH / 2 + 30 * u);
  },
};

// --- Cívicas ----------------------------------------------------------------

const diaDeVotar: Template = {
  id: "dia-de-votar",
  label: "4 de outubro",
  category: "civica",
  wm: { corner: "bl" },
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;

    // etiqueta de data no topo
    const date = "4 DE OUTUBRO";
    ctx.font = font(36 * u, 800);
    const dw = ctx.measureText(date).width + 60 * u;
    const dh = 76 * u;
    ctx.fillStyle = p.palette.accent;
    roundRect(ctx, (w - dw) / 2, 40 * u, dw, dh, 16 * u);
    ctx.fill();
    ctx.fillStyle = p.palette.on;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(date, w / 2, 40 * u + dh / 2 + 2 * u);

    // chamada na base
    fadeBottom(ctx, w, h, 300 * u);
    ctx.fillStyle = "#ffffff";
    const size = fitText(ctx, "É DIA DE VOTAR", w - 100 * u, 84 * u);
    ctx.font = font(size);
    ctx.fillText("É DIA DE VOTAR", w / 2, h - 110 * u);
    ctx.fillStyle = p.palette.accent2;
    ctx.fillRect(w / 2 - 80 * u, h - 56 * u, 160 * u, 8 * u);
  },
};

const primeiroVoto: Template = {
  id: "primeiro-voto",
  label: "Meu primeiro voto",
  category: "civica",
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;
    const bandH = 180 * u;
    const y = h - bandH;

    const grad = ctx.createLinearGradient(0, y, w, h);
    grad.addColorStop(0, p.palette.accent);
    grad.addColorStop(1, p.palette.accent2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, w, bandH);

    ctx.fillStyle = p.palette.on;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const size = fitText(ctx, "MEU PRIMEIRO VOTO", w - 120 * u, 64 * u);
    ctx.font = font(size);
    ctx.fillText("MEU PRIMEIRO VOTO", w / 2, y + bandH / 2 - 18 * u);
    ctx.font = font(28 * u, 600);
    ctx.globalAlpha = 0.9;
    ctx.fillText("Eleições 2026 · Minha voz conta", w / 2, y + bandH - 40 * u);
    ctx.globalAlpha = 1;

    // estrelas
    ctx.fillStyle = "#ffffff";
    star(ctx, 60 * u, y - 30 * u, 20 * u);
    star(ctx, w - 70 * u, y - 50 * u, 26 * u);
  },
};

const votoEVoz: Template = {
  id: "voto-e-voz",
  label: "Voto é voz",
  category: "civica",
  draw(ctx, w, h, p) {
    const u = Math.min(w, h) / 1000;
    fadeBottom(ctx, w, h, 380 * u, p.palette.dark);

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#ffffff";
    const size = fitText(ctx, "VOTO É VOZ.", w - 100 * u, 120 * u);
    ctx.font = font(size);
    ctx.fillText("VOTO É VOZ.", 44 * u, h - 120 * u);
    ctx.fillStyle = p.palette.accent2;
    ctx.fillRect(44 * u, h - 96 * u, 220 * u, 12 * u);
    ctx.fillStyle = "#ffffff";
    ctx.font = font(30 * u, 600);
    ctx.globalAlpha = 0.85;
    ctx.fillText("Use a sua. Eleições 2026", 44 * u, h - 44 * u);
    ctx.globalAlpha = 1;
  },
};

export const TEMPLATES: Template[] = [
  faixaClassica,
  minimalista,
  vibrante,
  sobrio,
  divertido,
  anelPerfil,
  blocosModernos,
  numeroGigante,
  quadro,
  fitaLateral,
  neon,
  carimbo,
  listras,
  vouVotar,
  voteConsciente,
  democracia,
  diaDeVotar,
  primeiroVoto,
  votoEVoz,
];

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

// ---------------------------------------------------------------------------
// Marca d'água do plano grátis (divulga o site em cada imagem compartilhada)
// ---------------------------------------------------------------------------

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  wm?: WatermarkSpec
) {
  const u = Math.min(w, h) / 1000;
  const text = "feito com VotoCard";
  ctx.save();
  ctx.font = font(26 * u, 600);
  const tw = ctx.measureText(text).width;
  const pillW = tw + 40 * u;
  const pillH = 48 * u;
  const inset = (wm?.inset ?? 20) * u;
  const corner = wm?.corner ?? "tr";
  const x = corner === "tl" || corner === "bl" ? inset : w - pillW - inset;
  const y = corner === "tl" || corner === "tr" ? inset : h - pillH - inset;
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = "#000000";
  roundRect(ctx, x, y, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + pillW / 2, y + pillH / 2 + 1 * u);
  ctx.restore();
}
