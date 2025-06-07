import os
from flask import send_from_directory
from converter.app import app
from converter.init import logger,get_lib_path

CURR_DIR=os.path.join(os.path.dirname(__file__))
def get_build_folder():
    return os.path.join(get_lib_path(CURR_DIR),'build')

@app.route('/')
def serve_react_app():
    # This will serve index.html for the root URL
    logger.info((f"sending file from {get_build_folder()} index.html"))
    return send_from_directory(get_build_folder(), 'index.html')
    
@app.route('/static/<path:path>')
def serve_static(path):
    dirpath=os.path.join(get_build_folder(), 'static')
    logger.info(f"sending file from {dirpath} {path}")
    return send_from_directory(os.path.join(get_build_folder(), 'static'), path)
