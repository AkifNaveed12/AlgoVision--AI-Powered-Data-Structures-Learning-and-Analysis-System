import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
import time

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

print(f"Connecting to {url}...")
supabase: Client = create_client(url, key)

print("Testing DB...")
start = time.time()
try:
    res = supabase.table("users").select("*").limit(1).execute()
    print(f"DB Success in {time.time()-start:.2f}s")
except Exception as e:
    print(f"DB Error: {e}")

print("Testing Auth...")
start = time.time()
try:
    # Just passing invalid credentials to see if we get a response or a timeout
    res = supabase.auth.sign_in_with_password({"email": "test@test.com", "password": "wrong"})
    print("Auth Success")
except Exception as e:
    print(f"Auth Error: {e} (took {time.time()-start:.2f}s)")
