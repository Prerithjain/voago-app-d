import pandas as pd
import numpy as np
import sqlite3
import os
from datetime import datetime

# Adjust paths relative to where the script is run (usually from project root)
CSV_PATH = os.path.join("data", "travel_dataset.csv")
DB_PATH = os.path.join("backend", "voyago_lite.db")
INIT_SQL_PATH = os.path.join("backend", "db_init.sql")

def init_db():
    print(f"Initializing database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    with open(INIT_SQL_PATH, 'r') as f:
        sql_script = f.read()
    
    cur.executescript(sql_script)
    conn.commit()
    conn.close()
    print("Database initialized.")

def import_data():
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV file not found at {CSV_PATH}")
        return

    print(f"Reading CSV from {CSV_PATH}...")
    df = pd.read_csv(CSV_PATH)
    
    # Robust header cleaning
    # 1. Strip whitespace
    # 2. Replace spaces with underscores
    # 3. Remove single quotes
    df.columns = [c.strip().replace(' ', '_').replace("'", "") for c in df.columns]
    
    print("Columns found:", df.columns.tolist())

    # Normalize rating and fee
    # Handle potential missing or malformed data
    if 'Google_review_rating' in df.columns:
        df['Google_review_rating'] = pd.to_numeric(df['Google_review_rating'], errors='coerce').fillna(0.0)
    else:
        df['Google_review_rating'] = 0.0

    # Handle Entrance Fee variations
    if 'Entrance_Fee_in_INR' in df.columns:
        df['Entrance_Fee_INR'] = pd.to_numeric(df['Entrance_Fee_in_INR'], errors='coerce').fillna(0.0)
    elif 'Entrance_Fee_INR' in df.columns:
        df['Entrance_Fee_INR'] = pd.to_numeric(df['Entrance_Fee_INR'], errors='coerce').fillna(0.0)
    else:
        df['Entrance_Fee_INR'] = 0.0

    # Create computed columns
    # Normalized rating 0-5
    min_rating = df['Google_review_rating'].min()
    max_rating = df['Google_review_rating'].max()
    if max_rating == min_rating:
        df['normalized_rating'] = 5.0
    else:
        df['normalized_rating'] = np.round((df['Google_review_rating'] - min_rating) / (max_rating - min_rating) * 5.0, 2)

    # Duration
    # Look for 'time_needed_to_visit_in_hrs' or 'time_needed_to_visit_hrs'
    duration_col = 'time_needed_to_visit_in_hrs' if 'time_needed_to_visit_in_hrs' in df.columns else 'time_needed_to_visit_hrs'
    if duration_col in df.columns:
        df['estimated_duration_hours'] = pd.to_numeric(df[duration_col], errors='coerce').fillna(1.0)
    else:
        df['estimated_duration_hours'] = 1.0

    # Prepare records for insertion
    records = []
    now = datetime.utcnow().isoformat()
    
    for _, row in df.iterrows():
        # Safe getters
        def get_val(col, default=None):
            return row[col] if col in df.columns else default

        records.append((
            get_val('Zone'),
            get_val('State'),
            get_val('City'),
            get_val('Name'),
            get_val('Type'),
            str(get_val('Establishment_Year', '')),
            float(get_val('estimated_duration_hours', 1.0)),
            float(get_val('Google_review_rating', 0.0)),
            float(get_val('Entrance_Fee_INR', 0.0)),
            get_val('Airport_with_50km_Radius'),
            get_val('Weekly_Off'),
            get_val('Significance'),
            get_val('DSLR_Allowed'),
            float(get_val('Number_of_google_review_in_lakhs', 0.0)),
            get_val('Best_Time_to_visit'),
            now
        ))

    print(f"Importing {len(records)} records into SQLite...")
    
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("PRAGMA foreign_keys = ON;")
    
    # Clear existing data to avoid duplicates on re-run
    cur.execute("DELETE FROM TravelDatasetImported")
    
    cur.executemany("""
    INSERT INTO TravelDatasetImported (
      Zone, State, City, Name, Type, Establishment_Year,
      time_needed_to_visit_hrs, Google_review_rating, Entrance_Fee_INR,
      Airport_with_50km_Radius, Weekly_Off, Significance, DSLR_Allowed,
      Number_of_google_review_in_lakhs, Best_Time_to_visit, imported_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, records)
    
    conn.commit()
    conn.close()
    print("Import completed successfully.")

if __name__ == "__main__":
    init_db()
    import_data()
