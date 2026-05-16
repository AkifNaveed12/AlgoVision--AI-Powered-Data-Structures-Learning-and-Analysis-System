from fastapi import APIRouter, HTTPException
from backend.models.auth_models import SignupRequest, LoginRequest, UserResponse, AuthResponse
from backend.services.supabase_service import supabase, get_current_user, get_user_profile
from fastapi import Depends

router = APIRouter()


@router.post("/signup")
async def signup(req: SignupRequest):
    """Register a new user via Supabase Auth."""
    try:
        # Using admin.create_user because the backend Supabase client is initialized with the Service Role Key
        res = supabase.auth.admin.create_user({
            "email": req.email, 
            "password": req.password,
            "email_confirm": True # Auto-confirms the email so they can log in instantly
        })
        if res.user is None:
            raise HTTPException(status_code=400, detail="Signup failed — email may already be registered")

        user_id = str(res.user.id)

        # Update full_name if provided (trigger already inserted email row)
        if req.full_name:
            try:
                supabase.table("users").update({"full_name": req.full_name}).eq("id", user_id).execute()
            except Exception:
                pass  # Non-critical

        return {"message": "Signup successful. Please check your email to confirm.", "user_id": user_id}

    except HTTPException:
        raise
    except Exception as e:
        err = str(e)
        if "already registered" in err.lower() or "already been registered" in err.lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail=f"Signup failed: {err}")


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Authenticate and return Supabase JWT."""
    try:
        res = supabase.auth.sign_in_with_password({"email": req.email, "password": req.password})
        if not res.session:
            raise HTTPException(status_code=400, detail="Invalid email or password")

        user = res.user
        profile = get_user_profile(str(user.id))

        return {
            "access_token": res.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": profile.get("full_name"),
                "created_at": str(user.created_at) if user.created_at else None,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        err = str(e)
        if "invalid" in err.lower() or "credentials" in err.lower():
            raise HTTPException(status_code=400, detail="Invalid email or password")
        raise HTTPException(status_code=400, detail=f"Login failed: {err}")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user=Depends(get_current_user)):
    """Return current user's profile (protected)."""
    profile = get_user_profile(str(current_user.id))
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": profile.get("full_name"),
        "created_at": str(current_user.created_at) if current_user.created_at else None,
    }
