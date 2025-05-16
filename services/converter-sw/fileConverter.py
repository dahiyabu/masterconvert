import os
import io
import sys
import uuid
import json
from datetime import datetime
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import logging
from pathlib import Path
import shutil
import subprocess
import zipfile
import pyzipper
import tarfile
import pytesseract
import py7zr
import rarfile
import mimetypes
import ffmpeg
from PyPDF2 import PdfReader, PdfWriter, PdfMerger
from pdf2docx import Converter
from docx2pdf import convert
import docx2txt
import fitz
from PIL import Image
#from cryptography.fernet import Fernet
import time
import pdfplumber
import pypandoc
import config
#from weasyprint import HTML
from docx import Document
from archive import merge_files_to_archive
from compress import compress_file
# Initialize Flask app
app = Flask(__name__, static_folder=os.path.join(os.getcwd(), 'build', 'static'))
CORS(app)  # Enable CORS for all routes
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable caching for development

# Configure logging
logging.basicConfig(level=logging.INFO, filename='app.log', filemode='a', format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
CONVERTED_FOLDER = 'converted'
ALLOWED_EXTENSIONS = {
    'pdf', 'docx', 'txt', 'rtf', 'odt','xlsx','xls','csv',  # Documents
    'jpg', 'jpeg', 'png', 'svg', 'webp', 'gif',  # Images
    'mp4', 'mov', 'avi', 'webm', 'mkv',  # Video
    'mp3', 'wav', 'ogg', 'flac', 'aac',  # Audio
    'zip', 'rar', 'tar', '7z', 'iso'  # Archives
}

# Create necessary folders
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)

# Generate a key for file encryption (in a production app, store this securely)
#ENCRYPTION_KEY = Fernet.generate_key()
#cipher_suite = Fernet(ENCRYPTION_KEY)

# Format compatibility mapping (same as frontend)
FORMAT_COMPATIBILITY = {
    # Document formats
    'pdf': ['docx', 'txt', 'rtf', 'odt', 'png', 'jpg','xlsx','xls','pdf'],
    'docx': ['pdf', 'txt', 'rtf', 'odt','docx'],
    'txt': ['pdf', 'docx', 'rtf', 'odt','txt'],
    'rtf': ['pdf', 'docx', 'txt', 'odt','rtf'],
    'odt': ['pdf', 'docx', 'txt', 'rtf','odt'],
    'xlsx': ['pdf', 'txt', 'rtf', 'odt','xls','xlsx'],
    'xls': ['pdf', 'txt', 'rtf', 'odt','xlsx','xls'],
    
    # Image formats
    'jpg': ['png', 'webp', 'gif', 'svg', 'pdf','jpg'],
    'jpeg': ['png', 'webp', 'gif', 'svg', 'pdf','jpeg'],
    'png': ['jpg', 'webp', 'gif', 'svg', 'pdf','png'],
    'svg': ['png', 'jpg', 'webp','svg'],
    'webp': ['png', 'jpg', 'gif','webp'],
    'gif': ['png', 'jpg', 'webp', 'mp4','gif'],
    
    # Video formats
    'mp4': ['mov', 'avi', 'webm', 'mkv', 'gif','mp4'],
    'mov': ['mp4', 'avi', 'webm', 'mkv','mov'],
    'avi': ['mp4', 'mov', 'webm', 'mkv','avi'],
    'webm': ['mp4', 'mov', 'avi', 'mkv','webm'],
    'mkv': ['mp4', 'mov', 'avi', 'webm','mkv'],
    
    # Audio formats
    'mp3': ['wav', 'ogg', 'flac', 'aac','mp3'],
    'wav': ['mp3', 'ogg', 'flac', 'aac','wav'],
    'ogg': ['mp3', 'wav', 'flac', 'aac','ogg'],
    'flac': ['mp3', 'wav', 'ogg', 'aac','flac'],
    'aac': ['mp3', 'wav', 'ogg', 'flac','aac'],
    
    # Archive/Other formats
    'zip': ['rar', 'tar', '7z','zip'],
    'rar': ['zip', 'tar', '7z','rar'],
    'tar': ['zip', 'rar', '7z','tar'],
    '7z': ['zip', 'rar', 'tar','7z'],
    'iso': ['zip', 'tar','iso']
}

