#!/usr/bin/env python3
"""
Seed script for TerraDetect MongoDB.
Creates sample devices, users, and sensor readings.

Usage:
  python3 backend/scripts/seed_db.py

Requirements:
  pip install pymongo bcrypt dnspython

The script reads `backend/.env` for MONGO_URI and DB_NAME. It will insert
sample documents and print what it created. It avoids duplicating existing
`device_id` or `username`/`email`.
"""
import os
import sys
import time
import uuid
import secrets
from datetime import datetime, timedelta

from pymongo import MongoClient
import bcrypt


def load_env(env_path):
    mongo_uri = None
    db_name = "terradetect"
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line.startswith("MONGO_URI="):
                    mongo_uri = line.split("=", 1)[1].strip()
                if line.startswith("DB_NAME="):
                    db_name = line.split("=", 1)[1].strip()
    return mongo_uri, db_name


def ensure_indexes(db):
    # Matches indexes created by the backend, idempotent if already created
    try:
        db.sensor_data.create_index([("device_id", 1), ("timestamp", -1)])
        db.token_deny_list.create_index([("expires_at", 1)], expireAfterSeconds=0)
        db.users.create_index([("username", 1)], unique=True)
    except Exception:
        pass


def upsert_device(devices_col, device_id, api_key=None, registered=False):
    if api_key is None:
        api_key = secrets.token_hex(16)
    now = datetime.utcnow()
    existing = devices_col.find_one({"device_id": device_id})
    if existing:
        print(f"Device {device_id} already exists; skipping insert")
        return existing
    doc = {
        "device_id": device_id,
        "api_key": api_key,
        "registered": registered,
        "created_at": now,
    }
    devices_col.insert_one(doc)
    print(f"Inserted device {device_id} (registered={registered})")
    return doc


def upsert_user(users_col, username, email, password_plain, device_id=""):
    now = datetime.utcnow()
    existing = users_col.find_one({"$or": [{"username": username}, {"email": email}]})
    if existing:
        print(f"User {username} / {email} already exists; skipping insert")
        return existing
    pw_hash = bcrypt.hashpw(password_plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    doc = {
        "username": username,
        "email": email,
        "password_hash": pw_hash,
        "device_id": device_id,
        "created_at": now,
    }
    users_col.insert_one(doc)
    print(f"Inserted user {username} (email={email}) device_id={device_id}")
    return doc


def insert_sensor_reading(sensor_col, device_id, temp=25.0, ph=6.5, humidity=60.0, ec=1.0, N=40.0, P=25.0, K=30.0, moisture=50.0, timestamp=None):
    if timestamp is None:
        timestamp = datetime.utcnow()
    doc = {
        "device_id": device_id,
        "temperature": float(temp),
        "ph": float(ph),
        "humidity": float(humidity),
        "ec": float(ec),
        "N": float(N),
        "P": float(P),
        "K": float(K),
        "moisture": float(moisture),
        "timestamp": timestamp,
    }
    sensor_col.insert_one(doc)
    print(f"Inserted sensor reading for {device_id} @ {timestamp.isoformat()}")


def main():
    repo_root = os.path.dirname(os.path.dirname(__file__))
    env_path = os.path.join(repo_root, ".env")
    mongo_uri, db_name = load_env(env_path)
    if not mongo_uri:
        mongo_uri = os.environ.get("MONGO_URI")

    if not mongo_uri:
        print("MONGO_URI not found in backend/.env or environment. Set it and retry.")
        sys.exit(1)

    print("Connecting to:", mongo_uri.split("@")[-1])
    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000, tls=True, tlsAllowInvalidCertificates=True)
    db = client[db_name]

    ensure_indexes(db)

    devices = db["device_ids"]
    users = db["users"]
    sensor = db["sensor_data"]

    # Sample devices (format: two uppercase letters + four digits, e.g. TD0001)
    dev1 = upsert_device(devices, "TD0001", registered=False)
    dev2 = upsert_device(devices, "TD0002", registered=False)

    # Sample users
    # User with no device
    upsert_user(users, "testuser", "test@example.com", "TestPass123!", device_id="")
    # User with a pre-provisioned device (claim it)
    # If you want the device claimed at creation, set registered=True above or update device after user creation.
    upsert_user(users, "steve.tyl", "steve.tyl@example.com", "SteveTyl@01", device_id="TD0001")

    # Mark device TD0001 as registered (claimed)
    devices.update_one({"device_id": "TD0001"}, {"$set": {"registered": True}}, upsert=False)
    print("Marked TD0001 as registered")

    # Sample sensor readings
    now = datetime.utcnow()
    insert_sensor_reading(sensor, "TD0001", temp=27.3, ph=6.8, humidity=63.0, N=42.0, P=28.0, K=33.0, moisture=55.0, timestamp=now - timedelta(hours=1))
    insert_sensor_reading(sensor, "TD0001", temp=26.8, ph=6.7, humidity=62.0, N=41.0, P=27.5, K=32.5, moisture=54.0, timestamp=now - timedelta(minutes=10))

    print("Seeding complete.")


if __name__ == "__main__":
    main()
