"""Optimiza las imagenes de cartas para uso en PWA.

Reglas:
- Detecta orientacion por imagen (ancho vs alto).
- Vertical: redimensiona a 800x1200 (ratio 2:3) con padding si hace falta.
- Horizontal: redimensiona a 1200x800 (ratio 3:2) con padding si hace falta.
- Genera thumbnail manteniendo la orientacion original.
- Comprime a JPEG calidad 82.
- Salida: full/ (alta) y thumb/ (baja) junto a _original/.

Uso:
    python optimizar_imagenes.py <carpeta_imagenes> [--dry-run]

Ejemplo:
    python optimizar_imagenes.py "1 la puerta inicio de sesion/imagenes"
"""

import argparse
import sys
import re
from pathlib import Path

from PIL import Image


# Tamano maximo del lado mayor para full
FULL_MAX = 1200
# Tamano maximo del lado mayor para thumbnail
THUMB_MAX = 450
# Calidad JPEG
JPEG_QUALITY = 82


def detectar_orientacion(img: Image.Image) -> str:
    """Devuelve 'vertical' o 'horizontal' segun el aspect ratio."""
    w, h = img.size
    return "vertical" if h > w else "horizontal"


def tamano_full(orientacion: str) -> tuple[int, int]:
    """Tamano objetivo para la version full."""
    if orientacion == "vertical":
        return (800, 1200)
    return (1200, 800)


def tamano_thumb(orientacion: str) -> tuple[int, int]:
    """Tamano objetivo para la version thumbnail."""
    if orientacion == "vertical":
        return (300, 450)
    return (450, 300)


