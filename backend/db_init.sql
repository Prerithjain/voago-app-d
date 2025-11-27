CREATE TABLE IF NOT EXISTS Users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  origin TEXT,
  destination TEXT,
  category TEXT,
  num_days INTEGER,
  budget REAL,
  travel_mode TEXT,
  itinerary_html TEXT,
  total_cost REAL,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES Users(id)
);

CREATE TABLE IF NOT EXISTS ItineraryItems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  day INTEGER,
  place_name TEXT,
  start_time TEXT,
  end_time TEXT,
  notes TEXT,
  estimated_cost REAL,
  FOREIGN KEY (trip_id) REFERENCES Trips(id)
);

CREATE TABLE IF NOT EXISTS Expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  category TEXT,
  amount REAL,
  currency TEXT,
  date TEXT,
  note TEXT,
  FOREIGN KEY (trip_id) REFERENCES Trips(id),
  FOREIGN KEY (user_id) REFERENCES Users(id)
);

CREATE TABLE IF NOT EXISTS TripMembers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  added_at TEXT NOT NULL,
  FOREIGN KEY (trip_id) REFERENCES Trips(id) ON DELETE CASCADE
);

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
