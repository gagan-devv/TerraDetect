#!/usr/bin/env python3
"""
Reset a user's password in the TerraDetect MongoDB.
Usage:
  python3 backend/scripts/reset_password.py <email_or_username> <new_password>

Reads `backend/.env` for MONGO_URI/DB_NAME. Replaces `password_hash` with a bcrypt hash.
Prints whether the user was updated.
"""
import sys
import os
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


def main():
    if len(sys.argv) != 3:
        print("Usage: reset_password.py <email_or_username> <new_password>")
        sys.exit(1)

    identifier = sys.argv[1]
    new_password = sys.argv[2]

    repo_root = os.path.dirname(os.path.dirname(__file__))
    env_path = os.path.join(repo_root, ".env")
    mongo_uri, db_name = load_env(env_path)
    if not mongo_uri:
        mongo_uri = os.environ.get("MONGO_URI")
    if not mongo_uri:
        print("MONGO_URI not found in backend/.env or environment. Set it and retry.")
        sys.exit(1)

    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=10000, tls=True, tlsAllowInvalidCertificates=True)
    db = client[db_name]
    users = db["users"]

    query = {"$or": [{"email": identifier}, {"username": identifier}]}
    user = users.find_one(query)
    if not user:
        print("User not found. No changes made.")
        sys.exit(1)

    pw_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    res = users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": pw_hash}})
    if res.modified_count == 1:
        print(f"Password updated for user: {user.get('username')} ({user.get('email')})")
    else:
        print("No changes made (unexpected).")

if __name__ == '__main__':
    main()
