import pandas as pd
import numpy as np

# Exercise 1: Load and Inspect
def load_data():
    df = pd.read_csv('../data/travel_dataset.csv')
    print("Shape:", df.shape)
    print("Columns:", df.columns)
    return df

# Exercise 2: Filter by Rating
def filter_high_rated(df):
    # Clean column name if needed
    col = 'Google review rating' if 'Google review rating' in df.columns else 'Google_review_rating'
    df[col] = pd.to_numeric(df[col], errors='coerce')
    high_rated = df[df[col] > 4.5]
    print(f"Found {len(high_rated)} places with rating > 4.5")
    return high_rated

if __name__ == "__main__":
    print("Running Pandas Lab...")
    try:
        df = load_data()
        filter_high_rated(df)
    except FileNotFoundError:
        print("Dataset not found. Run from LABS/ directory and ensure data exists.")
