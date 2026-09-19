import Link from "next/link";
import { Marca } from "@/components/Marca";

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/login"><Marca /></Link>
          <a href="https://asceaoficial.com.br" className="text-sm text-slate-500 hover:text-ascea-600">
            asceaoficial.com.br
          </a>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-slate-500">
          <p>Associação Sul Catarinense de Engenheiros e Arquitetos</p>
          <p className="mt-1">
            <Link href="/privacidade" className="underline hover:text-ascea-600">
              Política de privacidade e tratamento de dados
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
