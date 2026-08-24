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

## Estrutura

| Arquivo | O que faz |
|---|---|
| `src/lib/templates.ts` | Motor de templates paramétricos (nome, número e paleta como variáveis) + 9 templates em 2 categorias + marca d'água |
| `src/lib/palettes.ts` | 9 paletas de cores neutras (sem logomarcas partidárias) |
| `src/lib/formats.ts` | Formatos de export: Perfil 1:1 (1080²), Story 9:16 (1080×1920), Feed 4:5 (1080×1350) |
| `src/lib/render.ts` | Composição foto + moldura + marca d'água; export PNG via `toBlob` |
| `src/lib/filter.ts` | Filtro de palavrões nos campos de texto livre |
| `src/lib/stripe.ts` · `src/lib/license.ts` | Cliente Stripe (metadata `app=votocard`) e licença HMAC de desbloqueio |
| `src/lib/useLicense.ts` | Hook client: licença em localStorage, troca `?session_id=` pela licença após o checkout |
| `src/app/api/checkout` · `src/app/api/unlock` | Cria o Checkout (R$ 12,90, pagamento único) e emite/valida a licença |
| `src/app/api/webhook` · `src/app/api/recover` · `src/lib/email.ts` | Webhook (pagou → e-mail com link de desbloqueio) e "já paguei, recuperar por e-mail" (busca a compra no Stripe e reenvia) |
| `src/components/Editor.tsx` | Editor: upload local, arrastar/pinça/roda para posicionar, controles, download/share |
| `src/app/page.tsx` | Landing mobile-first com editor, "como funciona" e chamada B2B |
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

## Status vs. cronograma do planejamento

- [x] **Dia 1** — setup, layout mobile-first, editor canvas (upload, pan/zoom, moldura, download)
- [x] **Dia 2** — motor paramétrico + 6 templates de voto + 3 cívicos
- [x] **Dia 3** — pagamento via Stripe Checkout (pagamento único R$ 12,90) + desbloqueio HD sem marca d'água. Sem banco: o `session_id` pago vira uma licença assinada guardada no navegador; webhook manda o link por e-mail (Resend) e há recuperação por e-mail. **Pendente: ativar Pix no Dashboard do Stripe** (aparece sozinho no Checkout quando ativo)
- [ ] **Dia 4** — Página do Candidato (B2B)
- [ ] **Dia 5** — +10 templates, compartilhamento direto WhatsApp/Instagram (share nativo já funciona no celular)
- [x] **Dia 6 (parcial)** — rascunho de termos/privacidade, meta tags OG (falta imagem OG e revisão jurídica)
- [ ] **Dia 7** — domínio .com.br + deploy Vercel + lançamento