# File category mapping (for logging and metadata)
FILE_CATEGORIES = {
    'pdf': 'Documents',
    'docx': 'Documents',
    'txt': 'Documents',
    'rtf': 'Documents',
    'odt': 'Documents',
    'xlsx': 'Documents',
    'csv': 'Documents',
    'xls': 'Documents',
    
    'jpg': 'Images',
    'jpeg': 'Images',
    'png': 'Images',
    'svg': 'Images',
    'webp': 'Images',
    'gif': 'Images',
    
    'mp4': 'Video',
    'mov': 'Video',
    'avi': 'Video',
    'webm': 'Video',
    'mkv': 'Video',
    
    'mp3': 'Audio',
    'wav': 'Audio',
    'ogg': 'Audio',
    'flac': 'Audio',
    'aac': 'Audio',
    
    'zip': 'Archive',
    'rar': 'Archive',
    'tar': 'Archive',
    '7z': 'Archive',
    'iso': 'Archive'
}
COMPRESSED_QUALITY={'Documents':['None','low','medium','high'],
'Images':['None','70','85','95'],
'Video':['None','50','23','18'],
'Audio':['None','64k','128k','192k'],
'Archive':['None','1','5','9']}
ALLOWED_COMPRESS_EXTENTIONS=['mp4', 'mov', 'avi', 'mkv', 'webm','mp3', 'wav', 'ogg', 'flac','pdf','jpg', 'jpeg', 'png', 'svg', 'webp', 'gif']
ALLOWED_ENCRYPT_EXTENTIONS=['pdf','zip']

