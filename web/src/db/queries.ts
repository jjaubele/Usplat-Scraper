import { sql } from "./connection";
import type { MvPerformance, Metrica } from "./schema";

export function getSortDirection(metrica: Metrica): "ASC" | "DESC" {
  return metrica === "Segundos" ? "ASC" : "DESC";
}

export async function getEventos() {
  return sql`
    SELECT DISTINCT id_evento, nombre, metrica, nombre_wa
    FROM "Eventos"
    ORDER BY nombre_wa
  `;
}

export async function getEvento(id: number) {
  const rows = await sql`
    SELECT * FROM "Eventos" WHERE id_evento = ${id}
  `;
  return rows[0] || null;
}

export async function getEventoByNombreWa(nombreWa: string) {
  const rows = await sql`
    SELECT * FROM "Eventos" WHERE nombre_wa = ${nombreWa} LIMIT 1
  `;
  return rows[0] || null;
}

export async function getTemporadas() {
  return sql`
    SELECT DISTINCT temporada FROM mv_performances
    WHERE temporada IS NOT NULL
    ORDER BY temporada DESC
  `;
}

export async function getClubes() {
  return sql`
    SELECT DISTINCT club_representado
    FROM mv_performances
    WHERE club_representado IS NOT NULL AND club_representado != ''
    ORDER BY club_representado
  `;
}

export async function getCategorias() {
  return sql`
    SELECT DISTINCT categorias FROM "Pruebas"
    WHERE categorias IS NOT NULL AND categorias != ''
    ORDER BY categorias
  `;
}

interface ToplistParams {
  idEvento: number;
  genero: string;
  temporada?: number;
  desde?: string;
  hasta?: string;
  edadMin?: number;
  edadMax?: number;
  club?: string;
  vientoLegal?: boolean;
  modo?: "best" | "all";
  categoria?: string;
  limit?: number;
  offset?: number;
}

export async function getToplist(params: ToplistParams) {
  const {
    idEvento,
    genero,
    temporada,
    desde,
    hasta,
    edadMin,
    edadMax,
    club,
    vientoLegal,
    modo = "best",
    categoria,
    limit = 50,
    offset = 0,
  } = params;

  const metricaRows = await sql`
    SELECT metrica FROM "Eventos" WHERE id_evento = ${idEvento}
  `;
  const metrica = metricaRows[0]?.metrica as Metrica;
  const dir = getSortDirection(metrica);

  const conditions: string[] = [
    `mv.id_evento = ${idEvento}`,
    `mv.genero = '${genero}'`,
    `mv.es_relevo = false`,
  ];

  if (temporada && !desde && !hasta) {
    conditions.push(`mv.temporada = ${temporada}`);
  }
  if (desde) {
    conditions.push(`mv.fecha >= '${desde}'`);
  }
  if (hasta) {
    conditions.push(`mv.fecha <= '${hasta}'`);
  }
  if (edadMin !== undefined) {
    conditions.push(`mv.edad_en_competencia >= ${edadMin}`);
  }
  if (edadMax !== undefined) {
    conditions.push(`mv.edad_en_competencia <= ${edadMax}`);
  }
  if (club) {
    conditions.push(`mv.club_representado = '${club.replace(/'/g, "''")}'`);
  }
  if (vientoLegal) {
    conditions.push(`mv.viento_legal = true`);
  }
  if (categoria) {
    conditions.push(
      `EXISTS (
        SELECT 1 FROM "Pruebas" p2
        WHERE p2.id_prueba = mv.id_prueba
        AND p2.categorias LIKE '%${categoria.replace(/'/g, "''")}%'
      )`
    );
  }

  const whereClause = conditions.join(" AND ");

  if (modo === "best") {
    return sql.unsafe(`
      WITH ranked AS (
        SELECT mv.*,
          ROW_NUMBER() OVER (
            PARTITION BY mv.id_atleta
            ORDER BY mv.resultado_formateado ${dir}
          ) AS rn
        FROM mv_performances mv
        WHERE ${whereClause}
          AND mv.id_atleta IS NOT NULL
      )
      SELECT *, ROW_NUMBER() OVER (ORDER BY resultado_formateado ${dir}) AS ranking
      FROM ranked
      WHERE rn = 1
      ORDER BY resultado_formateado ${dir}
      LIMIT ${limit} OFFSET ${offset}
    `);
  }

  return sql.unsafe(`
    SELECT mv.*,
      ROW_NUMBER() OVER (ORDER BY mv.resultado_formateado ${dir}) AS ranking
    FROM mv_performances mv
    WHERE ${whereClause}
    ORDER BY mv.resultado_formateado ${dir}
    LIMIT ${limit} OFFSET ${offset}
  `);
}

