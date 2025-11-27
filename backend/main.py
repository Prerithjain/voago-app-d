from fastapi import FastAPI, HTTPException, Depends, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import pandas as pd
import numpy as np
import bcrypt
import os
from dotenv import load_dotenv
from authlib.integrations.starlette_client import OAuth

load_dotenv()

# Initialize OAuth
oauth = OAuth()
# These should be set in environment variables for security
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    oauth.register(
        name='google',
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'}
    )
else:
    # In development, you can set dummy values or skip registration
    pass

import json
from datetime import datetime
from mailer import send_itinerary_email

app = FastAPI(title="Voyago Lite API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://localhost:3000",
        "https://voago-app-d.vercel.app",  # Add your actual Vercel URL here
        "https://voago-app-d-prerithjains-projects.vercel.app",  # Alternative Vercel URL format
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "voyago_lite.db"

# --- Database Helper ---
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# --- Models ---
class UserSignup(BaseModel):
    full_name: str
    email: str
    password: str
    confirm_password: str

class UserLogin(BaseModel):
    email: str
    password: str

class RecommendationRequest(BaseModel):
    destination: str
    categories: List[str]
    significance: List[str]
    budget: float
    num_days: int
    preferences: List[str]

class TripCreate(BaseModel):
    user_id: int
    origin: str
    destination: str
    categories: List[str]
    num_days: int
    budget: float
    travel_mode: str
    selected_places: List[str] = [] # List of place names
    start_date: str
    end_date: str
    currency: str = "INR"  # NEW: Currency selection (USD, EUR, GBP, INR, JPY)

class ExpenseCreate(BaseModel):
    trip_id: int
    user_id: int
    category: str
    amount: float
    currency: str
    date: str
    note: str = ""  # Optional field with default empty string
    payer: str  # Required field for who paid
    cleared: bool = False  # Optional field for settlement tracking

# --- Trip Members Model ---
class TripMemberCreate(BaseModel):
    trip_id: int
    name: str
    email: str

# --- Checklist Models ---
class ChecklistItemCreate(BaseModel):
    trip_id: int
    task: str

class ChecklistItemUpdate(BaseModel):
    is_completed: bool

# --- Auth Endpoints ---

@app.post("/api/auth/signup")
def signup(user: UserSignup):
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    hashed = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())
    
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO Users (full_name, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (user.full_name, user.email, hashed.decode('utf-8'), datetime.utcnow().isoformat())
        )
        conn.commit()
        user_id = cur.lastrowid
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    conn.close()
    
    # Send welcome email (mock or real if configured)
    send_itinerary_email(user.email, "Welcome to Voyago Lite", "<h1>Welcome!</h1><p>Thanks for joining Voyago Lite.</p>")
    
    return {"message": "User created successfully", "user_id": user_id}

