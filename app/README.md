# VotoCard — SaaS de Molduras Eleitorais 2026

App web para eleitores declararem o voto com molduras personalizadas sobre a própria foto.
**Toda a composição de imagem acontece no navegador — a foto nunca sobe para servidor.**

Baseado no `Planejamento - SaaS Molduras Eleitorais 2026.pdf` (pasta acima).

## Rodar

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # build de produção (deploy: Vercel)
```

## Deploy

- **Produção:** https://votocard.vercel.app (projeto `votocard`, time `mirafranquicia-2132s-projects`)
- **GitHub:** `mirafranquicia/eleicao` (remote SSH `github-franquia`, branch `main`); o app fica na
  subpasta `app/`, então o projeto Vercel precisa de **Root Directory = `app`** para o deploy
  automático via git funcionar.
- Deploy manual: `cd app && npx vercel deploy --prod --yes`
- Variáveis de produção já cadastradas: `STRIPE_SECRET_KEY`, `VOTOCARD_LICENSE_SECRET`,
  `NEXT_PUBLIC_SITE_URL`. Faltam `STRIPE_WEBHOOK_SECRET` (gerar no endpoint de produção do
  Stripe) e `RESEND_API_KEY`/`EMAIL_FROM`.

## Estrutura

| Arquivo | O que faz |
|---|---|
| `src/lib/templates.ts` | Motor de templates paramétricos (nome, número e paleta como variáveis) + 19 templates em 2 categorias (13 de voto, 6 cívicos) + marca d'água |
| `src/lib/palettes.ts` | 9 paletas de cores neutras (sem logomarcas partidárias) |
| `src/lib/formats.ts` | Formatos de export: Perfil 1:1 (1080²), Story 9:16 (1080×1920), Feed 4:5 (1080×1350) |
| `src/lib/render.ts` | Composição foto + moldura + marca d'água; export PNG via `toBlob` |
| `src/lib/filter.ts` | Filtro de palavrões nos campos de texto livre |
| `src/lib/stripe.ts` · `src/lib/license.ts` | Cliente Stripe (metadata `app=votocard`) e licença HMAC de desbloqueio |
| `src/lib/useLicense.ts` | Hook client: licença em localStorage, troca `?session_id=` pela licença após o checkout |
| `src/app/api/checkout` · `src/app/api/unlock` | Cria o Checkout (R$ 12,90, pagamento único) e emite/valida a licença |
| `src/app/api/webhook` · `src/app/api/recover` · `src/lib/email.ts` | Webhook (pagou → e-mail com link de desbloqueio) e "já paguei, recuperar por e-mail" (busca a compra no Stripe e reenvia) |
| `src/lib/share.ts` | Compartilhamento: download, menu nativo (Web Share API), WhatsApp, Instagram, copiar imagem |
| `src/components/Editor.tsx` | Editor: upload local, arrastar/pinça/roda para posicionar, controles, botões de compartilhar |
| `src/app/page.tsx` | Landing mobile-first com editor e "como funciona" |
| `src/app/termos` · `src/app/privacidade` | Rascunhos jurídicos (revisar com advogado(a) eleitoral antes do lançamento) |

## Pagamento (Stripe)

Conta Stripe **compartilhada com os outros apps da Mira** (Cortes etc.). Tudo que este app
cria leva `metadata.app = "votocard"` — é assim que os relatórios se separam e que cada app
ignora sessões dos outros (`/api/unlock` recusa sessão de outro app).

Fluxo: botão "Desbloquear" → `POST /api/checkout` → Stripe Checkout → volta para
`/?session_id=cs_...` → `POST /api/unlock` confirma `payment_status=paid` na API e devolve
uma licença HMAC → `localStorage` → editor exporta sem marca d'água. Recuperar a licença em
outro aparelho = abrir o mesmo link de sucesso (o `session_id` é o recibo).

Se a pessoa fechar a aba antes de voltar (Pix pendente), o webhook
`checkout.session.completed` / `async_payment_succeeded` manda o link por e-mail via Resend;
sem `RESEND_API_KEY` o link só vai para o log do servidor. "Já paguei? Recuperar por e-mail"
procura no Stripe sessões pagas com `app=votocard` para aquele e-mail e reenvia — a resposta
é sempre genérica e a licença nunca volta na resposta (só chega no e-mail do comprador).

Dev: `stripe listen --forward-to localhost:3001/api/webhook` (imprime o `STRIPE_WEBHOOK_SECRET`).
Produção: criar o endpoint `https://<dominio>/api/webhook` no Dashboard com os eventos
`checkout.session.completed` e `checkout.session.async_payment_succeeded`.

