"""
Parser universal para todos los mazos del Proyecto MOSAICO.
Detecta automaticamente 3 templates HTML y genera JSON estructurado.

Templates:
  A: Tailwind CDN, <article class="card-hover"> — Mazos 1-3
  B: Custom CSS Terracota/Sage, <article class="carta"> — Mazos 7-13
  C: Custom CSS Purple/Theme, <div class="card"> — Mazos 4-6
"""

import json
import re
import sys
from pathlib import Path
from html.parser import HTMLParser


# ─── Registro maestro de mazos ───────────────────────────────────────────────

MAZOS = [
    {"id": "la-puerta",          "nombre": "La Puerta",          "numero": 1,  "rango": "P-01 a P-60",  "codigo_prefix": "P",  "descripcion": "Inicio de sesion, encuadre, alianza terapeutica, contrato y rituales de inicio."},
    {"id": "emociones",          "nombre": "Emociones",          "numero": 2,  "rango": "E-01 a E-60",  "codigo_prefix": "E",  "descripcion": "Alfabetizacion emocional, emociones primarias, conciencia corporal y regulacion inicial."},
    {"id": "historia-personal",  "nombre": "Historia Personal",  "numero": 3,  "rango": "H-01 a H-60",  "codigo_prefix": "H",  "descripcion": "Primeros recuerdos, infancia, figuras de apego, clima emocional familiar, mandatos heredados."},
    {"id": "creencias",          "nombre": "Creencias",          "numero": 4,  "rango": "C-01 a C-60",  "codigo_prefix": "C",  "descripcion": "Creencias nucleares, esquemas cognitivos, mandatos familiares, pensamiento automatico vs. creencia."},
    {"id": "sombras",            "nombre": "Sombras",            "numero": 5,  "rango": "S-01 a S-60",  "codigo_prefix": "S",  "descripcion": "Partes reprimidas, proyeccion, mascaras sociales, ira oculta y deseos inconfesables."},
    {"id": "relaciones",         "nombre": "Relaciones",         "numero": 6,  "rango": "R-01 a R-60",  "codigo_prefix": "R",  "descripcion": "Patrones vinculares, estilos de apego, conflictos relacionales, limites y comunicacion."},
    {"id": "el-cuerpo-habla",    "nombre": "El Cuerpo Habla",    "numero": 7,  "rango": "B-01 a B-60",  "codigo_prefix": "B",  "descripcion": "Somatizacion, conciencia corporal, regulacion del sistema nervioso, trauma y cuerpo."},
    {"id": "decisiones",         "nombre": "Decisiones",         "numero": 8,  "rango": "D-01 a D-60",  "codigo_prefix": "D",  "descripcion": "Toma de decisiones, indecision cronica, costos de oportunidad, valores y prioridades."},
    {"id": "recursos",           "nombre": "Recursos",           "numero": 9,  "rango": "RE-01 a RE-60", "codigo_prefix": "RE", "descripcion": "Fortalezas personales, resiliencia, redes de apoyo, autocuidado y recursos internalizados."},
    {"id": "futuro",             "nombre": "Futuro",             "numero": 10, "rango": "F-01 a F-60",  "codigo_prefix": "F",  "descripcion": "Proyeccion, esperanza, visualizacion positiva, metas, legado y sentido de vida."},
    {"id": "metaforas",          "nombre": "Metaforas",          "numero": 11, "rango": "M-01 a M-60",  "codigo_prefix": "M",  "descripcion": "Lenguaje metaforico, imaginacion, simbolos, narrativa y recursos creativos."},
    {"id": "desafios-terapeuticos", "nombre": "Desafios Terapeuticos", "numero": 12, "rango": "DT-01 a DT-60", "codigo_prefix": "DT", "descripcion": "Intervenciones de choque, tareas paradojicas, exposicion y desafios terapeuticos."},
    {"id": "cartas-del-terapeuta", "nombre": "Cartas del Terapeuta", "numero": 13, "rango": "T-01 a T-60", "codigo_prefix": "T",  "descripcion": "Cartas de uso exclusivo del profesional: supervision, autocuidado, contratransferencia y recursos del terapeuta."},
]


