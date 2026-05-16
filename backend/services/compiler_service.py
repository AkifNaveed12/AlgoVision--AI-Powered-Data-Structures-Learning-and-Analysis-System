"""
compiler_service.py
-------------------
Subprocess-based code execution engine for AlgoVision.
Replaces Judge0 entirely. Works natively on Windows + FastAPI.

Supported Languages (same IDs as before so frontend needs no changes):
  71 → Python 3
  54 → C++ (g++)
  62 → Java
  63 → JavaScript (Node.js)
  50 → C (gcc)
"""

import asyncio
import os
import shutil
import subprocess
import tempfile
import time
from typing import Optional

# ── Language Configuration ────────────────────────────────────────────────────

LANGUAGE_CONFIG = {
    # Python 3
    71: {
        "name": "Python 3",
        "extension": ".py",
        "compile_cmd": None,                        # interpreted — no compile step
        # Docker/Linux uses 'python3'; Windows local dev uses 'py' as fallback
        "run_cmd": ["python3", "{file}"],
        "run_cmd_alt": ["py", "{file}"],
    },
    # C++ (GCC) — available inside Docker; on Windows install MinGW
    54: {
        "name": "C++ (GCC)",
        "extension": ".cpp",
        "compile_cmd": ["g++", "-o", "{exe}", "{file}", "-std=c++17"],
        "run_cmd": ["{exe}"],
    },
    # C (GCC)
    50: {
        "name": "C (GCC)",
        "extension": ".c",
        "compile_cmd": ["gcc", "-o", "{exe}", "{file}"],
        "run_cmd": ["{exe}"],
    },
    # Java
    62: {
        "name": "Java",
        "extension": ".java",
        # javac needs the file; class name must match filename (Main)
        "compile_cmd": ["javac", "{file}"],
        "run_cmd": ["java", "-cp", "{dir}", "Main"],
    },
    # JavaScript (Node.js)
    63: {
        "name": "JavaScript (Node.js)",
        "extension": ".js",
        "compile_cmd": None,
        "run_cmd": ["node", "{file}"],
    },
}

TIMEOUT_SECONDS = 10   # Max execution time per submission


# ── Helper ────────────────────────────────────────────────────────────────────

def _resolve_cmd(template: list[str], file: str, exe: str, dir_: str) -> list[str]:
    """Replace {file}, {exe}, {dir} placeholders in a command list."""
    return [
        part.replace("{file}", file)
            .replace("{exe}", exe)
            .replace("{dir}", dir_)
        for part in template
    ]


def _run_subprocess(cmd: list[str], stdin_data: str, timeout: int, cwd: str = None) -> dict:
    """Run a command, capture stdout/stderr, enforce timeout."""
    start = time.perf_counter()
    try:
        proc = subprocess.run(
            cmd,
            input=stdin_data,
            capture_output=True,
            text=True,
            timeout=timeout,
            cwd=cwd,
        )
        elapsed = time.perf_counter() - start
        return {
            "stdout": proc.stdout or None,
            "stderr": proc.stderr or None,
            "returncode": proc.returncode,
            "time_ms": round(elapsed * 1000, 2),
            "timed_out": False,
        }
    except subprocess.TimeoutExpired:
        return {
            "stdout": None,
            "stderr": f"Execution timed out after {timeout} seconds.",
            "returncode": -1,
            "time_ms": timeout * 1000,
            "timed_out": True,
        }
    except FileNotFoundError as e:
        return {
            "stdout": None,
            "stderr": f"Compiler/interpreter not found: {e}. Please ensure it is installed and on your PATH.",
            "returncode": -1,
            "time_ms": 0,
            "timed_out": False,
        }


# ── Main Execution Function ───────────────────────────────────────────────────

async def execute_code(source_code: str, language_id: int, stdin: str = "") -> dict:
    """
    Execute source_code for the given language_id.
    Returns a dict matching the old Judge0 response schema:
      { stdout, stderr, compile_output, status, time, memory }
    """
    config = LANGUAGE_CONFIG.get(language_id)
    if config is None:
        return {
            "stdout": None,
            "stderr": None,
            "compile_output": f"Language ID {language_id} is not supported.",
            "status": "Compilation Error",
            "time": None,
            "memory": None,
        }

    # Run blocking I/O in a thread pool so FastAPI stays async
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, _execute_sync, source_code, config, stdin)
    return result


def _execute_sync(source_code: str, config: dict, stdin: str) -> dict:
    """Synchronous execution — runs in a thread pool executor."""
    tmp_dir = tempfile.mkdtemp(prefix="algovision_")
    try:
        extension = config["extension"]

        # Java requires the public class to be named Main
        if extension == ".java":
            filename = "Main.java"
        else:
            filename = f"code{extension}"

        src_file = os.path.join(tmp_dir, filename)
        exe_file = os.path.join(tmp_dir, "code_exe")
        if os.name == "nt":          # Windows executable has .exe extension
            exe_file += ".exe"

        # Write source code to temp file
        with open(src_file, "w", encoding="utf-8") as f:
            f.write(source_code)

        # ── Compile Step (if needed) ──────────────────────────────────────────
        compile_output: Optional[str] = None
        if config["compile_cmd"]:
            compile_cmd = _resolve_cmd(config["compile_cmd"], src_file, exe_file, tmp_dir)
            compile_result = _run_subprocess(compile_cmd, "", TIMEOUT_SECONDS, cwd=tmp_dir)

            if compile_result["returncode"] != 0:
                # Compilation failed
                return {
                    "stdout": None,
                    "stderr": compile_result["stderr"],
                    "compile_output": compile_result["stderr"] or compile_result["stdout"],
                    "status": "Compilation Error",
                    "time": None,
                    "memory": None,
                }
            compile_output = compile_result["stderr"]   # g++ sometimes writes warnings here

        # ── Run Step ─────────────────────────────────────────────────────────
        run_cmd = _resolve_cmd(config["run_cmd"], src_file, exe_file, tmp_dir)
        run_result = _run_subprocess(run_cmd, stdin, TIMEOUT_SECONDS, cwd=tmp_dir)

        # Try alternate command (e.g. python3 on Linux) if primary not found
        if run_result["returncode"] == -1 and "not found" in (run_result["stderr"] or "") \
                and config.get("run_cmd_alt"):
            alt_cmd = _resolve_cmd(config["run_cmd_alt"], src_file, exe_file, tmp_dir)
            run_result = _run_subprocess(alt_cmd, stdin, TIMEOUT_SECONDS, cwd=tmp_dir)

        # ── Determine Status ──────────────────────────────────────────────────
        if run_result["timed_out"]:
            status = "Time Limit Exceeded"
        elif run_result["returncode"] == 0:
            status = "Accepted"
        else:
            status = "Runtime Error"

        return {
            "stdout": run_result["stdout"],
            "stderr": run_result["stderr"],
            "compile_output": compile_output,
            "status": status,
            "time": str(round(run_result["time_ms"] / 1000, 3)),   # seconds string (Judge0 compat)
            "memory": None,   # subprocess doesn't measure memory easily — set to None
        }

    finally:
        # Always clean up temp files
        try:
            shutil.rmtree(tmp_dir, ignore_errors=True)
        except Exception:
            pass
