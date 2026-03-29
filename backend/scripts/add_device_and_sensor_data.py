#!/usr/bin/env python3
"""
Add/assign a device_id to a user and insert sensor_data documents.

Usage:
  python3 backend/scripts/add_device_and_sensor_data.py <email_or_username> <device_id> [count]

Example:
    python3 backend/scripts/add_device_and_sensor_data.py steve.tyl@example.com TD0001 7

The script reads `backend/.env` for MONGO_URI and DB_NAME. It will upsert the
device in `device_ids`, set the user's `device_id`, mark the device as
`registered: true`, and insert `count` sensor_data documents (default 7).
"""
import sys
import os
import random
from datetime import datetime, timedelta
from pymongo import MongoClient


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


def main():
    if len(sys.argv) < 3:
        print("Usage: add_device_and_sensor_data.py <email_or_username> <device_id> [count]")
        sys.exit(1)

    identifier = sys.argv[1]
    device_id = sys.argv[2]
    count = int(sys.argv[3]) if len(sys.argv) > 3 else 7
    count = max(1, min(100, count))

    # Validate device id format: two uppercase letters followed by four digits
    import re
    if not re.match(r'^[A-Z]{2}[0-9]{4}$', device_id):
        print('Invalid device_id format. Expected two uppercase letters followed by four digits (e.g. AB1234).')
        sys.exit(1)

    repo_root = os.path.dirname(os.path.dirname(__file__))
    env_path = os.path.join(repo_root, ".env")
    mongo_uri, db_name = load_env(env_path)
    if not mongo_uri:
        mongo_uri = os.environ.get('MONGO_URI')
    if not mongo_uri:
        print('MONGO_URI not found in backend/.env or environment. Set it and retry.')
        sys.exit(1)

    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000, tls=True, tlsAllowInvalidCertificates=True)
    db = client[db_name]
    users = db['users']
    devices = db['device_ids']
    sensor = db['sensor_data']

    user = users.find_one({'$or': [{'email': identifier}, {'username': identifier}]})
    if not user:
        print('User not found:', identifier)
        sys.exit(1)

    # Upsert device
    existing_dev = devices.find_one({'device_id': device_id})
    if existing_dev:
        print('Device exists, updating registered=true')
        devices.update_one({'device_id': device_id}, {'$set': {'registered': True}})
    else:
        api_key = os.environ.get('API_KEY_FALLBACK') or None
        dev_doc = {
            'device_id': device_id,
            'api_key': api_key or os.urandom(16).hex(),
            'registered': True,
            'created_at': datetime.utcnow(),
        }
        devices.insert_one(dev_doc)
        print('Inserted device', device_id)

    # Assign device to user
    users.update_one({'_id': user['_id']}, {'$set': {'device_id': device_id}})
    print(f"Assigned device {device_id} to user {user.get('username')} / {user.get('email')}")

    # Insert sensor readings spaced over the past 24 hours
    now = datetime.utcnow()
    for i in range(count):
        ts = now - timedelta(hours=(count - i)) + timedelta(minutes=random.randint(0, 59))
        doc = {
            'device_id': device_id,
            'temperature': round(random.uniform(20.0, 30.0), 2),
            'ph': round(random.uniform(5.5, 7.5), 2),
            'humidity': round(random.uniform(40.0, 80.0), 1),
            'ec': round(random.uniform(0.5, 2.0), 2),
            'N': round(random.uniform(10.0, 80.0), 1),
            'P': round(random.uniform(5.0, 60.0), 1),
            'K': round(random.uniform(10.0, 80.0), 1),
            'moisture': round(random.uniform(20.0, 80.0), 1),
            'timestamp': ts,
        }
        sensor.insert_one(doc)
    print(f'Inserted {count} sensor readings for {device_id}')
    print('Done.')


if __name__ == '__main__':
    main()