# ─── Deteccion de template ──────────────────────────────────────────────────

def detectar_template(html: str) -> str:
    if 'class="card-hover ' in html or 'class="card-hover"' in html:
        return "A"
    if 'class="carta"' in html or 'class="carta-header"' in html:
        return "B"
    if 'class="card"' in html and 'class="card-code"' in html:
        return "C"
    return None


# ─── Template A: Tailwind (Mazos 1-3) ────────────────────────────────────────

class ParserA(HTMLParser):
    def __init__(self):
        super().__init__()
        self.en_article = False
        self.article_depth = 0
        self.en_h3 = False
        self.en_h4 = False
        self.en_p = False
        self.en_li = False
        self.en_span_etiqueta = False
        self.en_div_observacion = False
        self.div_observacion_depth = 0
        self.en_span_observacion = False
        self.span_observacion_texto = ""
        self.h3_texto = ""
        self.h4_texto = ""
        self.p_texto = ""
        self.li_texto = ""
        self.span_etiqueta_texto = ""
        self.carta_actual = None
        self.cartas = []
        self.buffer_seccion = None
        self.codigo_re = re.compile(r"^[A-Z]{1,3}-\d{2}$")

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == "article" and "card-hover" in attrs_dict.get("class", ""):
            self.en_article = True
            self.article_depth = 1
            self.carta_actual = {"codigo": None, "iconos": [], "pregunta": "", "objetivo": "", "profundizacion": [], "observacion": [], "intervenciones": [], "tarea": ""}
            return
        if self.en_article:
            if tag == "article": self.article_depth += 1
            elif tag == "h3": self.en_h3 = True; self.h3_texto = ""
            elif tag == "h4": self.en_h4 = True; self.h4_texto = ""
            elif tag == "p": self.en_p = True; self.p_texto = ""
            elif tag == "li":
                self.en_li = True; self.li_texto = ""; self.span_etiqueta_texto = ""
            elif tag == "div":
                if not self.en_div_observacion and self.buffer_seccion == "observacion":
                    self.en_div_observacion = True; self.div_observacion_depth = 1
                elif self.en_div_observacion: self.div_observacion_depth += 1
            elif tag == "span":
                cls = attrs_dict.get("class", "")
                if "font-semibold" in cls and "text-brand-800" in cls:
                    self.en_span_etiqueta = True; self.span_etiqueta_texto = ""
                elif self.en_div_observacion and not self.en_span_observacion and "text-accent-600" not in cls:
                    self.en_span_observacion = True; self.span_observacion_texto = ""
            elif tag == "ul":
                cls = attrs_dict.get("class", "")
                if "list-disc" in cls: self.buffer_seccion = "profundizacion"
                elif "space-y-1.5" in cls: self.buffer_seccion = "intervenciones"

    def handle_data(self, data):
        if self.en_h3: self.h3_texto += data
        elif self.en_h4: self.h4_texto += data
        elif self.en_p: self.p_texto += data
        elif self.en_li:
            if self.en_span_etiqueta: self.span_etiqueta_texto += data
            else: self.li_texto += data
        elif self.en_span_observacion: self.span_observacion_texto += data
        elif self.en_article and not self.carta_actual.get("codigo"):
            stripped = data.strip()
            if self.codigo_re.match(stripped):
                self.carta_actual["codigo"] = stripped

    def handle_endtag(self, tag):
        if tag == "article" and self.en_article:
            self.article_depth -= 1
            if self.article_depth == 0:
                if self.carta_actual and self.carta_actual.get("codigo"):
                    self.cartas.append(self.carta_actual)
                self.en_article = False; self.carta_actual = None
            return
        if self.en_article:
            if tag == "h3":
                self.en_h3 = False; self.carta_actual["pregunta"] = self.h3_texto.strip()
            elif tag == "h4":
                self.en_h4 = False; h4 = self.h4_texto.strip()
                if "Objetivo" in h4: self.buffer_seccion = "objetivo"
                elif "Profundizacion" in h4 or "Profundización" in h4: self.buffer_seccion = "profundizacion"
                elif "Observacion" in h4 or "Observación" in h4: self.buffer_seccion = "observacion"
                elif "intervencion" in h4 or "intervención" in h4: self.buffer_seccion = "intervenciones"
                elif "Tarea" in h4: self.buffer_seccion = "tarea"
            elif tag == "p":
                self.en_p = False
                if self.buffer_seccion == "objetivo": self.carta_actual["objetivo"] = self.p_texto.strip()
                elif self.buffer_seccion == "tarea": self.carta_actual["tarea"] = self.p_texto.strip()
                self.p_texto = ""
            elif tag == "li":
                self.en_li = False
                if self.buffer_seccion == "profundizacion":
                    self.carta_actual["profundizacion"].append(self.li_texto.strip())
                elif self.buffer_seccion == "intervenciones":
                    item = self.li_texto.strip()
                    if self.span_etiqueta_texto:
                        item = f"{self.span_etiqueta_texto.strip()}: {item}"
                    if item: self.carta_actual["intervenciones"].append(item)
                self.li_texto = ""; self.span_etiqueta_texto = ""
            elif tag == "div" and self.en_div_observacion:
                self.div_observacion_depth -= 1
                if self.div_observacion_depth == 0: self.en_div_observacion = False
            elif tag == "span" and self.en_span_observacion:
                self.en_span_observacion = False
                texto = self.span_observacion_texto.strip()
                if texto: self.carta_actual["observacion"].append(texto)
                self.span_observacion_texto = ""
            elif tag == "span" and self.en_span_etiqueta:
                self.en_span_etiqueta = False


