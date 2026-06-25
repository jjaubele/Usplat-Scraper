import Link from "next/link";

const popularEvents = [
  { nombre_wa: "100m", label: "100 metros" },
  { nombre_wa: "200m", label: "200 metros" },
  { nombre_wa: "400m", label: "400 metros" },
  { nombre_wa: "800m", label: "800 metros" },
  { nombre_wa: "1500m", label: "1500 metros" },
  { nombre_wa: "5000m", label: "5000 metros" },
  { nombre_wa: "110mH", label: "110m vallas" },
  { nombre_wa: "100mH", label: "100m vallas" },
  { nombre_wa: "LJ", label: "Salto largo" },
  { nombre_wa: "HJ", label: "Salto alto" },
  { nombre_wa: "SP", label: "Lanzamiento bala" },
  { nombre_wa: "DT", label: "Lanzamiento disco" },
];

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold text-wa-blue mb-4">
          Atletismo Chile
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Rankings, resultados y perfiles de atletas del atletismo chileno.
          Datos actualizados desde atletismo.usplat.cl.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-6 text-wa-blue">
          Rankings por evento
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {popularEvents.map((evt) => (
            <Link
              key={evt.nombre_wa}
              href={`/toplists/${encodeURIComponent(evt.nombre_wa)}/hombres`}
              className="block p-4 rounded-lg border border-neutral-200 hover:border-wa-blue hover:bg-blue-50/50 transition-colors text-center"
            >
              <span className="text-lg font-semibold text-wa-blue">
                {evt.nombre_wa}
              </span>
              <span className="block text-xs text-neutral-500 mt-1">
                {evt.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        <Link
          href="/athletes"
          className="block p-8 rounded-xl border border-neutral-200 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-wa-blue mb-2">
            Buscar atletas
          </h3>
          <p className="text-sm text-neutral-500">
            Encuentra cualquier atleta por nombre y consulta su historial
            completo de marcas.
          </p>
        </Link>
        <Link
          href="/competitions"
          className="block p-8 rounded-xl border border-neutral-200 hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-wa-blue mb-2">
            Campeonatos
          </h3>
          <p className="text-sm text-neutral-500">
            Explora campeonatos y revisa los resultados de cada prueba.
          </p>
        </Link>
      </section>
    </div>
  );
}
