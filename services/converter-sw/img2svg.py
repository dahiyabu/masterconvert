import base64
from pathlib import Path
import cairosvg
import io
from PIL import Image
from init import logger

def raster_image_to_svg(input_path, output_path):
    with open(input_path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode("utf-8")

    ext = Path(input_path).suffix.replace(".", "")
    svg_data = f"""<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
  <image width="100" height="100" href="data:image/{ext};base64,{encoded}" />
</svg>"""

    with open(output_path, "w") as f:
        f.write(svg_data)

    return True

def convert_svg_to_jpg(svg_path, output_path, target_format,quality=95):
    try:
        # Infer format from output path extension
        supported_formats = {'jpeg', 'jpg', 'png', 'bmp', 'tiff', 'webp'}

        if target_format not in supported_formats:
            raise ValueError(f"Unsupported format: {target_format}. Choose from {supported_formats}")

        # Step 1: Convert SVG to PNG bytes
        png_data = cairosvg.svg2png(url=svg_path)

        # Step 2: Load PNG bytes into Pillow
        image = Image.open(io.BytesIO(png_data))

        # Convert to appropriate mode (RGB or RGBA depending on output format)
        if target_format in {'jpeg', 'jpg', 'bmp'}:
            image = image.convert('RGB')  # No alpha channel
        else:
            image = image.convert('RGBA')  # Preserve transparency

        # Step 3: Save to target format
        if target_format == 'jpg':
            target_format='jpeg'
        image.save(output_path, format=target_format.upper(), quality=quality)
        return True

    except Exception as e:
        logger.error(f"❌ Error converting {svg_path} → {output_path}: {e}")
        return False