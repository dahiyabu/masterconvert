import os
import psycopg2
import psycopg2.extras
from psycopg2 import sql, OperationalError, Error
import logging as logger
from datetime import datetime, timedelta

from datetime import date
from flask import g,jsonify

# Environment-based PostgreSQL DSN (customize as needed)
POSTGRES_DSN = os.getenv("POSTGRES_DSN", None)

MAX_DAILY_REQUESTS = int(os.getenv('MAX_REQUESTS', 2))

def get_db():
    """Return a persistent DB connection for the current request context."""
    if 'ip_db' not in g:
        g.ip_db = psycopg2.connect(POSTGRES_DSN)
        g.ip_db.autocommit = True
        logger.info("Connected to PostgreSQL for ip_db")
    return g.ip_db

def close_db(e=None):
    """Close the DB connection."""
    db = g.pop('ip_db', None)
    if db is not None:
        db.close()

def init_ip_log_db():
    """Safely initialize PostgreSQL IP log and related tables."""
    conn = None
    today = date.today()
    try:
        conn = psycopg2.connect(POSTGRES_DSN)
        cursor = conn.cursor()

        # Create metadata table if not exists
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS schema_meta (
                table_name TEXT PRIMARY KEY,
                last_updated DATE
            )
        ''')

        # Check if ip_log was created today
        cursor.execute("SELECT last_updated FROM schema_meta WHERE table_name = 'ip_log'")
        row = cursor.fetchone()

        if not row or row[0] < today:
            logger.info("Recreating ip_log table (first time or older than today)")
            cursor.execute("DROP TABLE IF EXISTS ip_log")
            cursor.execute('''
                CREATE TABLE ip_log (
                    id SERIAL PRIMARY KEY,
                    ip TEXT NOT NULL,
                    fingerprint TEXT NOT NULL,
                    log_date DATE NOT NULL,
                    request_count INTEGER NOT NULL DEFAULT 1,
                    is_paid BOOLEAN NOT NULL DEFAULT FALSE
                )
            ''')

            # Insert/update metadata
            if row:
                cursor.execute("UPDATE schema_meta SET last_updated = %s WHERE table_name = 'ip_log'", (today,))
            else:
                cursor.execute("INSERT INTO schema_meta (table_name, last_updated) VALUES ('ip_log', %s)", (today,))

        # Create additional tables if not already created
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS plan_access_log (
                id SERIAL PRIMARY KEY,
                ip_address TEXT NOT NULL,
                email TEXT,
                plan_type TEXT CHECK(plan_type IN ('daily', 'monthly', 'yearly')) NOT NULL,
                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS checkout_sessions (
                id SERIAL PRIMARY KEY,
                session_id TEXT NOT NULL UNIQUE,
                email TEXT,
                plan TEXT CHECK(plan IN ('daily', 'monthly', 'yearly')) NOT NULL,
                client_reference_id TEXT,
                payment_status TEXT CHECK(payment_status IN ('pending', 'success', 'failed')) NOT NULL DEFAULT 'pending',
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                receipt TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS licenses (
                id SERIAL PRIMARY KEY,
                license_id TEXT NOT NULL UNIQUE,
                key_data TEXT NOT NULL,
                session_id TEXT NOT NULL,
                email TEXT,
                plan TEXT CHECK(plan IN ('daily', 'monthly', 'yearly')) NOT NULL,
                platform TEXT CHECK(platform IN ('windows', 'macos', 'linux')) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMPTZ NOT NULL
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                subject VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'new'
            )
        ''')
        conn.commit()
        logger.info("Successfully initialized database tables")

    except OperationalError as e:
        logger.error(f"[DB Connection Error] {e}")
    except Error as e:
        logger.error(f"[DB Execution Error] {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()
            logger.info("PostgreSQL connection closed after init_ip_log_db()")

def log_ip_address(ip,identifier):
    """Insert or update IP usage log for today."""
    today = date.today().isoformat()
    conn = get_db()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    #cursor.execute('SELECT request_count FROM ip_log WHERE ip = %s AND log_date = %s', (ip, today))
    cursor.execute('SELECT request_count FROM ip_log WHERE fingerprint = %s AND log_date = %s', (identifier, today))
    row = cursor.fetchone()
    #if row:
    #    cursor.execute('UPDATE ip_log SET request_count = request_count + 1 WHERE ip = %s AND log_date = %s', (ip, today))
    #else:
    #    cursor.execute('INSERT INTO ip_log (ip, log_date, request_count) VALUES (%s, %s, %s)', (ip, today, 1))
    if row:
        cursor.execute('UPDATE ip_log SET request_count = request_count + 1 WHERE fingerprint = %s AND log_date = %s', (identifier, today))
    else:
        cursor.execute('INSERT INTO ip_log (ip,fingerprint, log_date, request_count) VALUES (%s,%s, %s, %s)', (ip,identifier, today, 1))

def recreate_ip_log_db():
    """Drop and recreate just the ip_log table."""
    conn = psycopg2.connect(POSTGRES_DSN)
    cursor = conn.cursor()
    cursor.execute('DROP TABLE IF EXISTS ip_log')
    conn.commit()
    logger.info("Dropped ip_log table")
    init_ip_log_db()

def is_ip_under_limit(identifier):
    """Return True if Identifier/fingerprint has not exceeded daily usage."""
    today = date.today().isoformat()
    conn = get_db()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    #cursor.execute('SELECT request_count, is_paid FROM ip_log WHERE ip = %s AND log_date = %s', (ip, today))
    cursor.execute('SELECT request_count, is_paid FROM ip_log WHERE fingerprint = %s AND log_date = %s', (identifier, today))
    row = cursor.fetchone()

    if row:
        logger.info(f'count={row['request_count']} and paid={row['is_paid']}')
        if 'is_paid' in row and  row['is_paid']:
            return True
        return'request_count' in row and row['request_count'] < MAX_DAILY_REQUESTS
    return True

def change_max_allowed_request(max_request):
    global MAX_DAILY_REQUESTS
    if max_request and isinstance(max_request, str):
        MAX_DAILY_REQUESTS = int(max_request)
        return True
    return False

def log_user_payment(session_id, email, plan, client_reference_id, payment_status):
    # Save to database
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO checkout_sessions (session_id, email, plan, client_reference_id, payment_status)
        VALUES (%s, %s, %s, %s, %s)
    ''', (session_id, email, plan, client_reference_id, payment_status))
    conn.commit()
    return True

def mark_successful_payment(session_id,plan,fingerprint,receipt):
    # ✅ Update payment status in DB
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE checkout_sessions
            SET payment_status = %s,
                       receipt = %s
            WHERE session_id = %s
        ''', ('success', receipt, session_id))
        # If this was a daily plan, mark is_paid=True for this IP and today's date
        if plan == 'daily' and fingerprint:
            today = date.today().isoformat()

            # Check if the IP already has a record today
            cursor.execute('''
                SELECT id FROM ip_log WHERE fingerprint = %s AND log_date = %s
            ''', (fingerprint, today))
            existing = cursor.fetchone()

            if existing:
                # Just update is_paid
                cursor.execute('''
                    UPDATE ip_log
                    SET is_paid = TRUE
                    WHERE fingerprint = %s AND log_date = %s
                ''', (fingerprint, today))
            else:
                # Insert new log with is_paid=True
                cursor.execute('''
                    INSERT INTO ip_log (fingerprint, log_date, request_count, is_paid)
                    VALUES (%s, %s, %s, %s)
                ''', (fingerprint, today, 0, True))
        conn.commit()
        
        logger.info("Database updated for successful payment.")
        return ('Success',200)
    except Exception as db_err:
        logger.info(f"❌ DB update failed: {db_err}")
        return ('Database error', 500)

