import os
import re
import sys
import json
import asyncio
import numpy as np
import pandas as pd
import nodriver as uc
from pathlib import Path
from bs4 import BeautifulSoup
from ScraperTemplate import visit_pages, log_in


async def wait_for_championship_title(tab, timeout=60, check_interval=1):
    print(f"Esperando a que aparezca el título del campeonato (timeout: {timeout}s)...")
    start_time = asyncio.get_event_loop().time()
    
    while True:
        elapsed = asyncio.get_event_loop().time() - start_time
        
        if elapsed > timeout:
            print(f"⚠ Timeout al esperar el título ({timeout}s)")
            return False
        
        try:
            # Obtener el contenido HTML actual
            html_content = await tab.get_content()
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Buscar el título
            title_element = soup.find('h3', style="text-align: center")
            if title_element:
                title_text = title_element.get_text(strip=True)
                if title_text.startswith("Resultados"):
                    print(f"✓ Título encontrado después de {elapsed:.1f}s: {title_text}")
                    return True
        except Exception as e:
            print(f"Error verificando título: {e}")
        
        # Esperar antes de la siguiente verificación
        await asyncio.sleep(check_interval)


async def extract_championship_info(tab):
    try:
        # Obtener el contenido HTML de la página
        html_content = await tab.get_content()
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Extraer el título de la página
        title_element = soup.find('h3', style="text-align: center")
        if not title_element:
            print("⚠ No se encontró el título del campeonato")
            return None
        
        title_text = title_element.get_text(strip=True)
        print(f"Título encontrado: {title_text}")

        # Formato antiguo: "Resultados - {nombre_campeonato} {año}"
        # Formato nuevo: "Resultados - {nombre_torneo} - {nombre_campeonato} {año}"
        title_parts = title_text.split(" - ")
        nombre_campeonato = title_parts[-1].strip()

        if len(title_parts) == 3:
            tournament_name = title_parts[1].strip()
        else:
            tournament_name = nombre_campeonato.split()[0:-1]  # Asumir que el nombre del torneo es todo excepto el último término (año)
            tournament_name = " ".join(tournament_name)
        
        # Extraer todas las pruebas del HTML
        pruebas = []
        links = soup.find_all('a', href=re.compile(r'^prueba/\d+'))
        
        for link in links:
            prueba_id = link['href'].split('/')[-1]
            pruebas.append({
                "id": prueba_id
            })
        
        resultado = {
            "nombre_torneo": tournament_name,
            "nombre_campeonato": nombre_campeonato,
            "pruebas": pruebas
        }
        
        print(f"✓ Información del campeonato extraída:")
        print(f"  Torneo: {tournament_name}")
        print(f"  Campeonato: {nombre_campeonato}")
        print(f"  Pruebas encontradas: {len(pruebas)}")
        
        return resultado
        
    except Exception as e:
        print(f"Error extrayendo información del campeonato: {e}")
        return None
    

async def main(urls):

    try: 
        browser = await log_in()

        output_file = Path(__file__).parent / f"../BD/JSON/nuevas_pruebas_de_campeonatos.json"
        races_results = await visit_pages(browser, urls, wait_for_championship_title, extract_championship_info, output_file=output_file)
        print(f"✓ Pruebas procesadas: {len(races_results)}/{len(ids_por_scrapear)}")
        
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

    pruebas = pd.read_csv(Path(__file__).parent / "../BD/Tablas/pruebas.csv")
    campeonatos = pd.read_csv(Path(__file__).parent / "../BD/Tablas/campeonatos.csv")
    pruebas_campeonatos = pruebas.merge(campeonatos, left_on='id_campeonato', right_on='id_campeonato', how='left')
    LAST_ID_SCRAPED = campeonatos['id_campeonato'].max()
    LAST_ID_TO_SCRAP = 1697
    ids_por_scrapear = [id for id in range(LAST_ID_SCRAPED + 1, LAST_ID_TO_SCRAP + 1) if id not in campeonatos['id_campeonato'].values]
    BASE_URL = "https://atletismo.usplat.cl/torneo/campeonato-nacional/resultados/"
    URLS = [(int(id), f"{BASE_URL}{id}/") for id in ids_por_scrapear]
    print(f"Total de campeonatos a scrapear: {len(URLS)}")
    print(f"IDs de campeonatos a scrapear: {ids_por_scrapear}")
    asyncio.run(main(URLS))