# ─── Template B: Terracota/Sage <article class="carta"> ──────────────────────

def parsear_template_b(html: str) -> list:
    """Extrae cartas de Template B usando regex sobre bloques <article class="carta">."""
    cartas = []
    bloque_re = re.compile(r'<article\s+class="carta"[^>]*>(.*?)</article>', re.DOTALL | re.IGNORECASE)
    codigo_re = re.compile(r'class="carta-codigo"[^>]*>\s*([^<]+)')
    pregunta_re = re.compile(r'class="pregunta-central"[^>]*>\s*"?([^<]+?)"?\s*<')
    objetivo_re = re.compile(r'class="seccion\s+objetivo"[^>]*>.*?<p>(.*?)</p>', re.DOTALL)
    prof_re = re.compile(r'class="seccion\s+profundizacion"[^>]*>(.*?)</div>\s*</div>', re.DOTALL)
    prof_li_re = re.compile(r'<li>(.*?)</li>', re.DOTALL)
    obs_re = re.compile(r'class="seccion\s+observacion"[^>]*>(.*?)</div>\s*</div>', re.DOTALL)
    obs_li_re = re.compile(r'<li>(.*?)</li>', re.DOTALL)
    interv_re = re.compile(r'class="seccion\s+intervenciones"[^>]*>(.*?)</div>\s*</div>', re.DOTALL)
    interv_item_re = re.compile(r'class="intervencion-item"[^>]*>(.*?)</div>', re.DOTALL)
    tarea_re = re.compile(r'class="seccion\s+tarea"[^>]*>.*?<p>(.*?)</p>', re.DOTALL)
    iconos_re = re.compile(r'class="carta-iconos"[^>]*>(.*?)</div>', re.DOTALL)

    for bloque in bloque_re.finditer(html):
        c = bloque.group(1)
        carta = {"codigo": "", "iconos": [], "pregunta": "", "objetivo": "", "profundizacion": [], "observacion": [], "intervenciones": [], "tarea": ""}

        m = codigo_re.search(c)
        if m: carta["codigo"] = m.group(1).strip()

        m = pregunta_re.search(c)
        if m: carta["pregunta"] = m.group(1).strip().strip('"').strip('\u201c').strip('\u201d')

        m = objetivo_re.search(c)
        if m: carta["objetivo"] = m.group(1).strip()

        m = prof_re.search(c)
        if m:
            prof_html = m.group(1)
            carta["profundizacion"] = [li.group(1).strip() for li in prof_li_re.finditer(prof_html)]

        m = obs_re.search(c)
        if m:
            obs_html = m.group(1)
            carta["observacion"] = [re.sub(r'^[✔✓]\s*', '', li.group(1).strip()) for li in obs_li_re.finditer(obs_html)]

        m = interv_re.search(c)
        if m:
            interv_html = m.group(1)
            for item in interv_item_re.finditer(interv_html):
                texto = item.group(1).strip()
                texto = re.sub(r'<strong>(.*?)</strong>', r'\1:', texto)
                texto = re.sub(r'<[^>]+>', '', texto)
                texto = re.sub(r'\s+', ' ', texto).strip()
                if texto: carta["intervenciones"].append(texto)

        m = tarea_re.search(c)
        if m: carta["tarea"] = m.group(1).strip()

        m = iconos_re.search(c)
        if m:
            carta["iconos"] = re.findall(r'[^\s<>/]+', m.group(1))

        if carta["codigo"]:
            cartas.append(carta)

    return cartas


