import httpx
import base64
import asyncio
from fastapi import HTTPException
from backend.config import settings

HEADERS = {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": settings.JUDGE0_API_KEY,
    "X-RapidAPI-Host": settings.JUDGE0_HOST,
}

STATUS_MAP = {
    1: "In Queue",
    2: "Processing",
    3: "Accepted",
    4: "Wrong Answer",
    5: "Time Limit Exceeded",
    6: "Compilation Error",
    11: "Runtime Error",
}


def _encode(text: str) -> str:
    return base64.b64encode(text.encode("utf-8")).decode("utf-8")


def _decode(val) -> str | None:
    if val is None:
        return None
    try:
        return base64.b64decode(val).decode("utf-8")
    except Exception:
        return str(val)


def _decode_result(data: dict) -> dict:
    status_id = data.get("status", {}).get("id", 0)
    status_desc = data.get("status", {}).get("description", "Unknown")

    return {
        "stdout": _decode(data.get("stdout")),
        "stderr": _decode(data.get("stderr")),
        "compile_output": _decode(data.get("compile_output")),
        "status": status_desc,
        "time": data.get("time"),
        "memory": data.get("memory"),
    }


async def execute_code(source_code: str, language_id: int, stdin: str = "") -> dict:
    """
    Submit code to Judge0, poll until done, return decoded result.
    Polls every 1s, max 10 attempts (10s timeout).
    """
    if not settings.JUDGE0_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Code execution service not configured yet (JUDGE0_API_KEY missing)"
        )

    encoded_source = _encode(source_code)
    encoded_stdin = _encode(stdin)

    async with httpx.AsyncClient() as client:
        # Step 1: Submit
        try:
            submit_res = await client.post(
                f"{settings.JUDGE0_API_URL}/submissions",
                headers=HEADERS,
                params={"base64_encoded": "true", "wait": "false"},
                json={
                    "source_code": encoded_source,
                    "language_id": language_id,
                    "stdin": encoded_stdin,
                },
                timeout=15,
            )
            submit_res.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=503, detail=f"Judge0 submission failed: {e.response.status_code}")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Compiler service temporarily unavailable")

        token = submit_res.json().get("token")
        if not token:
            raise HTTPException(status_code=503, detail="Judge0 did not return a submission token")

        # Step 2: Poll
        for _ in range(10):
            await asyncio.sleep(1)
            try:
                poll_res = await client.get(
                    f"{settings.JUDGE0_API_URL}/submissions/{token}",
                    headers=HEADERS,
                    params={
                        "base64_encoded": "true",
                        "fields": "stdout,stderr,status,time,memory,compile_output",
                    },
                    timeout=10,
                )
                poll_res.raise_for_status()
            except Exception:
                continue

            data = poll_res.json()
            status_id = data.get("status", {}).get("id", 0)

            if status_id not in [1, 2]:  # Not In Queue, not Processing
                return _decode_result(data)

    return {
        "status": "Timeout",
        "stdout": None,
        "stderr": "Execution timed out after 10 seconds",
        "compile_output": None,
        "time": None,
        "memory": None,
    }