Variáveis (`.env.local`, ver `.env.example`): `STRIPE_SECRET_KEY`, `VOTOCARD_LICENSE_SECRET`
(trocar invalida todas as licenças), `NEXT_PUBLIC_SITE_URL`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY` + `EMAIL_FROM` (domínio
verificado no Resend), opcional `STRIPE_PRICE_VOTOCARD_UNLOCK`.
Teste em sandbox com cartão `4242 4242 4242 4242`.

## Como criar um template novo (~20 min)

Em `src/lib/templates.ts`, adicione um objeto `Template` com `id`, `label`, `category`
(`"voto"` ou `"civica"`) e uma função `draw(ctx, w, h, params)`. Use `u = min(w,h)/1000`
como unidade para escalar em qualquer formato, e `fitText` para caber nomes longos.
Registre no array `TEMPLATES`. Se a arte ocupar o canto superior direito, defina `wm`
para reposicionar a marca d'água.

## Compartilhamento

WhatsApp, Instagram, Facebook e X **não aceitam imagem por link web** — só texto/link. O único
caminho que entrega o arquivo direto no app é a Web Share API (menu nativo do celular, onde
aparecem WhatsApp, Instagram Stories etc.). Por isso, em `src/lib/share.ts`:

- **Celular** (Chrome Android, Safari iOS): WhatsApp / Instagram / "Mais" abrem o menu nativo
  já com a imagem anexada e o texto `SHARE_TEXT` + link do site.
- **Desktop**: WhatsApp salva a imagem e abre o WhatsApp Web (`wa.me`) com o texto; Instagram
  salva a imagem e abre `instagram.com`; a tela mostra a dica para anexar o arquivo.
- **Copiar**: coloca o PNG na área de transferência (`ClipboardItem`) para colar em qualquer app.

## Status vs. cronograma do planejamento

**Escopo decidido em 24/08/2026: produto é só B2C — foto + moldura + compartilhar.
Sem Página do Candidato/B2B e sem banco de dados (Supabase).**

- [x] **Dia 1** — setup, layout mobile-first, editor canvas (upload, pan/zoom, moldura, download)
- [x] **Dia 2** — motor paramétrico + 13 templates de voto + 6 cívicos (19 no total)
- [x] **Dia 3** — pagamento via Stripe Checkout (pagamento único R$ 12,90) + desbloqueio HD sem marca d'água. Sem banco: o `session_id` pago vira uma licença assinada guardada no navegador; webhook manda o link por e-mail (Resend) e há recuperação por e-mail. **Pendente: ativar Pix no Dashboard do Stripe** (aparece sozinho no Checkout quando ativo) e preencher `RESEND_API_KEY`/`EMAIL_FROM`
- ~~**Dia 4** — Página do Candidato (B2B)~~ — descartado
- [x] **Dia 5** — compartilhamento WhatsApp/Instagram/copiar/menu nativo + 10 templates novos
- [x] **Dia 6 (parcial)** — rascunho de termos/privacidade, meta tags OG (falta imagem OG e revisão jurídica)
- [ ] **Dia 7** — domínio .com.br + deploy Vercel + lançamento