# ─── Template C: Purple/Theme <div class="card"> ─────────────────────────────

def parsear_template_c(html: str) -> list:
    """Extrae cartas de Template C div-by-div con contador de nesting."""
    cartas = []
    # Find all card positions by tracking div nesting from each <div class="card">
    card_start_re = re.compile(r'<div\s+class="card"[^>]*>')
    codigo_re = re.compile(r'class="card-code"[^>]*>\s*([^<]+)')
    pregunta_re = re.compile(r'class="card-question"[^>]*>\s*"?([^<]+?)"?\s*<')
    objetivo_re = re.compile(r'class="section-title">\s*Objetivo cl[íi]nico\s*</div>\s*(.*?)(?=<div\s+class="section-title">\s*Profundizaci)', re.DOTALL)
    prof_re = re.compile(r'class="section-title">\s*Profundizaci[óo]n\s*</div>\s*(.*?)(?=<div\s+class="section-title">\s*Observaci)', re.DOTALL)
    obs_re = re.compile(r'class="section-title">\s*Observaci[óo]n cl[íi]nica\s*</div>\s*<ul[^>]*>(.*?)</ul>', re.DOTALL)
    interv_re = re.compile(r'class="section-title">\s*Posibles l[íi]neas de intervenci[óo]n\s*</div>\s*<ul[^>]*>(.*?)</ul>', re.DOTALL)
    tarea_re = re.compile(r'<div\s+class="task"[^>]*>(.*?)</div>', re.DOTALL)

    # Split into card blocks using the card-start markers
    parts = card_start_re.split(html)
    if not parts:
        return cartas
    # First part is preamble (header, etc.), rest are card blocks
    for block in parts[1:]:
        # Find matching closing div by counting nesting
        depth = 1
        pos = 0
        while depth > 0 and pos < len(block):
            next_open = block.find('<div', pos)
            next_close = block.find('</div>', pos)
            if next_close == -1:
                break
            if next_open != -1 and next_open < next_close:
                depth += 1
                pos = next_open + 4
            else:
                depth -= 1
                pos = next_close + 6
        c = block[:pos] if depth == 0 else block

        carta = {"codigo": "", "iconos": [], "pregunta": "", "objetivo": "", "profundizacion": [], "observacion": [], "intervenciones": [], "tarea": ""}

        m = codigo_re.search(c)
        if m: carta["codigo"] = m.group(1).strip()

        m = pregunta_re.search(c)
        if m: carta["pregunta"] = m.group(1).strip().strip('"').strip('\u201c').strip('\u201d').strip('\u2018').strip('\u2019')

        m = objetivo_re.search(c)
        if m: carta["objetivo"] = re.sub(r'<[^>]+>', '', m.group(1)).strip()

        m = prof_re.search(c)
        if m:
            texto = re.sub(r'<[^>]+>', '\n', m.group(1))
            carta["profundizacion"] = [p.strip() for p in texto.split('\n') if p.strip()]

        m = obs_re.search(c)
        if m:
            items = re.findall(r'<li>(.*?)</li>', m.group(1), re.DOTALL)
            carta["observacion"] = [re.sub(r'<[^>]+>', '', li).strip() for li in items]

        m = interv_re.search(c)
        if m:
            items = re.findall(r'<li>(.*?)</li>', m.group(1), re.DOTALL)
            for item in items:
                texto = re.sub(r'<strong>(.*?)</strong>', r'\1:', item)
                texto = re.sub(r'<[^>]+>', '', texto)
                texto = re.sub(r'\s+', ' ', texto).strip()
                if texto: carta["intervenciones"].append(texto)

        m = tarea_re.search(c)
        if m: carta["tarea"] = m.group(1).strip()

        iconos_m = re.search(r'class="card-icons"[^>]*>(.*?)</span>', c, re.DOTALL)
        if iconos_m:
            carta["iconos"] = re.findall(r'[^\s<>/]+', iconos_m.group(1))

        if carta["codigo"]:
            cartas.append(carta)

    return cartas


