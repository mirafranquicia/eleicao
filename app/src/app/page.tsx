import Link from "next/link";
import Editor from "@/components/Editor";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
          <span className="text-lg font-black tracking-tight text-emerald-700">
            Voto<span className="text-zinc-900">Card</span>
          </span>
          <a
            href="#editor"
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Criar minha foto
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-white">
          <div className="mx-auto w-full max-w-5xl px-4 py-12 text-center sm:py-16">
            <h1 className="mx-auto max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              Declare seu voto com estilo nas{" "}
              <span className="text-emerald-600">Eleições 2026</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-600 sm:text-lg">
              Sua foto + moldura personalizada com nome e número do seu candidato. Pronta para
              perfil, story e feed — em 30 segundos, grátis.
            </p>
            <p className="mt-3 text-sm font-medium text-emerald-700">
              🔒 Sua foto não sai do seu celular. Nenhum upload, nenhum cadastro.
            </p>
          </div>
        </section>

        {/* Editor */}
        <section id="editor" className="mx-auto w-full max-w-5xl px-4 py-10">
          <Editor />
        </section>

        {/* Como funciona */}
        <section className="border-t border-zinc-200 bg-white">
          <div className="mx-auto w-full max-w-5xl px-4 py-12">
            <h2 className="text-center text-2xl font-bold">Como funciona</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {[
                {
                  n: "1",
                  t: "Escolha sua foto",
                  d: "Ela é processada só no seu navegador — nunca é enviada para nenhum servidor.",
                },
                {
                  n: "2",
                  t: "Personalize a moldura",
                  d: "Digite o nome e o número do seu candidato, escolha cores e estilo. Funciona para qualquer candidato do Brasil.",
                },
                {
                  n: "3",
                  t: "Compartilhe",
                  d: "Exporte em formato de perfil, story ou feed e mande direto para o WhatsApp ou Instagram com um toque.",
                },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl border border-zinc-200 p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 font-bold text-white">
                    {s.n}
                  </div>
                  <h3 className="font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm text-zinc-600">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 text-center text-xs text-zinc-500">
          <p>
            VotoCard é uma ferramenta de expressão pessoal do eleitor. Não criamos imagens
            sintéticas de pessoas e não reproduzimos marcas partidárias.
          </p>
          <p className="mt-2 flex items-center justify-center gap-4">
            <Link href="/termos" className="underline hover:text-zinc-700">
              Termos de uso
            </Link>
            <Link href="/privacidade" className="underline hover:text-zinc-700">
              Privacidade
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
