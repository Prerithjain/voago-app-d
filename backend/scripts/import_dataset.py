import sqlite3
import pandas as pd
import os
from datetime import datetime

DB_PATH = "voyago_lite.db"
CSV_PATH = "../data/expanded_travel_dataset.csv"

def import_data():
    if not os.path.exists(CSV_PATH):
        print(f"Dataset not found at {CSV_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Create table if not exists (schema should match db_init.sql)
    # We rely on db_init.sql having been run or we can alter table here if needed.
    # But for simplicity, let's assume the table exists or we drop and recreate.
    
    cur.execute("DROP TABLE IF EXISTS TravelDatasetImported")
    
    cur.execute("""
    CREATE TABLE IF NOT EXISTS TravelDatasetImported (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Zone TEXT,
      State TEXT,
      City TEXT,
      Name TEXT,
      Type TEXT,
      Establishment_Year TEXT,
      time_needed_to_visit_hrs REAL,
      Google_review_rating REAL,
      Entrance_Fee_INR REAL,
      Airport_with_50km_Radius TEXT,
      Weekly_Off TEXT,
      Significance TEXT,
      DSLR_Allowed TEXT,
      Number_of_google_review_in_lakhs REAL,
      Best_Time_to_visit TEXT,
      Latitude REAL,
      Longitude REAL,
      Description TEXT,
      Activities TEXT,
      Nearby_Hotels TEXT,
      Food_Options TEXT,
      Kid_Friendly TEXT,
      Activity_Type TEXT,
      imported_at TEXT
    );
    """)

    df = pd.read_csv(CSV_PATH)
    
    # Rename columns to match DB schema if necessary
    # CSV cols: Zone,State,City,Name,Type,Establishment Year,time needed to visit in hrs,Google review rating,Entrance Fee in INR,Airport with 50km Radius,Weekly Off,Significance,DSLR Allowed,Number of google review in lakhs,Best Time to visit,Latitude,Longitude,Description,Activities,Nearby Hotels,Food Options,Kid_Friendly,Activity_Type
    
    df.rename(columns={
        'Establishment Year': 'Establishment_Year',
        'time needed to visit in hrs': 'time_needed_to_visit_hrs',
        'Google review rating': 'Google_review_rating',
        'Entrance Fee in INR': 'Entrance_Fee_INR',
        'Airport with 50km Radius': 'Airport_with_50km_Radius',
        'Weekly Off': 'Weekly_Off',
        'DSLR Allowed': 'DSLR_Allowed',
        'Number of google review in lakhs': 'Number_of_google_review_in_lakhs',
        'Best Time to visit': 'Best_Time_to_visit',
        'Nearby Hotels': 'Nearby_Hotels',
        'Food Options': 'Food_Options'
    }, inplace=True)

    df['imported_at'] = datetime.utcnow().isoformat()

    # Insert data
    df.to_sql('TravelDatasetImported', conn, if_exists='append', index=False)
    
    conn.commit()
    conn.close()
    print(f"Successfully imported {len(df)} records.")

if __name__ == "__main__":
    import_data()
