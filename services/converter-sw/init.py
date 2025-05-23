import logging
import os
import sys
import shutil

def get_base_folder():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    else:
        return os.path.dirname(os.path.abspath(sys.argv[0]))
def get_upload_folder():
    return os.path.join(get_base_folder(), 'uploads')
def get_converted_folder():
    return os.path.join(get_base_folder(), 'converted')

def cleanup_files():
    temp_path=get_upload_folder()
    if os.path.exists(temp_path):
        try:
            shutil.rmtree(temp_path)
            logger.info(f"Deleted upload folder and all contents: {temp_path}")
        except Exception as e:
            logger.error(f"Failed to delete upload folder: {e}")
    temp_path=get_converted_folder()
    if os.path.exists(temp_path):
        try:
            shutil.rmtree(temp_path)
            logger.info(f"Deleted upload folder and all contents: {temp_path}")
        except Exception as e:
            logger.error(f"Failed to delete upload folder: {e}")

# Initialize Flask app
# Configure logging
for handler in logging.root.handlers[:]:
    logging.root.removeHandler(handler)
logging.basicConfig(level=logging.INFO, filename=os.path.join(get_base_folder(),'app.log'), filemode='a', format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
