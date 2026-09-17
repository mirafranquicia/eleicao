# VotoCard — molduras eleitorais 2026

Aplicativo web onde o eleitor sobe a própria foto, escolhe uma moldura de
declaração de voto e baixa a imagem pronta para postar. A versão gratuita sai com
marca d'água; pagando R$ 12,90, uma vez só, a pessoa baixa em alta sem marca.

No ar em <https://votocard.vercel.app>.

**A composição da imagem acontece inteira no navegador. A foto do eleitor nunca sobe
para servidor nenhum.** Isso não é detalhe técnico, é o argumento de privacidade do
produto e a razão de não existir banco de dados.

---

## Atenção ao calendário

Este é um produto de época. Ele só faz sentido durante a campanha eleitoral de
2026, e o primeiro turno é no começo de outubro. Qualquer decisão sobre ele é
urgente ou é tarde demais. Veja o `O-QUE-FALTA.md`.

---

## Como a pasta está organizada

```
eleicao/                      raiz do repositório
  app/                        o aplicativo Next.js de verdade
  Planejamento - SaaS Molduras Eleitorais 2026.pdf
```

O código fica numa subpasta, não na raiz. Isso tem uma consequência prática: o
projeto na Vercel precisa estar com **Root Directory = `app`**, senão o deploy
automático não encontra nada. Se alguém recriar o projeto na Vercel e esquecer
disso, o build falha sem explicação óbvia.

Para rodar:

```
cd app
npm install
npm run dev      # http://localhost:3000
```

---

## Stack

Next.js com App Router e TypeScript. Sem banco de dados, sem autenticação, sem
backend além das rotas de API do próprio Next. Stripe para o pagamento e Resend
para o e-mail.

---

## As peças do código

Tudo dentro de `app/src/`:

| Arquivo | O que faz |
| --- | --- |
| `lib/templates.ts` | O motor de molduras. Cada moldura é uma função que desenha no canvas, com nome, número e paleta como variáveis. São 19 molduras, 13 de voto e 6 cívicas |
| `lib/palettes.ts` | 9 paletas de cores neutras, de propósito sem logomarca de partido |
| `lib/formats.ts` | Os três formatos de saída: perfil 1:1, story 9:16 e feed 4:5 |
| `lib/render.ts` | Junta foto, moldura e marca d'água e exporta o PNG |
| `lib/filter.ts` | Filtro de palavrão nos campos de texto livre |
| `lib/stripe.ts` e `lib/license.ts` | Cliente do Stripe e a licença HMAC que desbloqueia |
| `lib/useLicense.ts` | Guarda a licença no navegador e troca o `session_id` por ela depois do pagamento |
| `lib/share.ts` | Download, menu nativo do celular, WhatsApp, Instagram e copiar imagem |
| `components/Editor.tsx` | O editor: upload, arrastar, pinça, roda do mouse, controles |
| `app/page.tsx` | A landing, feita para celular primeiro |
| `app/api/checkout`, `api/unlock`, `api/webhook`, `api/recover` | O fluxo de pagamento |

### Criar uma moldura nova

Leva cerca de vinte minutos. Em `lib/templates.ts`, acrescente um objeto `Template`
com `id`, `label`, `category` (`"voto"` ou `"civica"`) e uma função
`draw(ctx, w, h, params)`. Use `u = min(w,h)/1000` como unidade, para a arte escalar
em qualquer formato, e `fitText` para nomes longos caberem. Registre no array
`TEMPLATES`. Se a arte ocupar o canto superior direito, defina `wm` para mover a
marca d'água de lugar.

---

## Pagamento, que é a parte não óbvia

Não há banco de dados, e ainda assim o desbloqueio precisa sobreviver. A solução:

1. A pessoa clica em Desbloquear e vai para o Stripe Checkout.
2. Ao voltar, a URL traz `?session_id=cs_...`.
3. A rota `/api/unlock` confirma no Stripe que aquela sessão está paga e devolve
   uma **licença assinada com HMAC**.
4. A licença fica no `localStorage` e o editor passa a exportar sem marca d'água.

O `session_id` funciona como recibo: abrir o mesmo link de sucesso em outro aparelho
desbloqueia lá também.

Se a pessoa fechar a aba antes de voltar, o que acontece bastante com Pix, o webhook
`checkout.session.completed` manda o link de desbloqueio por e-mail. E existe um
"já paguei, recuperar por e-mail", que procura no Stripe as compras daquele e-mail e
reenvia. A resposta é sempre genérica e a licença nunca volta na resposta HTTP, só
no e-mail do comprador.

**A conta Stripe é compartilhada com os outros aplicativos da Mira.** Por isso tudo
que este app cria leva `metadata.app = "votocard"`, e a rota `/api/unlock` recusa
sessão de outro aplicativo. É assim que os relatórios financeiros se separam. Se
alguém mexer nessa metadata, os apps passam a enxergar as compras uns dos outros.

Trocar `VOTOCARD_LICENSE_SECRET` invalida todas as licenças já emitidas.

### Variáveis

`STRIPE_SECRET_KEY`, `VOTOCARD_LICENSE_SECRET`, `NEXT_PUBLIC_SITE_URL`,
`STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY` e `EMAIL_FROM`, mais a opcional
`STRIPE_PRICE_VOTOCARD_UNLOCK`. Ver `app/.env.example`.

Em desenvolvimento, `stripe listen --forward-to localhost:3000/api/webhook` imprime
o segredo do webhook. Cartão de teste: 4242 4242 4242 4242.

---

## Compartilhamento

Vale registrar, porque é contraintuitivo e já custou tempo: **WhatsApp, Instagram,
Facebook e X não aceitam receber uma imagem por link web**. Só texto e link. O único
caminho que entrega o arquivo dentro do aplicativo é a Web Share API, o menu nativo
do celular.

Por isso `lib/share.ts` se comporta diferente em cada lugar:

- **No celular**, os botões abrem o menu nativo já com a imagem anexada.
- **No computador**, o botão salva a imagem e abre o WhatsApp Web ou o Instagram,
  com uma dica na tela para a pessoa anexar o arquivo.
- **Copiar** coloca o PNG na área de transferência.

---

## Publicação

- Produção: `https://votocard.vercel.app`, projeto `votocard` no time
  `mirafranquicia-2132s-projects`.
- Repositório: `mirafranquicia/eleicao` no GitHub, branch `main`. Atenção ao
  **Root Directory = `app`** no projeto da Vercel.
- Deploy manual, se precisar: `cd app && npx vercel deploy --prod --yes`.

---

## Documentos relacionados

- `O-QUE-FALTA.md` — o que falta para lançar, e o prazo.
- `Planejamento - SaaS Molduras Eleitorais 2026.pdf` — o plano original, de onde
  saiu o escopo.
