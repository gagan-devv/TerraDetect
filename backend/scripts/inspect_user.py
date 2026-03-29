#!/usr/bin/env python3
"""
Simple inspect script to query a user document from the MongoDB used by the backend.
Run from the repo root: `python3 backend/scripts/inspect_user.py steve.tyl@example.com`
This script will print non-sensitive fields: whether the user exists, device_id, and whether a password hash exists.
"""
import sys
from pymongo import MongoClient
import ssl
import os

from urllib.parse import quote_plus


def main():
    if len(sys.argv) < 2:
        print("Usage: inspect_user.py <email_or_username>")
        sys.exit(1)

    identifier = sys.argv[1]

    # Load env from backend/.env if present
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    mongo_uri = None
    db_name = 'terradetect'
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('MONGO_URI='):
                    mongo_uri = line.split('=', 1)[1].strip()
                if line.startswith('DB_NAME='):
                    db_name = line.split('=', 1)[1].strip()

    if not mongo_uri:
        # fallback to environment variable
        mongo_uri = os.environ.get('MONGO_URI')

    if not mongo_uri:
        print('MONGO_URI not found in backend/.env or environment. Set it and retry.')
        sys.exit(1)

    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000, tls=True, tlsAllowInvalidCertificates=True)
        db = client[db_name]
        users = db['users']

        # Try to match email or username
        doc = users.find_one({'$or': [{'email': identifier}, {'username': identifier}]})
        if not doc:
            print('User not found')
            sys.exit(0)

        print('User found')
        print('username:', doc.get('username', ''))
        print('email:', doc.get('email', ''))
        device_id = doc.get('device_id', None)
        print('device_id:', device_id if device_id is not None else '(none)')
        has_pw = 'password_hash' in doc and bool(doc.get('password_hash'))
        print('password_hash_present:', has_pw)

    except Exception as e:
        print('Error connecting to MongoDB or querying:', str(e))
        sys.exit(2)


if __name__ == '__main__':
    main()