export async function getToplistCount(params: ToplistParams) {
  const {
    idEvento,
    genero,
    temporada,
    desde,
    hasta,
    edadMin,
    edadMax,
    club,
    vientoLegal,
    modo = "best",
    categoria,
  } = params;

  const conditions: string[] = [
    `mv.id_evento = ${idEvento}`,
    `mv.genero = '${genero}'`,
    `mv.es_relevo = false`,
  ];

  if (temporada && !desde && !hasta) {
    conditions.push(`mv.temporada = ${temporada}`);
  }
  if (desde) conditions.push(`mv.fecha >= '${desde}'`);
  if (hasta) conditions.push(`mv.fecha <= '${hasta}'`);
  if (edadMin !== undefined) conditions.push(`mv.edad_en_competencia >= ${edadMin}`);
  if (edadMax !== undefined) conditions.push(`mv.edad_en_competencia <= ${edadMax}`);
  if (club) conditions.push(`mv.club_representado = '${club.replace(/'/g, "''")}'`);
  if (vientoLegal) conditions.push(`mv.viento_legal = true`);
  if (categoria) {
    conditions.push(
      `EXISTS (SELECT 1 FROM "Pruebas" p2 WHERE p2.id_prueba = mv.id_prueba AND p2.categorias LIKE '%${categoria.replace(/'/g, "''")}%')`
    );
  }

  const whereClause = conditions.join(" AND ");

  if (modo === "best") {
    const rows = await sql.unsafe(`
      SELECT COUNT(DISTINCT mv.id_atleta) AS count
      FROM mv_performances mv
      WHERE ${whereClause} AND mv.id_atleta IS NOT NULL
    `);
    return Number(rows[0].count);
  }

  const rows = await sql.unsafe(`
    SELECT COUNT(*) AS count
    FROM mv_performances mv
    WHERE ${whereClause}
  `);
  return Number(rows[0].count);
}

export async function getAtleta(id: number) {
  const rows = await sql`
    SELECT * FROM "Atletas" WHERE id_atleta = ${id}
  `;
  return rows[0] || null;
}

export async function getAtletaPBs(idAtleta: number) {
  return sql`
    SELECT DISTINCT ON (mv.id_evento)
      mv.id_evento, mv.nombre_wa, mv.metrica,
      mv.resultado_formateado, mv.puntos, mv.fecha,
      mv.nombre_campeonato, mv.viento_num, mv.id_prueba
    FROM mv_performances mv
    WHERE mv.id_atleta = ${idAtleta}
      AND mv.es_relevo = false
    ORDER BY mv.id_evento,
      CASE WHEN mv.metrica = 'Segundos' THEN mv.resultado_formateado END ASC,
      CASE WHEN mv.metrica != 'Segundos' THEN mv.resultado_formateado END DESC
  `;
}

export async function getAtletaSBs(idAtleta: number, temporada: number) {
  return sql`
    SELECT DISTINCT ON (mv.id_evento)
      mv.id_evento, mv.nombre_wa, mv.metrica,
      mv.resultado_formateado, mv.puntos, mv.fecha,
      mv.nombre_campeonato, mv.viento_num, mv.id_prueba
    FROM mv_performances mv
    WHERE mv.id_atleta = ${idAtleta}
      AND mv.es_relevo = false
      AND mv.temporada = ${temporada}
    ORDER BY mv.id_evento,
      CASE WHEN mv.metrica = 'Segundos' THEN mv.resultado_formateado END ASC,
      CASE WHEN mv.metrica != 'Segundos' THEN mv.resultado_formateado END DESC
  `;
}

export async function getAtletaResults(idAtleta: number, limit = 50, offset = 0) {
  return sql`
    SELECT mv.*, mv.nombre_campeonato
    FROM mv_performances mv
    WHERE mv.id_atleta = ${idAtleta}
      AND mv.es_relevo = false
    ORDER BY mv.fecha DESC NULLS LAST
    LIMIT ${limit} OFFSET ${offset}
  `;
}

export async function getAtletaResultsByEvent(idAtleta: number, idEvento: number) {
  return sql`
    SELECT mv.*
    FROM mv_performances mv
    WHERE mv.id_atleta = ${idAtleta}
      AND mv.id_evento = ${idEvento}
      AND mv.es_relevo = false
    ORDER BY mv.fecha ASC NULLS LAST
  `;
}

