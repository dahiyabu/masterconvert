import os
import subprocess
import mimetypes
from scour import scour

from converter import config
from converter.init import logger

def is_audio(file_path):
    mime_type, _ = mimetypes.guess_type(file_path)
    return mime_type and mime_type.startswith('audio')

def is_video(file_path):
    mime_type, _ = mimetypes.guess_type(file_path)
    return mime_type and mime_type.startswith('video')

def compress_video(input_file, output_file, quality_level):
    """Compresses video files using ffmpeg.

       Args:
            input_file (str): path of the video file
            output_file (str): path of the output video file
            quality_level (str): 'low', 'medium', 'high' or bitrate
    """
    if quality_level == 'low':
        crf = 50  # Higher CRF means more compression, lower quality
    elif quality_level == 'medium':
        crf = 23
    elif quality_level == 'high':
        crf = 18
    elif quality_level in ['50','23','18']:
        crf = int(quality_level)
    else:
        # Assume it's a bitrate (e.g., "1000k", "500k")
        bitrate = quality_level
        command = [config.FFMPEG_PATH, '-i', input_file, '-b:v', bitrate, output_file]
        try:
            subprocess.run(command, check=True, capture_output=True)
            logger.info("Video compressed successfully using bitrate.")
            return
        except subprocess.CalledProcessError:
            logger.info("Error: Invalid bitrate format.  Using default compression.")
            crf = 23 #set to default.

    command = [config.FFMPEG_PATH, '-i', input_file, '-c:v', 'libx264', '-crf', str(crf), '-preset', 'fast', output_file]
    logger.info(command)
    subprocess.run(command, check=True, capture_output=True)
    logger.info("Video compressed successfully.")

def compress_audio(input_file, output_file, quality_level):
    """Compresses audio files using ffmpeg.

       Args:
        input_file (str): Path to the input audio file.
        output_file (str): Path to the output audio file.
        quality_level (str): 'low', 'medium', 'high', or a bitrate (e.g., '128k').
    """
    if quality_level == 'low':
        audio_bitrate = '64k'
    elif quality_level == 'medium':
        audio_bitrate = '128k'
    elif quality_level == 'high':
        audio_bitrate = '192k'
    elif quality_level in ['64k','128k','192k']:
        audio_bitrate = quality_level
    else:
        audio_bitrate = '128k' # Assume user provided bitrate

    command = [config.FFMPEG_PATH, '-i', input_file, '-b:a', audio_bitrate, output_file]
    logger.info(command)
    subprocess.run(command, check=True, capture_output=True)
    logger.info("Audio compressed successfully.")

def compress_image(input_file, output_file, quality_level):
    """Compresses image files, including conversion.

    Args:
        input_file (str): Path to the input image file.
        output_file (str): Path to the output image file.
        quality_level (str): 'low', 'medium', or 'high'.
    """
    if not os.path.exists(input_file):
        logger.info("File not found Not Compressing image=%s",input_file)
        return
    input_ext = input_file.split('.')[-1].lower()
    output_ext = output_file.split('.')[-1].lower()

    if quality_level == 'low':
        compression_quality = 70
    elif quality_level == 'medium':
        compression_quality = 85
    elif quality_level == 'high':
        compression_quality = 95
    elif quality_level in ['70','80','95']:
        compression_quality = int(quality_level)
    else:
        try:
            compression_quality = int(quality_level)
        except ValueError:
            print("Invalid quality level. Using default (85).")
            compression_quality = 85
    command = [config.FFMPEG_PATH, '-i', input_file, '-q:v', str(compression_quality), output_file]

    try:
        subprocess.run(command, check=True, capture_output=True)
        logger.info(f"Image compressed/converted successfully from {input_ext} to {output_ext}.")
    except subprocess.CalledProcessError as e:
        logger.error(f"Error compressing image: {e}")
        

def compress_pdf(input_file, output_file, quality_level):
    """Compresses PDF files using ghostscript.

       Args:
        input_file (str): Path to the input PDF file.
        output_file (str): Path to the output PDF file.
        quality_level (str): 'low', 'medium', or 'high'.
    """
    if quality_level == 'low':
        quality = '/screen'  # Lowest quality, smallest size
    elif quality_level == 'medium':
        quality = '/ebook'  # Medium quality, good compromise
    elif quality_level == 'high':
        quality = '/printer'  # Highest quality, larger size
    else:
        quality = '/default'

    command = [config.GS_PATH, '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.4',
               '-dPDFSETTINGS=' + quality, '-dNOPAUSE', '-dQUIET', '-dBATCH',
               '-sOutputFile=' + output_file, input_file]
    subprocess.run(command, check=True, capture_output=True)
    logger.info("PDF compressed successfully.")


def compress_generic(input_file, output_file, quality_level):
    """Attempts to compress a file using 7z.  Quality level is mapped to 7z compression level.

    Args:
        input_file (str): Path to the input file.
        output_file (str): Path to the output file.
        quality_level (str): 'low', 'medium', or 'high'.
    """
    if quality_level == 'low':
        compression_level = '1'  # Fastest, lowest compression
    elif quality_level == 'medium':
        compression_level = '5'  # Good compromise
    elif quality_level == 'high':
        compression_level = '9'  # Best compression, slowest
    elif quality_level in ['1','5','9']:
        compression_level = quality_level
    else:
         compression_level = '5'

    # 7z doesn't like overwriting without -y
    command = [config.SEVENZ_PATH, 'a', '-t7z', '-mx=' + compression_level, '-y', output_file, input_file]
    try:
        subprocess.run(command, check=True, capture_output=True)
        logger.info("File compressed successfully using 7z.")
    except subprocess.CalledProcessError as e:
        logger.exception(f"Error compressing with 7z: {e}")
        logger.exception("7z may not be installed or available in PATH.  Generic compression failed.")
        
def compress_file(input_file,output_file, quality_level):
    """
    Compresses the given file using ffmpeg, handling various file types and quality levels.

    Args:
        file_path (str): The path to the file to compress.
        quality_level (str): The desired quality level ('low', 'medium', 'high', or a bitrate).
    """
    if not os.path.exists(input_file):
        logger.error("File not found=%s",input_file)
        return
    try:
        if input_file.lower().endswith(('.mp4', '.mov', '.avi', '.mkv', '.webm')):
            compress_video(input_file, output_file, quality_level)
        elif input_file.lower().endswith(('.mp3', '.wav', '.ogg', '.flac')):
            compress_audio(input_file, output_file, quality_level)
        elif input_file.lower().endswith(('.pdf')):
            compress_pdf(input_file, output_file, quality_level)
        elif input_file.lower().endswith(('.jpg', '.jpeg', '.png', 'svg','.webp', '.gif')):
            compress_image(input_file, output_file, quality_level)
        elif input_file.lower().endswith(('svg')):
            options = scour.sanitizeOptions()

            # Set compression and preservation flags
            options.strip_comments = True
            options.remove_metadata = True
            options.remove_descriptive_elements = True
            options.keep_editor_data = True
            options.keep_defs = True
            options.enable_viewboxing = True
            options.renderer_workaround = True
            options.keep_style_elements = True   # ✅ keeps <style> blocks
            options.keep_ids = True              #

            with open(input_file, 'r', encoding='utf-8') as infile:
                with open(output_file, 'w', encoding='utf-8') as outfile:
                    scour.start(infile, outfile, options)
        else:
            # Attempt generic compression (may not be very effective)
            compress_generic(input_file, output_file, quality_level)
            logger.info("format not supported for compression")
            return

    except Exception as e:
        logger.exception(f"An error occurred during compression: {e}")