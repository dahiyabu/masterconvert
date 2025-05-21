import sys
import os
import platform
from logger import logger
# Detect the platform (Windows, macOS, Linux)
SYSTEM_PLATFORM = platform.system().lower()

# Base path for extracting bundled files if running from a packaged EXE
if getattr(sys, 'frozen', False):
    # If the app is packaged, dependencies will be extracted to a temporary folder
    BASE_PATH = sys._MEIPASS
else:
    # If running from source code, use the current working directory
    BASE_PATH = os.getcwd()


# Set paths for external binaries based on platform
if SYSTEM_PLATFORM == 'windows':
    LIBREOFFICE_PATH = os.path.join(BASE_PATH, 'dependencies', 'libreoffice','program','soffice.exe')
    TESSERACT_PATH = os.path.join(BASE_PATH, 'dependencies', 'tesseract-ocr','tesseract.exe')
    FFMPEG_PATH = os.path.join(BASE_PATH, 'dependencies', 'ffmpeg.exe')
    TESSDATA_DIR = os.path.join(BASE_PATH,'dependencies','tesseract-ocr')
    GS_PATH = os.path.join(BASE_PATH,'dependencies','gswin64c.exe')
    SEVENZ_PATH = os.path.join(BASE_PATH,'dependencies','7z.exe')
elif SYSTEM_PLATFORM == 'darwin':  # macOS
    LIBREOFFICE_PATH = os.path.join(BASE_PATH, 'dependencies', 'LibreOffice.app', 'Contents', 'MacOS', 'soffice')
    TESSERACT_PATH = os.path.join(BASE_PATH, 'dependencies', 'tesseract')
    FFMPEG_PATH = os.path.join(BASE_PATH, 'dependencies', 'ffmpeg')
    TESSDATA_DIR = os.path.join(BASE_PATH,'dependencies')
    GS_PATH = os.path.join(BASE_PATH,'dependencies','gs')
    SEVENZ_PATH = os.path.join(BASE_PATH,'dependencies','7z')
elif SYSTEM_PLATFORM == 'linux':
    LIBREOFFICE_PATH = os.path.join(BASE_PATH, 'dependencies', 'libreoffice')
    TESSERACT_PATH = os.path.join(BASE_PATH, 'dependencies', 'tesseract')
    FFMPEG_PATH = os.path.join(BASE_PATH, 'dependencies', 'ffmpeg')
    TESSDATA_DIR = os.path.join(BASE_PATH,'dependencies')
    GS_PATH = os.path.join(BASE_PATH,'dependencies','gs')
    SEVENZ_PATH = os.path.join(BASE_PATH,'dependencies','7z')
else:
    raise Exception(f"Unsupported platform: {SYSTEM_PLATFORM}")

# Set the TESSDATA_PREFIX environment variable to point to tessdata directory
os.environ['TESSDATA_PREFIX'] = TESSDATA_DIR

# Ensure dependencies exist
def check_dependencies():
    dependencies = {
        'LibreOffice': LIBREOFFICE_PATH,
        'Tesseract': TESSERACT_PATH,
        'FFmpeg': FFMPEG_PATH
    }
    for dep_name, dep_path in dependencies.items():
        if not os.path.exists(dep_path):
            logger.info(f"{dep_name} not found at {dep_path}")
        else:
            logger.info(f"{dep_name} found at {dep_path}")

check_dependencies()