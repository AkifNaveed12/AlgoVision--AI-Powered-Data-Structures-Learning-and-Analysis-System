# AlgoVision — Authentication Audit Report
**Audit Date:** 2026-11-10  
**Branch:** ui-rehabilitation-phase1

---

## Architecture Overview

The authentication system uses a **hybrid dual-layer approach**:

1. **FastAPI backend** handles signup/login by calling Supabase Auth admin APIs
2. **Supabase JS client** on the frontend restores sessions and listens for auth state changes
3. **JWT tokens** (Supabase-issued) stored in `localStorage` and sent as `Authorization: Bearer` headers

```
Frontend                     Backend                      Supabase
  |                             |                             |
  |-- POST /auth/signup ------->|                             |
  |                             |-- admin.create_user ------->|
  |                             |     (or sign_up fallback)   |
  |<--- { message, user_id } ---|                             |
  |                             |                             |
  |-- POST /auth/login -------->|                             |
  |                             |-- sign_in_with_password --->|
  |                             |<--- session + user ---------|
  |<--- { access_token, user } -|                             |
  |                             |                             |
  | stores token in localStorage                              |
  | supabase.auth.getSession() restores on page load          |
```

---

## Identified Authentication Issues

### Issue 1: SIGNUP FAILURE — Root Cause Identified ⛔

**Symptom:** "Signup failed. Please try again." — as shown in the uploaded screenshot.

**Root cause analysis:**

The backend `auth.py` signup flow:
1. Tries `supabase.auth.admin.create_user()` first (requires service-role key)
2. Falls back to `supabase.auth.sign_up()` on `"User not allowed"` error

**Problem:** The `SUPABASE_KEY` in `backend/config.py` → loaded from `.env` → the env file has `SUPABASE_KEY` (which may be the **anon key**, not the **service-role key**).

The backend also has `SUPABASE_SVC_KEY` in `.env` but `config.py` doesn't load it. The `supabase_service.py` creates the client with `settings.SUPABASE_KEY` — if this is the anon key, `admin.create_user` will fail with an auth error (not "User not allowed"), causing the exception to propagate without hitting the fallback.

**Additionally:** When `sign_up()` is used (the fallback), Supabase sends a **confirmation email**. The user must confirm before they can log in. The signup form shows "Please check your email to confirm" — but if the Supabase project has email confirmation enabled and the user tries to log in before confirming, login will fail with "Invalid credentials." This is expected behavior but the UX doesn't make it clear enough.

**Secondary issue:** Even if the anon key is used and `sign_up()` succeeds, returning `res.user` checks for `None` — but Supabase `sign_up()` returns a user even before email confirmation. So `user_id` extraction should work. The error must be in the initial `admin.create_user()` failing with something other than "User not allowed".

**Fix:** 
- Verify which key type is in `SUPABASE_KEY`
- If anon key: either switch to service-role key OR improve fallback error detection
- Add specific catch for `AuthApiError` to always fall back to `sign_up()`
- Improve UX to clearly communicate email confirmation requirement

### Issue 2: SESSION DUAL-TRACKING INCONSISTENCY ⚠️

The frontend tracks sessions in two places:
1. `localStorage.access_token` — set by `login()` from FastAPI response
2. Supabase session — managed by `supabase.auth.onAuthStateChange()`

**Problem:** `login()` calls FastAPI (which calls `supabase.auth.sign_in_with_password()`), gets back the JWT, and stores it. BUT the Supabase JS client on the frontend doesn't know about this sign-in — it wasn't triggered by `supabase.auth.signInWithPassword()` on the client side.

So `supabase.auth.onAuthStateChange()` won't fire for logins done through the backend. The session is only partially tracked.

**Impact:** 
- On page refresh, `supabase.auth.getSession()` may return null (no Supabase client session), so the user gets logged out even though `localStorage.access_token` is set
- OR: `getSession()` returns a session if the backend token is a valid Supabase JWT that the client recognizes

**Fix:** After FastAPI login, also call `supabase.auth.setSession({ access_token, refresh_token })` on the frontend, OR have the backend return the refresh_token alongside the access_token.

### Issue 3: LOGOUT PARTIAL CLEAR ⚠️

`logout()` calls `supabase.auth.signOut()` + removes `access_token` from localStorage. This is correct. No issues found.

### Issue 4: MISSING PASSWORD SHOW/HIDE ℹ️

Both Login and Signup forms lack show/hide password toggle. Minor UX issue.

### Issue 5: NO EMAIL VALIDATION FEEDBACK ℹ️

Client-side only validates via `type="email"` HTML attribute. No real-time Zod validation.

---

## Backend Auth Endpoint Analysis

### POST /auth/signup
- Tries admin create (service-role) → falls back to standard signup
- Returns `{ message, user_id }` — does NOT return a session/token
- Frontend redirects to login after 3 seconds
- **Issue:** If Supabase requires email confirmation, users will be confused when they try to log in

### POST /auth/login
- Calls `supabase.auth.sign_in_with_password()`
- Returns `{ access_token, token_type, user }` with user profile data
- Token is a valid Supabase JWT — should work for both Supabase client and API calls

### GET /auth/me
- Verifies Bearer token via `supabase.auth.get_user(token)` — correct
- Returns user profile from public.users table

---

## Recommended Fixes

### Fix 1: Improve signup error handling (backend)
```python
# In auth.py signup, catch all exceptions and always fall back:
try:
    res = supabase.auth.admin.create_user({...})
except Exception:
    res = supabase.auth.sign_up({...})  # always fall back
```

### Fix 2: Set Supabase client session after FastAPI login (frontend)
```javascript
// In AuthContext.jsx login():
const res = await api.post('/auth/login', { email, password })
localStorage.setItem('access_token', res.data.access_token)
// If backend returns refresh_token, also set Supabase session:
// await supabase.auth.setSession({ access_token, refresh_token })
setUser(res.data.user)
```

### Fix 3: Check if SUPABASE_KEY is service-role or anon key
- If anon key: either use service-role for admin operations OR always use `sign_up()`
- Document the expected key type in `.env.example`

---

## Test Matrix

| Test | Expected | Status |
|---|---|---|
| Signup with valid email/password | Account created, redirect to login | ❌ Failing |
| Signup with existing email | "Email already registered" error | Untested |
| Login with valid credentials | Redirect to home, navbar shows user | ✅ Expected to work |
| Login with wrong password | "Invalid email or password" | ✅ Expected to work |
| Login with unconfirmed email | Clear error message | ⚠️ Unclear UX |
| Page refresh while logged in | Stay logged in | ⚠️ Potential issue |
| Protected route while logged out | Redirect to /login | ✅ Works |
| Logout | Clear session, redirect to login | ✅ Works |