# ─── Dispatcher ──────────────────────────────────────────────────────────────

def parsear_html(ruta: Path) -> list:
    html = ruta.read_text(encoding="utf-8")
    template = detectar_template(html)

    if template == "A":
        parser = ParserA()
        parser.feed(html)
        return parser.cartas
    elif template == "B":
        return parsear_template_b(html)
    elif template == "C":
        return parsear_template_c(html)
    else:
        print(f"  [WARN] Template no detectado en {ruta.name}")
        return []


def procesar_mazo(carpeta: Path, info_mazo: dict) -> dict:
    """Procesa todos los HTMLs de un mazo y devuelve el dict del mazo completo."""
    archivos = sorted(carpeta.glob("*.html"))
    if not archivos:
        print(f"  [ERROR] No se encontraron HTMLs en {carpeta.name}")
        return None

    todas = []
    for archivo in archivos:
        cartas = parsear_html(archivo)
        print(f"  {archivo.name}: {len(cartas)} cartas")
        todas.extend(cartas)

    todas.sort(key=lambda c: c["codigo"])

    return {
        "id": info_mazo["id"],
        "nombre": info_mazo["nombre"],
        "numero": info_mazo["numero"],
        "rango": info_mazo["rango"],
        "descripcion": info_mazo["descripcion"],
        "cartas": todas,
    }


def main():
    base = Path(__file__).parent
    data_dir = base / "app" / "data"
    data_dir.mkdir(parents=True, exist_ok=True)

    total_global = 0

    for info in MAZOS:
        # Try exact folder name first, then fall back to listing
        candidates = list(base.glob(f"{info['numero']}*"))
        if candidates:
            carpeta = candidates[0]
        else:
            print(f"\n[SKIP] Carpeta no encontrada para mazo {info['numero']}: {info['nombre']}")
            continue

        # For mazo 1, read existing JSON instead of reparsing
        if info["numero"] == 1:
            json_existente = carpeta / "mazo-1-la-puerta.json"
            if json_existente.exists():
                print(f"\n=== Mazo 1: {info['nombre']} (usando JSON existente) ===")
                mazo = json.loads(json_existente.read_text(encoding="utf-8"))
                n = len(mazo["cartas"])
                total_global += n
                print(f"  Total: {n} cartas (del JSON existente)")

                destino = data_dir / f"mazo-{info['id']}.json"
                with open(destino, "w", encoding="utf-8") as f:
                    json.dump(mazo, f, ensure_ascii=False, indent=2)
                print(f"  Copiado a: {destino}")
                continue

        print(f"\n=== Mazo {info['numero']}: {info['nombre']} ===")

        mazo = procesar_mazo(carpeta, info)
        if not mazo:
            continue

        n = len(mazo["cartas"])
        total_global += n
        print(f"  Total: {n} cartas")

        salida = carpeta / f"mazo-{info['id']}.json"
        with open(salida, "w", encoding="utf-8") as f:
            json.dump(mazo, f, ensure_ascii=False, indent=2)
        print(f"  Guardado en: {salida}")

        destino = data_dir / f"mazo-{info['id']}.json"
        with open(destino, "w", encoding="utf-8") as f:
            json.dump(mazo, f, ensure_ascii=False, indent=2)
        print(f"  Copiado a: {destino}")

    print(f"\n{'='*50}")
    print(f"Total global: {total_global} cartas en {len(MAZOS)} mazos")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
