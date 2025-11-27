#!/bin/bash
# Startup script for Railway deployment

echo "Initializing database..."
python3 -c "
import sqlite3
import os

DB_PATH = 'voyago_lite.db'

# Create database if it doesn't exist
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Read and execute schema
with open('db_init.sql', 'r') as f:
    schema = f.read()
    cursor.executescript(schema)

conn.commit()
conn.close()
print('Database initialized successfully!')
"

echo "Starting application..."
uvicorn main:app --host 0.0.0.0 --port $PORT