def get_session_info(session_id):
    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT session_id, email, plan, payment_status, created_at
            FROM checkout_sessions
            WHERE session_id = %s
            LIMIT 1
        ''', (session_id,))
        row = cursor.fetchone()

        if not row:
            return jsonify({'error': 'Session not found'}), 404

        session_data = {
            'session_id': row[0],
            'customer_email': row[1],
            'plan_name': row[2],
            'payment_status': row[3],
            'created_at': row[4].isoformat() if row[4] else None,
            # Optional: add a dummy amount if needed
            'amount': 9900 if row[2] == 'yearly' else 990  # for example
        }

        return jsonify(session_data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def verify_user_payment(email, plan):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT session_id, payment_status, created_at
            FROM checkout_sessions
            WHERE email = %s AND plan = %s
            ORDER BY created_at DESC LIMIT 1
        ''', (email, plan))
        result = cursor.fetchone()

        if result:
            session_id, status, created_at = result
            paid = status == 'success'
            return jsonify({
                'email': email,
                'plan': plan,
                'payment_status': status,
                'session_id': session_id,
                'created_at': created_at,
                'paid': paid
            }), 200 if paid else 402  # 402 Payment Required for failed
        else:
            return jsonify({'paid': False, 'message': 'No payment record found'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
def get_account_limits(fingerprint):
    
    today = date.today().isoformat()

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute('''
            SELECT request_count, is_paid FROM ip_log
            WHERE fingerprint = %s AND log_date = %s
        ''', (fingerprint, today))
        row = cursor.fetchone()

        if row:
            request_count, is_paid = row
        else:
            request_count, is_paid = 0, False

        if is_paid:
            return jsonify({
                "max_file_size_mb": 1024,
                "conversions_left": None  # Unlimited
            })

        conversions_left = max(0, MAX_DAILY_REQUESTS - request_count)
        return jsonify({
            "max_file_size_mb": 100,
            "conversions_left": conversions_left
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
def store_license(license_id, key,sessionId,email,plan,platform):
    """Store license in database"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        # Assuming you have a licenses table
        cursor.execute("""
            INSERT INTO licenses (license_id, key_data, session_id,email,plan,platform,created_at, expires_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            license_id, 
            key,
            sessionId,
            email,
            plan,
            platform,
            datetime.now().isoformat(),
            (datetime.now() + timedelta(hours=24)).isoformat()
        ))
        conn.commit()
    except Exception as e:
        logger.error(f"Database error storing license: {str(e)}")

def get_download_records(session_id, email, plan,platform=None):
    """Get license from database"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        if platform:
            cursor.execute("""
                SELECT * FROM licenses 
                WHERE session_id = %s AND email = %s AND plan = %s AND platform = %s
                """, (session_id,email,plan,platform))
        else:
            cursor.execute("""
                SELECT * FROM licenses 
                WHERE session_id = %s AND email = %s AND plan = %s
                """, (session_id,email,plan))
        
         # Fetch all records
        result = cursor.fetchall()
        
        # If there are results, convert each row to a dictionary
        if result:
            download_records = []
            for row in result:
                download_record = {
                    'id': row[0],
                    'licenseId': row[1],
                    'key': row[2],
                    'sessionId':row[3],
                    'email': row[4],
                    'plan': row[5],
                    'platform': row[6],
                    'createdAt': row[7],
                    'expiresAt': row[8]
                }
                download_records.append(download_record)
            return download_records
        else:
            return None
    except Exception as e:
        logger.error(f"Database error retrieving license: {str(e)}")
        return None
    
# Insert contact data
def insert_contact_data(first_name, last_name, email, phone, subject, message):
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO contacts (first_name, last_name, email, phone, subject, message)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (first_name, last_name, email, phone, subject, message))
        
        contact_id = cursor.fetchone()[0]
        conn.commit()
        
        return contact_id
    except Exception as e:
        logger.error(f"Database error inserting contact info: {str(e)}")
        return None