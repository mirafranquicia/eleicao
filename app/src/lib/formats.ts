export type FormatId = "perfil" | "story" | "feed";

export type Format = {
  id: FormatId;
  label: string;
  w: number;
  h: number;
};

export const FORMATS: Format[] = [
  { id: "perfil", label: "Perfil 1:1", w: 1080, h: 1080 },
  { id: "story", label: "Story 9:16", w: 1080, h: 1920 },
  { id: "feed", label: "Feed 4:5", w: 1080, h: 1350 },
];

export function getFormat(id: FormatId): Format {
  return FORMATS.find((f) => f.id === id) ?? FORMATS[0];
}
