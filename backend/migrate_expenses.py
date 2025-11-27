import sqlite3

# Add payer and cleared columns to Expenses table

DB_PATH = "voyago_lite.db"

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

try:
    # Add payer column
    cur.execute("ALTER TABLE Expenses ADD COLUMN payer TEXT DEFAULT 'Unknown'")
    print("✅ Added 'payer' column to Expenses table")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("⚠️  'payer' column already exists")
    else:
        print(f"❌ Error adding payer column: {e}")

try:
    # Add cleared column
    cur.execute("ALTER TABLE Expenses ADD COLUMN cleared BOOLEAN DEFAULT 0")
    print("✅ Added 'cleared' column to Expenses table")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("⚠️  'cleared' column already exists")
    else:
        print(f"❌ Error adding cleared column: {e}")

conn.commit()
conn.close()

print("\n🎉 Database migration complete!")
print("You can now restart the backend server.")
