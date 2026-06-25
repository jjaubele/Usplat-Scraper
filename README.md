# 🏃 USPLAT Scraper — Pipeline ETL de Atletismo

Pipeline de extracción, transformación y carga (ETL) de resultados de competencias de atletismo desde la plataforma [atletismo.usplat.cl](https://atletismo.usplat.cl), orientado a construir una base de datos relacional con el historial de atletas, campeonatos y marcas.

---

## 📁 Estructura del Proyecto

```
Usplat Scraper/
│
├── Extract/                        # Extracción de datos desde USPLAT
│   ├── ScraperAtletas.ipynb        # Scraper de perfiles de atletas
│   ├── 2_pruebas_de_campeonato.py  # Scraper de pruebas por campeonato
│   └── 3_resultados_de_pruebas.py  # Scraper de resultados por prueba
│
├── Transform/                      # Limpieza y transformación de datos
│   └── transform_data.ipynb        # Notebook de limpieza y generación de CSVs
│
├── Load/                           # Carga a base de datos PostgreSQL
│   ├── UsplatDB.sql                # Definición del esquema relacional
│   └── load_data_to_postgres.py    # Script de carga de CSVs a PostgreSQL
│
└── BD/                             # Carpeta de datos (no incluida en el repositorio)
    ├── JSON/                       # Archivos JSON generados por los scrapers
    └── Tablas/                     # Archivos CSV listos para cargar
        ├── atletas.csv
        ├── campeonatos.csv
        ├── eventos.csv
        ├── pruebas.csv
        └── resultados.csv
```

> **Nota:** La carpeta `BD/` no está incluida en el repositorio por capacidad. Debe generarse ejecutando el pipeline completo.

---

## ⚙️ Flujo ETL

```
[USPLAT] → Extract → BD/JSON → Transform → BD/Tablas (CSV) → Load → PostgreSQL
```

### 1. Extract

Los scrapers obtienen los datos de [atletismo.usplat.cl](https://atletismo.usplat.cl) y los almacenan como archivos JSON en `BD/JSON/`. La extracción requiere credenciales de acceso a la plataforma, que se leen desde variables de entorno.

| Archivo | Descripción |
|---|---|
| `ScraperAtletas.ipynb` | Extrae perfiles de atletas (nombre, apellido, fecha de nacimiento, país, colegio, club). Usa `httpx` + `lxml` y detecta incrementalmente los IDs nuevos. |
| `2_pruebas_de_campeonato.py` | Extrae las pruebas asociadas a cada campeonato (nombre del torneo, campeonato y listado de IDs de pruebas). |
| `3_resultados_de_pruebas.py` | Extrae los resultados de cada prueba (posición, atleta, club, resultado, serie, viento). Usa navegación automatizada con Playwright para páginas con contenido dinámico. Incluye lógica de re-scraping para pruebas cuyo resultado aún puede actualizarse. |

### 2. Transform

El notebook `transform_data.ipynb` lee los archivos JSON de `BD/JSON/`, realiza la limpieza y normalización de los datos, y genera cinco tablas CSV en `BD/Tablas/`:

- Estandarización de nombres de eventos al formato World Athletics (WA).
- Conversión de resultados a formato numérico uniforme (`resultado_formateado`), diferenciando entre eventos de tiempo, distancia y puntos.
- Asignación de puntuación WA a cada resultado.
- Detección y corrección de duplicados y resultados mal formateados.
- Asignación de campeonatos a pruebas sin campeonato directo, usando heurísticas basadas en IDs consecutivos y atributos de la prueba.

### 3. Load

`load_data_to_postgres.py` carga las cinco tablas CSV a una base de datos PostgreSQL en el siguiente orden, respetando las claves foráneas:

1. Crea el esquema ejecutando `UsplatDB.sql`
2. Carga `atletas.csv`
3. Carga `campeonatos.csv`
4. Carga `eventos.csv`
5. Carga `pruebas.csv`
6. Carga `resultados.csv`

---

## 🗄️ Modelo de Datos

```
Atletas ──────────────────────────────────────────┐
  id_atleta (PK)                                  │
  nombre, apellido, fecha_nacimiento              │
  pais, colegio, club, club_master                │
                                                  ▼
Campeonatos         Eventos           Resultados
  id_campeonato (PK)  id_evento (PK)    id_prueba (FK → Pruebas)
  nombre_campeonato   nombre            id_atleta (FK → Atletas)
  nombre_torneo       metrica           posicion, atleta, club
                      nombre_wa         pista, resultado, serie
          │               │             viento, resultado_formateado
          └───────┬───────┘             puntos
                  ▼
              Pruebas
                id_prueba (PK)
                fecha, hora, genero
                categorias, prueba_padre
                id_campeonato (FK)
                id_evento (FK)
                timestamp
```

---

## 🚀 Cómo ejecutar el pipeline

### Prerrequisitos

- Python 3.10+
- PostgreSQL
- Credenciales de acceso a [atletismo.usplat.cl](https://atletismo.usplat.cl)

### Instalación de dependencias

```bash
pip install httpx lxml pandas tqdm playwright psycopg2-binary beautifulsoup4
playwright install chromium
```

### Variables de entorno

Crea un archivo `.env` o exporta las siguientes variables:

```bash
USER=tu_correo@ejemplo.com
PASSWORD=tu_contraseña
```

### Ejecución

```bash
# 1. Extraer atletas
#    Ejecutar ScraperAtletas.ipynb (Jupyter)

# 2. Extraer pruebas de campeonatos
python Extract/2_pruebas_de_campeonato.py

# 3. Extraer resultados de pruebas
python Extract/3_resultados_de_pruebas.py

# 4. Transformar datos
#    Ejecutar Transform/transform_data.ipynb (Jupyter)

# 5. Cargar a PostgreSQL
python Load/load_data_to_postgres.py
```

> **Nota:** Los scrapers están diseñados para ejecutarse de forma incremental. Solo procesan los IDs nuevos o aquellos cuyos resultados aún pueden estar pendientes de actualización.

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|---|---|
| Scraping estático | `httpx`, `lxml`, `BeautifulSoup` |
| Scraping dinámico | `Playwright` (asíncrono) |
| Transformación | `pandas`, `Jupyter Notebook` |
| Base de datos | `PostgreSQL`, `psycopg2` |
| Puntuación WA | Tablas de puntuación World Athletics |

---

## 📝 Notas

- Los resultados de pruebas recientes (menos de 2 días desde la fecha de la prueba) se re-scrapeán automáticamente para capturar actualizaciones.
- Las pruebas programadas con más de 7 días de anticipación no se scrapeán hasta estar próximas.
- El campo `puntos` refleja la puntuación equivalente según las tablas de puntuación de World Athletics, calculada durante la transformación.