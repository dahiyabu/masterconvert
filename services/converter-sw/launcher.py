import subprocess
import threading
import tkinter as tk
from PIL import Image, ImageTk
from time import sleep
import os
import psutil
import sys

if getattr(sys, 'frozen', False):
    # When frozen, use the temp folder where PyInstaller extracts
    sys.path.insert(0, sys._MEIPASS)
else:
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import converter.config
from converter.init import cleanup_files,get_lib_path
from converter.license import validate_license

DETACHED_PROCESS = 0x00000008
CREATE_NEW_PROCESS_GROUP = 0x00000200
CURR_DIR=os.path.join(os.path.dirname(__file__))

READY_FILE = os.path.join(get_lib_path(CURR_DIR),"app_ready.tmp")
CHECK_INTERVAL_MS = 1500
TIMEOUT_SECONDS = 300
MAX_ATTEMPTS = TIMEOUT_SECONDS * 1000 // CHECK_INTERVAL_MS

main_process = None  # Global to hold the Popen object

def is_main_process_running(proc):
    """Check if the main process is still running"""
    if proc is None:
        return False
    return proc.poll() is None


LOGO=os.path.join(get_lib_path(CURR_DIR),'resources','logo.jpg')
def launch_main_app():
    global main_process
    sleep(1.5)  # splash delay

    if os.name == 'nt':
        # Windows: start in new console with title
        MASTER_CONVERTER=os.path.join(get_lib_path(CURR_DIR),'app.exe')
        main_process = subprocess.Popen(
            [MASTER_CONVERTER],
            #[MASTER_CONVERTER],
            #shell=True,
            creationflags=subprocess.CREATE_NEW_CONSOLE#DETACHED_PROCESS|CREATE_NEW_PROCESS_GROUP
        )
    else:
        # macOS/Linux
        MASTER_CONVERTER=os.path.join(get_lib_path(CURR_DIR),'app')
        main_process = subprocess.Popen(
            ['x-terminal-emulator', '-e', MASTER_CONVERTER]
            if shutil.which('x-terminal-emulator') else
            ['gnome-terminal', '--', MASTER_CONVERTER]
            if shutil.which('gnome-terminal') else
            [MASTER_CONVERTER]  # fallback: same terminal
        )
    # Start monitoring the ready file on the main thread (Tkinter)
    root.after(0, check_ready_file)#check_ready_file()

def check_ready_file(attempt=0):
    if os.path.exists(READY_FILE):
        os.remove(READY_FILE)
        status_label.config(text="Convert Master APP is Ready. Enjoy!")
        # Start monitoring main app exit now
        threading.Thread(target=monitor_main_app, daemon=True).start()
    elif attempt < MAX_ATTEMPTS:
        root.after(CHECK_INTERVAL_MS, check_ready_file, attempt + 1)
    else:
        print("Timeout waiting for ready file.")
        root.destroy()
        root.after(100, lambda: os._exit(1))

def monitor_main_app():
    """Wait for main app to exit, then cleanup and close splash"""
    # Because process is detached, poll by psutil with PID
    try:
        proc = psutil.Process(main_process.pid)
        while proc.is_running():
            sleep(1)
    except psutil.NoSuchProcess:
        pass  # Process already ended

    print("Main app closed.")
    cleanup_files(get_lib_path(CURR_DIR))
    # Close splash window and exit
    root.after(0, root.destroy)
    root.after(100, lambda: os._exit(0))

# Message and font
status_text = "Preparing your tool... Please be patient, it may take a few minutes"
font = ("Arial", 10)

# Create splash window
root = tk.Tk()
root.title("ExtConvert")
root.overrideredirect(True)
root.configure(bg="white")

# Measure text width
text_widget = tk.Label(root, text=status_text, font=font)
text_widget.pack()
root.update_idletasks()
text_width = text_widget.winfo_width()
text_widget.destroy()

# Load image
img = Image.open(LOGO)

# Pad image if it's narrower than text
if text_width > img.width:
    padding = (text_width - img.width) // 2
    padded_img = Image.new("RGB", (text_width, img.height), color="white")
    padded_img.paste(img, (padding, 0))
else:
    padded_img = img

photo = ImageTk.PhotoImage(padded_img)


frame = tk.Frame(root, bg="white")
frame.pack()

# Image display
img_label = tk.Label(frame, image=photo, borderwidth=0)
img_label.pack()

# Message below image
status_label = tk.Label(
    frame,
    text=status_text,
    font=font,
    bg="white",
    fg="black"
)
status_label.pack(pady=(10, 10))

# Resize and center window
def resize_window():
    root.update_idletasks()
    win_width = max(padded_img.width, status_label.winfo_width())
    win_height = padded_img.height + status_label.winfo_height() + 20
    screen_width = root.winfo_screenwidth()
    screen_height = root.winfo_screenheight()
    x = (screen_width - win_width) // 2
    y = (screen_height - win_height) // 2
    root.geometry(f"{win_width}x{win_height}+{x}+{y}")

def start_after_license_check():
    try:
        validate_license()
        resize_window()
        threading.Thread(target=launch_main_app, daemon=True).start()
    except Exception as e:
        status_label.config(text=f"License Error: {str(e)}", fg="red")
        resize_window()
        print("License validation failed:", e)
        cleanup_files(get_lib_path(CURR_DIR))
        root.after(5000, root.destroy)

root.after(100, start_after_license_check)
root.mainloop()