import Link from "next/link";

export const metadata = { title: "Política de privacidade — VotoCard" };

export default function Privacidade() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold">Política de privacidade</h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-700">
        <p>
          <strong>Sua foto não sai do seu aparelho.</strong> Todo o processamento de imagem do
          VotoCard acontece localmente, no seu navegador. Nenhuma foto é enviada, armazenada ou
          processada em nossos servidores — por arquitetura, não coletamos nenhum dado biométrico.
        </p>
        <p>
          <strong>O que coletamos.</strong> Apenas métricas anônimas de uso (páginas visitadas,
          templates mais usados) e, em caso de compra, os dados mínimos necessários para o
          pagamento e a entrega da licença (e-mail e registro da transação).
        </p>
        <p>
          <strong>LGPD.</strong> Tratamos os dados de compra com base na execução de contrato (art.
          7º, V, da LGPD). Para exercer seus direitos de titular, escreva para{" "}
          <a href="mailto:ecossistemamira@gmail.com" className="underline">
            nosso contato
          </a>
          .
        </p>
        <p className="text-xs italic text-zinc-500">
          Documento em elaboração — o texto final passará por revisão jurídica antes do lançamento.
        </p>
      </div>
      <Link href="/" className="mt-8 inline-block text-sm text-emerald-700 underline">
        ← Voltar
      </Link>
    </main>
  );
}
