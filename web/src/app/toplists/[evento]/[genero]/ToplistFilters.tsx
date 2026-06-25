"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Props {
  eventos: { nombre_wa: string }[];
  temporadas: number[];
  clubes: string[];
  currentEvento: string;
  currentGenero: string;
}

export default function ToplistFilters({
  eventos,
  temporadas,
  clubes,
  currentEvento,
  currentGenero,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      return params.toString();
    },
    [searchParams]
  );

  const updateParam = (key: string, value: string) => {
    const qs = createQueryString({ [key]: value || null });
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  const switchEvent = (nombreWa: string) => {
    router.push(
      `/toplists/${encodeURIComponent(nombreWa)}/${currentGenero}?${searchParams.toString()}`
    );
  };

  const switchGender = (genero: string) => {
    router.push(
      `/toplists/${encodeURIComponent(currentEvento)}/${genero}?${searchParams.toString()}`
    );
  };

  const modo = searchParams.get("modo") || "best";
  const temporada = searchParams.get("temporada") || "";
  const clubFilter = searchParams.get("club") || "";
  const vientoLegal = searchParams.get("viento_legal") === "1";
  const edadMin = searchParams.get("edad_min") || "";
  const edadMax = searchParams.get("edad_max") || "";
  const desde = searchParams.get("desde") || "";
  const hasta = searchParams.get("hasta") || "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            Evento
          </label>
          <Select
            value={currentEvento}
            onChange={(e) => switchEvent(e.target.value)}
            className="w-36"
          >
            {eventos.map((ev) => (
              <option key={ev.nombre_wa} value={ev.nombre_wa}>
                {ev.nombre_wa}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            Género
          </label>
          <Select
            value={currentGenero}
            onChange={(e) => switchGender(e.target.value)}
            className="w-32"
          >
            <option value="hombres">Hombres</option>
            <option value="mujeres">Mujeres</option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            Temporada
          </label>
          <Select
            value={temporada}
            onChange={(e) => updateParam("temporada", e.target.value)}
            className="w-28"
          >
            <option value="">Todas</option>
            {temporadas.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            Modo
          </label>
          <Select
            value={modo}
            onChange={(e) => updateParam("modo", e.target.value)}
            className="w-32"
          >
            <option value="best">Mejor marca</option>
            <option value="all">Todas</option>
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            Club
          </label>
          <Select
            value={clubFilter}
            onChange={(e) => updateParam("club", e.target.value)}
            className="w-44"
          >
            <option value="">Todos</option>
            {clubes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer pb-1">
          <input
            type="checkbox"
            checked={vientoLegal}
            onChange={(e) =>
              updateParam("viento_legal", e.target.checked ? "1" : "")
            }
            className="rounded border-neutral-300"
          />
          Viento legal
        </label>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            Desde
          </label>
          <Input
            type="date"
            value={desde}
            onChange={(e) => updateParam("desde", e.target.value)}
            className="w-36"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            Hasta
          </label>
          <Input
            type="date"
            value={hasta}
            onChange={(e) => updateParam("hasta", e.target.value)}
            className="w-36"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            Edad mín.
          </label>
          <Input
            type="number"
            value={edadMin}
            onChange={(e) => updateParam("edad_min", e.target.value)}
            className="w-20"
            min={0}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1">
            Edad máx.
          </label>
          <Input
            type="number"
            value={edadMax}
            onChange={(e) => updateParam("edad_max", e.target.value)}
            className="w-20"
            min={0}
          />
        </div>
      </div>
    </div>
  );
}
