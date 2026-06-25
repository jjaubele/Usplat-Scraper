import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  getAtleta,
  getAtletaPBs,
  getAtletaSBs,
  getAtletaResults,
  getAtletaEventos,
  getAtletaResultsByEvent,
  getHeadToHead,
} from "@/db/queries";
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
import ProgressionChart from "./ProgressionChart";
import HeadToHead from "./HeadToHead";

export default async function AthleteProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const idAtleta = Number(id);

  const atleta = (await getAtleta(idAtleta)) as {
    nombre: string; apellido: string; pais: string | null;
    club: string | null; colegio: string | null; fecha_nacimiento: string | null;
  } | null;
  if (!atleta) notFound();

  const currentYear = new Date().getFullYear();

  const [pbs, sbs, recentResults, eventos] = await Promise.all([
    getAtletaPBs(idAtleta),
    getAtletaSBs(idAtleta, currentYear),
    getAtletaResults(idAtleta, 20),
    getAtletaEventos(idAtleta),
  ]);

  const selectedEvent = sp.event ? Number(sp.event) : null;
  let progressionData: Record<string, unknown>[] = [];
  let selectedEventInfo: Record<string, unknown> | null = null;

  if (selectedEvent) {
    progressionData = await getAtletaResultsByEvent(idAtleta, selectedEvent);
    selectedEventInfo =
      eventos.find(
        (e: Record<string, unknown>) => e.id_evento === selectedEvent
      ) || null;
  } else if (eventos.length > 0) {
    const firstEvent = eventos[0] as Record<string, unknown>;
    progressionData = await getAtletaResultsByEvent(
      idAtleta,
      firstEvent.id_evento as number
    );
    selectedEventInfo = firstEvent;
  }

  const vsId = sp.vs ? Number(sp.vs) : null;
  let h2hResults: Record<string, unknown>[] = [];
  let rivalAtleta: { nombre: string; apellido: string } | null = null;
  if (vsId) {
    [h2hResults, rivalAtleta] = await Promise.all([
      getHeadToHead(idAtleta, vsId),
      getAtleta(vsId) as Promise<{ nombre: string; apellido: string } | null>,
    ]);
  }

  let h2hWins = 0;
  let h2hLosses = 0;
  if (h2hResults.length > 0) {
    for (const r of h2hResults) {
      const metrica = r.metrica as Metrica;
      const m1 = r.marca1 as number;
      const m2 = r.marca2 as number;
      if (metrica === "Segundos") {
        if (m1 < m2) h2hWins++;
        else if (m1 > m2) h2hLosses++;
      } else {
        if (m1 > m2) h2hWins++;
        else if (m1 < m2) h2hLosses++;
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-wa-blue">
          {atleta.nombre} {atleta.apellido}
        </h1>
        <div className="flex flex-wrap gap-3 mt-3 text-sm text-neutral-600">
          {atleta.pais && <Badge variant="secondary">{atleta.pais}</Badge>}
          {atleta.club && <Badge variant="outline">{atleta.club}</Badge>}
          {atleta.colegio && (
            <span className="text-neutral-400">Colegio: {atleta.colegio}</span>
          )}
          {atleta.fecha_nacimiento && (
            <span className="text-neutral-400">
              Nac: {formatDate(atleta.fecha_nacimiento)}
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Personal Bests */}
        <section>
          <h2 className="text-lg font-semibold text-wa-blue mb-3">
            Mejores marcas (PB)
          </h2>
          {pbs.length === 0 ? (
            <p className="text-neutral-400 text-sm">Sin marcas registradas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-wa-blue text-white hover:bg-wa-blue">
                  <TableHead className="text-white">Evento</TableHead>
                  <TableHead className="text-white">Marca</TableHead>
                  <TableHead className="text-white">Viento</TableHead>
                  <TableHead className="text-white">Fecha</TableHead>
                  <TableHead className="text-white text-right">Pts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pbs.map((pb: Record<string, unknown>, i: number) => (
                  <TableRow
                    key={pb.id_evento as number}
                    className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}
                  >
                    <TableCell className="font-medium">
                      {pb.nombre_wa as string}
                    </TableCell>
                    <TableCell className="font-semibold">
                      <Link
                        href={`/results/${pb.id_prueba}`}
                        className="hover:text-wa-blue"
                      >
                        {formatResult(
                          pb.resultado_formateado as number,
                          pb.metrica as Metrica
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-neutral-500">
                      {formatWind(pb.viento_num as number | null)}
                    </TableCell>
                    <TableCell className="text-sm text-neutral-500">
                      {formatDate(pb.fecha as string)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {(pb.puntos as number) || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        {/* Season Bests */}
        <section>
          <h2 className="text-lg font-semibold text-wa-blue mb-3">
            Mejores marcas {currentYear} (SB)
          </h2>
          {sbs.length === 0 ? (
            <p className="text-neutral-400 text-sm">
              Sin marcas en {currentYear}.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-wa-blue text-white hover:bg-wa-blue">
                  <TableHead className="text-white">Evento</TableHead>
                  <TableHead className="text-white">Marca</TableHead>
                  <TableHead className="text-white">Viento</TableHead>
                  <TableHead className="text-white">Fecha</TableHead>
                  <TableHead className="text-white text-right">Pts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sbs.map((sb: Record<string, unknown>, i: number) => (
                  <TableRow
                    key={sb.id_evento as number}
                    className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}
                  >
                    <TableCell className="font-medium">
                      {sb.nombre_wa as string}
                    </TableCell>
                    <TableCell className="font-semibold">
                      <Link
                        href={`/results/${sb.id_prueba}`}
                        className="hover:text-wa-blue"
                      >
                        {formatResult(
                          sb.resultado_formateado as number,
                          sb.metrica as Metrica
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-neutral-500">
                      {formatWind(sb.viento_num as number | null)}
                    </TableCell>
                    <TableCell className="text-sm text-neutral-500">
                      {formatDate(sb.fecha as string)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {(sb.puntos as number) || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>

      {/* Progression chart */}
      {selectedEventInfo && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-wa-blue mb-3">
            Progresión: {selectedEventInfo.nombre_wa as string}
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {eventos.map((ev: Record<string, unknown>) => (
              <Link
                key={ev.id_evento as number}
                href={`/athletes/${idAtleta}?event=${ev.id_evento}${vsId ? `&vs=${vsId}` : ""}`}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  (ev.id_evento as number) ===
                  (selectedEventInfo!.id_evento as number)
                    ? "bg-wa-blue text-white border-wa-blue"
                    : "bg-white text-neutral-600 border-neutral-300 hover:border-wa-blue"
                }`}
              >
                {ev.nombre_wa as string}
              </Link>
            ))}
          </div>
          <ProgressionChart
            data={progressionData.map((d: Record<string, unknown>) => ({
              fecha: d.fecha as string,
              resultado_formateado: d.resultado_formateado as number,
            }))}
            metrica={selectedEventInfo.metrica as string}
            invertY={(selectedEventInfo.metrica as string) === "Segundos"}
          />
        </section>
      )}

      {/* Recent Results */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-wa-blue mb-3">
          Últimos resultados
        </h2>
        {recentResults.length === 0 ? (
          <p className="text-neutral-400 text-sm">Sin resultados recientes.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-wa-blue text-white hover:bg-wa-blue">
                <TableHead className="text-white">Evento</TableHead>
                <TableHead className="text-white">Marca</TableHead>
                <TableHead className="text-white">Viento</TableHead>
                <TableHead className="text-white">Pos.</TableHead>
                <TableHead className="text-white">Fecha</TableHead>
                <TableHead className="text-white">Campeonato</TableHead>
                <TableHead className="text-white text-right">Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentResults.map((r: Record<string, unknown>, i: number) => (
                <TableRow
                  key={`${r.id_prueba}-${i}`}
                  className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}
                >
                  <TableCell className="font-medium">
                    {r.nombre_wa as string}
                  </TableCell>
                  <TableCell className="font-semibold">
                    <Link
                      href={`/results/${r.id_prueba}`}
                      className="hover:text-wa-blue"
                    >
                      {formatResult(
                        r.resultado_formateado as number,
                        r.metrica as Metrica
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-neutral-500">
                    {formatWind(r.viento_num as number | null)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {(r.posicion as string) || "-"}
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
        )}
      </section>

      {/* Head to Head */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-wa-blue mb-3">
          Head to Head
        </h2>
        <Suspense fallback={null}>
          <HeadToHead currentAtletaId={idAtleta} />
        </Suspense>

        {vsId && rivalAtleta && h2hResults.length > 0 && (
          <div className="mt-4">
            <div className="flex gap-6 items-center mb-4 text-sm">
              <span className="font-semibold text-wa-blue">
                {atleta.nombre} {atleta.apellido}
              </span>
              <span className="text-2xl font-bold text-wa-blue">
                {h2hWins}
              </span>
              <span className="text-neutral-400">-</span>
              <span className="text-2xl font-bold text-neutral-600">
                {h2hLosses}
              </span>
              <span className="font-semibold text-neutral-600">
                {rivalAtleta.nombre} {rivalAtleta.apellido}
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="bg-wa-blue text-white hover:bg-wa-blue">
                  <TableHead className="text-white">Evento</TableHead>
                  <TableHead className="text-white">
                    {atleta.nombre} {atleta.apellido}
                  </TableHead>
                  <TableHead className="text-white">
                    {rivalAtleta.nombre} {rivalAtleta.apellido}
                  </TableHead>
                  <TableHead className="text-white">Fecha</TableHead>
                  <TableHead className="text-white">Campeonato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {h2hResults.map((r: Record<string, unknown>, i: number) => {
                  const metrica = r.metrica as Metrica;
                  const m1 = r.marca1 as number;
                  const m2 = r.marca2 as number;
                  let winner: 1 | 2 | 0 = 0;
                  if (metrica === "Segundos") {
                    if (m1 < m2) winner = 1;
                    else if (m1 > m2) winner = 2;
                  } else {
                    if (m1 > m2) winner = 1;
                    else if (m1 < m2) winner = 2;
                  }

                  return (
                    <TableRow
                      key={`${r.id_prueba}-${i}`}
                      className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}
                    >
                      <TableCell className="font-medium">
                        {r.nombre_wa as string}
                      </TableCell>
                      <TableCell
                        className={`font-semibold ${winner === 1 ? "text-green-600" : ""}`}
                      >
                        {formatResult(m1, metrica)}
                      </TableCell>
                      <TableCell
                        className={`font-semibold ${winner === 2 ? "text-green-600" : ""}`}
                      >
                        {formatResult(m2, metrica)}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-500">
                        {formatDate(r.fecha as string)}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-500">
                        {(r.nombre_campeonato as string) || "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {vsId && h2hResults.length === 0 && (
          <p className="text-neutral-400 text-sm mt-4">
            No se encontraron pruebas compartidas.
          </p>
        )}
      </section>
    </div>
  );
}
