import threading
import time
from datetime import datetime, timedelta
from models.ip_log_pg import recreate_ip_log_db
from converter.convertMaster import reinitialize
import logging as logger

def schedule_midnight_reset():
    def reset_task():
        while True:
            now = datetime.now()
            # Time until next midnight
            next_midnight = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            sleep_seconds = (next_midnight - now).total_seconds()
            logger.info(f"[Scheduler] Sleeping for {sleep_seconds / 3600:.2f} hours until DB reset.")
            time.sleep(sleep_seconds)
            recreate_ip_log_db()

    thread = threading.Thread(target=reset_task, daemon=True)
    thread.start()

def schedule_hourly_delete():
    def hourly_task():
        while True:
            now = datetime.now()
            # Calculate time until next hour
            next_30min = (now + timedelta(minutes=30)).replace(second=0, microsecond=0)
            sleep_seconds = (next_30min - now).total_seconds()
            logger.info(f"[Scheduler] Sleeping for {sleep_seconds / 60:.2f} minutes until hourly delete.")
            if sleep_seconds > 0:
                time.sleep(sleep_seconds)
            else:
                logger.warning("[Scheduler] Negative sleep time, skipping sleep.")
            reinitialize()

    thread = threading.Thread(target=hourly_task, daemon=True)
    thread.start()