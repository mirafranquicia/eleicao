# VotoCard — molduras eleitorais 2026

Aplicativo web onde o eleitor sobe a própria foto, escolhe uma moldura de voto e
baixa a imagem pronta para postar. A composição acontece toda no navegador: a foto
nunca sobe para servidor. No ar em <https://votocard.vercel.app>.

**O código fica na subpasta `app/`, não na raiz.** O projeto na Vercel precisa de
Root Directory = `app`.

Documentação:

- [`PROJETO.md`](PROJETO.md) — o que é o produto, estrutura, o fluxo de pagamento
  sem banco de dados e as regras de compartilhamento. Comece por aqui.
- [`O-QUE-FALTA.md`](O-QUE-FALTA.md) — o que falta para lançar. **Leia primeiro: o
  produto tem prazo de validade, que é a eleição de outubro de 2026.**
- [`app/README.md`](app/README.md) — detalhamento técnico arquivo por arquivo.

Para rodar:

```
cd app
npm install
npm run dev
```