export async function getAtletaEventos(idAtleta: number) {
  return sql`
    SELECT DISTINCT mv.id_evento, mv.nombre_wa, mv.metrica
    FROM mv_performances mv
    WHERE mv.id_atleta = ${idAtleta}
      AND mv.es_relevo = false
    ORDER BY mv.nombre_wa
  `;
}

export async function getHeadToHead(idAtleta1: number, idAtleta2: number) {
  return sql`
    SELECT
      a.id_prueba, a.nombre_wa, a.metrica, a.fecha, a.nombre_campeonato,
      a.resultado_formateado AS marca1, a.puntos AS puntos1,
      b.resultado_formateado AS marca2, b.puntos AS puntos2
    FROM mv_performances a
    JOIN mv_performances b ON a.id_prueba = b.id_prueba
    WHERE a.id_atleta = ${idAtleta1}
      AND b.id_atleta = ${idAtleta2}
      AND a.es_relevo = false
      AND b.es_relevo = false
    ORDER BY a.fecha DESC NULLS LAST
  `;
}

export async function searchAtletas(query: string, limit = 30) {
  return sql`
    SELECT id_atleta, nombre, apellido, pais, club,
      similarity(COALESCE(nombre, '') || ' ' || COALESCE(apellido, ''), ${query}) AS sim
    FROM "Atletas"
    WHERE (COALESCE(nombre, '') || ' ' || COALESCE(apellido, '')) % ${query}
    ORDER BY sim DESC
    LIMIT ${limit}
  `;
}

export async function searchCampeonatos(query: string, limit = 30) {
  return sql`
    SELECT id_campeonato, nombre_campeonato, nombre_torneo,
      similarity(COALESCE(nombre_campeonato, '') || ' ' || COALESCE(nombre_torneo, ''), ${query}) AS sim
    FROM "Campeonatos"
    WHERE (COALESCE(nombre_campeonato, '') || ' ' || COALESCE(nombre_torneo, '')) % ${query}
    ORDER BY sim DESC
    LIMIT ${limit}
  `;
}

export async function getCampeonato(id: number) {
  const rows = await sql`
    SELECT * FROM "Campeonatos" WHERE id_campeonato = ${id}
  `;
  return rows[0] || null;
}

export async function getCampeonatoPruebas(idCampeonato: number) {
  return sql`
    SELECT p.id_prueba, p.fecha, p.hora, p.genero, p.categorias,
      p.prueba_padre, e.nombre_wa, e.nombre AS evento_nombre, e.metrica
    FROM "Pruebas" p
    JOIN "Eventos" e ON p.id_evento = e.id_evento
    WHERE p.id_campeonato = ${idCampeonato}
    ORDER BY e.nombre_wa, p.genero, p.fecha
  `;
}

export async function getPrueba(idPrueba: number) {
  const rows = await sql`
    SELECT p.*, e.nombre_wa, e.nombre AS evento_nombre, e.metrica,
      c.nombre_campeonato, c.nombre_torneo, c.id_campeonato
    FROM "Pruebas" p
    JOIN "Eventos" e ON p.id_evento = e.id_evento
    LEFT JOIN "Campeonatos" c ON p.id_campeonato = c.id_campeonato
    WHERE p.id_prueba = ${idPrueba}
  `;
  return rows[0] || null;
}

export async function getPruebaResultados(idPrueba: number) {
  const prueba = await getPrueba(idPrueba);
  if (!prueba) return [];

  const dir = getSortDirection(prueba.metrica as Metrica);

  return sql.unsafe(`
    SELECT r.*, a.nombre AS atleta_nombre, a.apellido AS atleta_apellido
    FROM "Resultados" r
    LEFT JOIN "Atletas" a ON r.id_atleta = a.id_atleta
    WHERE r.id_prueba = ${idPrueba}
    ORDER BY
      CASE WHEN r.posicion ~ '^[0-9]' THEN r.posicion::float ELSE 9999 END ASC,
      r.resultado_formateado ${dir} NULLS LAST
  `);
}

export async function getPruebaHijos(idPruebaPadre: number) {
  return sql`
    SELECT p.id_prueba, p.fecha, p.hora, p.genero, p.categorias, p.prueba_padre,
      e.nombre_wa
    FROM "Pruebas" p
    JOIN "Eventos" e ON p.id_evento = e.id_evento
    WHERE p.prueba_padre = ${idPruebaPadre}
    ORDER BY p.fecha, p.hora
  `;
}
