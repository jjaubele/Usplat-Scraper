"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  fecha: string;
  resultado_formateado: number;
}

interface Props {
  data: DataPoint[];
  metrica: string;
  invertY: boolean;
}

export default function ProgressionChart({ data, metrica, invertY }: Props) {
  if (data.length < 2) {
    return (
      <p className="text-neutral-400 text-sm py-4">
        Se necesitan al menos 2 marcas para mostrar la progresión.
      </p>
    );
  }

  const sorted = [...data].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  const chartData = sorted.map((d) => ({
    fecha: d.fecha,
    marca: d.resultado_formateado,
  }));

  const unit = metrica === "Segundos" ? "s" : metrica === "Metros" ? "m" : "pts";

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis
            dataKey="fecha"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => {
              const d = new Date(v + "T00:00:00");
              return d.toLocaleDateString("es-CL", {
                month: "short",
                year: "2-digit",
              });
            }}
          />
          <YAxis
            reversed={invertY}
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v}${unit}`}
            domain={["auto", "auto"]}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any) => [`${Number(value).toFixed(2)} ${unit}`, "Marca"]) as any}
            labelFormatter={(label) => {
              const d = new Date(label + "T00:00:00");
              return d.toLocaleDateString("es-CL", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
            }}
          />
          <Line
            type="monotone"
            dataKey="marca"
            stroke="#1a2b5f"
            strokeWidth={2}
            dot={{ r: 3, fill: "#1a2b5f" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
