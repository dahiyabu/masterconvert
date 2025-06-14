import threading
import time
from datetime import datetime, timedelta
from models.ip_log import recreate_ip_log_db

def schedule_midnight_reset():
    def reset_task():
        while True:
            now = datetime.now()
            # Time until next midnight
            next_midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            sleep_seconds = (next_midnight - now).total_seconds()
            print(f"[Scheduler] Sleeping for {sleep_seconds / 3600:.2f} hours until DB reset.")
            time.sleep(sleep_seconds)
            recreate_ip_log_db()

    thread = threading.Thread(target=reset_task, daemon=True)
    thread.start()