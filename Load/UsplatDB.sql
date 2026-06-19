CREATE TYPE "SEX_TYPE" AS ENUM (
  'masculino',
  'femenino',
  'otro'
);

CREATE TYPE "ORG_TYPE" AS ENUM (
  'club',
  'colegio',
  'asociacion',
  'otro'
);

CREATE TYPE "SPECIALITY_TYPE" AS ENUM (
  'Velocidad',
  'Fondo/Medio Fondo',
  'Vallas',
  'Lanzamientos',
  'Saltos',
  'otro'
);

CREATE TYPE "METRICS_TYPE" AS ENUM (
  'tiempo',
  'distancia',
  'puntos'
);

CREATE TABLE "Atletas" (
  "id_atleta" INT PRIMARY KEY,
  "nombre" TEXT,
  "apellido" TEXT,
  "sexo" "SEX_TYPE",
  "id_pais" INT,
  "fecha_de_nacimiento" DATE
);

CREATE TABLE "Organizaciones" (
  "id_organizacion" INT PRIMARY KEY,
  "nombre" TEXT,
  "tipo" "ORG_TYPE",
  "id_region" INT
);

CREATE TABLE "Inscripciones" (
  "id_atleta" INT,
  "id_organizacion" INT
);

CREATE TABLE "Paises" (
  "id_pais" INT PRIMARY KEY,
  "nombre" TEXT
);

CREATE TABLE "Regiones" (
  "id_region" INT PRIMARY KEY,
  "nombre" TEXT
);

CREATE TABLE "Pruebas" (
  "id_prueba" INT PRIMARY KEY,
  "nombre" TEXT,
  "detalle" TEXT,
  "especialidad" "SPECIALITY_TYPE",
  "sexo" "SEX_TYPE",
  "metrica" "METRICS_TYPE"
);

CREATE TABLE "Torneo" (
  "id_torneo" INT PRIMARY KEY,
  "nombre" TEXT,
  "id_organizacion" INT
);

CREATE TABLE "Campeonatos" (
  "id_campeonato" INT PRIMARY KEY,
  "nombre" TEXT,
  "fecha_inicio" DATE,
  "fecha_termino" DATE,
  "id_torneo" INT
);

CREATE TABLE "Resultados" (
  "id_resultado" INT PRIMARY KEY,
  "id_atleta" INT,
  "id_competencia" INT,
  "serie" TEXT,
  "tiempo" TIME,
  "distancia" NUMERIC(5,2),
  "puntaje" INT,
  "puntaje_WA" INT
);

CREATE TABLE "Competencias" (
  "id_competencia" INT PRIMARY KEY,
  "id_prueba" INT,
  "id_campeonato" INT,
  "horario" TIMESTAMP,
  "id_locacion" INT
);

CREATE TABLE "Locaciones" (
  "id_locacion" INT PRIMARY KEY,
  "ciudad" TEXT,
  "id_pais" INT
);

ALTER TABLE "Atletas" ADD FOREIGN KEY ("id_pais") REFERENCES "Paises" ("id_pais");

ALTER TABLE "Organizaciones" ADD FOREIGN KEY ("id_region") REFERENCES "Regiones" ("id_region");

ALTER TABLE "Inscripciones" ADD FOREIGN KEY ("id_atleta") REFERENCES "Atletas" ("id_atleta");

ALTER TABLE "Inscripciones" ADD FOREIGN KEY ("id_organizacion") REFERENCES "Organizaciones" ("id_organizacion");

ALTER TABLE "Torneo" ADD FOREIGN KEY ("id_organizacion") REFERENCES "Organizaciones" ("id_organizacion");

ALTER TABLE "Campeonatos" ADD FOREIGN KEY ("id_torneo") REFERENCES "Torneo" ("id_torneo");

ALTER TABLE "Resultados" ADD FOREIGN KEY ("id_atleta") REFERENCES "Atletas" ("id_atleta");

ALTER TABLE "Resultados" ADD FOREIGN KEY ("id_competencia") REFERENCES "Competencias" ("id_competencia");

ALTER TABLE "Competencias" ADD FOREIGN KEY ("id_prueba") REFERENCES "Pruebas" ("id_prueba");

ALTER TABLE "Competencias" ADD FOREIGN KEY ("id_campeonato") REFERENCES "Campeonatos" ("id_campeonato");

ALTER TABLE "Competencias" ADD FOREIGN KEY ("id_locacion") REFERENCES "Locaciones" ("id_locacion");

ALTER TABLE "Locaciones" ADD FOREIGN KEY ("id_pais") REFERENCES "Paises" ("id_pais");
