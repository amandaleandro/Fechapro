import Image from "next/image";
import Link from "next/link";

type LegalSection = {
  title: string;
  paragraphs: string[];
};

export function LegalPage({
  effectiveDate,
  intro,
  sections,
  title,
}: {
  effectiveDate: string;
  intro: string;
  sections: LegalSection[];
  title: string;
}) {
  return (
    <main className="fp-landing min-h-screen bg-[#fbfaf7] text-slate-950">
      <header className="border-b border-black/10 bg-white/90 px-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 py-4">
          <Link href="/" aria-label="Voltar para a página inicial">
            <Image
              alt="FechaPro"
              src="/brand/logofechapro.png"
              width={132}
              height={36}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <nav className="flex items-center gap-3 text-sm font-bold text-slate-600">
            <Link className="hover:text-slate-950" href="/privacidade">
              Privacidade
            </Link>
            <Link className="hover:text-slate-950" href="/termos">
              Termos
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-black uppercase text-green-700">FechaPro</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">{intro}</p>
          <p className="mt-4 text-sm font-bold text-slate-500">Última atualização: {effectiveDate}</p>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto grid max-w-4xl gap-4">
          {sections.map((section) => (
            <article className="rounded-lg border border-black/10 bg-white p-5 shadow-sm sm:p-6" key={section.title}>
              <h2 className="text-xl font-black">{section.title}</h2>
              <div className="mt-3 grid gap-3 text-sm leading-7 text-slate-700 sm:text-base">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-black/10 bg-[#0d1409] px-4 py-8 text-sm text-white/60">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 FechaPro. Todos os direitos reservados.</span>
          <div className="flex flex-wrap gap-5">
            <Link className="hover:text-white" href="/privacidade">
              Política de Privacidade
            </Link>
            <Link className="hover:text-white" href="/termos">
              Termos de Uso
            </Link>
            <Link className="hover:text-white" href="/interesse">
              Suporte
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
