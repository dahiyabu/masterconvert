import os
import sqlite3
import logging as logger

from datetime import date, datetime
from flask import g
DB_PATH = os.path.join(os.path.dirname(__file__), 'ip_log.db')

def get_db():
    global DB_PATH
    """Return a persistent DB connection for the current context."""
    if 'ip_db' not in g:
        g.ip_db = sqlite3.connect(DB_PATH)
        g.ip_db.row_factory = sqlite3.Row
        logger.info("Loaded ip_db")
    return g.ip_db

def close_db(e=None):
    """Close the DB connection."""
    db = g.pop('ip_db', None)
    if db is not None:
        db.close()

def init_ip_log_db(db_path=None):
    global DB_PATH
    global MAX_DAILY_REQUESTS
    if db_path:
        DB_PATH = os.path.join(db_path, 'ip_log.db')
    """Init DB on startup or recreate if older than today."""
    if os.path.exists(DB_PATH):
        modified_time = datetime.fromtimestamp(os.path.getmtime(DB_PATH)).date()
        if modified_time < date.today():
            os.remove(DB_PATH)
            print("[IP Log] Old DB removed")

    if not os.path.exists(DB_PATH):
        logger.info("[IP Log] Creating new IP log DB")
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS ip_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ip TEXT NOT NULL,
                log_date TEXT NOT NULL,
                request_count INTEGER NOT NULL DEFAULT 1
            )
        ''')
        conn.commit()
        conn.close()
    MAX_DAILY_REQUESTS=int(os.getenv('MAX_REQUESTS', 2))
    if os.path.exists(DB_PATH):
        logger.info(f"Created SQLITE DB at {DB_PATH}")

def log_ip_address(ip):
    """Insert or update IP usage log for today."""
    today = date.today().isoformat()
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('SELECT request_count FROM ip_log WHERE ip = ? AND log_date = ?', (ip, today))
    row = cursor.fetchone()
    logger.info(row)
    if row:
        cursor.execute('UPDATE ip_log SET request_count = request_count + 1 WHERE ip = ? AND log_date = ?', (ip, today))
    else:
        cursor.execute('INSERT INTO ip_log (ip, log_date, request_count) VALUES (?, ?, ?)', (ip, today, 1))

    conn.commit()

def recreate_ip_log_db(db_path=None):
    global DB_PATH
    if db_path:
        DB_PATH=os.path.join(db_path, 'ip_log.db')
    """Drops and recreates the DB."""
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute('DROP TABLE IF EXISTS ip_log')
        conn.commit()
    print("Recreating IP log DB.")
    init_ip_log_db()
    
def is_ip_under_limit(ip):
    global MAX_DAILY_REQUESTS
    """Return True if IP has not exceeded daily usage."""
    today = date.today().isoformat()
    conn = get_db()
    if conn is None:
        logger.error("DB connection error")
        return False
    cursor = conn.cursor()
    if cursor is None:
        logger.error("DB cursor error")
        return False
    cursor.execute('SELECT request_count FROM ip_log WHERE ip = ? AND log_date = ?', (ip, today))
    row = cursor.fetchone()

    if row:
        if row['request_count'] >= MAX_DAILY_REQUESTS:
            return False
    return True

def change_max_allowed_request(max_request):
    global MAX_DAILY_REQUESTS
    if max_request and isinstance(max_request,str):
        MAX_DAILY_REQUESTS = int(max_request)
        return True
    return False