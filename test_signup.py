import asyncio
from backend.services.supabase_service import supabase

async def test_admin_signup():
    try:
        res = supabase.auth.admin.create_user({
            "email": "testuser_admin@gmail.com",
            "password": "password123",
            "email_confirm": True
        })
        print("Success Admin Create:", res)
    except Exception as e:
        print("Error Admin Create:", repr(e))

asyncio.run(test_admin_signup())
