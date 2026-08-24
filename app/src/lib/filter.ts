// Filtro simples de palavrões/ofensas para os campos de texto livre
// (regra de ouro nº 2 do planejamento — lista de bloqueio resolve ~95% dos casos).

const BLOCKLIST = [
  "arrombado",
  "babaca",
  "boceta",
  "bosta",
  "buceta",
  "caralho",
  "corno",
  "cuzao",
  "desgraca",
  "fdp",
  "filha da puta",
  "filho da puta",
  "foda",
  "fodase",
  "foda-se",
  "fuder",
  "krl",
  "ladrao",
  "merda",
  "otario",
  "pau no cu",
  "piranha",
  "porra",
  "puta",
  "puto",
  "safado",
  "vagabundo",
  "vagabunda",
  "viado",
  "vsf",
  "vtnc",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Retorna true se o texto contém termo bloqueado. */
export function hasBlockedWord(text: string): boolean {
  const norm = normalize(text);
  if (!norm) return false;
  const padded = ` ${norm} `;
  return BLOCKLIST.some((word) => padded.includes(` ${word} `) || norm.replace(/\s/g, "").includes(word.replace(/\s/g, "")));
}
