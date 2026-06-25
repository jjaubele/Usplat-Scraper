import {
  pgTable,
  integer,
  text,
  date,
  time,
  timestamp,
  doublePrecision,
  primaryKey,
} from "drizzle-orm/pg-core";

export const atletas = pgTable("Atletas", {
  id_atleta: integer("id_atleta").primaryKey(),
  nombre: text("nombre"),
  apellido: text("apellido"),
  fecha_nacimiento: date("fecha_nacimiento"),
  pais: text("pais"),
  colegio: text("colegio"),
  club: text("club"),
  club_master: text("club_master"),
});

export const eventos = pgTable("Eventos", {
  id_evento: integer("id_evento").primaryKey(),
  nombre: text("nombre"),
  metrica: text("metrica"),
  nombre_wa: text("nombre_wa"),
});

export const campeonatos = pgTable("Campeonatos", {
  id_campeonato: integer("id_campeonato").primaryKey(),
  nombre_campeonato: text("nombre_campeonato"),
  nombre_torneo: text("nombre_torneo"),
});

export const pruebas = pgTable("Pruebas", {
  id_prueba: integer("id_prueba").primaryKey(),
  fecha: date("fecha"),
  hora: time("hora"),
  genero: text("genero"),
  categorias: text("categorias"),
  prueba_padre: integer("prueba_padre"),
  id_campeonato: integer("id_campeonato").references(() => campeonatos.id_campeonato),
  id_evento: integer("id_evento").references(() => eventos.id_evento),
  timestamp: timestamp("timestamp"),
});

export const resultados = pgTable("Resultados", {
  id_prueba: integer("id_prueba").references(() => pruebas.id_prueba),
  id_atleta: integer("id_atleta"),
  posicion: text("posicion"),
  atleta: text("atleta"),
  club: text("club"),
  pista: text("pista"),
  resultado: text("resultado"),
  serie: text("serie"),
  viento: text("viento"),
  resultado_formateado: doublePrecision("resultado_formateado"),
  puntos: integer("puntos"),
});

export type Atleta = typeof atletas.$inferSelect;
export type Evento = typeof eventos.$inferSelect;
export type Campeonato = typeof campeonatos.$inferSelect;
export type Prueba = typeof pruebas.$inferSelect;
export type Resultado = typeof resultados.$inferSelect;

export type Metrica = "Segundos" | "Metros" | "Puntos";
export type Genero = "Hombres" | "Mujeres";

export interface MvPerformance {
  id_prueba: number;
  id_atleta: number | null;
  id_evento: number;
  id_campeonato: number;
  nombre_wa: string;
  metrica: Metrica;
  genero: Genero;
  fecha: string;
  temporada: number;
  edad_en_competencia: number | null;
  club_representado: string | null;
  nombre_atleta: string | null;
  viento_num: number | null;
  viento_legal: boolean;
  resultado_formateado: number | null;
  puntos: number | null;
  posicion: string | null;
  serie: string | null;
  es_relevo: boolean;
  nombre_campeonato: string | null;
}
