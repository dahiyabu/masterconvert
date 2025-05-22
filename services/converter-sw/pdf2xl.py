import os
import pdfplumber
import pandas as pd
import pytesseract
import config
import fitz  # PyMuPDF
from PIL import Image
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
    pytesseract.pytesseract.tesseract_cmd = config.TESSERACT_PATH
    doc = fitz.open(input_path)
    all_rows = []

    for page_index in range(len(doc)):
        page = doc.load_page(page_index)
        pix = page.get_pixmap(dpi=300)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        # Use OCR to get word-level data with bounding boxes
        data = pytesseract.image_to_data(img, config="--psm 6", output_type=pytesseract.Output.DATAFRAME)

        # Drop rows with no text
        data = data.dropna(subset=["text"])
        if data.empty:
            continue

        # Group by line number
        grouped = data.groupby("line_num")

        for _, group in grouped:
            words = list(group.sort_values("left")["text"])
            all_rows.append(words)

    if all_rows:
        max_cols = max(len(row) for row in all_rows)
        normalized_rows = [row + [''] * (max_cols - len(row)) for row in all_rows]
        df = pd.DataFrame(normalized_rows)
        df.to_excel(output_path, index=False, header=False)
        print(f"✅ OCR-based Excel saved to {output_path}")
        return True
    else:
        print("❌ No usable OCR data found.")
        return False
    
# ✅ Main smart dispatcher
def convert_pdf_to_xl(input_path, output_path):
    if is_scanned_pdf(input_path):
        logger.info("📄 Detected scanned PDF – using OCR...")
        return convert_scanned_pdf_to_excel(input_path, output_path)
    else:
        logger.info("📄 Detected digital PDF – extracting text and tables...")
        return convert_pdf_to_excel(input_path, output_path)