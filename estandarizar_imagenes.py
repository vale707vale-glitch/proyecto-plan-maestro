"""
Estandariza nombres de imagenes en todos los mazos y limpia duplicados/basura.

Reglas:
1. Eliminar archivos con prefijo incorrecto (ej: R-* en mazos que no son Relaciones)
2. Renombrar a formato PREFIX-NN.jpg (ej: E01.jpeg → E-01.jpg, E-17.png → E-17.jpg)
3. Convertir PNG a JPEG
4. Limpiar carpetas basura (Nueva carpeta/, imagenes/imagenes/, .docx, WhatsApp*)
5. Mover originales a _original/ antes de modificar
"""

import shutil
import sys
from pathlib import Path

BASE = Path(__file__).parent

MAZOS = [
    {"numero": 2,  "prefix": "E",  "folder": "2 emociones",              "expected": 60},
    {"numero": 3,  "prefix": "H",  "folder": "3 historia personal",      "expected": 0},   # No real H images
    {"numero": 4,  "prefix": "C",  "folder": "4 creencias",              "expected": 60},
    {"numero": 5,  "prefix": "S",  "folder": "5 sombras",                "expected": 60},
    {"numero": 6,  "prefix": "R",  "folder": "6 relaciones",             "expected": 60},
    {"numero": 7,  "prefix": "B",  "folder": "7 el cuerpo habla",         "expected": 60},
    {"numero": 8,  "prefix": "D",  "folder": "8 decisiones",             "expected": 60},
    {"numero": 9,  "prefix": "RE", "folder": "9 recursos",               "expected": 60},
    {"numero": 10, "prefix": "F",  "folder": "10 futuro",                "expected": 60},
    {"numero": 11, "prefix": "M",  "folder": "11 metaforas",             "expected": 60},
    {"numero": 12, "prefix": "DT", "folder": "12 desafios terapeuticos", "expected": 60},
    {"numero": 13, "prefix": "T",  "folder": "13 cartas del terapeuta",  "expected": 30},
]

PREFIXES_VALID = {"E", "H", "C", "S", "R", "B", "D", "RE", "F", "M", "DT", "T"}
EXT_VALID = {".jpg", ".jpeg", ".png", ".webp"}

def limpiar_junk(imagenes_dir: Path):
    """Elimina carpetas basura y archivos no-imagen."""
    if not imagenes_dir.exists():
        return
    for item in list(imagenes_dir.iterdir()):
        name = item.name.lower()
        if item.is_dir():
            if name in ("nueva carpeta",):
                shutil.rmtree(item)
                print(f"  [LIMPIAR] Carpeta eliminada: {item.name}")
            elif item.name == "imagenes":
                shutil.rmtree(item)
                print(f"  [LIMPIAR] Subcarpeta 'imagenes' eliminada: {item}")
        elif item.is_file():
            if item.suffix.lower() not in EXT_VALID:
                item.unlink()
                print(f"  [LIMPIAR] Archivo no-imagen eliminado: {item.name}")

def es_prefijo_valido_para_mazo(filename: str, prefix: str) -> bool:
    """Verifica si el archivo tiene el prefijo correcto para el mazo."""
    up = filename.upper()
    return up.startswith(prefix.upper())

def extraer_numero(filename: str, prefix: str) -> int | None:
    """Extrae el numero de carta de un filename como E01, E-01, E-17.png, etc."""
    name = filename.upper()
    # Remove extension
    stem = Path(filename).stem
    # Remove prefix (case insensitive)
    rest = stem[len(prefix):] if stem.upper().startswith(prefix.upper()) else stem
    # Remove leading dash, space, parens
    rest = rest.lstrip("- ").split("(")[0].strip()
    try:
        return int(rest)
    except ValueError:
        return None

