import subprocess
import shutil
import os
import signal
from init import logger,get_upload_folder,get_converted_folder
from fileConverter import app

def setup():
    # Create necessary folders
    os.makedirs(get_upload_folder(), exist_ok=True)
    os.makedirs(get_converted_folder(), exist_ok=True)

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

try:
    # Optional: clean stale files before running
    cleanup_files()

    # Start the Flask app
    proc = subprocess.Popen(["python", "fileConverter.py"])
    print ("Close by Closing the window")
    # Wait for the process (blocks until Flask app exits)
    proc.wait()

except KeyboardInterrupt:
    logger.info("Interrupted. Terminating Flask app...")
    proc.terminate()

finally:
    logger.info("Cleaning up after Flask app exit...")
    cleanup_files()