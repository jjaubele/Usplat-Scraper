# Atletismo Chile - Web

Plataforma de visualización de resultados de atletismo chileno.

## Requisitos

- Node.js >= 20.9.0
- PostgreSQL con la BD `usplat_db` ya poblada (ver `Load/UsplatDB.sql`)
- Extensión `pg_trgm` habilitada en PostgreSQL

## Instalación

```bash
cd web
npm install
```

## Configuración

El archivo `.env` debe estar en la **raíz del repo** (un nivel arriba de `web/`), con las variables:

```dotenv
HOST=localhost
DATABASE=usplat_db
DB_USER=postgres
DB_PASSWORD=1234
PORT=5432
# Opcional: si existe, se usa directamente
DATABASE_URL=postgresql://postgres:1234@localhost:5432/usplat_db
```

## Migración de la vista materializada

Ejecutar una sola vez (después de tener la BD base cargada):

```bash
psql -h localhost -U postgres -d usplat_db -f db/migrations/001_mv_performances.sql
```

Para refrescar la vista después de cada carga del ETL:

```bash
psql -h localhost -U postgres -d usplat_db -f db/migrations/refresh_mv.sql
```

## Desarrollo

```bash
npm run dev
```

Abre http://localhost:3000
