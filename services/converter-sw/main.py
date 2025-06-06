import sys
sys.path.append('../')
from converter.convertMaster import cleanup_files,setup
from converter.init import get_base_folder
from converter.app import app
import os

def set_console_title(title: str):
    if os.name == 'nt':
        # Windows
        os.system(f'title {title}')
    elif os.name == 'posix':
        # Linux/macOS — use ANSI escape sequence
        sys.stdout.write(f"\33]0;{title}\a")
        sys.stdout.flush()

if __name__ == '__main__':
    cleanup_files(get_base_folder())
    set_console_title("ConvertMaster")
    ready_file=os.path.join(get_base_folder(),'app_ready.tmp')
    with open(ready_file, "w") as f:
        f.write("ready")
    setup()
    print("Enjoy Convert Master at http://localhost:5000 in your browser")
    print("To Exit, Close the window")
    app.run(debug=False,use_reloader=False, host='0.0.0.0', port=5000)