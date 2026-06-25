-- Materialized view: mv_performances
-- Flattened view of all individual results for fast querying
-- Run this AFTER the base schema (Load/UsplatDB.sql) has been applied

-- Enable pg_trgm for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop existing view if it exists (for re-running)
DROP MATERIALIZED VIEW IF EXISTS mv_performances;

CREATE MATERIALIZED VIEW mv_performances AS
SELECT
  r."id_prueba",
  r."id_atleta",
  e."id_evento",
  p."id_campeonato",
  e."nombre_wa",
  e."metrica",
  p."genero",
  p."fecha",
  EXTRACT(YEAR FROM p."fecha")::INT AS temporada,
  CASE
    WHEN a."fecha_nacimiento" IS NOT NULL AND p."fecha" IS NOT NULL
    THEN EXTRACT(YEAR FROM age(p."fecha", a."fecha_nacimiento"))::INT
    ELSE NULL
  END AS edad_en_competencia,
  r."club" AS club_representado,
  r."atleta" AS nombre_atleta,
  CASE
    WHEN r."viento" IS NULL OR r."viento" = '' OR r."viento" = 'NaN'
    THEN NULL
    ELSE REPLACE(r."viento", ',', '.')::FLOAT
  END AS viento_num,
  CASE
    WHEN r."viento" IS NULL OR r."viento" = '' OR r."viento" = 'NaN'
    THEN TRUE
    ELSE REPLACE(r."viento", ',', '.')::FLOAT <= 2.0
  END AS viento_legal,
  r."resultado_formateado",
  r."puntos",
  r."posicion",
  r."serie",
  (r."id_atleta" IS NULL) AS es_relevo,
  c."nombre_campeonato"
FROM "Resultados" r
JOIN "Pruebas" p ON r."id_prueba" = p."id_prueba"
JOIN "Eventos" e ON p."id_evento" = e."id_evento"
LEFT JOIN "Atletas" a ON r."id_atleta" = a."id_atleta"
LEFT JOIN "Campeonatos" c ON p."id_campeonato" = c."id_campeonato"
WHERE r."resultado_formateado" IS NOT NULL;

-- Note: CONCURRENTLY refresh requires a unique index, but the source data has
-- true duplicates in relay results. Use regular REFRESH MATERIALIZED VIEW instead.

-- Indexes for toplists
CREATE INDEX IF NOT EXISTS idx_mv_perf_toplists
  ON mv_performances (id_evento, genero, temporada, resultado_formateado);

-- Indexes for athlete profile (PB/SB)
CREATE INDEX IF NOT EXISTS idx_mv_perf_athlete
  ON mv_performances (id_atleta, id_evento, resultado_formateado);

-- Index for head-to-head (join by prueba)
CREATE INDEX IF NOT EXISTS idx_mv_perf_prueba
  ON mv_performances (id_prueba);

-- Indexes on base tables
CREATE INDEX IF NOT EXISTS idx_resultados_atleta ON "Resultados" ("id_atleta");
CREATE INDEX IF NOT EXISTS idx_resultados_prueba ON "Resultados" ("id_prueba");
CREATE INDEX IF NOT EXISTS idx_pruebas_evento ON "Pruebas" ("id_evento");
CREATE INDEX IF NOT EXISTS idx_pruebas_campeonato ON "Pruebas" ("id_campeonato");
CREATE INDEX IF NOT EXISTS idx_pruebas_fecha ON "Pruebas" ("fecha");

-- GIN trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_atletas_nombre_trgm
  ON "Atletas" USING GIN ((COALESCE("nombre", '') || ' ' || COALESCE("apellido", '')) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_campeonatos_nombre_trgm
  ON "Campeonatos" USING GIN ((COALESCE("nombre_campeonato", '') || ' ' || COALESCE("nombre_torneo", '')) gin_trgm_ops);
