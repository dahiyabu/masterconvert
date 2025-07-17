import logging
import os
import sys
import shutil
import  converter.config
from logging.handlers import TimedRotatingFileHandler

CURR_DIR=os.path.join(os.path.dirname(__file__))
base_folder = None
def get_lib_path(path=CURR_DIR):
    # Base path for extracting bundled files if running from a packaged EXE
    if getattr(sys, 'frozen', False):
        # If the app is packaged, dependencies will be extracted to a temporary folder
        return sys._MEIPASS
    else:
        # If running from source code, use the current working directory
        return path

def get_base_folder():
    global base_folder
    if base_folder is None:
        if getattr(sys, 'frozen', False):
            base_folder = os.path.dirname(sys.executable)
        else:
            base_folder = os.path.dirname(os.path.abspath(sys.argv[0]))
    return base_folder

def set_base_folder(path=None):
    global base_folder
    base_folder = path or get_base_folder()   
    
def get_upload_folder():
    return os.path.join(get_base_folder(), 'uploads')

def get_converted_folder():
    return os.path.join(get_base_folder(), 'converted')

def cleanup_files(parent_folder=get_base_folder(),log_path=None,delete_log=True):
    if delete_log and log_path is None and hasattr(converter.config, 'logpath'):
        log_path = converter.config.logpath
    temp_path=os.path.join(parent_folder,'uploads')
    if os.path.exists(temp_path):
        try:
            shutil.rmtree(temp_path)
            logging.info(f"Deleted upload folder and all contents: {temp_path}")
        except Exception as e:
            logging.error(f"Failed to delete upload folder: {e}")
    temp_path=os.path.join(parent_folder,'converted')
    if os.path.exists(temp_path):
        try:
            shutil.rmtree(temp_path)
            logging.info(f"Deleted converted folder and all contents: {temp_path}")
        except Exception as e:
            logging.error(f"Failed to delete converted folder: {e}")
    if delete_log and log_path and os.path.exists(log_path):
        for handler in logging.root.handlers[:]:
            handler.close()
            logging.root.removeHandler(handler)
            try:
                os.remove(log_path)
                print(f"Deleted log file: {log_path}")
            except Exception as e:
                print(f"Failed to delete log file: {e}")
    READY_FILE = os.path.join(parent_folder,"app_ready.tmp")
    if os.path.exists(READY_FILE):
        os.remove(READY_FILE)

# Configure logging
def create_timed_rotating_log(path=None):
    for handler in logging.root.handlers[:]:
        logging.root.removeHandler(handler)
    if not path and hasattr(converter.config,'logpath'):
        path=converter.config.logpath
    logger = logging.getLogger()
    handler = TimedRotatingFileHandler(path,
                                when="d",
                                    interval=1,
                                    backupCount=5)#backup count is to delete how many log file
    handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(process)d- %(levelname)s - %(message)s'))
    logger.setLevel(logging.DEBUG)
    logger.addHandler(handler)
    logger.info("Logger Created")
    return logger