import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampeonato, getCampeonatoPruebas } from "@/db/queries";
import { Badge } from "@/components/ui/badge";

export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idCampeonato = Number(id);

  const campeonato = await getCampeonato(idCampeonato);
  if (!campeonato) notFound();

  const pruebas = await getCampeonatoPruebas(idCampeonato);

  const grouped: Record<string, Record<string, unknown>[]> = {};
  for (const p of pruebas) {
    const key = `${p.nombre_wa} - ${p.genero}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-wa-blue mb-1">
        {campeonato.nombre_campeonato}
      </h1>
      {campeonato.nombre_torneo && (
        <p className="text-sm text-neutral-500 mb-6">
          {campeonato.nombre_torneo}
        </p>
      )}

      {Object.keys(grouped).length === 0 ? (
        <p className="text-neutral-400 py-12 text-center">
          No se encontraron pruebas para este campeonato.
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([key, pruebasGrupo]) => (
            <div key={key}>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">
                {key}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {pruebasGrupo.map((p) => (
                  <Link
                    key={p.id_prueba as number}
                    href={`/results/${p.id_prueba}`}
                    className="block p-3 rounded-lg border border-neutral-200 hover:border-wa-blue hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="font-medium text-sm">
                      {String(p.nombre_wa)}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary" className="text-[10px]">
                        {String(p.genero)}
                      </Badge>
                      {p.categorias ? (
                        <Badge variant="outline" className="text-[10px]">
                          {String(p.categorias).length > 30
                            ? String(p.categorias).substring(0, 30) + "..."
                            : String(p.categorias)}
                        </Badge>
                      ) : null}
                    </div>
                    {p.fecha ? (
                      <div className="text-xs text-neutral-400 mt-1">
                        {String(p.fecha)}
                      </div>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
