import { criarClienteServidor } from "@/lib/supabase/server";
import { Aviso } from "@/components/Aviso";
import { dataBR } from "@/lib/formato";
import type { Parceiro } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export default async function PaginaBeneficios() {
  const supabase = criarClienteServidor();
  const { data } = await supabase
    .from("parceiros")
    .select("*")
    .order("categoria")
    .order("ordem")
    .order("nome");

  const parceiros = (data ?? []) as Parceiro[];

  if (!parceiros.length) {
    return (
      <Aviso tipo="info" titulo="Nenhum convênio disponível">
        Os convênios aparecem aqui assim que a secretaria cadastrá-los. Se você está em
        situação regular e mesmo assim não vê nada, fale com a ASCEA.
      </Aviso>
    );
  }

  const grupos = parceiros.reduce<Record<string, Parceiro[]>>((acc, p) => {
    (acc[p.categoria] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Convênios e benefícios</h1>
        <p className="mt-1 text-sm text-slate-500">
          Apresente sua carteirinha digital no estabelecimento parceiro.
        </p>
      </div>

      {Object.entries(grupos).map(([categoria, lista]) => (
        <section key={categoria}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {categoria}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {lista.map((p) => (
              <article key={p.id} className="cartao p-5">
                <h3 className="font-medium text-slate-900">{p.nome}</h3>
                <p className="mt-1 text-sm text-ascea-700">{p.descricao_beneficio}</p>
                {p.como_usar && (
                  <p className="mt-2 text-sm text-slate-600">{p.como_usar}</p>
                )}
                <dl className="mt-3 space-y-1 text-xs text-slate-500">
                  {p.endereco && <div>{p.endereco}</div>}
                  {p.contato && <div>{p.contato}</div>}
                  {p.site && (
                    <div>
                      <a href={p.site} target="_blank" rel="noreferrer"
                         className="text-ascea-600 underline">
                        {p.site.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                  <div>Válido até {dataBR(p.vigencia_fim)}</div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
