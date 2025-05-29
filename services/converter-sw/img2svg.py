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
    
def resize_if_needed(img, max_size=16383):
    width, height = img.size
    if width > max_size or height > max_size:
        scaling_factor = min(max_size / width, max_size / height)
        new_size = (int(width * scaling_factor), int(height * scaling_factor))
        img = img.resize(new_size,Image.Resampling.LANCZOS)
    return img

def convert_image_to_webp(input_path, output_path):
    try:
        with Image.open(input_path) as img:
            img = resize_if_needed(img)
            img.save(output_path, format="WEBP")
        logger.info(f"Converted to WebP: {output_path}")
    except Exception as e:
        logger.error(f"Image conversion error: {e}")