import sys,os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from converter.convertMaster import cleanup_files,setup
from converter.init import get_base_folder,set_base_folder,get_lib_path
from converter.app import cm_bp
from app import cm_app_bp
from flask import Flask
from flask_cors import CORS


CURR_DIR=os.path.join(os.path.dirname(__file__))
app = Flask("Convert Master", static_folder=os.path.join(get_lib_path(CURR_DIR), 'build', 'static'))
CORS(app)  # Enable CORS for all routes

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable caching for development

# Register common/shared routes
app.register_blueprint(cm_bp)
app.register_blueprint(cm_app_bp)

if __name__ == '__main__':
    temp_path = os.getenv('TEMPPATH')
    set_base_folder(path=temp_path)
    cleanup_files(get_base_folder())
    setup()
    port=int(os.getenv('PORT', 5000))
    print("Enjoy Convert Master - APP to convert 50+ file format")
    app.run(debug=False,use_reloader=False, host='0.0.0.0', port=5000)