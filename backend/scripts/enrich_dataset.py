import pandas as pd
import numpy as np

# Load existing dataset
df = pd.read_csv('../data/expanded_travel_dataset.csv')

# Add Kid_Friendly column if not exists
if 'Kid_Friendly' not in df.columns:
    # Logic: Parks, Zoos, Museums, Beaches are usually kid friendly. 
    # Trekking, some religious sites might be less so, but let's default to Yes for most tourist places
    # and No for specific types if needed.
    df['Kid_Friendly'] = 'Yes'
    
    # Example logic to refine
    not_kid_friendly_types = ['Night Club', 'Bar', 'Trekking']
    df.loc[df['Type'].isin(not_kid_friendly_types), 'Kid_Friendly'] = 'No'

# Add Activity_Type column if not exists
if 'Activity_Type' not in df.columns:
    # Derive from Type or Significance
    # Categories: Adventure, Cultural, Relaxation, Historical, Nature, Religious, Shopping
    
    def get_activity_type(row):
        t = str(row['Type']).lower()
        s = str(row['Significance']).lower()
        
        if 'beach' in t or 'lake' in t or 'park' in t:
            return 'Relaxation'
        if 'temple' in t or 'church' in t or 'mosque' in t or 'religious' in s:
            return 'Religious'
        if 'fort' in t or 'palace' in t or 'museum' in t or 'historical' in s:
            return 'Historical'
        if 'wildlife' in t or 'zoo' in t or 'nature' in s:
            return 'Nature'
        if 'trekking' in t or 'adventure' in s:
            return 'Adventure'
        return 'Cultural' # Default

    df['Activity_Type'] = df.apply(get_activity_type, axis=1)

# Ensure other new columns exist (Latitude, Longitude, etc are already there)
# Just to be safe, fill NaNs
df['Latitude'] = df['Latitude'].fillna(0.0)
df['Longitude'] = df['Longitude'].fillna(0.0)

# Save back
df.to_csv('../data/expanded_travel_dataset.csv', index=False)
print("Dataset enriched with Kid_Friendly and Activity_Type columns.")