@app.post("/api/auth/login")
def login(user: UserLogin, response: Response):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM Users WHERE email = ?", (user.email,))
    row = cur.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(user.password.encode('utf-8'), row['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Set session cookie (simple implementation)
    response.set_cookie(key="session_user", value=str(row['id']), httponly=False, samesite='lax')
    
    return {"message": "Login successful", "user": {"id": row['id'], "full_name": row['full_name'], "email": row['email']}}

@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie("session_user")
    return {"message": "Logged out successfully"}

# --- Checklist Endpoints ---

@app.get("/api/trips/{trip_id}/checklist")
def get_checklist(trip_id: int):
    conn = get_db_connection()
    # Create table if not exists (lazy init)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS ChecklistItems (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id INTEGER NOT NULL,
            task TEXT NOT NULL,
            is_completed BOOLEAN DEFAULT 0,
            FOREIGN KEY (trip_id) REFERENCES Trips (id)
        )
    """)
    items = pd.read_sql_query("SELECT * FROM ChecklistItems WHERE trip_id = ?", conn, params=(trip_id,))
    conn.close()
    
    # NEW: Calculate progress percentage (WanderDog feature)
    result = items.to_dict(orient='records')
    if len(result) > 0:
        completed = sum(1 for item in result if item['is_completed'])
        progress = int((completed / len(result)) * 100)
        return {"items": result, "progress": progress, "total": len(result), "completed": completed}
    return {"items": [], "progress": 0, "total": 0, "completed": 0}

@app.post("/api/trips/{trip_id}/checklist")
def add_checklist_item(trip_id: int, item: ChecklistItemCreate):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO ChecklistItems (trip_id, task) VALUES (?, ?)", (trip_id, item.task))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"id": new_id, "trip_id": trip_id, "task": item.task, "is_completed": False}

@app.put("/api/checklist/{item_id}")
def update_checklist_item(item_id: int, item: ChecklistItemUpdate):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE ChecklistItems SET is_completed = ? WHERE id = ?", (item.is_completed, item_id))
    conn.commit()
    conn.close()
    return {"message": "Updated"}

@app.delete("/api/checklist/{item_id}")
def delete_checklist_item(item_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM ChecklistItems WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}

# NEW: Export itinerary (WanderDog feature)
@app.get("/api/trips/{trip_id}/export")
def export_itinerary(trip_id: int, format: str = "json"):
    conn = get_db_connection()
    
    # Get trip details
    trip_df = pd.read_sql_query("SELECT * FROM Trips WHERE id = ?", conn, params=(trip_id,))
    if trip_df.empty:
        conn.close()
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Get itinerary items
    items_df = pd.read_sql_query("SELECT * FROM ItineraryItems WHERE trip_id = ? ORDER BY day, start_time", conn, params=(trip_id,))
    
    # Get checklist
    checklist_df = pd.read_sql_query("SELECT * FROM ChecklistItems WHERE trip_id = ?", conn, params=(trip_id,))
    
    conn.close()
    
    trip_data = trip_df.to_dict(orient='records')[0]
    
    export_data = {
        "trip": trip_data,
        "itinerary": items_df.to_dict(orient='records'),
        "checklist": checklist_df.to_dict(orient='records') if not checklist_df.empty else [],
        "exported_at": datetime.utcnow().isoformat()
    }
    
    if format == "csv":
        # Return CSV format
        csv_data = items_df.to_csv(index=False)
        return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=trip_{trip_id}_itinerary.csv"})
    
    return export_data

# NEW: Surprise Me - Random Destination (using NumPy)
@app.get("/api/surprise-destination")
def get_surprise_destination():
    conn = get_db_connection()
    cities_df = pd.read_sql_query("SELECT DISTINCT City FROM TravelDatasetImported", conn)
    conn.close()
    
    if cities_df.empty:
        return {"city": "Paris", "message": "How about Paris? 🎉"}
    
    # Use NumPy random choice
    random_city = np.random.choice(cities_df['City'].values)
    
    return {
        "city": random_city,
        "message": f"How about {random_city}? 🎉",
        "emoji": "🎲"
    }

# --- Data & Recommendations ---

@app.get("/api/filters")
def get_filters():
    conn = get_db_connection()
    # Get unique values for filters
    df = pd.read_sql_query("SELECT DISTINCT City, State, Type, Significance, Best_Time_to_visit FROM TravelDatasetImported", conn)
    
    # Get city coordinates (approximate center)
    city_coords = pd.read_sql_query("SELECT City, AVG(Latitude) as lat, AVG(Longitude) as lon FROM TravelDatasetImported GROUP BY City", conn)
    
    conn.close()
    
    city_data = city_coords.to_dict(orient='records')
    
    return {
        "cities": sorted(df['City'].dropna().unique().tolist()),
        "city_data": city_data,
        "states": sorted(df['State'].dropna().unique().tolist()),
        "types": sorted(df['Type'].dropna().unique().tolist()),
        "significance": sorted(df['Significance'].dropna().unique().tolist()),
        "best_times": sorted(df['Best_Time_to_visit'].dropna().unique().tolist())
    }

@app.post("/api/recommendations")
def get_recommendations(req: RecommendationRequest):
    conn = get_db_connection()
    df = pd.read_sql_query("SELECT * FROM TravelDatasetImported", conn)
    conn.close()
    
    # 1. Filter by Destination (City or State)
    # Check if destination matches City or State
    mask = (df['City'].str.lower() == req.destination.lower()) | (df['State'].str.lower() == req.destination.lower())
    filtered = df[mask].copy()
    
    if filtered.empty:
        # Fallback: if no exact match, try partial match or return top rated overall
        filtered = df.copy()
    
    # 2. Filter by Categories (Type)
    if req.categories:
        filtered = filtered[filtered['Type'].isin(req.categories)]
        
    # 3. Filter by Significance
    if req.significance:
        filtered = filtered[filtered['Significance'].isin(req.significance)]
        
    if filtered.empty:
        return {"recommendations": []}

    # 4. Compute Cost Estimate
    # travel_mode_factor not passed in recommendation req, assuming average 1.0 for ranking
    travel_mode_factor = 1.0 
    
    # cost_estimate = Entrance_Fee_INR * (1 + 0.2 * (1 - normalized_rating/5)) * travel_mode_factor
    filtered['cost_estimate'] = filtered['Entrance_Fee_INR'] * (1 + 0.2 * (1 - filtered['Google_review_rating']/5.0)) * travel_mode_factor
    
    # day_multiplier = min(1.0, num_days / 3)
    day_multiplier = min(1.0, req.num_days / 3.0)
    
    filtered['estimated_cost'] = np.round(filtered['cost_estimate'] * day_multiplier, 2)
    
    # 5. Compute Utility Score
    # utility_score = (
    #   0.5 * (normalized_rating / 5.0) +
    #   0.3 * (min(1, budget / (estimated_cost + 1)) ) +
    #   0.2 * (1 / (1 + np.log1p(time_needed_to_visit_hrs)))
    # )
    
    # Ensure numeric types
    filtered['Google_review_rating'] = pd.to_numeric(filtered['Google_review_rating'])
    filtered['time_needed_to_visit_hrs'] = pd.to_numeric(filtered['time_needed_to_visit_hrs'])
    
    # Normalize rating 0-5
    min_r = filtered['Google_review_rating'].min()
    max_r = filtered['Google_review_rating'].max()
    if max_r > min_r:
        filtered['normalized_rating'] = (filtered['Google_review_rating'] - min_r) / (max_r - min_r) * 5.0
    else:
        filtered['normalized_rating'] = 5.0

    filtered['utility_score'] = (
        0.5 * (filtered['normalized_rating'] / 5.0) +
        0.3 * (np.minimum(1, req.budget / (filtered['estimated_cost'] + 1))) +
        0.2 * (1 / (1 + np.log1p(filtered['time_needed_to_visit_hrs'])))
    )
    
    # Sort and return top 15
    top_n = filtered.sort_values(by='utility_score', ascending=False).head(15)
    
    return {"recommendations": top_n.to_dict(orient='records')}

# --- Trip Builder ---

@app.post("/api/trips/create")
def create_trip(trip: TripCreate):
    conn = get_db_connection()
    df = pd.read_sql_query("SELECT * FROM TravelDatasetImported", conn)
    
    # 1. Select Places
    if trip.selected_places:
        selected_df = df[df['Name'].isin(trip.selected_places)].copy()
    else:
        # Use recommendation logic if no places selected
        # (Simplified reuse of logic above or call internal function)
        # For now, let's assume user selects places or we pick top 5 from destination
        mask = (df['City'].str.lower() == trip.destination.lower()) | (df['State'].str.lower() == trip.destination.lower())
        selected_df = df[mask].sort_values(by='Google_review_rating', ascending=False).head(5).copy()

    if selected_df.empty:
        conn.close()
        raise HTTPException(status_code=400, detail="No places found for this trip")

    # 2. Greedy Fill Algorithm for Itinerary
    # Sort by rating (proxy for utility here if not computed)
    selected_df = selected_df.sort_values(by='Google_review_rating', ascending=False)
    
    itinerary_items = []
    current_day = 1
    day_time_used = 0
    MAX_HOURS_PER_DAY = 8
    
    # Travel mode factor
    mode_map = {'flight': 1.4, 'train': 1.0, 'road': 0.9, 'bus': 0.8, 'car': 1.2}
    t_factor = mode_map.get(trip.travel_mode.lower(), 1.0)
    
    total_est_cost = 0
    
    for _, place in selected_df.iterrows():
        duration = float(place['time_needed_to_visit_hrs'])
        if duration <= 0: duration = 1.0
        
        if day_time_used + duration > MAX_HOURS_PER_DAY:
            current_day += 1
            day_time_used = 0
            
        if current_day > trip.num_days:
            break # Trip full
            
        # Time arithmetic (Start 9:00 AM)
        start_hour = 9 + day_time_used
        end_hour = start_hour + duration
        
        start_time = f"{int(start_hour):02d}:{(start_hour%1)*60:02.0f}"
        end_time = f"{int(end_hour):02d}:{(end_hour%1)*60:02.0f}"
        
        # Cost
        fee = float(place['Entrance_Fee_INR'])
        rating = float(place['Google_review_rating'])
        # Cost formula
        cost = fee * (1 + 0.2 * (1 - rating/5.0)) * t_factor
        total_est_cost += cost
        
        itinerary_items.append({
            "day": current_day,
            "place_name": place['Name'],
            "start_time": start_time,
            "end_time": end_time,
            "notes": f"Type: {place['Type']}",
            "estimated_cost": round(cost, 2)
        })
        
        day_time_used += duration

    # Transit estimate
    transit_estimate = 500 * t_factor * trip.num_days # Base 500 INR per day transit
    total_trip_cost = total_est_cost + transit_estimate
    
    # 3. Save to DB
    cur = conn.cursor()
    
    # Generate HTML table
    itinerary_df = pd.DataFrame(itinerary_items)
    html_table = itinerary_df.to_html(classes='table table-sm', index=False)
    
    # Insert with start_date and end_date
    cur.execute("""
        INSERT INTO Trips (user_id, origin, destination, category, num_days, budget, travel_mode, itinerary_html, total_cost, created_at, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (trip.user_id, trip.origin, trip.destination, ",".join(trip.categories), trip.num_days, trip.budget, trip.travel_mode, html_table, total_trip_cost, datetime.utcnow().isoformat(), trip.start_date, trip.end_date))
    
    trip_id = cur.lastrowid
    
    # Save Items
    for item in itinerary_items:
        cur.execute("""
            INSERT INTO ItineraryItems (trip_id, day, place_name, start_time, end_time, notes, estimated_cost)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (trip_id, item['day'], item['place_name'], item['start_time'], item['end_time'], item['notes'], item['estimated_cost']))
        
    conn.commit()
    
    # Get User Email
    cur.execute("SELECT email FROM Users WHERE id = ?", (trip.user_id,))
    user_row = cur.fetchone()
    if user_row:
        email_body = f"""
        <h2>Trip Confirmed: {trip.destination}</h2>
        <p><strong>Dates:</strong> {trip.start_date} to {trip.end_date} ({trip.num_days} days)</p>
        <p><strong>Budget:</strong> ₹{trip.budget}</p>
        <p><strong>Total Estimated Cost:</strong> ₹{total_trip_cost:.2f}</p>
        <hr>
        <h3>Your Itinerary</h3>
        {html_table}
        <br>
        <p>Safe Travels!</p>
        """
        send_itinerary_email(user_row['email'], f"Your Trip to {trip.destination}", email_body)
    
    conn.close()
    
    return {
        "trip_id": trip_id,
        "total_cost": total_trip_cost,
        "itinerary": itinerary_items,
        "html": html_table
    }

@app.get("/api/trips/user/{user_id}")
def get_user_trips(user_id: int):
    conn = get_db_connection()
    trips = pd.read_sql_query("SELECT * FROM Trips WHERE user_id = ?", conn, params=(user_id,))
    conn.close()
    return trips.to_dict(orient='records')

@app.delete("/api/trips/{trip_id}")
def delete_trip(trip_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Get trip details for email before deleting
    cur.execute("SELECT * FROM Trips WHERE id = ?", (trip_id,))
    trip = cur.fetchone()
    
    if not trip:
        conn.close()
        raise HTTPException(status_code=404, detail="Trip not found")
        
    # Delete expenses and items first (foreign keys)
    cur.execute("DELETE FROM Expenses WHERE trip_id = ?", (trip_id,))
    cur.execute("DELETE FROM ItineraryItems WHERE trip_id = ?", (trip_id,))
    cur.execute("DELETE FROM Trips WHERE id = ?", (trip_id,))
    conn.commit()
    
    # Send cancellation email
    cur.execute("SELECT email FROM Users WHERE id = ?", (trip['user_id'],))
    user = cur.fetchone()
    if user:
        send_itinerary_email(
            user['email'],
            f"Trip Cancelled: {trip['destination']}",
            f"<p>Your trip to {trip['destination']} has been successfully deleted.</p>"
        )
        
    conn.close()
    return {"message": "Trip deleted successfully"}

@app.get("/api/places")
def get_places(city: str, activity: str = None, kid_friendly: bool = None, max_duration: float = None):
    conn = get_db_connection()
    sql = "SELECT * FROM TravelDatasetImported WHERE City = ? COLLATE NOCASE"
    params = [city]

    if activity:
        sql += " AND Activity_Type = ?"
        params.append(activity)
    if kid_friendly is not None:
        sql += " AND Kid_Friendly = ?"
        params.append('Yes' if kid_friendly else 'No')
    if max_duration:
        sql += " AND time_needed_to_visit_hrs <= ?"
        params.append(max_duration)

    df = pd.read_sql_query(sql, conn, params=params)
    conn.close()
    
    if df.empty:
        return []
        
    # Clean up data for frontend
    df['Google_review_rating'] = pd.to_numeric(df['Google_review_rating'], errors='coerce').fillna(0)
    df['Entrance_Fee_INR'] = pd.to_numeric(df['Entrance_Fee_INR'], errors='coerce').fillna(0)
    df['time_needed_to_visit_hrs'] = pd.to_numeric(df['time_needed_to_visit_hrs'], errors='coerce').fillna(1)
    
    return df.to_dict(orient='records')

# --- Expenses ---

@app.post("/api/expenses")
def add_expense(exp: ExpenseCreate):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO Expenses (trip_id, user_id, category, amount, currency, date, note, payer, cleared)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (exp.trip_id, exp.user_id, exp.category, exp.amount, exp.currency, exp.date, exp.note, exp.payer, exp.cleared))
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return {"message": "Expense added", "id": new_id}

@app.get("/api/trips/{trip_id}/expenses")
def get_trip_expenses(trip_id: int):
    conn = get_db_connection()
    expenses_df = pd.read_sql_query(
        "SELECT * FROM Expenses WHERE trip_id = ? ORDER BY date DESC",
        conn, params=(trip_id,)
    )
    conn.close()
    return expenses_df.to_dict(orient='records')

@app.get("/api/trips/{trip_id}/actually-spent")
def get_actually_spent(trip_id: int):
    """
    Calculate actually spent amount using NumPy.
    Includes: Flight/Travel fees + All expenses
    """
    conn = get_db_connection()
    
    # Get trip details for travel mode and days
    cur = conn.cursor()
    cur.execute("SELECT travel_mode, num_days FROM Trips WHERE id = ?", (trip_id,))
    trip_row = cur.fetchone()
    
    if not trip_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Trip not found")
    
    travel_mode = trip_row['travel_mode']
    num_days = trip_row['num_days']
    
    # Calculate flight/travel fees using NumPy
    mode_costs = {
        'flight': 5000,
        'train': 2000,
        'road': 1500,
        'bus': 1000,
        'car': 3000
    }
    base_travel_cost = mode_costs.get(travel_mode.lower(), 2000)
    
    # Use NumPy to calculate travel cost with day multiplier
    travel_cost_array = np.array([base_travel_cost])
    day_multiplier = np.array([1 + (num_days - 1) * 0.1])  # 10% increase per additional day
    flight_fees = np.sum(travel_cost_array * day_multiplier)
    
    # Get all expenses
    expenses_df = pd.read_sql_query(
        "SELECT amount FROM Expenses WHERE trip_id = ?",
        conn, params=(trip_id,)
    )
    conn.close()
    
    # Use NumPy to sum expenses
    if not expenses_df.empty:
        expenses_array = np.array(expenses_df['amount'].values, dtype=float)
        total_expenses = np.sum(expenses_array)
    else:
        total_expenses = 0.0
    
    # Calculate total actually spent using NumPy
    actually_spent = np.sum(np.array([flight_fees, total_expenses]))
    
    return {
        "actually_spent": round(float(actually_spent), 2),
        "flight_fees": round(float(flight_fees), 2),
        "expenses_total": round(float(total_expenses), 2),
        "breakdown": {
            "travel_mode": travel_mode,
            "num_days": num_days,
            "base_travel_cost": base_travel_cost
        }
    }

@app.delete("/api/trips/{trip_id}/expenses/clear")
def clear_trip_expenses(trip_id: int):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM Expenses WHERE trip_id = ?", (trip_id,))
    deleted_count = cur.rowcount
    conn.commit()
    conn.close()
    return {"message": f"Cleared {deleted_count} expenses", "count": deleted_count}

@app.delete("/api/expenses/{expense_id}")
def delete_expense(expense_id: int):
    """Delete a single expense by ID"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM Expenses WHERE id = ?", (expense_id,))
    deleted_count = cur.rowcount
    conn.commit()
    conn.close()
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted", "id": expense_id}

@app.patch("/api/expenses/{expense_id}")
def update_expense(expense_id: int, data: dict):
    """Update expense fields (e.g., mark as cleared)"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Build dynamic UPDATE query based on provided fields
    allowed_fields = ['cleared', 'note', 'amount', 'category', 'date', 'payer']
    updates = []
    values = []
    
    for field in allowed_fields:
        if field in data:
            updates.append(f"{field} = ?")
            values.append(data[field])
    
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    values.append(expense_id)
    query = f"UPDATE Expenses SET {', '.join(updates)} WHERE id = ?"
    
    cur.execute(query, values)
    updated_count = cur.rowcount
    conn.commit()
    conn.close()
    
    if updated_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return {"message": "Expense updated", "id": expense_id}

# --- Trip Members ---

@app.post("/api/trip-members")
def add_trip_member(member: TripMemberCreate):
    """Add a person to a trip and send them an email invite"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Check if trip exists
    cur.execute("SELECT * FROM Trips WHERE id = ?", (member.trip_id,))
    trip = cur.fetchone()
    if not trip:
        conn.close()
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Check if member already exists
    cur.execute("SELECT * FROM TripMembers WHERE trip_id = ? AND email = ?", (member.trip_id, member.email))
    existing = cur.fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Member already added to this trip")
    
    # Insert member
    cur.execute("""
        INSERT INTO TripMembers (trip_id, name, email, added_at)
        VALUES (?, ?, ?, ?)
    """, (member.trip_id, member.name, member.email, datetime.utcnow().isoformat()))
    conn.commit()
    member_id = cur.lastrowid
    conn.close()
    
    # Send email invite
    email_body = f"""
    <h2>You've been added to a trip!</h2>
    <p>Hi {member.name},</p>
    <p>You've been added to a trip to <strong>{trip['destination']}</strong>!</p>
    <p><strong>Trip Details:</strong></p>
    <ul>
        <li>Destination: {trip['destination']}</li>
        <li>Duration: {trip['num_days']} days</li>
        <li>Budget: ₹{trip['budget']}</li>
    </ul>
    <p>You can now track expenses and collaborate on this trip.</p>
    <p>Happy travels! 🌍</p>
    """
    send_itinerary_email(member.email, f"Trip Invite: {trip['destination']}", email_body)
    
    return {"message": "Member added successfully", "id": member_id, "name": member.name, "email": member.email}

@app.get("/api/trips/{trip_id}/members")
def get_trip_members(trip_id: int):
    """Get all members for a trip"""
    conn = get_db_connection()
    members_df = pd.read_sql_query(
        "SELECT * FROM TripMembers WHERE trip_id = ? ORDER BY added_at",
        conn, params=(trip_id,)
    )
    conn.close()
    return members_df.to_dict(orient='records')

@app.delete("/api/trip-members/{member_id}")
def delete_trip_member(member_id: int):
    """Remove a member from a trip"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM TripMembers WHERE id = ?", (member_id,))
    deleted_count = cur.rowcount
    conn.commit()
    conn.close()
    
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return {"message": "Member removed successfully"}


# --- Session Validation ---
@app.get("/api/auth/validate")
def validate_session(request: Request):
    """Validate if user session is active"""
    session_user = request.cookies.get("session_user")
    if not session_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, full_name, email FROM Users WHERE id = ?", (session_user,))
    user = cur.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    return {
        "user": {
            "id": user['id'],
            "full_name": user['full_name'],
            "email": user['email']
        }
    }

# --- Itinerary Management ---
@app.get("/api/itinerary/{trip_id}")
def get_itinerary_items(trip_id: int):
    """Get all itinerary items for a trip, enriched with lat/lon"""
    conn = get_db_connection()
    query = """
        SELECT ii.*, td.Latitude, td.Longitude, td.Type
        FROM ItineraryItems ii
        LEFT JOIN TravelDatasetImported td ON ii.place_name = td.Name
        WHERE ii.trip_id = ?
        ORDER BY ii.day, ii.start_time
    """
    items = pd.read_sql_query(query, conn, params=(trip_id,))
    conn.close()
    return items.to_dict(orient='records')

@app.put("/api/itinerary/{item_id}")
def update_itinerary_item(item_id: int, item: dict):
    """Update an itinerary item"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        UPDATE ItineraryItems 
        SET day = ?, place_name = ?, start_time = ?, end_time = ?, notes = ?, estimated_cost = ?
        WHERE id = ?
    """, (item.get('day'), item.get('place_name'), item.get('start_time'), 
          item.get('end_time'), item.get('notes'), item.get('estimated_cost'), item_id))
    
    conn.commit()
    conn.close()
    return {"message": "Item updated successfully"}

@app.delete("/api/itinerary/{item_id}")
def delete_itinerary_item(item_id: int):
    """Delete an itinerary item"""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM ItineraryItems WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return {"message": "Item deleted successfully"}

@app.post("/api/itinerary")
def add_itinerary_item(item: dict):
    """Add a new itinerary item"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        INSERT INTO ItineraryItems (trip_id, day, place_name, start_time, end_time, notes, estimated_cost)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (item.get('trip_id'), item.get('day'), item.get('place_name'), 
          item.get('start_time'), item.get('end_time'), item.get('notes'), item.get('estimated_cost')))
    
    conn.commit()
    item_id = cur.lastrowid
    conn.close()
    return {"message": "Item added successfully", "id": item_id}