def allowed_file(filename):
    """Check if file has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_extension(filename):
    """Extract extension from filename"""
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ""

def is_conversion_supported(source_ext, target_ext):
    """Check if conversion is supported"""
    source_ext = source_ext.lower()
    target_ext = target_ext.lower()
    
    # If source extension is not in our compatibility mapping
    if source_ext not in FORMAT_COMPATIBILITY:
        return False
    
    # Check if target format is in the list of compatible formats
    return target_ext in FORMAT_COMPATIBILITY[source_ext]

def encrypt_pdf(input_path, output_path, password):
    """Encrypt a PDF file with a password"""
    try:
        reader = PdfReader(input_path)
        writer = PdfWriter()
        # Add the image-based PDF to the writer
        for page_num in range(len(reader.pages)):
            writer.add_page(reader.pages[page_num])

        # Set password for the PDF
        writer.encrypt(password)
        #file_name = os.path.basename()
        #file_name_without_extension, _ = os.path.splitext(file_name)

        # Save the password-protected PDF
        #output_pdf_path = os.path.join(output_pdf_path, file_name_without_extension + '.pdf')
        with open(output_path, "wb") as output_pdf:
            writer.write(output_pdf)
        return True
        # Delete the temporary file
        #os.remove(pdf_path)
    except Exception as e:
        print(f"Error encrypting PDF: {e}")
        return False
    
def create_password_protected_zip(input_file, output_zip, password):
    """Create a password-protected zip file."""
    try:
        with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Add the file to the ZIP archive with password
            zipf.setpassword(password.encode())
            zipf.setencryption(pyzipper.WZ_AES)
            zipf.write(input_file, arcname=input_file.split("/")[-1])
        logger.info(f"Password-protected ZIP created: {output_zip}")
        return True
    except Exception as e:
        print(f"Error creating password-protected ZIP: {e}")
        return False

def is_pdf(file_path):
    """Check if a file is a PDF based on its magic number"""
    try:
        with open(file_path, 'rb') as file:
            # Read the first 4 bytes to check the PDF header
            header = file.read(4)
            # PDF files start with "%PDF"
            return header == b'%PDF'
    except Exception as e:
        print(f"Error checking file: {e}")
        return False
           
def encrypt_file(input_path, output_path, password):
    """Encrypt a file with a password"""
    try:
        # For a real application, use a proper encryption library and derive a key from the password
        # This is a simplified example using Fernet
        if(is_pdf(input_path)):
            #input_path=input_path+'.pdf'
            return encrypt_pdf(input_path=input_path,output_path=output_path,password=password)
        #input_path=input_path+'.zip'
        return create_password_protected_zip(input_path,output_zip=output_path,password=password)
    except Exception as e:
        logger.error(f"Encryption error: {str(e)}")
        return False

def convert_pdf_to_docx(input_path, output_path):
    try:
        # Create a PDF converter object
        cv = Converter(input_path)
        # Convert the PDF to DOCX
        cv.convert(output_path, start=0, end=None)  # You can specify the page range (start, end)
        cv.close()
        logger.info(f"PDF converted to DOCX and saved at {output_path}")
        return True
    except Exception as e:
        logger.error(f"Error converting PDF to DOCX: {e}")
        return False

def convert_pdf_to_image(input_path, output_path, target_format):
    try:
        # Open the PDF file
        pdf_document = fitz.open(input_path)
        images=[]
        logger.info("Pages in pdf=%s",pdf_document.page_count)
        # Iterate through the pages
        for i in range(pdf_document.page_count):
            # Get the page
            page = pdf_document.load_page(i)
            logger.info("page found")
            # Convert the page to an image (pixmap)
            pix = page.get_pixmap()
            logger.info("pixmap done")
            img_bytes = pix.tobytes("ppm")  # Convert pixmap to raw bytes (PPM format)
            img = Image.open(io.BytesIO(img_bytes))  # Open as a PIL Image from byte stream
            images.append(img)
            # Save the image to the desired format
            #image_output_path = f"{output_path}_page_{i + 1}.{target_format}"
            #pix.save(image_output_path)
            
            #logger.info(f"Saved {image_output_path}")
        # Calculate the total width and height of the combined image
        total_width = max(img.width for img in images)
        total_height = sum(img.height for img in images)

        # Create a new blank image with the calculated size
        combined_img = Image.new('RGB', (total_width, total_height))

        # Paste each image onto the new image
        y_offset = 0
        for img in images:
            combined_img.paste(img, (0, y_offset))
            y_offset += img.height

        # Save the combined image
        combined_img.save(output_path)
        return True
    except Exception as e:
        logger.error(f"PDF to image conversion error: {str(e)}")
        return False
        
def convert_doc_to_pdf(input_path, output_path, source_format):
    try:
        #libreoffice_path = r"C:\Program Files (x86)\LibreOffice\program\soffice.exe"
        output_dir = os.path.dirname(output_path)
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        generated_pdf = os.path.join(output_dir, f"{base_name}.pdf")
        try:
            subprocess.run([
                config.LIBREOFFICE_PATH,
                '--headless',
                '--convert-to', 'pdf',
                '--outdir', output_dir,
                input_path
            ], check=True)
            if os.path.exists(generated_pdf):
                shutil.move(generated_pdf, output_path)
            logger.info(f"✅ Converted to PDF: {output_path}")
            logger.info(f"PDF conversion successful! Saved at {output_path}")
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Error: {e}")
        return True
        #else:
         #   raise Exception("Conversion failed during the process.")
    
    except Exception as e:
        logger.error(f"Error during conversion to PDF: {e}")
        return False

def convert_from_pdf(input_path, output_path, dest_format):
    try:
     #   libreoffice_path = r"C:\Program Files (x86)\LibreOffice\program\soffice.exe"
        output_dir = os.path.dirname(output_path)
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        generated_doc = os.path.join(output_dir, f"{base_name}.{dest_format}")
        try:
            subprocess.run([
                config.LIBREOFFICE_PATH,
                '--headless',
                '--convert-to', dest_format,
                '--outdir', output_dir,
                input_path
            ], check=True)

            logger.info(f"Geenerated doc at {generated_doc}")
            if os.path.exists(generated_doc):
                shutil.move(generated_doc, output_path)
            logger.info(f"✅ Converted to PDF: {output_path}")
            logger.info(f"PDF conversion successful! Saved at {output_path}")
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Error: {e}")
        return True
        #else:
         #   raise Exception("Conversion failed during the process.")
    
    except Exception as e:
        logger.error(f"Error during conversion to PDF: {e}")
        return False

def convert_docx_to_txt(input_path,output_path):
    try:
        with open(input_path, 'rb') as infile:
            with open(output_path, 'w', encoding='utf-8') as outfile:
                doc = docx2txt.process(infile)
                print(doc)
                outfile.write(doc)
        logger.info(f"docx converted to TXT and saved at {output_path}")
        return True
    except Exception as e:
        logger.error(f"Error converting PDF: {e}")
        return False

def convert_pdf_to_txt(input_path, output_path):
    """Convert PDF to TXT."""
    #pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'  # Update this path
    pytesseract.pytesseract.tesseract_cmd = config.TESSERACT_PATH
    try:
        doc = fitz.open(input_path)
        full_text = ""

        # Iterate through each page and extract text
        for page_num in range(doc.page_count):
            page = doc.load_page(page_num)
            text = page.get_text("text")
            full_text += text
            if not text.strip():
                logger.info(f"Performing OCR on page {page_num + 1}...")
                images = page.get_images(full=True)
                for img_index, img in enumerate(images):
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    image = Image.open(io.BytesIO(image_bytes))
                    
                    # Perform OCR on the image
                    ocr_text = pytesseract.image_to_string(image)
                    full_text += ocr_text


        # Close the PDF
        doc.close()

        with open(output_path, 'w', encoding='utf-8') as outfile:
            outfile.write(full_text)
            logger.info(f"PDF converted to TXT and saved at {output_path}")
            return True
    except Exception as e:
        logger.error(f"Error converting PDF: {e}")
        return False

def convert_document(input_path, output_path, source_format, target_format, options=None):
    """Convert document files"""
    try:
        # Example PDF to DOCX conversion (would use libraries like python-docx in production)
        if source_format == 'pdf' and target_format == 'docx':
            # In a real app, use python-docx or LibreOffice CLI
            conversion_success = convert_pdf_to_docx(input_path, output_path)
            if conversion_success:
                logger.info(f"Conversion successful! The file is saved at {output_path}")
            else:
                logger.info("Conversion failed.")
            return True
            
        # PDF to image conversion
        elif source_format == 'pdf' and target_format in ['png', 'jpg']:
            # In a real app, use pdf2image
            conversion_success = convert_pdf_to_image(input_path, output_path, target_format)
            if conversion_success:
                logger.info(f"Conversion successful! Images are saved at {output_path}_page_X.{target_format}")
                return True
            else:
                logger.error("Conversion failed.")
                return False
            
        # DOCX/TXT/RTF to PDF conversion
        elif source_format in ['xlsx','xls','docx', 'txt', 'rtf', 'odt'] and target_format == 'pdf':
            # In a real app, use python-docx-to-pdf or similar
            conversion_success = convert_doc_to_pdf(input_path, output_path, source_format)
            if conversion_success:
                logger.info(f"Conversion successful! The PDF is saved at {output_path}")
                return True
            else:
                logger.error("Conversion failed.")
                return False
        # TXT conversions (simple)
        elif source_format == 'pdf' and target_format in ['rtf', 'txt']:
            conversion_success = convert_pdf_to_txt(input_path, output_path)
            if conversion_success:
                logger.info(f"Conversion successful! The TXT is saved at {output_path}")
                return True
            else:
                logger.error("Conversion failed.")
                return False
            shutil.copy(input_path, output_path)  # Dummy conversion
            return True
        elif source_format == 'pdf' and target_format in ['xlsx','xls']:
            conversion_success = convert_from_pdf(input_path,output_path,target_format)
            if conversion_success:
                logger.info(f"Conversion successful! The File is saved at {output_path}")
                return True
            else:
                logger.error("Conversion failed.")
                return False
            
        # Default fallback
        else:
            shutil.copy(input_path, output_path)  # Dummy conversion
            return True
            
    except Exception as e:
        logger.error(f"Document conversion error: {str(e)}")
        return False

def convert_image(input_path, output_path, source_format, target_format, options=None):
    """Convert image files"""
    try:
        format_map = {
                        'jpg': 'JPEG',
                        'jpeg': 'JPEG',
                        'png': 'PNG',
                        'webp': 'WEBP',
                        'bmp': 'BMP',
                        'tiff': 'TIFF'
                    }
        # Use PIL for image conversions
        if source_format in ['jpg', 'jpeg', 'png', 'webp', 'gif'] and target_format in ['jpg', 'jpeg', 'png', 'webp', 'gif']:
            try:
                image = Image.open(input_path)
                
                # Apply quality settings if specified
                save_options = {}
                if options and 'quality' in options:
                    quality_map = {
                        'high': 95,
                        'medium': 80,
                        'low': 60
                    }
                    quality = quality_map.get(options['quality'], 85)
                    save_options['quality'] = quality
                
                # Handle specific format settings
                if target_format in ['jpg', 'jpeg','gif']:
                    # Convert to RGB if needed (for PNG with transparency)
                    if image.mode in ('RGBA', 'LA') or (image.mode == 'P' and 'transparency' in image.info):
                        # Convert to RGBA for consistency
                        image = image.convert('RGBA')
                        # Create white background
                        background = Image.new('RGBA', image.size, (255, 255, 255, 255))
                        # Composite with the background
                        image = Image.alpha_composite(background, image)
                        # Convert to RGB (JPEG requirement)
                        image = image.convert('RGB')
                    elif image.mode != 'RGB':
                        image = image.convert('RGB')
                pil_format = format_map.get(target_format.lower(), target_format.upper())

                # Save with the target format
                image.save(output_path, format=pil_format, **save_options)
                return True
                
            except Exception as e:
                logger.error(f"Image conversion error: {str(e)}")
                return False
                
        # Image to PDF conversion
        elif source_format in ['jpg', 'jpeg', 'png', 'gif'] and target_format == 'pdf':
            try:
                logger.info("Converting image ot pdf")
                image = Image.open(input_path)
                if image.mode in ('RGBA', 'LA') or (image.mode == 'P' and 'transparency' in image.info):
                        # Convert to RGBA for consistency
                        image = image.convert('RGBA')
                        # Create white background
                        background = Image.new('RGBA', image.size, (255, 255, 255, 255))
                        # Composite with the background
                        image = Image.alpha_composite(background, image)
                        # Convert to RGB (JPEG requirement)
                        image = image.convert('RGB')
                elif image.mode != 'RGB':
                    image = image.convert('RGB')
                image.save(output_path, 'PDF')
                logger.info(f"Converted image to {output_path}")
                return True
            except Exception as e:
                logger.error(f"Image to PDF conversion error: {str(e)}")
                return False
                
        # SVG conversions would require additional libraries
        elif source_format == 'svg' or target_format == 'svg':
            # In a real app, use cairosvg or other SVG libraries
            shutil.copy(input_path, output_path)  # Dummy conversion
            return True
            
        # Default fallback
        else:
            shutil.copy(input_path, output_path)  # Dummy conversion
            return True
            
    except Exception as e:
        logger.error(f"Image conversion error: {str(e)}")
        return False

def convert_video(input_path, output_path, source_format, target_format, options=None):
    try:
        # Check if the source and target formats are supported for conversion
        if source_format in ['mp4', 'mov', 'avi', 'webm', 'mkv'] and target_format in ['mp4', 'mov', 'avi', 'webm', 'mkv', 'gif']:
            # Determine video quality
            quality = 'high' if options and options.get('quality') == 'high' else 'medium'
            crf = '18' if quality == 'high' else '23'  # Lower CRF = higher quality

            # FFmpeg command to convert video
            cmd = [
                config.FFMPEG_PATH, '-i', input_path,        # Input file
                '-c:v', 'libx264',                # Video codec (H.264)
                '-crf', crf,                      # CRF (Quality)
                '-c:a', 'aac',                    # Audio codec (AAC)
                output_path                        # Output file
            ]

            # Run the command and check for errors
            subprocess.run(cmd, check=True)

            logger.info(f"Video conversion successful! Saved at {output_path}")
            return True

        else:
            raise ValueError(f"Unsupported source or target format: {source_format} to {target_format}")

    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg conversion failed: {e}")
        return False
    except Exception as e:
        logger.error(f"Error during video conversion: {e}")
        return False

def convert_audio(input_path, output_path, source_format, target_format, options=None):
    """Convert audio files"""
    try:
        # Supported formats for conversion
        supported_formats = ['mp3', 'wav', 'ogg', 'flac', 'aac']
        
        # Check if source and target formats are supported
        if source_format in supported_formats and target_format in supported_formats:
            # Determine the quality (bitrate) based on options
            quality = 'high' if options and options.get('quality') == 'high' else 'medium'
            bitrate = '320k' if quality == 'high' else '192k'
            
            # Example ffmpeg command for audio conversion
            cmd = [
                config.FFMPEG_PATH, '-i', input_path,  # Input file
                '-b:a', bitrate,            # Set bitrate for audio quality
                '-ac', '2',                 # Convert to stereo (2 channels) if not stereo
                output_path                 # Output file
            ]
            
            # Run the command to convert the audio
            subprocess.run(cmd, check=True)
            
            logger.info(f"Audio conversion successful! Saved at {output_path}")
            return True
        
        else:
            # If source or target format is unsupported, just copy the file as is
            shutil.copy(input_path, output_path)
            logger.info(f"Unsupported format, file copied as-is: {output_path}")
            return True

    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg conversion failed: {e}")
        return False
    except Exception as e:
        logger.error(f"Audio conversion error: {str(e)}")
        return False
    
def convert_archive(input_path, output_path, source_format, target_format, options=None):
    """Convert archive files"""
    try:
        # If the target format is a zip archive
        if target_format == 'zip':
            if source_format == 'zip':
                # If source is already a zip, just copy the file (dummy conversion for this demo)
                shutil.copy(input_path, output_path)
                return True

            # Extract from the source archive and create a zip file
            with open(input_path, 'rb') as source_file:
                # Create a zip file
                with zipfile.ZipFile(output_path, 'w') as zipf:
                    if source_format == 'tar':
                        # Extract from tar and add to zip
                        with tarfile.open(input_path, 'r') as tarf:
                            for member in tarf.getmembers():
                                if member.isreg():  # Only process regular files
                                    content = tarf.extractfile(member).read()
                                    zipf.writestr(member.name, content)
                    elif source_format == '7z':
                        # Extract from 7z and add to zip
                        with py7zr.SevenZipFile(input_path, mode='r') as archive:
                            extracted_files = archive.read()  # This will return a dictionary of file
                            # Iterate over all extracted files
                            for file, extracted_file in extracted_files.items():
                                if file in ['.', '..'] or file.endswith('/'):
                                    continue
                                extracted_file_content=extracted_file
                                if isinstance(extracted_file_content, io.BytesIO):
                                    extracted_file_content = extracted_file_content.read()
                                # Write the extracted content to the zip file
                                zipf.writestr(file, extracted_file_content)
                    elif source_format == 'rar':
                        # Extract from rar and add to zip
                        logger.info("File Format=",input_path)
                        with rarfile.RarFile(input_path) as rar:
                            for file in rar.namelist():
                                content = rar.read(file)
                                zipf.writestr(file, content)

            logger.info(f"Conversion successful: {input_path} to {output_path}")
            return True

        # If the target format is tar archive
        elif target_format == 'tar':
            with tarfile.open(output_path, 'a') as tarf:
                if source_format == 'zip':
                    # Extract from zip and add to tar
                    with zipfile.ZipFile(input_path, 'r') as zipf:
                        for file in zipf.namelist():
                            extracted_file = zipf.open(file)
                            tarinfo = tarfile.TarInfo(name=os.path.basename(file))
                            tarinfo.size = len(extracted_file.read())  # Set the file size
                
                            # Reset the file pointer of extracted_file after checking the size
                            extracted_file.seek(0)
                            
                            # Add the file content to the TAR file
                            tarf.addfile(tarinfo, extracted_file)
                elif source_format == 'tar':
                    # If source is already tar, just copy it (dummy conversion)
                    shutil.copy(input_path, output_path)
                elif source_format == '7z':
                    # Extract from 7z and add to tar
                    with py7zr.SevenZipFile(input_path, mode='r') as archive:
                        for file in archive.getnames():
                            tarf.add(file, arcname=os.path.basename(file))
                elif source_format == 'rar':
                    # Extract from rar and add to tar
                    with rarfile.RarFile(input_path) as rar:
                        for file in rar.namelist():
                            tarf.add(file, arcname=os.path.basename(file))

            logger.info(f"Conversion successful: {input_path} to {output_path}")
            return True
        elif target_format == '7z':
            with py7zr.SevenZipFile(output_path, 'a') as archive:
                temp_dir = "temp_extract"
                os.makedirs(temp_dir, exist_ok=True)        
                if source_format == 'zip':
                    # Extract from zip and add to tar
                    with zipfile.ZipFile(input_path, 'r') as zipf:
                        # Extract all files from ZIP into the temporary directory
                        zipf.extractall(temp_dir)
                elif source_format == 'tar':
                    with tarfile.open(input_path, 'r') as tarf:
                        tarf.extractall(temp_dir)
                elif source_format == 'rar':
                    # Extract from rar and add to tar
                    with rarfile.RarFile(input_path) as rar:
                        rar.extract_all(temp_dir)
                archive.writeall(temp_dir, arcname='')
                for root, dirs, files in os.walk(temp_dir, topdown=False):
                    for name in files:
                        os.remove(os.path.join(root, name))
                    for name in dirs:
                        os.rmdir(os.path.join(root, name))
                os.rmdir(temp_dir)  # Remove the base temp
            logger.info(f"Conversion successful: {input_path} to {output_path}")
            return True

        else:
            # For unsupported formats, just copy the file (dummy conversion)
            shutil.copy(input_path, output_path)
            logger.info(f"Unsupported format, file copied as-is: {output_path}")
            return True

    except Exception as e:
        logger.error(f"Archive conversion error: {str(e)}")
        return False

def perform_conversion(input_path, output_path, source_format, target_format, options=None):
    """Route the conversion to the appropriate handler based on file type"""
    source_category = FILE_CATEGORIES.get(source_format, 'Unknown')
    logger.info(f"Convertions source category={source_category} for {source_format} to {target_format}")
    # Call the appropriate conversion function based on file category
    if source_category == 'Documents':
        return convert_document(input_path, output_path, source_format, target_format, options)
    elif source_category == 'Images':
        return convert_image(input_path, output_path, source_format, target_format, options)
    elif source_category == 'Video':
        return convert_video(input_path, output_path, source_format, target_format, options)
    elif source_category == 'Audio':
        return convert_audio(input_path, output_path, source_format, target_format, options)
    elif source_category == 'Archive':
        return convert_archive(input_path, output_path, source_format, target_format, options)
    else:
        logger.error(f"Unsupported file category: {source_category}")
        return False

def merge_pdfs(output_path,temp_merge_path, *file_paths):
    """
    Merges multiple files into a single PDF, converting them if necessary.

    Args:
        output_path (str): The path to save the merged PDF.
        *file_paths (str): Variable number of paths to the files to merge.
    """
    merger = PdfMerger()
    logger.info(f"output path={output_path}")
    for file_path in file_paths:
        if not os.path.exists(file_path):
            logger.info("Warning: File not found: {file_path}")
            continue

        if file_path.lower().endswith('.pdf'):
            merger.append(file_path)
        else:
            # Generate output filename
            output_filename = f"{uuid.uuid4().hex}.pdf"
            temp_output_path = os.path.join(temp_merge_path, output_filename)
            source_format = file_path.split('.')[-1].lower()
            logger.info(f"Converting {file_path} to {temp_output_path}")
            conversion_success = perform_conversion(file_path,temp_output_path,source_format,'pdf')
            if conversion_success:
                if os.path.getsize(temp_output_path) > 0:  # Ensure the file isn't empty
                    try:
                        # Attempt to read the PDF to check if it's valid
                        with open(temp_output_path, 'rb') as f:
                            PdfReader(f)  # This will raise an error if the file is not a valid PDF
                        logger.info(f"Merged to {temp_output_path}")
                        merger.append(temp_output_path)
                    except Exception as e:
                        logger.error(f"Invalid PDF after conversion: {temp_output_path}. Error: {e}")
                        continue
                else:
                    logger.error(f"Generated PDF is empty: {temp_output_path}")
                    continue
            else:
                logger.error(f"Failed to convert {file_path} to PDF")
                continue
             #   os.remove(temp_output_path)
    try:
        merger.write(output_path)
        merger.close()
        logger.info(f"Files merged successfully into {output_path}")
    except Exception as e:
        logger.error(f"Error merging files: {e}")
    finally:
        merger.close()

@app.route('/api/merge', methods=['POST'])
def merge_files():
    if 'files' not in request.files:
        return jsonify({"error": "No files provided."}), 400

    files = request.files.getlist('files')
    merge_type = request.form.get('merge_type', 'pdf')
    password = request.form.get('password',None)
    # Save uploaded files
    uploaded_file_paths = []
    upload_merge_path = os.path.join(UPLOAD_FOLDER,"temp-merge")
    temp_merge_path = os.path.join(CONVERTED_FOLDER,"temp-merge")
    os.makedirs(upload_merge_path, exist_ok=True)
    os.makedirs(temp_merge_path, exist_ok=True)
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(upload_merge_path, filename)
            logger.info(file_path)
            file.save(file_path)
            uploaded_file_paths.append(file_path)
        else:
            return jsonify({"error": f"File type not allowed: {file.filename}"}), 400
    # Merge the files
    try:
        # Create a temporary output file path for the merged result
        merged_output_filename = f"{uuid.uuid4().hex}.{merge_type}"
        merged_output_path = os.path.join(CONVERTED_FOLDER, merged_output_filename)
        if merge_type == 'pdf':
            merge_pdfs(merged_output_path,temp_merge_path, *uploaded_file_paths)
            # Apply password protection if requested
            if password:
                encrypted_filename = f"{uuid.uuid4().hex}.{merge_type}"
                encrypted_path = os.path.join(CONVERTED_FOLDER, encrypted_filename)
                
                if encrypt_file(merged_output_path, encrypted_path, password):
                    # Remove the unencrypted file
                    os.remove(merged_output_path)
                    merged_output_filename = encrypted_filename
                    merged_output_path = encrypted_path
                else:
                    return jsonify({'error': 'Encryption failed'}), 500
        elif merge_type in ['zip','tar','7z','rar']:
            merge_files_to_archive(merged_output_path, merge_type,password, *uploaded_file_paths)
        shutil.rmtree(upload_merge_path)
        shutil.rmtree(temp_merge_path)
        
        # Get file size
        file_size = os.path.getsize(merged_output_path)
        
        return jsonify({
            'success': True,
            'merge_id': merged_output_filename,
            'file_size': file_size,
            'target_format': 'pdf'
        }), 200
        
    except Exception as e:
        logger.error(f"Error during merge: {e}")
        return jsonify({"error": "An error occurred while merging the files."}), 500

# API Routes
@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file upload and return compatible formats"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    try:
        # Generate a unique filename
        original_filename = secure_filename(file.filename)
        file_extension = get_file_extension(original_filename)
        unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
        file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
        
        # Save the file
        file.save(file_path)
        
        # Get compatible formats
        compatible_formats = FORMAT_COMPATIBILITY.get(file_extension.lower(), [])
        
        # Get file size and metadata
        file_size = os.path.getsize(file_path)
        file_category = FILE_CATEGORIES.get(file_extension.lower(), 'Unknown')
        
        allowed_encrypt_extensions = [format for format in compatible_formats if format in ALLOWED_ENCRYPT_EXTENTIONS]
        compressed_quality={}
        for format in compatible_formats:
            if format in ALLOWED_COMPRESS_EXTENTIONS:
                compressed_quality[format]=COMPRESSED_QUALITY[FILE_CATEGORIES.get(format)]
        # Return response
        return jsonify({
            'success': True,
            'file_id': unique_filename,
            'original_name': original_filename,
            'file_extension': file_extension,
            'file_size': file_size,
            'file_category': file_category,
            'compatible_formats': compatible_formats,
            'allowed_encrypt_extensions': allowed_encrypt_extensions,
            'compressed_quality':compressed_quality
        }), 200
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        return jsonify({'error': 'File upload failed'}), 500

@app.route('/api/convert', methods=['POST'])
def convert_file():
    """Handle file conversion"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['file_id', 'target_format']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        file_id = data['file_id']
        target_format = data['target_format'].lower()
        password = data.get('password', None)
        compress_rate = data.get('compress_rate',None)
        options = data.get('options', {})
        
        # Validate file exists
        input_path = os.path.join(UPLOAD_FOLDER, file_id)
        if not os.path.exists(input_path):
            return jsonify({'error': 'File not found'}), 404
        
        # Get source format
        source_format = file_id.split('.')[-1].lower()
        
        # Check if conversion is supported
        if not is_conversion_supported(source_format, target_format):
            return jsonify({'error': 'Conversion not supported'}), 400
        
        # Generate output filename
        output_filename = f"{uuid.uuid4().hex}.{target_format}"
        output_path = os.path.join(CONVERTED_FOLDER, output_filename)
        
        # Log conversion start
        logger.info(f"Starting conversion: {source_format} to {target_format}")
        
        # Simulate processing time (remove in production)
        time.sleep(1)
        
        if source_format != target_format:
            # Perform the conversion
            conversion_success = perform_conversion(
                input_path, output_path, source_format, target_format, options
            )
        
            if not conversion_success:
                return jsonify({'error': 'Conversion failed'}), 500
        else:
            shutil.move(input_path, output_path)
        if compress_rate and compress_rate != 'None':
            if os.path.exists(input_path):
                os.remove(input_path)
            input_path=output_path
            output_filename=f"{uuid.uuid4().hex}.{target_format}"
            output_path = os.path.join(CONVERTED_FOLDER,output_filename)
            compress_file(input_file=input_path,output_file=output_path,quality_level=compress_rate)
            if os.path.exists(input_path):
                os.remove(input_path)   

        # Apply password protection if requested
        if password:
            encrypted_filename = f"{uuid.uuid4().hex}.{target_format}"
            encrypted_path = os.path.join(CONVERTED_FOLDER, encrypted_filename)
            
            if encrypt_file(output_path, encrypted_path, password):
                # Remove the unencrypted file
                os.remove(output_path)
                output_filename = encrypted_filename
                output_path = encrypted_path
            else:
                return jsonify({'error': 'Encryption failed'}), 500
        
        # Get file size
        file_size = os.path.getsize(output_path)
        
        # Return success response
        return jsonify({
            'success': True,
            'conversion_id': output_filename,
            'file_size': file_size,
            'target_format': target_format,
            'is_encrypted': password is not None
        }), 200
        
    except Exception as e:
        logger.error(f"Conversion error: {str(e)}")
        return jsonify({'error': 'Conversion process failed'}), 500

