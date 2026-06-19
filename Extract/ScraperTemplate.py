import os
import json
import asyncio
import datetime
import nodriver as uc
from pathlib import Path
from dotenv import load_dotenv


def load_env_variables():
    try:
        env_file = Path(__file__).parent.parent / ".env"
        if env_file.exists():
            load_dotenv(env_file)
            print(f"✓ Variables de entorno cargadas desde: {env_file}")
        else:
            print(f"⚠ Archivo .env no encontrado en: {env_file}")
    except ImportError:
        print("⚠ dotenv no instalado. Usando variables de sistema.")

async def log_in():
 
    load_env_variables()
    USER = os.getenv("USER")
    PASSWORD = os.getenv("PASSWORD")
    LOGIN_URL = "https://atletismo.usplat.cl/login"

    if not USER or not PASSWORD:
        raise ValueError("Variables de entorno USER y PASSWORD no configuradas")
    
    browser = await uc.start()

    try:
        tab = await browser.get(LOGIN_URL)
        
        print("Esperando formulario...")
        await asyncio.sleep(3)
        
        print("Ingresando credenciales...")
        await tab.evaluate(f"""
            document.querySelector("input[name='email']").value = '{USER}';
            document.querySelector("input[name='password']").value = '{PASSWORD}';
        """)
        
        print("Haciendo clic en el botón de login...")
        await tab.evaluate("document.querySelector('button[type=\"submit\"]').click();")
        
        print("Esperando a que cargue la página principal...")
        await asyncio.sleep(5)
        print("✓ Login completado exitosamente")

        return browser
    
    except Exception as e:
        print(f"Error: {e}")
        try:
            await browser.stop()
        except:
            pass
        raise

async def go_to_page(tab, url, wait_for_content, extract_content):
    try:
        await tab.get(url)
        content_found = await wait_for_content(tab, timeout=60)
        
        if not content_found:
            print(f"⚠ No se cargaron los resultados")
            return None
        
        page_data = await extract_content(tab)
        
        return page_data
        
    except Exception as e:
        print(f"Error navegando a {url}: {e}")
        return None

async def visit_pages(browser, urls, wait_for_content, extract_content, output_file=None):

    pages_data = []
    for idx, url in enumerate(urls, start=1):
        try:
            print(f"Visitando página {idx}/{len(urls)}: {url}")
            tab = await browser.get()
            page_info = await go_to_page(tab, url[1], wait_for_content, extract_content)
            if page_info:
                pages_data.append({"id": url[0], **page_info, "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")})
                print(f"✓ Página {idx} procesada exitosamente")
        except Exception as e:
            print(f"✗ Error en página {idx}: {e}")

        if idx % 100 == 0 and output_file:
            try:
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(pages_data, f, ensure_ascii=False, indent=4)
                print(f"✓ Guardado intermedio después de {idx} páginas en: {output_file}")
            except Exception as e:
                print(f"⚠ Error guardando intermedio: {e}")

    # Guardar datos finales si se especificó un archivo de salida
    if output_file:
        try:
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(pages_data, f, ensure_ascii=False, indent=4)
            print(f"✓ Datos finales guardados en: {output_file}")
        except Exception as e:
            print(f"⚠ Error guardando datos finales: {e}")

    return pages_data