# --- Places with Coordinates ---

@app.get("/api/places")
def get_places(city: str, activity: str = None, kid_friendly: bool = None, max_duration: float = None):
    conn = get_db_connection()
    sql = "SELECT * FROM TravelDatasetImported WHERE City = ? COLLATE NOCASE"
    params = [city]

    if activity:
        sql += " AND Activity_Type = ?"
        params.append(activity)
    if kid_friendly is not None:
        sql += " AND Kid_Friendly = ?"
        params.append('Yes' if kid_friendly else 'No')
    if max_duration:
        sql += " AND time_needed_to_visit_hrs <= ?"
        params.append(max_duration)

    df = pd.read_sql_query(sql, conn, params=params)
    conn.close()
    
    if df.empty:
        return []
        
    # Clean up data for frontend
    df['Google_review_rating'] = pd.to_numeric(df['Google_review_rating'], errors='coerce').fillna(0)
    df['Entrance_Fee_INR'] = pd.to_numeric(df['Entrance_Fee_INR'], errors='coerce').fillna(0)
    df['time_needed_to_visit_hrs'] = pd.to_numeric(df['time_needed_to_visit_hrs'], errors='coerce').fillna(1)
    
    return df.to_dict(orient='records')

@app.get("/api/places/coordinates")
def get_places_with_coordinates(city: str = None):
    """Get places with latitude and longitude for mapping"""
    conn = get_db_connection()
    
    if city:
        query = "SELECT * FROM TravelDatasetImported WHERE City = ? COLLATE NOCASE"
        df = pd.read_sql_query(query, conn, params=(city,))
    else:
        df = pd.read_sql_query("SELECT * FROM TravelDatasetImported LIMIT 100", conn)
    
    conn.close()
    
    # Add sample coordinates if not in database (for demo purposes)
    # In production, these should come from the database
    if 'Latitude' not in df.columns:
        df['Latitude'] = 28.6139 + (df.index * 0.01)
        df['Longitude'] = 77.2090 + (df.index * 0.01)
    
    return df.to_dict(orient='records')

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
