import os
from converter.init import logger,get_lib_path
from flask import Blueprint,send_from_directory

cm_sw_bp = Blueprint('cm_sw_bp', __name__)

CURR_DIR=os.path.join(os.path.dirname(__file__))
def get_build_folder():
    return os.path.join(get_lib_path(CURR_DIR),'build')

@cm_sw_bp.route('/')
def serve_react_app():
    # This will serve index.html for the root URL
    logger.info((f"sending file from {get_build_folder()} index.html"))
    return send_from_directory(get_build_folder(), 'index.html')
    
@cm_sw_bp.route('/static/<path:path>')
def serve_static(path):
    dirpath=os.path.join(get_build_folder(), 'static')
    logger.info(f"sending file from {dirpath} {path}")
    return send_from_directory(os.path.join(get_build_folder(), 'static'), path)
