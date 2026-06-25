import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrueba, getPruebaResultados, getPruebaHijos } from "@/db/queries";
import { formatResult, formatWind, formatDate } from "@/lib/format";
import type { Metrica } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idPrueba = Number(id);

  const prueba = await getPrueba(idPrueba);
  if (!prueba) notFound();

  const [resultados, hijos] = await Promise.all([
    getPruebaResultados(idPrueba),
    getPruebaHijos(idPrueba),
  ]);

  const metrica = prueba.metrica as Metrica;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-wa-blue">
          {prueba.nombre_wa || prueba.evento_nombre}
        </h1>
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          <Badge variant="secondary">{prueba.genero}</Badge>
          {prueba.categorias && (
            <Badge variant="outline" className="text-xs">
              {(prueba.categorias as string).length > 50
                ? (prueba.categorias as string).substring(0, 50) + "..."
                : prueba.categorias}
            </Badge>
          )}
          {prueba.fecha && (
            <span className="text-sm text-neutral-500">
              {formatDate(prueba.fecha)}
            </span>
          )}
        </div>
        {prueba.nombre_campeonato && (
          <Link
            href={`/competitions/${prueba.id_campeonato}`}
            className="text-sm text-wa-blue hover:underline mt-1 inline-block"
          >
            {prueba.nombre_campeonato}
          </Link>
        )}
      </div>

      {/* Series/children */}
      {hijos.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-600 mb-2">
            Series relacionadas
          </h3>
          <div className="flex flex-wrap gap-2">
            {hijos.map((h: Record<string, unknown>) => (
              <Link
                key={h.id_prueba as number}
                href={`/results/${h.id_prueba}`}
                className="px-3 py-1.5 text-xs rounded-md border border-neutral-200 hover:border-wa-blue transition-colors"
              >
                {h.nombre_wa as string} - Serie
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Results table */}
      {resultados.length === 0 ? (
        <p className="text-neutral-400 py-12 text-center">
          No se encontraron resultados para esta prueba.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-wa-blue text-white hover:bg-wa-blue">
              <TableHead className="text-white w-12">Pos.</TableHead>
              <TableHead className="text-white">Atleta</TableHead>
              <TableHead className="text-white">Club</TableHead>
              <TableHead className="text-white">Marca</TableHead>
              <TableHead className="text-white">Viento</TableHead>
              <TableHead className="text-white">Serie</TableHead>
              <TableHead className="text-white text-right">Puntos WA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultados.map((r: Record<string, unknown>, i: number) => (
              <TableRow
                key={`${r.id_atleta}-${i}`}
                className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}
              >
                <TableCell className="font-medium text-neutral-500">
                  {(r.posicion as string) || "-"}
                </TableCell>
                <TableCell>
                  {r.id_atleta ? (
                    <Link
                      href={`/athletes/${r.id_atleta}`}
                      className="text-wa-blue hover:underline font-medium"
                    >
                      {r.atleta as string}
                    </Link>
                  ) : (
                    <span className="font-medium">
                      {(r.atleta as string) || "-"}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-neutral-600">
                  {(r.club as string) || "-"}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatResult(r.resultado_formateado as number, metrica)}
                </TableCell>
                <TableCell className="text-xs text-neutral-500">
                  {r.viento && r.viento !== "NaN"
                    ? formatWind(Number(r.viento))
                    : ""}
                </TableCell>
                <TableCell className="text-sm text-neutral-500">
                  {(r.serie as string) || "-"}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {(r.puntos as number) || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Link back if there's a parent */}
      {prueba.prueba_padre && (
        <div className="mt-6">
          <Link
            href={`/results/${prueba.prueba_padre}`}
            className="text-sm text-wa-blue hover:underline"
          >
            Ver prueba final
          </Link>
        </div>
      )}
    </div>
  );
}