@app.route('/api/download/<conversion_id>', methods=['GET'])
def download_file(conversion_id):
    """Download a converted file"""
    try:
        file_path = os.path.join(CONVERTED_FOLDER, conversion_id)
        
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        # Get original filename from request query params or use conversion_id
        original_name = request.args.get('name', conversion_id)
        
        # Handle file download
        return send_file(
            file_path,
            download_name=original_name,
            as_attachment=True
        )
        
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        return jsonify({'error': 'Download failed'}), 500

@app.route('/api/formats', methods=['GET'])
def get_formats():
    """Get all supported formats and their compatibility"""
    return jsonify({
        'format_compatibility': FORMAT_COMPATIBILITY,
        'file_categories': FILE_CATEGORIES
    }), 200

def get_build_folder():
    if getattr(sys, 'frozen', False):
        # If running as a PyInstaller executable, use the temp folder path
        return os.path.join(sys._MEIPASS, 'build')
    else:
        # If running as a script, the build folder is at the root
        return os.path.join(app.root_path, 'build')
    
@app.route('/')
def serve_react_app():
    # This will serve index.html for the root URL
    return send_from_directory(get_build_folder(), 'index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    dirpath=os.path.join(get_build_folder(), 'static')
    print(f"sending file from {dirpath} {path}")
    return send_from_directory(os.path.join(get_build_folder(), 'static'), path)

# Error handlers
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Server error occurred'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)