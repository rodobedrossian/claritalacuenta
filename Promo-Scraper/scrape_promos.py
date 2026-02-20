import requests
from bs4 import BeautifulSoup
from datetime import datetime
import json
import re
import uuid

# ---------- Helpers comunes ----------

MESES_ES = {
    "enero": "01", "febrero": "02", "marzo": "03", "abril": "04",
    "mayo": "05", "junio": "06", "julio": "07", "agosto": "08",
    "septiembre": "09", "octubre": "10", "noviembre": "11", "diciembre": "12",
}

def generar_id():
    return str(uuid.uuid4())

def parse_monto(texto):
    # Extrae número tipo 40.000 o 6000 y devuelve int
    texto = texto.replace(".", "").replace(",", "")
    nums = re.findall(r"\d+", texto)
    if not nums:
        return None
    return int(nums[0])

def normalizar_fecha(mes_str, anio=2026, dia="01"):
    mes_str = mes_str.lower().strip()
    mes_num = MESES_ES.get(mes_str)
    if not mes_num:
        return None
    return f"{anio}-{mes_num}-{dia}"

def crear_promo_base(origen, medio_pago_tipo, medio_pago_nombre,
                     comercio_tipo, comercio_nombre,
                     beneficio_tipo, beneficio_valor,
                     tope_monto, tope_unidad,
                     dias_semana, rango_horario,
                     fecha_inicio, fecha_fin,
                     condiciones_texto, fuente_url):
    return {
        "id": generar_id(),
        "origen": origen,
        "medio_pago_tipo": medio_pago_tipo,
        "medio_pago_nombre": medio_pago_nombre,
        "comercio_tipo": comercio_tipo,
        "comercio_nombre": comercio_nombre,
        "beneficio_tipo": beneficio_tipo,
        "beneficio_valor": beneficio_valor,
        "tope_monto": tope_monto,
        "tope_unidad": tope_unidad,
        "dias_semana": dias_semana,
        "rango_horario": rango_horario,
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
        "condiciones_texto": condiciones_texto.strip(),
        "fuente_url": fuente_url,
    }

# ---------- Scraper Mercado Pago (nota resumen) ----------

def scrape_mercado_pago_combustible():
    url = "https://www.mdzol.com/sociedad/banco-nacion-estos-son-los-descuentos-cargar-nafta-febrero-2026-n1444648"
    # Arriba hay otra nota específica de Mercado Pago en febrero.[web:23]
    url_mp = "https://www.mdzol.com/sociedad/mercado-pago-febrero-uno-uno-los-descuentos-este-mes-n1523567"  # [web:23]
    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/122.0.0.0 Safari/537.36"
        )
    }

    resp = requests.get(url_mp, timeout=15, headers=HEADERS)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    promos = []

    # Este selector es un ejemplo: adaptalo a cómo el medio marca los bloques de beneficio.
    bloques = soup.find_all(["p", "li"])
    for b in bloques:
        t = b.get_text(" ", strip=True)
        if "Combustible" in t or "nafta" in t.lower() or "gasoil" in t.lower():
            # Ejemplo de texto: "Combustible: 30% OFF todos los lunes abonando con tarjeta de crédito física de Mercado Pago, con tope mensual de $6.000."[web:23]
            beneficio_valor = None
            m_pct = re.search(r"(\d+)\s*%|\b(\d+)\s*OFF", t)
            if m_pct:
                beneficio_valor = int(m_pct.group(1) or m_pct.group(2))

            tope_monto = None
            m_tope = re.search(r"tope[^$]*\$ ?([\d\.\,]+)", t, re.IGNORECASE)
            if m_tope:
                tope_monto = parse_monto(m_tope.group(1))

            dias_semana = []
            if "lunes" in t.lower():
                dias_semana.append("lunes")
            if "martes" in t.lower():
                dias_semana.append("martes")
            if "miércoles" in t.lower() or "miercoles" in t.lower():
                dias_semana.append("miércoles")
            if "jueves" in t.lower():
                dias_semana.append("jueves")
            if "viernes" in t.lower():
                dias_semana.append("viernes")
            if "sábado" in t.lower() or "sabado" in t.lower():
                dias_semana.append("sábado")
            if "domingo" in t.lower():
                dias_semana.append("domingo")
            if not dias_semana:
                dias_semana = ["desconocido"]

            promo = crear_promo_base(
                origen="billetera",
                medio_pago_tipo="billetera",
                medio_pago_nombre="Mercado Pago",
                comercio_tipo="combustible",
                comercio_nombre="Axion/YPF/otras (según texto)",
                beneficio_tipo="descuento_porcentaje",
                beneficio_valor=beneficio_valor or 0,
                tope_monto=tope_monto,
                tope_unidad="por_mes",
                dias_semana=dias_semana,
                rango_horario=None,
                fecha_inicio="2026-02-01",
                fecha_fin="2026-02-28",
                condiciones_texto=t,
                fuente_url=url_mp,
            )
            promos.append(promo)

    return promos

