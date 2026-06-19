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


async def wait_for_results_content(tab, timeout=60, check_interval=1):
    print(f"Esperando a que aparezcan los resultados (timeout: {timeout}s)...")
    start_time = asyncio.get_event_loop().time()
    
    while True:
        elapsed = asyncio.get_event_loop().time() - start_time
        
        if elapsed > timeout:
            print(f"⚠ Timeout al esperar los resultados ({timeout}s)")
            return False
        
        try:
            html_content = await tab.get_content()
            soup = BeautifulSoup(html_content, 'html.parser')
            # Id invalido con elemento <b>Alerta:</b>
            warning = soup.find('b', string=re.compile(r'Alerta:'))
            if warning:
                print(f"⚠ Contenido inválido encontrado después de {elapsed:.1f}s")
                return False
            table = soup.find('table', class_='table table-striped table-condensed')
            if table:
                print(f"✓ Tabla de resultados encontrada después de {elapsed:.1f}s")
                return True
        except Exception as e:
            print(f"Error verificando resultados: {e}")
        
        await asyncio.sleep(check_interval)


async def extract_race_results(tab):
    try:
        html_content = await tab.get_content()
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Extraer nombre de la prueba desde title
        title_tag = soup.find('title')
        titulo_prueba = title_tag.get_text(strip=True) if title_tag else "Unknown"
        atributos_titulo = titulo_prueba.split('-') if '-' in titulo_prueba else [titulo_prueba]
        if len(atributos_titulo) == 3:
            nombre_prueba = atributos_titulo[0].strip()
            categoria = atributos_titulo[1].strip()
            genero = atributos_titulo[2].strip()
        elif len(atributos_titulo) > 3:
            nombre_prueba = atributos_titulo[0].strip()
            categoria = '-'.join(atributos_titulo[1:-1]).strip()
            genero = atributos_titulo[-1].strip()
        categorias = categoria.split(',') if ',' in categoria else [categoria]

        # Limpiar espacios y caracteres no deseados
        nombre_prueba = nombre_prueba.strip()
        categorias = [cat.strip() for cat in categorias]
        genero = genero.strip()
        
        print(f"  Prueba: {nombre_prueba}")
        
        # Extraer fecha y hora del formato: "Sábado 11 de Abril 2026 - 11:30"
        fecha = None
        hora = None
        
        h4_tag = soup.find('h4')
        if h4_tag:
            text = h4_tag.get_text(strip=True)
            print(f"  Texto h4: {repr(text)}")
            
            # Parsear formato: "Sábado 11 de Abril 2026 - 11:30"
            match = re.search(r'(\d{1,2})\s+de\s+(\w+)\s+(\d{4})\s*-\s*(\d{1,2}):(\d{2})', text)
            if match:
                dia = int(match.group(1))
                mes_nombre = match.group(2).lower()
                año = match.group(3)
                hora_str = f"{match.group(4)}:{match.group(5)}"
                
                # Mapear mes en texto a número
                meses = {
                    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
                    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
                    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
                }
                mes = meses.get(mes_nombre, '01')
                
                fecha = f"{dia:02d}/{mes}/{año}"
                hora = hora_str
        
        print(f"  Fecha: {fecha if fecha else 'No encontrada'}")
        print(f"  Hora: {hora if hora else 'No encontrada'}")
        
        # Buscar tabla de resultados
        table = soup.find('table', class_='table table-striped table-condensed')
        if not table:
            print("⚠ No se encontró la tabla de resultados")
            return None
        
        # Obtener encabezados
        thead = table.find('thead')
        headers = []
        if thead:
            for th in thead.find_all('th'):
                headers.append(th.get_text(strip=True).lower())
        
        print(f"  Encabezados: {headers}")
        
        resultados = []
        tbody = table.find('tbody')
        
        if tbody:
            current_series = None
            current_viento = None
            current_atleta = None
            current_id_atleta = None
            
            for row in tbody.find_all('tr', recursive=False):
                cols = row.find_all('td', recursive=False)
                if not cols:
                    continue
                
                cols_text = [col.get_text(strip=True) for col in cols]
                
                # Verificar si es una fila de serie/información (para carreras) mediante class="info"

                if 'info' in row.get('class', []):
                    # Parsear: "Serie 1 V.V. +1.4"
                    info_text = cols_text[0]
                    if 'serie' in info_text.lower():
                        current_series = info_text.split()[1]  # Asumiendo formato "Serie X"
                        viento_match = re.search(r'V\.V\.\s*([+-]?\d+\.?\d*)', info_text)
                        if viento_match:
                            current_viento = viento_match.group(1)  
                
                # Es una fila de resultado
                try:
                    # Fila de resultado de atleta
                    if len(cols) >= 3:
                        # Obtener datos según los encabezados
                        atleta_col = cols[0]
                        atleta_nombre = atleta_col.get_text()
                        
                        # Extraer ID del atleta si existe link
                        atleta_link = atleta_col.find('a')
                        if atleta_link:
                            href = atleta_link.get('href', '')
                            id_atleta_match = re.search(r'/atleta/(\d+)', href)
                            id_atleta = id_atleta_match.group(1) if id_atleta_match else None
                        else:
                            id_atleta = None
                        
                        club = cols_text[1] if len(cols_text) > 1 else ""
                        
                        # Resultado puede estar en diferentes posiciones
                        # Buscar según encabezados o por posición
                        resultado = ""
                        posicion = ""
                        
                        if 'resultado' in headers:
                            idx = headers.index('resultado')
                            resultado = cols_text[idx] if idx < len(cols_text) else ""
                        if 'lugar' in headers:
                            idx = headers.index('lugar')
                            posicion = cols_text[idx] if idx < len(cols_text) else ""
                        elif 'lugar' in [h.lower() for h in headers] or len(cols_text) > 3:
                            posicion = cols_text[-1]
                        
                        # Parsear posición
                        posicion_num = None
                        if posicion:
                            posicion_match = re.match(r'(\d+)', posicion)
                            if posicion_match:
                                posicion_num = int(posicion_match.group(1))
                        
                        # Obtener pista si existe (para carreras)
                        pista = ""
                        if 'pista' in headers:
                            idx = headers.index('pista')
                            pista = cols_text[idx] if idx < len(cols_text) else ""
                        
                        if resultado:
                            resultados.append({
                                "posicion": posicion_num,
                                "atleta": atleta_nombre,
                                "id_atleta": int(id_atleta) if id_atleta else None,
                                "club": club,
                                "pista": pista,
                                "resultado": resultado,
                                "serie": current_series,
                                "viento": current_viento
                            })

                except Exception as e:
                    print(f"  Error extrayendo fila: {e}")
        
        return {
            "nombre_prueba": nombre_prueba,
            "fecha": fecha,
            "hora": hora,
            "categorias": categorias,
            "genero": genero,
            "resultados": resultados
        }
        
    except Exception as e:
        print(f"Error extrayendo resultados: {e}")
        import traceback
        traceback.print_exc()
        return None

