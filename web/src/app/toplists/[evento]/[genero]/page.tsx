import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getEventoByNombreWa,
  getEventos,
  getTemporadas,
  getClubes,
  getToplist,
  getToplistCount,
} from "@/db/queries";
import { formatResult, formatWind, formatDate } from "@/lib/format";
import { generoFromSlug } from "@/lib/format";
import type { Metrica } from "@/db/schema";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import ToplistFilters from "./ToplistFilters";
import Pagination from "./Pagination";

const PAGE_SIZE = 50;

export default async function ToplistPage({
  params,
  searchParams,
}: {
  params: Promise<{ evento: string; genero: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { evento: eventoSlug, genero: generoSlug } = await params;
  const sp = await searchParams;

  const eventoName = decodeURIComponent(eventoSlug);
  const genero = generoFromSlug(generoSlug);

  const evento = await getEventoByNombreWa(eventoName);
  if (!evento) notFound();

  const [eventosRaw, temporadasRaw, clubesRaw] = await Promise.all([
    getEventos(),
    getTemporadas(),
    getClubes(),
  ]);

  const eventos = eventosRaw.map((e: Record<string, unknown>) => ({
    nombre_wa: e.nombre_wa as string,
  }));
  const temporadas = temporadasRaw.map(
    (t: Record<string, unknown>) => t.temporada as number
  );
  const clubes = clubesRaw
    .map((c: Record<string, unknown>) => c.club_representado as string)
    .filter(Boolean);

  const temporada = sp.temporada ? Number(sp.temporada) : undefined;
  const page = sp.page ? Number(sp.page) : 1;
  const modo = (sp.modo as "best" | "all") || "best";

  const queryParams = {
    idEvento: evento.id_evento as number,
    genero,
    temporada,
    desde: sp.desde as string | undefined,
    hasta: sp.hasta as string | undefined,
    edadMin: sp.edad_min ? Number(sp.edad_min) : undefined,
    edadMax: sp.edad_max ? Number(sp.edad_max) : undefined,
    club: sp.club as string | undefined,
    vientoLegal: sp.viento_legal === "1",
    modo,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const [results, total] = await Promise.all([
    getToplist(queryParams),
    getToplistCount(queryParams),
  ]);

  const metrica = evento.metrica as Metrica;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-wa-blue mb-1">
        Toplists: {eventoName} - {genero}
      </h1>
      <p className="text-sm text-neutral-500 mb-6">
        {total} {modo === "best" ? "atletas" : "marcas"}
      </p>

      <Suspense fallback={null}>
        <ToplistFilters
          eventos={eventos}
          temporadas={temporadas}
          clubes={clubes}
          currentEvento={eventoName}
          currentGenero={generoSlug}
        />
      </Suspense>

      <div className="mt-6">
        {results.length === 0 ? (
          <p className="text-neutral-400 py-12 text-center">
            No se encontraron resultados con los filtros seleccionados.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-wa-blue text-white hover:bg-wa-blue">
                  <TableHead className="text-white w-12">#</TableHead>
                  <TableHead className="text-white">Marca</TableHead>
                  <TableHead className="text-white">Viento</TableHead>
                  <TableHead className="text-white">Atleta</TableHead>
                  <TableHead className="text-white">Club</TableHead>
                  <TableHead className="text-white">Fecha</TableHead>
                  <TableHead className="text-white">Campeonato</TableHead>
                  <TableHead className="text-white text-right">
                    Puntos WA
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r: Record<string, unknown>, i: number) => (
                  <TableRow
                    key={`${r.id_prueba}-${r.id_atleta}-${i}`}
                    className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}
                  >
                    <TableCell className="font-medium text-neutral-400">
                      {r.ranking as number}
                    </TableCell>
                    <TableCell className="font-semibold">
                      <Link
                        href={`/results/${r.id_prueba}`}
                        className="hover:text-wa-blue"
                      >
                        {formatResult(
                          r.resultado_formateado as number,
                          metrica
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="text-neutral-500 text-xs">
                      {formatWind(r.viento_num as number | null)}
                    </TableCell>
                    <TableCell>
                      {r.id_atleta ? (
                        <Link
                          href={`/athletes/${r.id_atleta}`}
                          className="text-wa-blue hover:underline"
                        >
                          {r.nombre_atleta as string}
                        </Link>
                      ) : (
                        (r.nombre_atleta as string) || "-"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-neutral-600">
                      {(r.club_representado as string) || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-neutral-500">
                      {formatDate(r.fecha as string)}
                    </TableCell>
                    <TableCell className="text-sm text-neutral-500 max-w-[200px] truncate">
                      {r.id_campeonato ? (
                        <Link
                          href={`/competitions/${r.id_campeonato}`}
                          className="hover:text-wa-blue"
                        >
                          {r.nombre_campeonato as string}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {(r.puntos as number) || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              total={total}
              pageSize={PAGE_SIZE}
              currentPage={page}
            />
          </>
        )}
      </div>
    </div>
  );
}
