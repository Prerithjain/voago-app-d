import pandas as pd
import sqlite3
import os

# Define paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "voyago_lite.db")
CSV_PATH = os.path.join(BASE_DIR, "data", "international_cities.csv")

def import_international_cities():
    print(f"Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    
    print(f"Reading CSV from {CSV_PATH}...")
    try:
        df = pd.read_csv(CSV_PATH)
        
        # Ensure columns match the schema of TravelDatasetImported
        # We might need to map or fill missing columns if the schema is strict
        # Let's check the CSV columns against what we expect
        
        # Add any missing columns with default values if necessary
        # For now, we assume the CSV matches the required columns for the app logic
        
        print("Appending data to TravelDatasetImported table...")
        df.to_sql("TravelDatasetImported", conn, if_exists="append", index=False)
        
        print(f"Successfully added {len(df)} international places!")
        
    except Exception as e:
        print(f"Error importing data: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    import_international_cities()
