import json
import uuid
import socket
import hashlib
from datetime import datetime, timezone, timedelta
import os
from converter.init import get_base_folder
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
        return None
    try:
        with open(LICENSE_PATH, "rb") as f:
            encrypted = f.read()
        decrypted = fernet.decrypt(encrypted)
        return json.loads(decrypted)
    except Exception as e:
        print("Failed to read license:", e)
        return None

def write_license(data):
    encrypted = fernet.encrypt(json.dumps(data).encode())
    with open(LICENSE_PATH, "wb") as f:
        f.write(encrypted)

def validate_license():
    generate_license_file(LICENSE_PATH,-1)
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


def generate_license_file(output_path='', expiry_days=30):
    license_data = {
        "expiry": (datetime.now(timezone.utc) + timedelta(days=expiry_days)).isoformat(),
        "device_id": "",  # Will be filled on first activation
        "used": False
    }
    encrypted = fernet.encrypt(json.dumps(license_data).encode())
    return encrypted
    with open(output_path, "wb") as f:
        f.write(encrypted)
    print("License file generated:", output_path)