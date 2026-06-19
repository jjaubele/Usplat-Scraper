import nodriver as uc
import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import re
import json
import csv

# Cargar variables de entorno desde .env
try:
    env_file = Path(__file__).parent / ".env"
    if env_file.exists():
        load_dotenv(env_file)
        print(f"✓ Variables de entorno cargadas desde: {env_file}")
    else:
        print(f"⚠ Archivo .env no encontrado en: {env_file}")
except ImportError:
    print("⚠ dotenv no instalado. Usando variables de sistema.")


def load_tournament_urls_from_csv(csv_file="torneos.csv"):
    csv_path = Path(__file__).parent / csv_file
    
    if not csv_path.exists():
        print(f"⚠ Archivo {csv_file} no encontrado")
        return []
    
    tournament_urls = []
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if 'url_completa' in row and row['url_completa']:
                    # Agregar /resultados al final de la URL
                    url = row['url_completa'].rstrip('/') + '/resultados'
                    tournament_urls.append(url)
        
        print(f"✓ {len(tournament_urls)} torneos cargados desde {csv_file}")
        return tournament_urls
    
    except Exception as e:
        print(f"Error al leer {csv_file}: {e}")
        return []


async def wait_for_tournament_content(tab, timeout=60, check_interval=1):
    print(f"Esperando a que aparezca el contenido del torneo (timeout: {timeout}s)...")
    start_time = asyncio.get_event_loop().time()
    
    while True:
        elapsed = asyncio.get_event_loop().time() - start_time
        
        if elapsed > timeout:
            print(f"⚠ Timeout al esperar el contenido del torneo ({timeout}s)")
            return False
        
        try:
            # Obtener el contenido HTML actual
            html_content = await tab.get_content()
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Buscar el título del torneo
            title_element = soup.find('h3', style="text-align: center")
            if title_element:
                title_text = title_element.get_text(strip=True)
                if title_text.startswith("Resultados"):
                    # Verificar que hay campeonatos disponibles
                    panel_group = soup.find('div', id=re.compile(r'accordion'))
                    if panel_group:
                        print(f"✓ Contenido del torneo encontrado después de {elapsed:.1f}s: {title_text}")
                        return True
        except Exception as e:
            print(f"Error verificando contenido: {e}")
        
        # Esperar antes de la siguiente verificación
        await asyncio.sleep(check_interval)


async def extract_tournaments_championships(tab, tournament_url):
    try:
        # Obtener el contenido HTML de la página
        html_content = await tab.get_content()
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Extraer el título del torneo
        title_element = soup.find('h3', style="text-align: center")
        if not title_element:
            print("⚠ No se encontró el título del torneo")
            return None
        
        title_text = title_element.get_text(strip=True)
        
        # Parsear el título: "Resultados - {nombre_torneo}"
        match = re.match(r"Resultados\s*-\s*(.+?)$", title_text)
        if not match:
            print("⚠ No se pudo parsear el título del torneo")
            return None
        
        nombre_torneo = match.group(1).strip()
        print(f"✓ Torneo encontrado: {nombre_torneo}")
        
        # Extraer campeonatos del accordeón
        campeonatos = []
        
        # Buscar el div con id que contiene "accordion"
        panel_group = soup.find('div', id=re.compile(r'accordion'))
        if not panel_group:
            print("⚠ No se encontró el contenedor de campeonatos")
            return None
        
        panels = panel_group.find_all('div', class_='panel panel-default')
        
        for panel in panels:
            # Buscar los ids de campeonatos en ese panel
            championship_links = panel.find_all('a', href=re.compile(r'^\d+/$'))
            
            for link in championship_links:
                championship_id = link['href'].rstrip('/').split('/')[-1]
                
                campeonatos.append({
                    "id": championship_id,
                    "link_resultados": f"{tournament_url}/{championship_id}"
                })
        
        if not campeonatos:
            print("⚠ No se encontraron campeonatos")
            return None
        
        resultado = {
            "nombre_torneo": nombre_torneo,
            "campeonatos": campeonatos
        }
        
        print(f"✓ Información del torneo extraída:")
        print(f"  Torneo: {nombre_torneo}")
        print(f"  Campeonatos encontrados: {len(campeonatos)}")
        
        return resultado
        
    except Exception as e:
        print(f"Error extrayendo información del torneo: {e}")
        import traceback
        traceback.print_exc()
        return None


