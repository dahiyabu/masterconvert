import os
import pyzipper
import zipfile
import rarfile
import tarfile
import py7zr
import uuid
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, filename='app.log', filemode='a', format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
CONVERTED_FOLDER = 'converted'

def merge_files_to_archive(output_path, merge_type, password, *file_paths):
    """
    Merges multiple files into a specified archive format (zip, rar, tar, or 7z),
    and adds password protection if specified.

    Args:
        output_path (str): The path to save the merged archive file.
        merge_type (str): The type of archive (zip, rar, tar, or 7z).
        password (str): The password for encryption (can be None or empty).
        *file_paths (str): Variable number of paths to the files to include in the archive.
    """
    try:
        # Check merge_type and process accordingly
        if merge_type == 'zip':
            return create_zip(output_path, password, *file_paths)
        elif merge_type == 'rar':
            return create_rar(output_path, password, *file_paths)
        elif merge_type == 'tar':
            return create_tar(output_path, password, *file_paths)
        elif merge_type == '7z':
            return create_7z(output_path, password, *file_paths)
        else:
            raise ValueError(f"Unsupported merge type: {merge_type}")
    except Exception as e:
        logger.error(f"Error merging files into {merge_type.upper()}: {e}")
        raise


def create_zip(output_path, password, *file_paths):
    try:
        with pyzipper.AESZipFile(output_path, 'w', compression=zipfile.ZIP_DEFLATED) as zipf:
            # Apply password only if it's not None or empty
            if password:
                logger.info(f"Setting password for the zip file.")
                zipf.setpassword(password.encode())  # Set password for the zip file
                zipf.setencryption(pyzipper.WZ_AES)  # Apply AES encryption
            for file_path in file_paths:
                if os.path.exists(file_path) and os.path.isfile(file_path):
                    zipf.write(file_path, os.path.basename(file_path))
                    logger.info(f"Added {file_path} to the ZIP archive.")
                else:
                    logger.warning(f"Skipping invalid file: {file_path}")
    except Exception as e:
        logger.error(f"Error merging files into ZIP: {e}")
        raise  # Re-raise the exception after logging it


def create_rar(output_path, password, *file_paths):
    # Use rarfile to create the .rar file (without password protection)
    try:
        with rarfile.RarFile(output_path, 'w') as rarf:
            for file_path in file_paths:
                if os.path.exists(file_path) and os.path.isfile(file_path):
                    rarf.write(file_path, os.path.basename(file_path))
                    logger.info(f"Added {file_path} to the RAR archive.")
                else:
                    logger.warning(f"Skipping invalid file: {file_path}")

    except Exception as e:
        logger.error(f"Error creating RAR archive: {e}")
        raise


def create_tar(output_path, password, *file_paths):
    # First, create a TAR file
    tar_temp_path = output_path.replace(".tar", "_temp.tar")
    with tarfile.open(tar_temp_path, 'w') as tarf:
        for file_path in file_paths:
            if os.path.exists(file_path) and os.path.isfile(file_path):
                tarf.add(file_path, os.path.basename(file_path))
                logger.info(f"Added {file_path} to the TAR archive.")
            else:
                logger.warning(f"Skipping invalid file: {file_path}")
    
    # Now, compress with 7z and add password protection if password is provided
    try:
        if password:
            with py7zr.SevenZipFile(output_path, mode='w', password=password) as archive:
                archive.write(tar_temp_path, arcname="merged_files.tar")
                logger.info(f"Created 7z archive with password protection: {output_path}")
        else:
            # If no password, create 7z without password protection
            with py7zr.SevenZipFile(output_path, mode='w') as archive:
                archive.write(tar_temp_path, arcname="merged_files.tar")
                logger.info(f"Created 7z archive without password protection: {output_path}")
    except Exception as e:
        logger.error(f"Error creating 7z archive: {e}")
        raise
    finally:
        # Remove the temporary TAR file
        if os.path.exists(tar_temp_path):
            os.remove(tar_temp_path)


def create_7z(output_path, password, *file_paths):
    # Create 7z file with or without password
    try:
        if password:
            with py7zr.SevenZipFile(output_path, mode='w', password=password) as archive:
                for file_path in file_paths:
                    if os.path.exists(file_path) and os.path.isfile(file_path):
                        archive.write(file_path, os.path.basename(file_path))
                        logger.info(f"Added {file_path} to the 7z archive with password protection.")
                    else:
                        logger.warning(f"Skipping invalid file: {file_path}")
        else:
            # If no password, create 7z without password protection
            with py7zr.SevenZipFile(output_path, mode='w') as archive:
                for file_path in file_paths:
                    if os.path.exists(file_path) and os.path.isfile(file_path):
                        archive.write(file_path, os.path.basename(file_path))
                        logger.info(f"Added {file_path} to the 7z archive without password protection.")
                    else:
                        logger.warning(f"Skipping invalid file: {file_path}")
    except Exception as e:
        logger.error(f"Error creating 7z archive: {e}")
        raise