"""
Array Algorithm Engine
======================
Generates step-by-step state snapshots for array operations.
Each state follows the ArrayState contract from idea.md Section 9.1.
No database calls — pure stateless computation.
"""

import time
import tracemalloc
from typing import List, Tuple


def _make_state(elements: list, highlight, operation: str, message: str, **extra) -> dict:
    """Build a single ArrayState dict."""
    state = {
        "type": "array",
        "elements": list(elements),
        "highlight": highlight,
        "operation": operation,
        "message": message,
    }
    state.update(extra)
    return state


def _measure_start() -> Tuple[float, object]:
    tracemalloc.start()
    return time.perf_counter(), None


def _measure_end(start: float) -> dict:
    current, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start
    return {
        "execution_time_ms": round(elapsed * 1000, 4),
        "memory_usage_kb": round(current / 1024, 4),
    }


# ─── Array Insert ─────────────────────────────────────────────────────────────

def array_insert(array: List[int], index: int, value: int) -> dict:
    """
    Insert `value` at `index`, shifting elements right.
    Returns states[] and performance{}.
    """
    if index < 0 or index > len(array):
        raise ValueError(f"Index {index} is out of bounds for array of length {len(array)}")

    start_time = time.perf_counter()
    tracemalloc.start()

    states = []
    arr = list(array)
    op_count = 0

    # Step 1: start
    states.append(_make_state(arr, None, "start",
                              f"Starting insert of {value} at index {index}",
                              new_value=value))

    # Steps 2..n: shift elements right from end down to index
    arr.append(None)  # placeholder
    for i in range(len(arr) - 1, index, -1):
        arr[i] = arr[i - 1]
        op_count += 1
        
        temp_arr = list(arr)
        temp_arr[i - 1] = None
        
        states.append(_make_state(
            temp_arr,
            i - 1, "shift",
            f"Shifting element {arr[i]} right to make room"
        ))

    # Step final: place the new element
    arr[index] = value
    op_count += 1
    states.append(_make_state(arr, index, "insert",
                              f"Inserted {value} at index {index}",
                              new_value=value))

    current, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start_time

    performance = {
        "execution_time_ms": round(elapsed * 1000, 4),
        "memory_usage_kb": round(current / 1024, 4),
        "operation_count": op_count,
    }

    return {"states": states, "performance": performance}


# ─── Array Delete ─────────────────────────────────────────────────────────────

def array_delete(array: List[int], index: int) -> dict:
    """
    Delete element at `index`, shifting elements left.
    Returns states[] and performance{}.
    """
    if not array:
        raise ValueError("Cannot delete from an empty array")
    if index < 0 or index >= len(array):
        raise ValueError(f"Index {index} is out of bounds for array of length {len(array)}")

    start_time = time.perf_counter()
    tracemalloc.start()

    states = []
    arr = list(array)
    op_count = 0
    target_val = arr[index]

    # Step 1: start
    states.append(_make_state(arr, None, "start",
                              f"Starting deletion at index {index}"))

    # Step 2: target
    states.append(_make_state(arr, index, "target",
                              f"Targeting element {target_val} at index {index} for deletion"))
    op_count += 1

    # Step 3: delete (shift left)
    new_arr = arr[:index] + arr[index + 1:]
    op_count += len(arr) - index - 1
    states.append(_make_state(new_arr, max(0, index - 1) if new_arr else None,
                              "delete",
                              f"Deleted {target_val}, shifted elements left"))

    current, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start_time

    performance = {
        "execution_time_ms": round(elapsed * 1000, 4),
        "memory_usage_kb": round(current / 1024, 4),
        "operation_count": op_count,
    }

    return {"states": states, "performance": performance}


# ─── Array Search ─────────────────────────────────────────────────────────────

def array_search(array: List[int], value: int) -> dict:
    """
    Linear search for `value` in array.
    Returns states[], performance{}, found: bool, index: int|None.
    """
    start_time = time.perf_counter()
    tracemalloc.start()

    states = []
    arr = list(array)
    op_count = 0
    found_index = None

    # Step 1: start
    states.append(_make_state(arr, None, "start",
                              f"Starting linear search for {value}",
                              comparison_value=value))

    # Steps: compare each element
    for i, elem in enumerate(arr):
        op_count += 1
        if elem == value:
            states.append(_make_state(arr, i, "found",
                                      f"Found {value} at index {i}!",
                                      comparison_value=value))
            found_index = i
            break
        else:
            states.append(_make_state(arr, i, "compare",
                                      f"Comparing {elem} with target {value} — not equal",
                                      comparison_value=value))
    else:
        states.append(_make_state(arr, None, "not_found",
                                  f"{value} not found in the array",
                                  comparison_value=value))

    current, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start_time

    performance = {
        "execution_time_ms": round(elapsed * 1000, 4),
        "memory_usage_kb": round(current / 1024, 4),
        "operation_count": op_count,
    }

    return {
        "states": states,
        "performance": performance,
        "found": found_index is not None,
        "index": found_index,
    }
