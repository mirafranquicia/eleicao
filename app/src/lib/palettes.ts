// Paletas neutras: cores livres (sem logomarca de partido — ver "Regras de ouro" do planejamento).
export type Palette = {
  id: string;
  label: string;
  accent: string; // cor principal da moldura
  accent2: string; // cor de apoio (gradientes/detalhes)
  on: string; // cor de texto sobre o accent
  dark: string; // tom escuro da paleta (barras sóbrias)
};

export const PALETTES: Palette[] = [
  { id: "vermelho", label: "Vermelho", accent: "#dc2626", accent2: "#f97316", on: "#ffffff", dark: "#7f1d1d" },
  { id: "azul", label: "Azul", accent: "#2563eb", accent2: "#06b6d4", on: "#ffffff", dark: "#1e3a8a" },
  { id: "verde", label: "Verde", accent: "#16a34a", accent2: "#84cc16", on: "#ffffff", dark: "#14532d" },
  { id: "amarelo", label: "Amarelo", accent: "#f59e0b", accent2: "#fbbf24", on: "#1f2937", dark: "#92400e" },
  { id: "roxo", label: "Roxo", accent: "#7c3aed", accent2: "#c026d3", on: "#ffffff", dark: "#4c1d95" },
  { id: "laranja", label: "Laranja", accent: "#ea580c", accent2: "#f59e0b", on: "#ffffff", dark: "#7c2d12" },
  { id: "rosa", label: "Rosa", accent: "#db2777", accent2: "#f472b6", on: "#ffffff", dark: "#831843" },
  { id: "brasil", label: "Verde e amarelo", accent: "#15803d", accent2: "#facc15", on: "#ffffff", dark: "#14532d" },
  { id: "preto", label: "Preto", accent: "#111827", accent2: "#4b5563", on: "#ffffff", dark: "#030712" },
];

export const DEFAULT_PALETTE = PALETTES[1];
