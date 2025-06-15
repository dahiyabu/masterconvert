import argparse
import sys,os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import converter.config
from converter.convertMaster import cleanup_files,setup
from converter.init import get_base_folder,set_base_folder,get_lib_path,create_timed_rotating_log
from converter.app import cm_bp
from app import cm_app_bp
from flask import Flask
from flask_cors import CORS
from models.ip_log import init_ip_log_db,close_db
from tasks.scheduler import schedule_midnight_reset


CURR_DIR=os.path.join(os.path.dirname(__file__))
app = Flask("Convert Master", static_folder=os.path.join(get_lib_path(CURR_DIR), 'build', 'static'))
CORS(app)  # Enable CORS for all routes

app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Disable caching for development

# Register common/shared routes
app.register_blueprint(cm_app_bp)
app.register_blueprint(cm_bp)
app.teardown_appcontext(close_db)
    
def initialize_args():
    #Prevent multiple instantiations pf DistManager and logger
    logfile = ''
    parser = argparse.ArgumentParser(description="ConvertMaster")
    # Adding optional argument
    parser.add_argument("-l", "--log", help = "Log File")
    # Read arguments from command line
    args = parser.parse_args()
    if args.log:
        logfile=args.log
        
    else:
        print("-l or --log <log file>")
        sys.exit()
    #log.basicConfig(filename=logfile,format='%(asctime)s - %(name)s - %(process)d- %(levelname)s - %(message)s',level=log.DEBUG, force=True)
    converter.config.logpath = logfile

if __name__ == '__main__':
    initialize_args()
    temp_path = os.getenv('TEMPPATH')
    if temp_path:
        os.makedirs(temp_path)
    # Initialize IP DB
    print(temp_path)
    init_ip_log_db(temp_path)

    # Start midnight DB reset thread
    schedule_midnight_reset()

    set_base_folder(path=temp_path)
    cleanup_files(get_base_folder())
    create_timed_rotating_log()

    setup()
    port=int(os.getenv('PORT', 5000))
    print("Enjoy Convert Master - APP to convert 200+ file format")
    app.run(debug=False,use_reloader=False, host='0.0.0.0', port=port)