CREATE TABLE "Atletas" (
  "id_atleta" INT PRIMARY KEY,
  "nombre" TEXT,
  "apellido" TEXT,
  "fecha_nacimiento" DATE,
  "pais" TEXT,
  "colegio" TEXT,
  "club" TEXT,
  "club_master" TEXT
);

CREATE TABLE "Eventos" (
  "id_evento" INT PRIMARY KEY,
  "nombre" TEXT,
  "metrica" TEXT,
  "nombre_wa" TEXT
);

CREATE TABLE "Campeonatos" (
  "id_campeonato" INT PRIMARY KEY,
  "nombre_campeonato" TEXT,
  "nombre_torneo" TEXT
);

CREATE TABLE "Pruebas" (
  "id_prueba" INT PRIMARY KEY,
  "fecha" DATE,
  "hora" TIME,
  "genero" TEXT,
  "categorias" TEXT,
  "prueba_padre" INT,
  "id_campeonato" INT,
  "id_evento" INT,
  "timestamp" TIMESTAMP
);

CREATE TABLE "Resultados" (
  "id_prueba" INT,
  "id_atleta" INT,
  "posicion" TEXT,
  "atleta" TEXT,
  "club" TEXT,
  "pista" TEXT,
  "resultado" TEXT,
  "serie" TEXT,
  "viento" TEXT,
  "resultado_formateado" FLOAT,
  "puntos" INT
);

ALTER TABLE "Pruebas" ADD FOREIGN KEY ("id_campeonato") REFERENCES "Campeonatos" ("id_campeonato");
ALTER TABLE "Pruebas" ADD FOREIGN KEY ("id_evento") REFERENCES "Eventos" ("id_evento");
ALTER TABLE "Resultados" ADD FOREIGN KEY ("id_prueba") REFERENCES "Pruebas" ("id_prueba");
