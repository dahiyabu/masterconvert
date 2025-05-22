import os
import shutil
import subprocess
import config
from logger import logger
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from docx import Document


# ✅ Detect if PDF is scanned
def is_scanned_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    for page in doc:
        if page.get_text("text").strip():
            return False  # Has text
    return True  # No text

# ✅ Convert scanned PDF to DOCX using OCR
def convert_scanned_pdf_to_docx(input_path, output_path):
    try:
        pytesseract.pytesseract.tesseract_cmd = config.TESSERACT_PATH
        doc = Document()
        pdf_doc = fitz.open(input_path)

        for page_index in range(len(pdf_doc)):
            page = pdf_doc.load_page(page_index)
            pix = page.get_pixmap(dpi=300)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            # Use image_to_data to get structured text
            data = pytesseract.image_to_data(img, config="--psm 6", output_type=pytesseract.Output.DATAFRAME)
            data = data.dropna(subset=["text"])
            if data.empty:
                continue

            #doc.add_paragraph(f"--- Page {page_index + 1} ---")

            # Group by line and sort left-to-right
            for _, line in data.groupby("line_num"):
                line_text = " ".join(line.sort_values("left")["text"])
                if line_text.strip():
                    doc.add_paragraph(line_text.strip())

        doc.save(output_path)
        logger.info(f"✅ OCR-based DOCX saved at {output_path}")
        return True

    except Exception as e:
        logger.error(f"❌ OCR conversion failed: {e}")
        return False

# ✅ Main function to convert PDF to DOCX (smart fallback)
def convert_from_pdf(input_path, output_path, dest_format):
    try:
        output_dir = os.path.dirname(output_path)
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        generated_doc = os.path.join(output_dir, f"{base_name}.{dest_format}")

        if is_scanned_pdf(input_path):
            logger.info("📄 Detected scanned PDF – using OCR method for DOCX.")
            return convert_scanned_pdf_to_docx(input_path, output_path)

        # Use LibreOffice for digital PDFs
        subprocess.run([
            config.LIBREOFFICE_PATH,
            '--headless',
            '--convert-to', dest_format,
            '--outdir', output_dir,
            input_path
        ], check=True)

        if os.path.exists(generated_doc):
            shutil.move(generated_doc, output_path)
            logger.info(f"✅ Converted (digital) to DOCX: {output_path}")
            return True
        else:
            raise Exception("LibreOffice conversion failed.")

    except subprocess.CalledProcessError as e:
        logger.error(f"❌ LibreOffice error: {e}")
    except Exception as e:
        logger.error(f"❌ Conversion failed: {e}")
    return False