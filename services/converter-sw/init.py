import logging
import os
import sys
import shutil

def get_lib_path():
    # Base path for extracting bundled files if running from a packaged EXE
    if getattr(sys, 'frozen', False):
        # If the app is packaged, dependencies will be extracted to a temporary folder
        return sys._MEIPASS
    else:
        # If running from source code, use the current working directory
        return os.getcwd()

def get_base_folder():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    else:
        return os.path.dirname(os.path.abspath(sys.argv[0]))
    
def get_upload_folder():
    return os.path.join(get_base_folder(), 'uploads')
def get_converted_folder():
    return os.path.join(get_base_folder(), 'converted')

def cleanup_files(parent_folder=get_base_folder(),del_log=False):
    temp_path=os.path.join(parent_folder,'uploads')
    if os.path.exists(temp_path):
        try:
            shutil.rmtree(temp_path)
            logger.info(f"Deleted upload folder and all contents: {temp_path}")
        except Exception as e:
            logger.error(f"Failed to delete upload folder: {e}")
    temp_path=os.path.join(parent_folder,'converted')
    if os.path.exists(temp_path):
        try:
            shutil.rmtree(temp_path)
            logger.info(f"Deleted converted folder and all contents: {temp_path}")
        except Exception as e:
            logger.error(f"Failed to delete converted folder: {e}")
    if del_log and os.path.exists('converter.log'):
        for handler in logging.root.handlers[:]:
            handler.close()
            logging.root.removeHandler(handler)
            try:
                os.remove('converter.log')
                print("Deleted log file: converter.log")
            except Exception as e:
                print(f"Failed to delete log file: {e}")
    READY_FILE = os.path.join(get_lib_path(),"app_ready.tmp")
    if os.path.exists(READY_FILE):
        os.remove(READY_FILE)

# Initialize Flask app
# Configure logging
for handler in logging.root.handlers[:]:
    logging.root.removeHandler(handler)
logging.basicConfig(level=logging.INFO, filename=os.path.join(get_base_folder(),'converter.log'), filemode='a', format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
