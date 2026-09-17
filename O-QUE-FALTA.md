# O que falta fazer

Anotações de passagem de bastão, escritas em 17/09/2026.

---

## Antes da lista: este produto tem prazo, e o prazo é agora

O VotoCard só existe por causa da eleição de 2026. O primeiro turno é no começo de
outubro, ou seja, faltam poucas semanas. O produto está **pronto e no ar desde
24/08/2026**, e desde então ninguém mexeu nele: sem domínio próprio, sem divulgação,
sem uma venda.

Então a primeira decisão não é técnica, é de negócio, e não dá para adiar:

- **Vai lançar?** Então os itens 1 a 4 precisam ser resolvidos esta semana, porque
  depois da eleição o produto não vende mais.
- **Não vai lançar?** Então vale dizer isso em voz alta e parar de gastar atenção
  com ele. O código fica guardado e o motor de molduras é reaproveitável em 2028 ou
  em qualquer campanha de outro tipo.

O que não faz sentido é o estado atual: pronto, no ar, e invisível.

---

## Situação em 17/09/2026

- `https://votocard.vercel.app` responde 200.
- Último trabalho em 24/08/2026.
- Das sete etapas do planejamento, seis estão concluídas. A sétima, que é domínio,
  deploy e lançamento, nunca aconteceu.
- A etapa de Página do Candidato, que seria a parte B2B, foi descartada de
  propósito em 24/08/2026. O produto é só B2C.

---

## 1. Confirmar se o Stripe está em modo produção

O `.env.local` desta máquina usa uma chave de teste (`sk_test_`), o que é o certo
para desenvolvimento. **O que não dá para conferir de fora é qual chave está no
painel da Vercel.**

Se estiver a de teste em produção, o site aceita cartão 4242 alegremente e nenhum
dinheiro entra. É a primeira coisa a checar, e leva um minuto: painel da Vercel,
projeto `votocard`, Environment Variables, conferir se `STRIPE_SECRET_KEY` começa
com `sk_live_`.

---

## 2. O webhook de produção nunca foi criado

`STRIPE_WEBHOOK_SECRET` está listado como pendente desde sempre. Sem o webhook
apontando para `https://<domínio>/api/webhook` no painel da Stripe, com os eventos
`checkout.session.completed` e `checkout.session.async_payment_succeeded`, acontece
o seguinte: quem paga e fecha a aba antes de voltar **não recebe nada**. Nem a
licença no navegador, nem o e-mail.

Isso atinge principalmente quem paga por Pix, que é justamente o meio de pagamento
mais provável no público-alvo.

---

## 3. Pix não está ativado, e o e-mail não sai

Dois itens pequenos com efeito grande:

- **Pix** precisa ser ativado no painel do Stripe. Quando ativo, ele aparece sozinho
  no Checkout, sem mexer no código. Vender uma imagem de R$ 12,90 só por cartão, no
  Brasil, corta uma parte enorme das vendas.
- **`RESEND_API_KEY` e `EMAIL_FROM`** nunca foram preenchidas. Sem elas, o link de
  desbloqueio que deveria ir por e-mail só aparece no log do servidor. Junto com o
  item 2, isso significa que uma pessoa pode pagar e ficar sem o produto, sem
  nenhuma forma automática de recuperar.

---

## 4. Domínio próprio

O endereço é `votocard.vercel.app`. Para um produto que vai ser divulgado e receber
pagamento, um subdomínio da Vercel passa impressão de improviso, e já foi o
suficiente para muita gente desistir de pagar em outros produtos.

O planejamento previa um `.com.br`. Se a decisão for lançar, compre e aponte na
Vercel no mesmo dia, e atualize `NEXT_PUBLIC_SITE_URL`.

---

## 5. Revisão jurídica dos termos e da privacidade

As páginas `/termos` e `/privacidade` existem, mas são rascunho. Num produto
eleitoral isso pesa mais que o normal: há regra específica de propaganda eleitoral,
e o produto lida com foto de pessoa, o que atrai a LGPD.

O ponto forte da defesa já está no desenho: **a foto nunca sai do navegador**, não
existe upload nem banco. Isso precisa estar escrito com clareza na política, porque
é o que resolve a maior parte da preocupação com dado pessoal.

Ainda assim, quem entende de direito eleitoral precisa ler antes de divulgar.

---

## O que não precisa de atenção

- **Editor, molduras e compartilhamento.** Estão prontos e funcionando: 19
  molduras, três formatos de saída, arrastar e ampliar a foto, marca d'água na
  versão gratuita, compartilhamento pelo menu nativo do celular.
- **O fluxo de licença sem banco de dados.** É a parte mais bem resolvida do
  projeto: o `session_id` do Stripe funciona como recibo e a licença é assinada com
  HMAC. Não precisa de banco e funciona em vários aparelhos.
- **Imagem de compartilhamento (Open Graph).** Gerada no build, já funciona.
- **Separação da conta Stripe compartilhada.** A `metadata.app = "votocard"` já
  separa este produto dos outros aplicativos da Mira que usam a mesma conta. Não
  mexa nisso sem entender o efeito nos relatórios dos outros.

---

## Se o produto for arquivado

O `lib/templates.ts` é um motor de molduras paramétricas que não tem nada de
eleitoral: recebe nome, número e paleta e desenha no canvas. Serve para qualquer
campanha em que a pessoa põe a própria foto numa moldura, como Dia das Mães,
aniversário de cidade, torcida de time. É a parte do projeto que vale guardar.

---

## Onde está o resto

- `PROJETO.md` — o que é o produto, a estrutura de pastas (o código fica em `app/`,
  não na raiz), o fluxo de pagamento sem banco e as regras de compartilhamento.
- `app/README.md` — detalhamento técnico arquivo por arquivo.
- `Planejamento - SaaS Molduras Eleitorais 2026.pdf` — o plano original.
