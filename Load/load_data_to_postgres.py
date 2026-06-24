import os
import pandas as pd
import psycopg2
from psycopg2 import sql
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv


def load_env_variables():
    try:
        env_file = Path(__file__).parent.parent / ".env"
        if env_file.exists():
            load_dotenv(env_file)
            print(f"✓ Variables de entorno cargadas desde: {env_file}")
            return {
                'host': os.getenv("HOST"),
                'database': os.getenv("DATABASE"),
                'user': os.getenv("DB_USER"),
                'password': os.getenv("DB_PASSWORD"),
                'port': int(os.getenv("PORT", 5432))
            }
        else:
            print(f"⚠ Archivo .env no encontrado en: {env_file}")
    except ImportError:
        print("⚠ dotenv no instalado. Usando variables de sistema.")

# Configuración de conexión a PostgreSQL
# IMPORTANTE: Modifica estos valores según tu configuración
DB_CONFIG = load_env_variables()

def create_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("✓ Conexión exitosa a PostgreSQL")
        return conn
    except Exception as e:
        print(f"✗ Error al conectar a PostgreSQL: {e}")
        return None

def execute_sql_file(conn, sql_file_path):
    try:
        with open(sql_file_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        cursor = conn.cursor()
        cursor.execute(sql_script)
        conn.commit()
        cursor.close()
        print(f"✓ Esquema de base de datos creado desde {sql_file_path}")
        return True
    except Exception as e:
        print(f"✗ Error al ejecutar SQL: {e}")
        conn.rollback()
        return False

def load_athletes(conn, csv_path):
    try:
        df = pd.read_csv(csv_path)
        cursor = conn.cursor()
        for index, row in df.iterrows():
            insert_query = sql.SQL("""
                INSERT INTO public."Atletas" (id_atleta, nombre, apellido, fecha_nacimiento, pais, colegio, club, club_master)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id_atleta) DO NOTHING
            """)
            cursor.execute(insert_query, (
                row['id_atleta'],
                row['Nombre'],
                row['Apellido'],
                row['Fecha de Nacimiento'] if pd.notnull(row['Fecha de Nacimiento']) else None,
                row['Pais'],
                row['Colegio'],
                row['Club'],
                row['Club Master']
            ))
        conn.commit()
        cursor.close()
        print(f"✓ Atletas cargados desde {csv_path}")

    except Exception as e:
        print(f"✗ Error al cargar atletas: {e}")
        conn.rollback()
        return False
    
def load_championships(conn, csv_path):
    try:
        df = pd.read_csv(csv_path)
        cursor = conn.cursor()
        for index, row in df.iterrows():
            insert_query = sql.SQL("""
                INSERT INTO public."Campeonatos" (id_campeonato, nombre_campeonato, nombre_torneo)
                VALUES (%s, %s, %s)
                ON CONFLICT (id_campeonato) DO NOTHING
            """)
            cursor.execute(insert_query, (
                row['id_campeonato'],
                row['nombre_campeonato'],
                row['nombre_torneo']
            ))
        conn.commit()
        cursor.close()
        print(f"✓ Campeonatos cargados desde {csv_path}")

    except Exception as e:
        print(f"✗ Error al cargar campeonatos: {e}")
        conn.rollback()
        return False
    
def load_events(conn, csv_path):
    try:
        df = pd.read_csv(csv_path)
        cursor = conn.cursor()
        for index, row in df.iterrows():
            insert_query = sql.SQL("""
                INSERT INTO public."Eventos" (id_evento, nombre, metrica, nombre_wa)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id_evento) DO NOTHING
            """)
            cursor.execute(insert_query, (
                row['id_evento'],
                row['nombre'],
                row['metrica'],
                row['nombre_wa']
            ))
        conn.commit()
        cursor.close()
        print(f"✓ Eventos cargados desde {csv_path}")

    except Exception as e:
        print(f"✗ Error al cargar eventos: {e}")
        conn.rollback()
        return False
    
def load_pruebas(conn, csv_path):
    try:
        df = pd.read_csv(csv_path)
        cursor = conn.cursor()
        for index, row in df.iterrows():
            insert_query = sql.SQL("""
                INSERT INTO public."Pruebas" (id_prueba, fecha, hora, genero, categorias, prueba_padre, id_campeonato, id_evento, timestamp)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id_prueba) DO NOTHING
            """)
            cursor.execute(insert_query, (
                row['id_prueba'],
                row['fecha'] if pd.notnull(row['fecha']) else None,
                row['hora'],
                row['genero'],
                row['categorias'],
                int(row['prueba_padre']) if pd.notnull(row['prueba_padre']) else None,
                int(row['id_campeonato']) if pd.notnull(row['id_campeonato']) else None,
                int(row['id_evento']) if pd.notnull(row['id_evento']) else None,
                row['timestamp'] if pd.notnull(row['timestamp']) else None
            ))
        conn.commit()
        cursor.close()
        print(f"✓ Pruebas cargadas desde {csv_path}")

    except Exception as e:
        print(f"✗ Error al cargar pruebas: {e}")
        conn.rollback()
        return False
    
def load_resultados(conn, csv_path):
    try:
        df = pd.read_csv(csv_path)
        cursor = conn.cursor()
        # Datos no tienen id_resultado
        for index, row in df.iterrows():
            insert_query = sql.SQL("""
                INSERT INTO public."Resultados" (id_prueba, id_atleta, posicion, atleta, club, pista, resultado, serie, viento, resultado_formateado, puntos)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """)
            cursor.execute(insert_query, (
                int(row['id_prueba']) if pd.notnull(row['id_prueba']) else None,
                int(row['id_atleta']) if pd.notnull(row['id_atleta']) else None,
                row['posicion'],
                row['atleta'],
                row['club'],
                row['pista'],
                row['resultado'],
                row['serie'],
                row['viento'],
                float(row['resultado_formateado']) if pd.notnull(row['resultado_formateado']) else None,
                int(row['puntos']) if pd.notnull(row['puntos']) else None
            ))
        conn.commit()
        cursor.close()
        print(f"✓ Resultados cargados desde {csv_path}")

    except Exception as e:
        print(f"✗ Error al cargar resultados: {e}")
        conn.rollback()
        return False

def main():
    print("=" * 60)
    print("CARGA DE DATOS A POSTGRESQL - USPLAT")
    print("=" * 60)

    conn = create_connection()
    if not conn:
        return
    
    try:
        # 1. Crear esquema de base de datos
        print("\n[1/6] Creando esquema de base de datos...")
        sql_path = r"c:\Users\juanj\OneDrive - Universidad Católica de Chile\Escritorio\Usplat Scraper\Load\UsplatDB.sql"
        if execute_sql_file(conn, sql_path):
            print("✓ Esquema creado exitosamente")
        else:
            print("⚠ Advertencia: Puede que el esquema ya exista")
        
        # 2. Cargar atletas
        print("\n[2/6] Cargando atletas...")
        athletes_path = r"c:\Users\juanj\OneDrive - Universidad Católica de Chile\Escritorio\Usplat Scraper\BD\Tablas\atletas.csv"
        load_athletes(conn, athletes_path)

        # 3. Cargar campeonatos
        print("\n[3/6] Cargando campeonatos...")
        championships_path = r"c:\Users\juanj\OneDrive - Universidad Católica de Chile\Escritorio\Usplat Scraper\BD\Tablas\campeonatos.csv"
        load_championships(conn, championships_path)

        # 4. Cargar eventos
        print("\n[4/6] Cargando eventos...")
        events_path = r"c:\Users\juanj\OneDrive - Universidad Católica de Chile\Escritorio\Usplat Scraper\BD\Tablas\eventos.csv"
        load_events(conn, events_path)

        # 5. Cargar pruebas
        print("\n[5/6] Cargando pruebas...")
        pruebas_path = r"c:\Users\juanj\OneDrive - Universidad Católica de Chile\Escritorio\Usplat Scraper\BD\Tablas\pruebas.csv"
        load_pruebas(conn, pruebas_path)

        # 6. Cargar resultados
        print("\n[6/6] Cargando resultados...")
        resultados_path = r"c:\Users\juanj\OneDrive - Universidad Católica de Chile\Escritorio\Usplat Scraper\BD\Tablas\resultados.csv"
        load_resultados(conn, resultados_path)
        
        print("\n" + "=" * 60)
        print("✓ PROCESO COMPLETADO EXITOSAMENTE")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error general: {e}")
    finally:
        conn.close()
        print("\n✓ Conexión cerrada")

if __name__ == "__main__":
    main()
