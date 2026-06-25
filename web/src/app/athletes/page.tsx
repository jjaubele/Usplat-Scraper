import Link from "next/link";
import { searchAtletas } from "@/db/queries";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import SearchForm from "./SearchForm";

export default async function AthletesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const query = (sp.q as string) || "";

  let results: Record<string, unknown>[] = [];
  if (query.length >= 2) {
    results = await searchAtletas(query);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-wa-blue mb-6">Buscar atletas</h1>

      <SearchForm
        placeholder="Nombre del atleta..."
        defaultValue={query}
        action="/athletes"
      />

      {query.length >= 2 && (
        <div className="mt-6">
          {results.length === 0 ? (
            <p className="text-neutral-400 text-center py-12">
              No se encontraron atletas para &quot;{query}&quot;.
            </p>
          ) : (
            <>
              <p className="text-sm text-neutral-500 mb-3">
                {results.length} resultado(s)
              </p>
              <Table>
                <TableHeader>
                  <TableRow className="bg-wa-blue text-white hover:bg-wa-blue">
                    <TableHead className="text-white">Nombre</TableHead>
                    <TableHead className="text-white">País</TableHead>
                    <TableHead className="text-white">Club</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((a, i) => (
                    <TableRow
                      key={a.id_atleta as number}
                      className={i % 2 === 0 ? "bg-white" : "bg-neutral-50"}
                    >
                      <TableCell>
                        <Link
                          href={`/athletes/${a.id_atleta}`}
                          className="text-wa-blue hover:underline font-medium"
                        >
                          {a.nombre as string} {a.apellido as string}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-600">
                        {(a.pais as string) || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-600">
                        {(a.club as string) || "-"}
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