async def go_to_tournament(tab, tournament_url):
    try:
        print(f"\nNavegando a: {tournament_url}")
        
        await tab.get(tournament_url)
        
        # Esperar a que aparezca el contenido del torneo (máximo 60 segundos)
        content_found = await wait_for_tournament_content(tab, timeout=60)
        
        if not content_found:
            print(f"⚠ No se cargó el contenido del torneo")
            return {
                "tab": tab,
                "info": None,
                "url": tournament_url
            }
        
        # Extraer información del torneo
        tournament_info = await extract_tournaments_championships(tab, tournament_url)
        
        return {
            "tab": tab,
            "info": tournament_info,
            "url": tournament_url
        }
        
    except Exception as e:
        print(f"Error navegando a torneo: {e}")
        raise


async def visit_tournaments(browser, tournament_urls):
    tournament_data = []
    
    for idx, tournament_url in enumerate(tournament_urls, 1):
        try:
            print(f"\n[{idx}/{len(tournament_urls)}] Procesando torneo...")
            tab = await browser.get()  # Crear nueva ventana/tab
            result = await go_to_tournament(tab, tournament_url)
            
            if result and isinstance(result, dict) and result.get("info"):
                tournament_data.append(result["info"])
                print(f"✓ Torneo {idx} completado exitosamente")
        except Exception as e:
            print(f"✗ Error en torneo {idx}: {e}")
    
    return tournament_data


async def main(tournament_urls=None):
    # Si no se proporcionan URLs, cargar del CSV
    if tournament_urls is None:
        tournament_urls = load_tournament_urls_from_csv()
        if not tournament_urls:
            print("⚠ No se encontraron torneos para visitar")
            return
    
    # Realizar login
    USER = os.getenv("USER")
    PASSWORD = os.getenv("PASSWORD")
    LOGIN_URL = "https://atletismo.usplat.cl/login"
    
    if not USER or not PASSWORD:
        raise ValueError("Variables de entorno USER y PASSWORD no configuradas")
    
    print("Iniciando navegador con nodriver...")
    browser = await uc.start()
    
    try:
        # Ir a la página de login
        print("Navegando a la página de login...")
        tab = await browser.get(LOGIN_URL)
        
        # Esperar a que se cargue el formulario
        print("Esperando formulario...")
        await asyncio.sleep(3)
        
        # Llenar el formulario
        print("Ingresando credenciales...")
        await tab.evaluate(f"""
            document.querySelector("input[name='email']").value = '{USER}';
            document.querySelector("input[name='password']").value = '{PASSWORD}';
        """)
        
        # Hacer clic en el botón de login
        print("Haciendo clic en el botón de login...")
        await tab.evaluate("document.querySelector('button[type=\"submit\"]').click();")
        
        # Esperar a que se cargue la página principal
        print("Esperando a que cargue la página principal...")
        await asyncio.sleep(5)
        
        print("✓ Login completado exitosamente")
        
        # Visitar torneos
        if tournament_urls:
            print(f"\nVisitando {len(tournament_urls)} torneos...")
            tournament_data = await visit_tournaments(browser, tournament_urls)
            
            # Mostrar información extraída
            print("\n" + "="*80)
            print("INFORMACIÓN EXTRAÍDA DE LOS TORNEOS")
            print("="*80)
            for idx, data in enumerate(tournament_data, 1):
                print(f"\nTorneo {idx}: {data['nombre_torneo']}")
                print(f"  Campeonatos ({len(data['campeonatos'])}):")
            
            # Guardar información en un archivo JSON
            output_file = Path(__file__).parent / "campeonatos_de_torneos.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(tournament_data, f, ensure_ascii=False, indent=4)
            print(f"\n✓ Información guardada en: {output_file}")
        
        # Cerrar navegador al finalizar
        print("\nCerrando navegador...")
        await browser.stop()
        
    except Exception as e:
        print(f"Error: {e}")
        try:
            await browser.stop()
        except:
            pass
        raise

if __name__ == "__main__":
    # Por defecto, carga URLs del archivo torneos.csv
    # Para usar URLs específicas, pasa una lista de URLs:
    # urls = ["https://atletismo.usplat.cl/torneo/campeonato-nacional/resultados"]
    # asyncio.run(main(tournament_urls=urls))
    
    asyncio.run(main())