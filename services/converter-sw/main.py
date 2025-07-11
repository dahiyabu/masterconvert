import sys,os
if getattr(sys, 'frozen', False):
    # When frozen, use the temp folder where PyInstaller extracts
    sys.path.insert(0, sys._MEIPASS)
else:
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import converter.config
from converter.convertMaster import cleanup_files,setup
from converter.init import get_base_folder,get_lib_path,create_timed_rotating_log
from converter.app import cm_bp
from app import cm_sw_bp

from flask import Flask
from flask_cors import CORS


CURR_DIR=os.path.join(os.path.dirname(__file__))
app = Flask("Convert Master", static_folder=os.path.join(get_lib_path(CURR_DIR), 'build', 'static'))
CORS(app)  # Enable CORS for all routes

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable caching for development

# Register common/shared routes
app.register_blueprint(cm_bp)
app.register_blueprint(cm_sw_bp)

def set_console_title(title: str):
    if os.name == 'nt':
        # Windows
        os.system(f'title {title}')
    elif os.name == 'posix':
        # Linux/macOS — use ANSI escape sequence
        sys.stdout.write(f"\33]0;{title}\a")
        sys.stdout.flush()

def initialize():
    
    #log.basicConfig(filename=logfile,format='%(asctime)s - %(name)s - %(process)d- %(levelname)s - %(message)s',level=log.DEBUG, force=True)
    converter.config.logpath = os.path.join(get_base_folder(),'converter.log')

if __name__ == '__main__':
    initialize()
    cleanup_files(get_base_folder())
    create_timed_rotating_log()
    set_console_title("ExtConvert")
    ready_file=os.path.join(get_base_folder(),'app_ready.tmp')
    with open(ready_file, "w") as f:
        f.write("ready")
    setup()
    print("Enjoy Convert Master at http://localhost:5000 in your browser")
    print("To Exit, Close the window")
    app.run(debug=False,use_reloader=False, host='0.0.0.0', port=5000)