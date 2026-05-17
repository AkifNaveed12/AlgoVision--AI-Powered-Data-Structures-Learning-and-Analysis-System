"""
Linked List Algorithm Engine
=============================
Generates step-by-step state snapshots for linked list operations.
Each state follows the LinkedListState contract from idea.md Section 9.2.
Linked list is represented as a plain Python list — backend is stateless.
"""

import time
import tracemalloc
from typing import List, Optional


def _make_state(nodes: list, highlight, active_pointer: str,
                operation: str, message: str, **extra) -> dict:
    """Build a single LinkedListState dict."""
    state = {
        "type": "linkedlist",
        "nodes": list(nodes),
        "highlight": highlight,
        "active_pointer": active_pointer,
        "operation": operation,
        "message": message,
    }
    state.update(extra)
    return state


# ─── Linked List Insert ───────────────────────────────────────────────────────

def linkedlist_insert(nodes: List[int], value: int, position: int) -> dict:
    """
    Insert `value` at `position` (0-indexed).
    0 = head, len(nodes) = tail.
    """
    if position < 0 or position > len(nodes):
        raise ValueError(f"Position {position} is out of range for list of length {len(nodes)}")

    start_time = time.perf_counter()
    tracemalloc.start()

    states = []
    arr = list(nodes)
    op_count = 0

    # Step 1: start
    states.append(_make_state(arr, None, "head", "start",
                              f"Starting insert of {value} at position {position}"))

    if position == 0:
        # Head insert — no traversal
        new_arr = [value] + arr
        op_count += 1
        states.append(_make_state(new_arr, value, "new_node", "insert",
                                  f"New node {value} inserted at head"))
    else:
        # Traverse to position - 1
        for i in range(position):
            op_count += 1
            states.append(_make_state(arr, arr[i] if i < len(arr) else None,
                                      "current", "traverse",
                                      f"Traversing to position {i} — at node {arr[i] if i < len(arr) else 'NULL'}"))

        # Insert
        new_arr = arr[:position] + [value] + arr[position:]
        op_count += 1
        states.append(_make_state(new_arr, value, "new_node", "insert",
                                  f"New node {value} inserted at position {position}"))

    current, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start_time

    performance = {
        "execution_time_ms": round(elapsed * 1000, 4),
        "memory_usage_kb": round(current / 1024, 4),
        "operation_count": op_count,
    }

    return {"states": states, "performance": performance}


# ─── Linked List Delete ───────────────────────────────────────────────────────

def linkedlist_delete(nodes: List[int], value: int) -> dict:
    """
    Delete the first occurrence of `value` in the linked list.
    """
    start_time = time.perf_counter()
    tracemalloc.start()

    states = []
    arr = list(nodes)
    op_count = 0
    found = False

    # Step 1: start
    states.append(_make_state(arr, None, "head", "start",
                              f"Starting search-and-delete for value {value}"))

    for i, node_val in enumerate(arr):
        op_count += 1
        if node_val == value:
            states.append(_make_state(arr, node_val, "current", "compare",
                                      f"Found {node_val} at position {i} — deleting"))
            new_arr = arr[:i] + arr[i + 1:]
            states.append(_make_state(new_arr, None, None, "delete",
                                      f"Deleted node {value}. List updated."))
            found = True
            break
        else:
            states.append(_make_state(arr, node_val, "current", "compare",
                                      f"Node {node_val} ≠ {value} — moving forward"))

    if not found:
        states.append(_make_state(arr, None, None, "not_found",
                                  f"Value {value} not found in the linked list"))

    current, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start_time

    performance = {
        "execution_time_ms": round(elapsed * 1000, 4),
        "memory_usage_kb": round(current / 1024, 4),
        "operation_count": op_count,
    }

    return {"states": states, "performance": performance, "found": found}


# ─── Linked List Search ───────────────────────────────────────────────────────

def linkedlist_search(nodes: List[int], value: int) -> dict:
    """
    Linear search for `value` in the linked list.
    Returns states[], performance{}, found: bool, result_node: int|None.
    """
    start_time = time.perf_counter()
    tracemalloc.start()

    states = []
    arr = list(nodes)
    op_count = 0
    result_node = None

    # Step 1: start
    states.append(_make_state(arr, None, "head", "start",
                              f"Starting search for value {value}"))

    for i, node_val in enumerate(arr):
        op_count += 1
        if node_val == value:
            states.append(_make_state(arr, node_val, "current", "found",
                                      f"Found {value} at position {i}!"))
            result_node = node_val
            break
        else:
            states.append(_make_state(arr, node_val, "current", "compare",
                                      f"Node {node_val} ≠ {value} — moving to next"))
    else:
        states.append(_make_state(arr, None, None, "not_found",
                                  f"Value {value} not found in the linked list"))

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
        "found": result_node is not None,
        "result_node": result_node,
    }