# ---------- Scraper MODO + Banco Nación (nota resumen) ----------

def scrape_modo_bna_combustible():
    url = "https://www.mdzol.com/sociedad/banco-nacion-estos-son-los-descuentos-cargar-nafta-febrero-2026-n1444648"  # [web:26]
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    promos = []
    bloques = soup.find_all(["p", "li"])
    for b in bloques:
        t = b.get_text(" ", strip=True)
        # Buscamos mención a MODO, Banco Nación, combustibles.[web:21][web:26]
        if ("MODO" in t or "MODO BNA" in t or "billetera virtual" in t.lower()) and \
           ("combustible" in t.lower() or "nafta" in t.lower() or "gasoil" in t.lower()):
            m_pct = re.search(r"(\d+)\s*%", t)
            beneficio_valor = int(m_pct.group(1)) if m_pct else 0

            m_tope = re.search(r"tope[^$]*\$ ?([\d\.\,]+)", t, re.IGNORECASE)
            tope_monto = parse_monto(m_tope.group(1)) if m_tope else None

            dias_semana = []
            for dia in ["lunes", "martes", "miércoles", "miercoles", "jueves", "viernes", "sábado", "sabado", "domingo"]:
                if dia in t.lower():
                    if dia.startswith("mier"):
                        dias_semana.append("miércoles")
                    elif dia.startswith("saba"):
                        dias_semana.append("sábado")
                    else:
                        dias_semana.append(dia)
            if not dias_semana:
                # La nota habla de "viernes" para BNA en combustibles.[web:21][web:26]
                dias_semana = ["viernes"]

            promo = crear_promo_base(
                origen="banco",
                medio_pago_tipo="billetera",
                medio_pago_nombre="MODO BNA+ (Visa/Mastercard Nación)",
                comercio_tipo="combustible",
                comercio_nombre="YPF/Shell/Axion/Gulf",
                beneficio_tipo="descuento_porcentaje",
                beneficio_valor=beneficio_valor,
                tope_monto=tope_monto,
                tope_unidad="por_mes",
                dias_semana=dias_semana,
                rango_horario=None,
                fecha_inicio="2026-02-01",
                fecha_fin="2026-02-28",
                condiciones_texto=t,
                fuente_url=url,
            )
            promos.append(promo)

    return promos

# ---------- Scraper genérico banco (plantilla) ----------

def scrape_banco_macro_combustible():
    # Ejemplo basado en notas de promos de combustibles que nombran Banco Macro.[web:12][web:15]
    url = "https://www.losandes.com.ar/economia/promociones-combustibles-febrero-descuentos-30-y-reintegros-25000-nafta-y-gasoil-n5979954"  # [web:12]
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    promos = []
    bloques = soup.find_all(["p", "li"])
    for b in bloques:
        t = b.get_text(" ", strip=True)
        if "Banco Macro" in t or "Macro:" in t:
            m_pct = re.search(r"(\d+)\s*%", t)
            beneficio_valor = int(m_pct.group(1)) if m_pct else 0

            m_tope = re.search(r"tope[^$]*\$ ?([\d\.\,]+)", t, re.IGNORECASE)
            tope_monto = parse_monto(m_tope.group(1)) if m_tope else None

            dias_semana = []
            for dia in ["lunes", "martes", "miércoles", "miercoles", "jueves",
                        "viernes", "sábado", "sabado", "domingo"]:
                if dia in t.lower():
                    if dia.startswith("mier"):
                        dias_semana.append("miércoles")
                    elif dia.startswith("saba"):
                        dias_semana.append("sábado")
                    else:
                        dias_semana.append(dia)
            if not dias_semana:
                dias_semana = ["desconocido"]

            promo = crear_promo_base(
                origen="banco",
                medio_pago_tipo="credito",
                medio_pago_nombre="Banco Macro (Visa/Mastercard)",
                comercio_tipo="combustible",
                comercio_nombre="varias estaciones adheridas",
                beneficio_tipo="descuento_porcentaje",
                beneficio_valor=beneficio_valor,
                tope_monto=tope_monto,
                tope_unidad="por_semana" if "semanal" in t.lower() else "por_mes",
                dias_semana=dias_semana,
                rango_horario=None,
                fecha_inicio="2026-02-01",
                fecha_fin="2026-02-28",
                condiciones_texto=t,
                fuente_url=url,
            )
            promos.append(promo)

    return promos

# ---------- Orquestador ----------

def scrape_promos_febrero_2026():
    todas = []
    todas.extend(scrape_mercado_pago_combustible())
    todas.extend(scrape_modo_bna_combustible())
    todas.extend(scrape_banco_macro_combustible())
    # Podés agregar más scrapers (Cuenta DNI, MODO otros bancos, supermercados, etc.)
    return todas

if __name__ == "__main__":
    promos = scrape_promos_febrero_2026()
    print(json.dumps(promos, ensure_ascii=False, indent=2))
