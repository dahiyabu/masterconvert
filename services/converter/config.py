import shutil
import sys
import os
import platform
from converter.init import get_lib_path
import logging as logger

# Detect the platform (Windows, macOS, Linux)
SYSTEM_PLATFORM = platform.system().lower()
CURR_DIR=os.path.join(os.path.dirname(__file__))

BASE_PATH = get_lib_path(CURR_DIR)

# Set paths for external binaries based on platform
if SYSTEM_PLATFORM == 'windows':
    LIBREOFFICE_PATH = os.path.join(BASE_PATH, 'dependencies', 'libreoffice','program','soffice.exe')
    TESSERACT_PATH = os.path.join(BASE_PATH, 'dependencies', 'tesseract-ocr','tesseract.exe')
    FFMPEG_PATH = os.path.join(BASE_PATH, 'dependencies', 'ffmpeg.exe')
    TESSDATA_DIR = os.path.join(BASE_PATH,'dependencies','tesseract-ocr','tessdata')
    GS_PATH = os.path.join(BASE_PATH,'dependencies','ghostscript','bin','gswin64c.exe')
    SEVENZ_PATH = os.path.join(BASE_PATH,'dependencies','7zip','7z.exe')
    RAR_PATH = os.path.join(BASE_PATH,'dependencies','rar','rar.exe')
    UNRAR_PATH = os.path.join(BASE_PATH,'dependencies','rar','UnRAR.exe')
elif SYSTEM_PLATFORM == 'darwin':  # macOS
    LIBREOFFICE_PATH = os.path.join(BASE_PATH, 'dependencies', 'LibreOffice.app', 'Contents', 'MacOS', 'soffice')
    TESSERACT_PATH = os.path.join(BASE_PATH, 'dependencies', 'tesseract')
    FFMPEG_PATH = os.path.join(BASE_PATH, 'dependencies', 'ffmpeg')
    TESSDATA_DIR = os.path.join(BASE_PATH,'dependencies','tesseract','tessdata')
    GS_PATH = os.path.join(BASE_PATH,'dependencies','gs')
    SEVENZ_PATH = os.path.join(BASE_PATH,'dependencies','7z')
    RAR_PATH = os.path.join(BASE_PATH, 'dependencies', 'rar', 'rar')
    UNRAR_PATH = os.path.join(BASE_PATH, 'dependencies', 'rar', 'unrar')
elif SYSTEM_PLATFORM == 'linux':
    LIBREOFFICE_PATH = shutil.which('libreoffice') or os.path.join(BASE_PATH, 'dependencies', 'libreoffice')
    TESSERACT_PATH = shutil.which('tesseract') or os.path.join(BASE_PATH, 'dependencies', 'tesseract')
    FFMPEG_PATH = shutil.which('ffmpeg') or os.path.join(BASE_PATH, 'dependencies', 'ffmpeg')
    TESSDATA_DIR = os.path.join(BASE_PATH,'dependencies','tesseract','tessdata')
    GS_PATH = shutil.which('gs') or os.path.join(BASE_PATH,'dependencies','gs')
    SEVENZ_PATH = shutil.which('7z') or os.path.join(BASE_PATH,'dependencies','7z')
    RAR_PATH = shutil.which('rar') or os.path.join(BASE_PATH, 'dependencies', 'rar', 'rar')
    UNRAR_PATH = shutil.which('unrar') or os.path.join(BASE_PATH, 'dependencies', 'rar', 'unrar')
else:
    raise Exception(f"Unsupported platform: {SYSTEM_PLATFORM}")

# Set the TESSDATA_PREFIX environment variable to point to tessdata directory
if not shutil.which('tesseract'):
    os.environ['TESSDATA_PREFIX'] = TESSDATA_DIR + os.sep

# Ensure dependencies exist
def check_dependencies():
    dependencies = {
        'LibreOffice': LIBREOFFICE_PATH,
        'Tesseract': TESSERACT_PATH,
        'FFmpeg': FFMPEG_PATH,
        'Ghostscript': GS_PATH,
        '7zip': SEVENZ_PATH,
        'RAR': RAR_PATH,
        'UnRAR': UNRAR_PATH,
    }
    for dep_name, dep_path in dependencies.items():
        if not dep_path or not os.path.exists(dep_path):
            logger.info(f"{dep_name} not found at {dep_path}")
        else:
            logger.info(f"{dep_name} found at {dep_path}")

check_dependencies()