def redimensionar_con_padding(
    img: Image.Image, target: tuple[int, int]
) -> Image.Image:
    """Redimensiona SIN CORTAR: escala para entrar en target, padding centrado."""
    target_w, target_h = target
    src_w, src_h = img.size

    # Escalar para que ENTRE dentro del target (contain, no cover)
    scale = min(target_w / src_w, target_h / src_h)
    new_w = int(src_w * scale)
    new_h = int(src_h * scale)

    img_resized = img.resize((new_w, new_h), Image.LANCZOS)

    # Centrar sobre canvas blanco
    canvas = Image.new("RGB", target, (255, 255, 255))
    offset = ((target_w - new_w) // 2, (target_h - new_h) // 2)
    canvas.paste(img_resized, offset)
    return canvas


def guardar_jpeg(img: Image.Image, destino: Path, quality: int = JPEG_QUALITY) -> None:
    """Guarda la imagen como JPEG con la calidad dada, modo RGB."""
    if img.mode != "RGB":
        img = img.convert("RGB")
    destino.parent.mkdir(parents=True, exist_ok=True)
    img.save(destino, "JPEG", quality=quality, optimize=True, progressive=True)


def extraer_codigo(filename: str) -> str | None:
    """Extrae el codigo de carta de un filename como 'E01.jpeg' -> 'E-01'."""
    stem = Path(filename).stem
    # Match prefix letters + optional dash + number
    m = re.match(r"^([A-Za-z]{1,3})[- ]?(\d{1,2})(?:\s|$)", stem)
    if m:
        prefix = m.group(1).upper()
        num = int(m.group(2))
        return f"{prefix}-{num:02d}"
    return None


def procesar_imagen(origen: Path, full_dir: Path, thumb_dir: Path, codigo: str = None) -> dict:
    """Procesa una imagen y devuelve info del resultado."""
    img = Image.open(origen)
    orientacion = detectar_orientacion(img)

    nombre_salida = (codigo or origen.stem) + ".jpg"

    # Full
    full_target = tamano_full(orientacion)
    img_full = redimensionar_con_padding(img, full_target)
    full_path = full_dir / nombre_salida
    guardar_jpeg(img_full, full_path)
    full_size = full_path.stat().st_size

    # Thumb
    thumb_target = tamano_thumb(orientacion)
    img_thumb = redimensionar_con_padding(img, thumb_target)
    thumb_path = thumb_dir / nombre_salida
    guardar_jpeg(img_thumb, thumb_path, quality=75)
    thumb_size = thumb_path.stat().st_size

    return {
        "archivo": nombre_salida,
        "orientacion": orientacion,
        "original": origen.stat().st_size,
        "full": full_size,
        "thumb": thumb_size,
    }


def formatear_kb(bytes_size: int) -> str:
    return f"{bytes_size / 1024:.1f} KB"


def main() -> int:
    parser = argparse.ArgumentParser(description="Optimiza imagenes de cartas.")
    parser.add_argument("carpeta", type=Path, help="Carpeta con imagenes P-NN.*")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Solo muestra lo que haria, sin escribir archivos.",
    )
    args = parser.parse_args()

    carpeta = args.carpeta.resolve()
    if not carpeta.is_dir():
        print(f"ERROR: {carpeta} no existe o no es una carpeta.")
        return 1

    # Patrones validos: P-NN.jpg, E-NN.jpg, etc. (prefijo de 1-3 letras + guion)
    extensiones = {".jpg", ".jpeg", ".png", ".webp"}
    imagenes = sorted(
        p for p in carpeta.iterdir()
        if p.is_file() and p.suffix.lower() in extensiones
    )

    if not imagenes:
        print(f"No se encontraron imagenes en {carpeta}.")
        return 1

    print(f"Encontradas {len(imagenes)} imagenes en {carpeta.name}")
    if args.dry_run:
        print("(dry-run: no se escribiran archivos)\n")

    full_dir = carpeta / "full"
    thumb_dir = carpeta / "thumb"

    total_orig = 0
    total_full = 0
    total_thumb = 0
    verticales = 0
    horizontales = 0
    resultados = []

    for origen in imagenes:
        try:
            if args.dry_run:
                img = Image.open(origen)
                ori = detectar_orientacion(img)
                if ori == "vertical":
                    verticales += 1
                else:
                    horizontales += 1
                total_orig += origen.stat().st_size
                resultados.append({
                    "archivo": origen.name,
                    "orientacion": ori,
                    "original": origen.stat().st_size,
                })
            else:
                codigo = extraer_codigo(origen.name)
                if not codigo:
                    print(f"  [SKIP] {origen.name}: no se pudo extraer codigo")
                    continue
                info = procesar_imagen(origen, full_dir, thumb_dir, codigo=codigo)
                total_orig += info["original"]
                total_full += info["full"]
                total_thumb += info["thumb"]
                if info["orientacion"] == "vertical":
                    verticales += 1
                else:
                    horizontales += 1
                resultados.append(info)
                print(
                    f"  {info['archivo']:<12} {info['orientacion']:<11} "
                    f"{formatear_kb(info['original']):>10} -> "
                    f"full {formatear_kb(info['full']):>9} / "
                    f"thumb {formatear_kb(info['thumb']):>8}"
                )
        except Exception as exc:
            print(f"  ERROR con {origen.name}: {exc}", file=sys.stderr)

    print(f"\n=== Resumen ===")
    print(f"Imagenes procesadas: {len(resultados)}")
    print(f"  Verticales:   {verticales}")
    print(f"  Horizontales: {horizontales}")
    print(f"  Peso original total: {formatear_kb(total_orig)}")

    if not args.dry_run:
        print(f"  Peso full total:     {formatear_kb(total_full)}")
        print(f"  Peso thumb total:    {formatear_kb(total_thumb)}")
        reduccion = (1 - total_full / total_orig) * 100 if total_orig else 0
        print(f"  Reduccion full:      {reduccion:.1f}%")
        print(f"\nSalida:")
        print(f"  {full_dir}")
        print(f"  {thumb_dir}")
    else:
        print("\n(dry-run: ejecuta sin --dry-run para aplicar los cambios)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