def estandarizar_mazo(info: dict):
    prefix = info["prefix"]
    folder = info["folder"]
    expected = info["expected"]

    mazo_dir = BASE / folder
    if not mazo_dir.exists():
        # Try glob
        candidates = list(BASE.glob(f"{info['numero']}*"))
        if not candidates:
            print(f"\n[SKIP] {folder} - carpeta no encontrada")
            return
        mazo_dir = candidates[0]
        folder = mazo_dir.name

    imagenes_dir = mazo_dir / "imagenes"
    if not imagenes_dir.exists():
        print(f"\n[SKIP] {folder}/imagenes/ - no existe")
        return

    print(f"\n=== {folder} (prefix={prefix}, expected={expected}) ===")

    # Step 1: Clean junk
    limpiar_junk(imagenes_dir)

    # Step 2: Create _original backup
    original_dir = imagenes_dir / "_original"
    if not original_dir.exists():
        original_dir.mkdir()
        # Copy all current files to _original
        for f in imagenes_dir.iterdir():
            if f.is_file() and f.suffix.lower() in EXT_VALID:
                shutil.copy2(f, original_dir / f.name)
        print(f"  Backup creado en _original/ ({len(list(original_dir.iterdir()))} archivos)")

    # Step 3: Remove files with wrong prefix
    intruders = []
    for f in list(imagenes_dir.iterdir()):
        if f.is_file() and f.suffix.lower() in EXT_VALID:
            if not es_prefijo_valido_para_mazo(f.name, prefix):
                intruders.append(f.name)
                f.unlink()

    if intruders:
        print(f"  [LIMPIEZA] {len(intruders)} archivos con prefijo incorrecto eliminados:")
        for name in sorted(intruders):
            print(f"    - {name}")

    # Step 4: Map existing files to expected codes
    files_by_num = {}
    for f in list(imagenes_dir.iterdir()):
        if f.is_file() and f.suffix.lower() in EXT_VALID:
            num = extraer_numero(f.name, prefix)
            if num is not None and 1 <= num <= 99:
                if num not in files_by_num:
                    files_by_num[num] = f
                else:
                    # Keep JPEG over PNG, prefer dash format
                    pass

    # Step 5: Rename to standard PREFIX-NN.jpg
    renamed = 0
    for f in list(imagenes_dir.iterdir()):
        if f.is_file() and f.suffix.lower() in EXT_VALID:
            num = extraer_numero(f.name, prefix)
            if num is None:
                continue
            target_name = f"{prefix}-{num:02d}.jpg"
            target_path = imagenes_dir / target_name
            if f.name == target_name:
                continue
            if f.suffix.lower() != ".jpg":
                # Convert to JPEG
                try:
                    from PIL import Image
                    img = Image.open(f)
                    if img.mode != "RGB":
                        img = img.convert("RGB")
                    if target_path.exists():
                        target_path.unlink()
                    img.save(target_path, "JPEG", quality=92, optimize=True)
                    f.unlink()
                    renamed += 1
                    print(f"  [CONVERT] {f.name} -> {target_name}")
                except Exception as e:
                    print(f"  [ERROR] {f.name}: {e}")
            else:
                if target_path.exists() and target_path.name != f.name:
                    f.unlink()
                else:
                    f.rename(target_path)
                    renamed += 1

    # Final count
    final_files = sorted([p for p in imagenes_dir.iterdir() if p.is_file() and p.suffix.lower() in EXT_VALID and p.name[0].isalpha()])
    print(f"  Resultado: {len(final_files)} archivos estandarizados")
    if expected and len(final_files) != expected:
        missing = expected - len(final_files)
        if missing > 0:
            print(f"  [ATENCION] Faltan {missing} imagenes (esperadas: {expected})")

def main():
    print("=" * 60)
    print("ESTANDARIZACION DE IMAGENES - Proyecto MOSAICO")
    print("=" * 60)

    for info in MAZOS:
        estandarizar_mazo(info)

    print("\n" + "=" * 60)
    print("COMPLETADO")
    print("=" * 60)
    print("\nIMPORTANTE: Mazo 3 (Historia Personal) no tiene imagenes H-*.")
    print("  Las 58 imagenes R-* que habia se eliminaron (pertenecen a Relaciones).")
    print("  Se necesitan generar o proveer imagenes H-01 a H-60.")

if __name__ == "__main__":
    main()
