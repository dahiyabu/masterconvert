import os
import pdfplumber
import pandas as pd
from pdf2image import convert_from_path
import pytesseract
import config
import fitz  # PyMuPDF
from logger import logger

# ✅ Detect if PDF is scanned (image-based)
def is_scanned_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    for page in doc:
        if page.get_text("text").strip():
            return False  # Text found → digital PDF
    return True  # No text → likely scanned

# ✅ Convert digital PDF (text + tables) to Excel
def convert_pdf_to_excel(input_path, output_path):
    rows = []

    try:
        with pdfplumber.open(input_path) as pdf:
            for i, page in enumerate(pdf.pages):
                # Extract plain text
                text = page.extract_text()
                if text:
                    #rows.append(["--- Page {}: Text ---".format(i + 1)])
                    for line in text.split('\n'):
                        rows.append([line])

                # Extract tables
                tables = page.extract_tables()
                for t_index, table in enumerate(tables):
                    #rows.append(["--- Page {}: Table {} ---".format(i + 1, t_index + 1)])
                    for row in table:
                        rows.append(row)

        # Normalize rows to equal column lengths
        max_cols = max(len(row) for row in rows)
        normalized_rows = [row + [''] * (max_cols - len(row)) for row in rows]

        df = pd.DataFrame(normalized_rows)
        df.to_excel(output_path, index=False, header=False)
        logger.info(f"✅ Converted digital PDF to Excel: {output_path}")
        return True

    except Exception as e:
        logger.error(f"❌ Error converting digital PDF: {e}")
        return False

# ✅ Convert scanned image-based PDF to Excel using OCR
def convert_scanned_pdf_to_excel(input_path, output_path):
    from io import StringIO
    import csv

    pytesseract.pytesseract.tesseract_cmd = config.TESSERACT_PATH
    images = convert_from_path(input_path)
    all_rows = []

    for i, img in enumerate(images):
        # Use psm 6: Assume a uniform block of text (like a table)
        ocr_text = pytesseract.image_to_string(img, config="--psm 6")
        
        for line in ocr_text.split('\n'):
            line = line.strip()
            if line:
                # Try splitting with common delimiters (tab or multiple spaces)
                if '\t' in line:
                    row = line.split('\t')
                else:
                    row = [cell.strip() for cell in line.split('  ') if cell.strip()]
                all_rows.append(row)

    if all_rows:
        max_cols = max(len(row) for row in all_rows)
        normalized_rows = [row + [''] * (max_cols - len(row)) for row in all_rows]

        df = pd.DataFrame(normalized_rows)
        df.to_excel(output_path, index=False, header=False)
        logger.info(f"✅ OCR-based Excel (with tables) saved to {output_path}")
        return True
    else:
        logger.error("❌ No usable table data extracted from OCR.")
        return False


# ✅ Main smart dispatcher
def convert_pdf_to_xl(input_path, output_path):
    if is_scanned_pdf(input_path):
        logger.info("📄 Detected scanned PDF – using OCR...")
        return convert_scanned_pdf_to_excel(input_path, output_path)
    else:
        logger.info("📄 Detected digital PDF – extracting text and tables...")
        return convert_pdf_to_excel(input_path, output_path)