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
    """Crear conexión a PostgreSQL"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("✓ Conexión exitosa a PostgreSQL")
        return conn
    except Exception as e:
        print(f"✗ Error al conectar a PostgreSQL: {e}")
        return None

def execute_sql_file(conn, sql_file_path):
    """Ejecutar el archivo SQL para crear las tablas"""
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

def load_paises(conn, csv_path):
    """Cargar datos de países"""
    try:
        # Leer CSV
        df = pd.read_csv(csv_path)
        print(f"✓ Leídos {len(df)} países desde {csv_path}")
        
        # Insertar datos
        cursor = conn.cursor()
        for _, row in df.iterrows():
            cursor.execute(
                'INSERT INTO "Paises" (id_pais, nombre) VALUES (%s, %s) ON CONFLICT (id_pais) DO NOTHING',
                (int(row['id_pais']), row['Pais'])
            )
        
        conn.commit()
        cursor.close()
        print(f"✓ {len(df)} países cargados en la tabla Paises")
        return True
    except Exception as e:
        print(f"✗ Error al cargar países: {e}")
        conn.rollback()
        return False

def load_athletes(conn, csv_path):
    """Cargar datos de atletas"""
    try:
        # Leer CSV
        df = pd.read_csv(csv_path)
        print(f"✓ Leídos {len(df)} atletas desde {csv_path}")
        
        # Obtener mapeo de países
        cursor = conn.cursor()
        cursor.execute('SELECT nombre, id_pais FROM "Paises"')
        paises_map = {nombre: id_pais for nombre, id_pais in cursor.fetchall()}
        
        # Insertar atletas
        inserted = 0
        skipped = 0
        errors = 0
        
        for _, row in df.iterrows():
            try:
                # Obtener ID de país
                pais_nombre = row['Pais']
                id_pais = paises_map.get(pais_nombre)
                
                if id_pais is None:
                    print(f"  Advertencia: País no encontrado: {pais_nombre}")
                    skipped += 1
                    continue
                
                # Parsear fecha de nacimiento
                fecha_nac = None
                if pd.notna(row['Fecha de Nacimiento']):
                    try:
                        fecha_nac = pd.to_datetime(row['Fecha de Nacimiento']).date()
                    except:
                        pass
                
                # Insertar atleta (sin campo sexo ya que no está en el CSV)
                cursor.execute(
                    '''INSERT INTO "Atletas" (id_atleta, nombre, apellido, sexo, id_pais, fecha_de_nacimiento) 
                       VALUES (%s, %s, %s, %s, %s, %s) 
                       ON CONFLICT (id_atleta) DO NOTHING''',
                    (int(row['id_atleta']), 
                     row['Nombre'] if pd.notna(row['Nombre']) else None,
                     row['Apellido'] if pd.notna(row['Apellido']) else None,
                     None,  # sexo no disponible en CSV
                     id_pais,
                     fecha_nac)
                )
                inserted += 1
                
                if inserted % 1000 == 0:
                    conn.commit()
                    print(f"  Progreso: {inserted} atletas insertados...")
                    
            except Exception as e:
                print(f"  Error en atleta {row.get('id_atleta', 'unknown')}: {e}")
                errors += 1
                continue
        
        conn.commit()
        cursor.close()
        
        print(f"✓ Carga completada:")
        print(f"  - {inserted} atletas insertados")
        print(f"  - {skipped} omitidos (país no encontrado)")
        print(f"  - {errors} errores")
        
        return True
    except Exception as e:
        print(f"✗ Error al cargar atletas: {e}")
        conn.rollback()
        return False

def main():
    """Función principal"""
    print("=" * 60)
    print("CARGA DE DATOS A POSTGRESQL - USPLAT")
    print("=" * 60)

    conn = create_connection()
    if not conn:
        return
    
    try:
        # 1. Crear esquema de base de datos
        print("\n[1/3] Creando esquema de base de datos...")
        sql_path = r"c:\Users\juanj\OneDrive - Universidad Católica de Chile\Escritorio\Usplat Scraper\BD\UsplatDB.sql"
        if execute_sql_file(conn, sql_path):
            print("✓ Esquema creado exitosamente")
        else:
            print("⚠ Advertencia: Puede que el esquema ya exista")
        
        # 2. Cargar países
        print("\n[2/3] Cargando países...")
        paises_path = r"c:\Users\juanj\OneDrive - Universidad Católica de Chile\Escritorio\Usplat Scraper\BD\paises.csv"
        load_paises(conn, paises_path)
        
        # 3. Cargar atletas
        print("\n[3/3] Cargando atletas...")
        athletes_path = r"c:\Users\juanj\OneDrive - Universidad Católica de Chile\Escritorio\Usplat Scraper\BD\athletes_cleaned.csv"
        load_athletes(conn, athletes_path)
        
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
