import Link from "next/link";
import { searchCampeonatos } from "@/db/queries";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import SearchForm from "../athletes/SearchForm";

export default async function CompetitionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const query = (sp.q as string) || "";

  let results: Record<string, unknown>[] = [];
  if (query.length >= 2) {
    results = await searchCampeonatos(query);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-wa-blue mb-6">
        Buscar campeonatos
      </h1>

      <SearchForm
        placeholder="Nombre del campeonato..."
        defaultValue={query}
        action="/competitions"
      />

      {query.length >= 2 && (
        <div className="mt-6">
          {results.length === 0 ? (
            <p className="text-neutral-400 text-center py-12">
              No se encontraron campeonatos para &quot;{query}&quot;.
            </p>
          ) : (
            <>
              <p className="text-sm text-neutral-500 mb-3">
                {results.length} resultado(s)
              </p>
              <Table>
                <TableHeader>
                  <TableRow className="bg-wa-blue text-white hover:bg-wa-blue">
                    <TableHead className="text-white">Campeonato</TableHead>
                    <TableHead className="text-white">Torneo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((c, i) => (
                    <TableRow
                      key={c.id_campeonato as number}
                      className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}
                    >
                      <TableCell>
                        <Link
                          href={`/competitions/${c.id_campeonato}`}
                          className="text-wa-blue hover:underline font-medium"
                        >
                          {c.nombre_campeonato as string}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-600">
                        {(c.nombre_torneo as string) || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </div>
      )}

      {!query && (
        <p className="text-neutral-400 text-center py-12">
          Ingresa al menos 2 caracteres para buscar.
        </p>
      )}
    </div>
  );
}