async def main(urls):

    try: 
        browser = await log_in()

        output_file = Path(__file__).parent / f"../BD/JSON/nuevos_resultados_de_pruebas.json"
        races_results = await visit_pages(browser, urls, wait_for_results_content, extract_race_results, output_file=output_file)
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

    FIRST_ID = 51526
    LAST_ID = 51958
    pruebas = pd.read_csv(Path(__file__).parent / "../BD/Tablas/pruebas.csv")
    # timestamp < fecha y hora de la prueba + 1 día no se considera definitivamente scrapeado, ya que los resultados pueden actualizarse.
    pruebas_scrapeadas = pruebas[pd.to_datetime(pruebas['timestamp']) > (pd.to_datetime(pruebas['fecha']) + pd.Timedelta(days=1))]
    ids_scrapeados = set(pruebas_scrapeadas['id_prueba'].unique())
    ids_por_scrapear = [id for id in range(FIRST_ID, LAST_ID + 1) if id not in ids_scrapeados]
    # ids_por_scrapear = list(range(FIRST_ID, LAST_ID + 1))
    BASE_URL = "https://atletismo.usplat.cl/torneo/campeonato-nacional/resultados/1503/prueba/"
    URLS = [(id, f"{BASE_URL}{id}/") for id in ids_por_scrapear]
    print(f"Total de pruebas a scrapear: {len(URLS)}")
    asyncio.run(main(URLS))# Solo para mantener el navegador abierto durante pruebas
