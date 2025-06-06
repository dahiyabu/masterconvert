import sys
sys.path.append('../')
from converter.convertMaster import cleanup_files,setup
from converter.init import get_base_folder,set_base_folder
from converter.app import app
import os

if __name__ == '__main__':
    temp_path = os.getenv('TEMPPATH')
    set_base_folder(path=temp_path)
    cleanup_files(get_base_folder())
    setup()
    port=int(os.getenv('PORT', 5000))
    print("Enjoy Convert Master - APP to convert 50+ file format")
    app.run(debug=False,use_reloader=False, host='0.0.0.0', port=5000)