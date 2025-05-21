import sys
import os
import platform

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
    LIBREOFFICE_PATH = os.path.join(BASE_PATH, 'dependencies', 'soffice_program','soffice.exe')
    TESSERACT_PATH = os.path.join(BASE_PATH, 'dependencies', 'tesseract.exe')
    FFMPEG_PATH = os.path.join(BASE_PATH, 'dependencies', 'ffmpeg.exe')
elif SYSTEM_PLATFORM == 'darwin':  # macOS
    LIBREOFFICE_PATH = os.path.join(BASE_PATH, 'dependencies', 'LibreOffice.app', 'Contents', 'MacOS', 'soffice')
    TESSERACT_PATH = os.path.join(BASE_PATH, 'dependencies', 'tesseract')
    FFMPEG_PATH = os.path.join(BASE_PATH, 'dependencies', 'ffmpeg')
elif SYSTEM_PLATFORM == 'linux':
    LIBREOFFICE_PATH = os.path.join(BASE_PATH, 'dependencies', 'libreoffice')
    TESSERACT_PATH = os.path.join(BASE_PATH, 'dependencies', 'tesseract')
    FFMPEG_PATH = os.path.join(BASE_PATH, 'dependencies', 'ffmpeg')
else:
    raise Exception(f"Unsupported platform: {SYSTEM_PLATFORM}")

# Ensure dependencies exist
def check_dependencies():
    dependencies = {
        'LibreOffice': LIBREOFFICE_PATH,
        'Tesseract': TESSERACT_PATH,
        'FFmpeg': FFMPEG_PATH
    }
    for dep_name, dep_path in dependencies.items():
        if not os.path.exists(dep_path):
            print(f"{dep_name} not found at {dep_path}")
        else:
            print(f"{dep_name} found at {dep_path}")

check_dependencies()