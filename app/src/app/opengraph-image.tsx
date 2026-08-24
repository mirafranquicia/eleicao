import { ImageResponse } from "next/og";

// Imagem que aparece quando o link é colado no WhatsApp/Instagram/Twitter.
// Gerada no build a partir deste JSX (Satori: só flexbox, sem emoji externo).

export const alt = "VotoCard — sua foto de perfil eleitoral em 30 segundos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GREEN = "#059669";
const GREEN_DARK = "#064e3b";
const AMBER = "#f59e0b";

// Fonte em negrito (a padrão do gerador só tem peso normal). Se o download falhar
// no build, cai na fonte padrão em vez de quebrar o deploy.
async function loadFont(weight: 400 | 900): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=Geist:wght@${weight}`, {
      // sem UA "moderno" o Google devolve TTF, que é o que o gerador aceita
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:5.0) Gecko/20100101 Firefox/5.0" },
    }).then((r) => r.text());
    const url = css.match(/src: url\(([^)]+)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image() {
  const [regular, black] = await Promise.all([loadFont(400), loadFont(900)]);
  const fonts = [
    regular && { name: "Geist", data: regular, weight: 400 as const, style: "normal" as const },
    black && { name: "Geist", data: black, weight: 900 as const, style: "normal" as const },
  ].filter((f): f is NonNullable<typeof f> => Boolean(f));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: `linear-gradient(135deg, ${GREEN_DARK} 0%, ${GREEN} 100%)`,
          color: "#ffffff",
          fontFamily: fonts.length ? "Geist" : "sans-serif",
          padding: 64,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Texto à esquerda */}
        <div style={{ display: "flex", flexDirection: "column", width: 640 }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 900, letterSpacing: -1 }}>
            <span>Voto</span>
            <span style={{ color: AMBER }}>Card</span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 64,
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Sua foto de perfil eleitoral em 30 segundos
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 28, color: "#d1fae5", lineHeight: 1.3 }}>
            Molduras com nome e número do seu candidato, prontas para perfil, story e feed.
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 32, gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(255,255,255,0.14)",
                borderRadius: 999,
                padding: "12px 22px",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              Grátis · sua foto não sai do seu celular
            </div>
          </div>
        </div>

        {/* Cartão simulando a foto com moldura, à direita */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 380,
            height: 470,
            borderRadius: 32,
            overflow: "hidden",
            background: "linear-gradient(180deg, #cbd5e1 0%, #64748b 100%)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.35)",
            transform: "rotate(-4deg)",
            position: "relative",
          }}
        >
          {/* silhueta */}
          <div
            style={{
              position: "absolute",
              top: 90,
              left: 110,
              width: 160,
              height: 160,
              borderRadius: 999,
              background: "#fcd9b6",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 250,
              left: 50,
              width: 280,
              height: 220,
              borderRadius: 140,
              background: "#1e293b",
            }}
          />
          {/* faixa da moldura */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: 380,
              height: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              background: AMBER,
              color: "#1f2937",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 18, fontWeight: 700, opacity: 0.85 }}>EU VOTO</div>
              <div style={{ display: "flex", fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>FULANA</div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#1f2937",
                color: AMBER,
                borderRadius: 16,
                padding: "10px 18px",
                fontSize: 40,
                fontWeight: 900,
              }}
            >
              13123
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );
}
