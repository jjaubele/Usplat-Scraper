import type { Metrica } from "@/db/schema";

export function formatResult(value: number | null, metrica: Metrica): string {
  if (value === null || value === undefined) return "-";

  if (metrica === "Segundos") {
    if (value >= 3600) {
      const hours = Math.floor(value / 3600);
      const mins = Math.floor((value % 3600) / 60);
      const secs = value % 60;
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toFixed(2).padStart(5, "0")}`;
    }
    if (value >= 60) {
      const mins = Math.floor(value / 60);
      const secs = value % 60;
      return `${mins}:${secs.toFixed(2).padStart(5, "0")}`;
    }
    return value.toFixed(2);
  }

  if (metrica === "Metros") {
    return value.toFixed(2);
  }

  return Math.round(value).toString();
}

export function formatWind(value: number | null): string {
  if (value === null || value === undefined) return "";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatAge(age: number | null): string {
  if (age === null || age === undefined) return "-";
  return age.toString();
}

export function generoLabel(genero: string): string {
  return genero === "Hombres" ? "Hombres" : "Mujeres";
}

export function generoSlug(genero: string): string {
  return genero === "Hombres" ? "hombres" : "mujeres";
}

export function generoFromSlug(slug: string): string {
  return slug === "hombres" ? "Hombres" : "Mujeres";
}
