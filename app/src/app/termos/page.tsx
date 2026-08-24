import Link from "next/link";

export const metadata = { title: "Termos de uso — VotoCard" };

export default function Termos() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-bold">Termos de uso</h1>
      <div className="prose-sm mt-6 space-y-4 text-sm leading-relaxed text-zinc-700">
        <p>
          <strong>1. Manifestação pessoal.</strong> Todo conteúdo criado no VotoCard é manifestação
          pessoal e espontânea do usuário, que é o único responsável pelo texto, pela foto e pela
          divulgação das imagens geradas.
        </p>
        <p>
          <strong>2. Sem imagens sintéticas.</strong> O VotoCard não cria, altera nem simula imagens
          de pessoas. A ferramenta apenas aplica elementos gráficos (molduras, cores e textos) sobre
          a foto real enviada pelo próprio usuário, em conformidade com as vedações a conteúdo
          sintético da Resolução TSE nº 23.610/2019 e atualizações.
        </p>
        <p>
          <strong>3. Marcas e imagens de terceiros.</strong> Os templates próprios não reproduzem
          logomarcas oficiais de partidos nem fotografias de candidatos. É vedado ao usuário inserir
          conteúdo ofensivo, difamatório ou que viole direitos de terceiros.
        </p>
        <p>
          <strong>4. Privacidade.</strong> As fotos dos usuários são processadas exclusivamente no
          navegador e nunca são enviadas aos nossos servidores. Veja a{" "}
          <Link href="/privacidade" className="underline">
            política de privacidade
          </Link>
          .
        </p>
        <p className="text-xs italic text-zinc-500">
          Documento em elaboração — o texto final passará por revisão de advogado(a) eleitoral antes
          do lançamento.
        </p>
      </div>
      <Link href="/" className="mt-8 inline-block text-sm text-emerald-700 underline">
        ← Voltar
      </Link>
    </main>
  );
}
