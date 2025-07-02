import base64
import json
import uuid
import socket
import hashlib
from datetime import datetime, timezone, timedelta
import os
from converter.init import get_base_folder
import logging as logger
from cryptography.fernet import Fernet

LICENSE_PATH = os.path.join(get_base_folder(), "license.lic")
ENCRYPTION_KEY = b'XvOeIlLx4Co6kMKhCD9w9Gj_2uYZHdHrVWhxvj1TfPA='  # Replace with real 32-byte Fernet key
fernet = Fernet(ENCRYPTION_KEY)

def get_device_id():
    mac = uuid.getnode()
    hostname = socket.gethostname()
    return hashlib.sha256(f"{mac}_{hostname}".encode()).hexdigest()

def read_license():
    if not os.path.exists(LICENSE_PATH):
        print("License File not found")
        return None
    try:
        with open(LICENSE_PATH, "rb") as f:
            encrypted_b64 = f.read()
        encrypted = base64.b64decode(encrypted_b64)  # Decode base64 to raw bytes
        decrypted = fernet.decrypt(encrypted)
        return json.loads(decrypted)
    except Exception as e:
        print("Failed to read license:", e)
        return None

def write_license(data):
    encrypted = fernet.encrypt(json.dumps(data).encode())
    key_b64 = base64.b64encode(encrypted).decode('utf-8')
    with open(LICENSE_PATH, "w") as f:
        f.write(key_b64)

def validate_license():
    data = read_license()
    if not data:
        raise Exception("Missing or invalid license file. Please obtain a valid license.")
    
    if data.get("used") and data.get("device_id") != get_device_id():
            raise Exception("License already used on another device.")
        
    if datetime.fromisoformat(data["expiry"]) < datetime.now(timezone.utc):
        raise Exception("License expired.")

    if not data.get("used"):
        data["device_id"] = get_device_id()
        data["used"] = True
        write_license(data)

    return True

def generate_unique_license_id():
    """Generate a unique license ID"""
    return f"lic_{uuid.uuid4().hex[:12]}_{int(datetime.now().timestamp())}"

def generate_license_file(output_path='', expiry_days=30, license_id=None):
    license_id = license_id or generate_unique_license_id()  # Add license ID to the encrypted data
    license_data = {
        "expiry": (datetime.now(timezone.utc) + timedelta(days=expiry_days)).isoformat(),
        "device_id": "",  # Will be filled on first activation
        "used": False,
        "license_id": license_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    encrypted = fernet.encrypt(json.dumps(license_data).encode())
    key_b64 = base64.b64encode(encrypted).decode('utf-8')
    
    return {'key': key_b64,'license_id':license_id}
    with open(output_path, "wb") as f:
        f.write(encrypted)
    print("License file generated:", output_path)