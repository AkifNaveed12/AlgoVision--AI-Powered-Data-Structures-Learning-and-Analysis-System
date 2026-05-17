"""
Sorting & Binary Search Algorithm Engine
=========================================
Generates step-by-step state snapshots for sorting and binary search.
Each state follows array format from idea.md Section 9.1.
No database calls — pure stateless computation.

Supported sorting algorithms (Version 3):
- Bubble Sort
- Selection Sort
- Insertion Sort
- Merge Sort
- Quick Sort

Binary Search (Version 3).
"""

import time
import tracemalloc
from typing import List, Optional, Tuple


def _make_state(elements: list, highlight, operation: str, message: str, **extra) -> dict:
    """Build a single ArrayState dict (same contract as array_engine)."""
    state = {
        "type": "array",
        "elements": list(elements),
        "highlight": highlight,
        "operation": operation,
        "message": message,
    }
    state.update(extra)
    return state


def _make_sort_state(elements: list, highlight, highlight2, sorted_indices: list,
                     operation: str, message: str) -> dict:
    """Extended state for sorting with multiple highlights."""
    return {
        "type": "array",
        "elements": list(elements),
        "highlight": highlight,          # primary highlighted index
        "highlight2": highlight2,        # secondary highlighted index (comparison partner)
        "sorted_indices": sorted_indices,  # indices that are finalized/sorted
        "operation": operation,
        "message": message,
    }


# ─── Bubble Sort ──────────────────────────────────────────────────────────────

def bubble_sort(array: List[int]) -> dict:
    """Bubble Sort with step-by-step state generation."""
    start_time = time.perf_counter()
    tracemalloc.start()

    arr = list(array)
    n = len(arr)
    states = []
    op_count = 0
    sorted_indices = []

    states.append(_make_sort_state(arr, None, None, [],
                                   "start", f"Starting Bubble Sort on {arr}"))

    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            op_count += 1
            # Compare
            states.append(_make_sort_state(
                arr, j, j + 1, list(sorted_indices),
                "compare", f"Comparing arr[{j}]={arr[j]} and arr[{j+1}]={arr[j+1]}"
            ))

            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
                states.append(_make_sort_state(
                    arr, j, j + 1, list(sorted_indices),
                    "swap", f"Swapped {arr[j+1]} and {arr[j]} — {arr[j+1]} was larger"
                ))

        sorted_indices.append(n - i - 1)
        states.append(_make_sort_state(
            arr, None, None, list(sorted_indices),
            "sorted_partial", f"Position {n-i-1} is now sorted with value {arr[n-i-1]}"
        ))

        if not swapped:
            break

    states.append(_make_sort_state(arr, None, None, list(range(n)),
                                   "done", f"Bubble Sort complete! Sorted: {arr}"))

    current_mem, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start_time

    return {
        "states": states,
        "performance": {
            "execution_time_ms": round(elapsed * 1000, 4),
            "memory_usage_kb": round(current_mem / 1024, 4),
            "operation_count": op_count,
        },
        "sorted_array": arr,
    }


# ─── Selection Sort ───────────────────────────────────────────────────────────

def selection_sort(array: List[int]) -> dict:
    """Selection Sort with step-by-step state generation."""
    start_time = time.perf_counter()
    tracemalloc.start()

    arr = list(array)
    n = len(arr)
    states = []
    op_count = 0
    sorted_indices = []

    states.append(_make_sort_state(arr, None, None, [],
                                   "start", f"Starting Selection Sort on {arr}"))

    for i in range(n):
        min_idx = i
        states.append(_make_sort_state(
            arr, i, None, list(sorted_indices),
            "select", f"Finding minimum in arr[{i}..{n-1}]"
        ))

        for j in range(i + 1, n):
            op_count += 1
            states.append(_make_sort_state(
                arr, min_idx, j, list(sorted_indices),
                "compare", f"Comparing current min arr[{min_idx}]={arr[min_idx]} with arr[{j}]={arr[j]}"
            ))
            if arr[j] < arr[min_idx]:
                min_idx = j
                states.append(_make_sort_state(
                    arr, min_idx, j, list(sorted_indices),
                    "new_min", f"New minimum found: arr[{min_idx}]={arr[min_idx]}"
                ))

        if min_idx != i:
            arr[i], arr[min_idx] = arr[min_idx], arr[i]
            states.append(_make_sort_state(
                arr, i, min_idx, list(sorted_indices),
                "swap", f"Swapped arr[{i}]={arr[i]} with arr[{min_idx}]={arr[min_idx]}"
            ))

        sorted_indices.append(i)
        states.append(_make_sort_state(
            arr, i, None, list(sorted_indices),
            "sorted_partial", f"Position {i} is now sorted with minimum value {arr[i]}"
        ))

    states.append(_make_sort_state(arr, None, None, list(range(n)),
                                   "done", f"Selection Sort complete! Sorted: {arr}"))

    current_mem, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start_time

    return {
        "states": states,
        "performance": {
            "execution_time_ms": round(elapsed * 1000, 4),
            "memory_usage_kb": round(current_mem / 1024, 4),
            "operation_count": op_count,
        },
        "sorted_array": arr,
    }


# ─── Insertion Sort ───────────────────────────────────────────────────────────

def insertion_sort(array: List[int]) -> dict:
    """Insertion Sort with step-by-step state generation."""
    start_time = time.perf_counter()
    tracemalloc.start()

    arr = list(array)
    n = len(arr)
    states = []
    op_count = 0

    states.append(_make_sort_state(arr, None, None, [0],
                                   "start", f"Starting Insertion Sort on {arr}"))

    for i in range(1, n):
        key = arr[i]
        j = i - 1

        states.append(_make_sort_state(
            arr, i, None, list(range(i)),
            "select", f"Inserting key={key} (arr[{i}]) into sorted portion arr[0..{i-1}]"
        ))

        while j >= 0 and arr[j] > key:
            op_count += 1
            states.append(_make_sort_state(
                arr, j, j + 1, list(range(j + 1)),
                "compare", f"arr[{j}]={arr[j]} > key={key} — shift right"
            ))
            arr[j + 1] = arr[j]
            j -= 1

        arr[j + 1] = key
        op_count += 1
        states.append(_make_sort_state(
            arr, j + 1, None, list(range(i + 1)),
            "insert", f"Placed key={key} at position {j+1}"
        ))

    states.append(_make_sort_state(arr, None, None, list(range(n)),
                                   "done", f"Insertion Sort complete! Sorted: {arr}"))

    current_mem, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start_time

    return {
        "states": states,
        "performance": {
            "execution_time_ms": round(elapsed * 1000, 4),
            "memory_usage_kb": round(current_mem / 1024, 4),
            "operation_count": op_count,
        },
        "sorted_array": arr,
    }


# ─── Merge Sort ───────────────────────────────────────────────────────────────

def merge_sort(array: List[int]) -> dict:
    """Merge Sort with step-by-step state generation."""
    start_time = time.perf_counter()
    tracemalloc.start()

    arr = list(array)
    n = len(arr)
    states = []
    op_count = [0]

    states.append(_make_sort_state(arr, None, None, [],
                                   "start", f"Starting Merge Sort on {arr}"))

    def merge_sort_rec(a: list, left: int, right: int):
        if left >= right:
            return

        mid = (left + right) // 2

        states.append(_make_sort_state(
            a, left, right, [],
            "divide", f"Dividing arr[{left}..{right}] into arr[{left}..{mid}] and arr[{mid+1}..{right}]"
        ))

        merge_sort_rec(a, left, mid)
        merge_sort_rec(a, mid + 1, right)

        # Merge step
        left_part = a[left:mid + 1]
        right_part = a[mid + 1:right + 1]

        i = j = 0
        k = left
        while i < len(left_part) and j < len(right_part):
            op_count[0] += 1
            states.append(_make_sort_state(
                a, left + i, mid + 1 + j, [],
                "compare", f"Merging: comparing {left_part[i]} and {right_part[j]}"
            ))
            if left_part[i] <= right_part[j]:
                a[k] = left_part[i]
                i += 1
            else:
                a[k] = right_part[j]
                j += 1
            k += 1
            states.append(_make_sort_state(
                a, k - 1, None, [],
                "merge", f"Placed {a[k-1]} at position {k-1}"
            ))

        while i < len(left_part):
            a[k] = left_part[i]
            i += 1
            k += 1

        while j < len(right_part):
            a[k] = right_part[j]
            j += 1
            k += 1

        states.append(_make_sort_state(
            a, left, right, list(range(left, right + 1)) if right == n - 1 else [],
            "merged", f"Merged arr[{left}..{right}] = {a[left:right+1]}"
        ))

    merge_sort_rec(arr, 0, n - 1)
    states.append(_make_sort_state(arr, None, None, list(range(n)),
                                   "done", f"Merge Sort complete! Sorted: {arr}"))

    current_mem, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start_time

    return {
        "states": states,
        "performance": {
            "execution_time_ms": round(elapsed * 1000, 4),
            "memory_usage_kb": round(current_mem / 1024, 4),
            "operation_count": op_count[0],
        },
        "sorted_array": arr,
    }


# ─── Quick Sort ───────────────────────────────────────────────────────────────

def quick_sort(array: List[int]) -> dict:
    """Quick Sort with step-by-step state generation."""
    start_time = time.perf_counter()
    tracemalloc.start()

    arr = list(array)
    n = len(arr)
    states = []
    op_count = [0]
    sorted_indices = []

    states.append(_make_sort_state(arr, None, None, [],
                                   "start", f"Starting Quick Sort on {arr}"))

    def partition(a: list, low: int, high: int) -> int:
        pivot = a[high]
        states.append(_make_sort_state(
            a, high, None, list(sorted_indices),
            "pivot", f"Pivot selected: arr[{high}]={pivot}"
        ))
        i = low - 1

        for j in range(low, high):
            op_count[0] += 1
            states.append(_make_sort_state(
                a, j, high, list(sorted_indices),
                "compare", f"Comparing arr[{j}]={a[j]} with pivot={pivot}"
            ))
            if a[j] <= pivot:
                i += 1
                a[i], a[j] = a[j], a[i]
                if i != j:
                    states.append(_make_sort_state(
                        a, i, j, list(sorted_indices),
                        "swap", f"Swapped arr[{i}]={a[i]} and arr[{j}]={a[j]}"
                    ))

        a[i + 1], a[high] = a[high], a[i + 1]
        sorted_indices.append(i + 1)
        states.append(_make_sort_state(
            a, i + 1, None, list(sorted_indices),
            "placed", f"Pivot {pivot} placed at final position {i+1}"
        ))
        return i + 1

    def quick_sort_rec(a: list, low: int, high: int):
        if low < high:
            pi = partition(a, low, high)
            quick_sort_rec(a, low, pi - 1)
            quick_sort_rec(a, pi + 1, high)

    quick_sort_rec(arr, 0, n - 1)
    states.append(_make_sort_state(arr, None, None, list(range(n)),
                                   "done", f"Quick Sort complete! Sorted: {arr}"))

    current_mem, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start_time

    return {
        "states": states,
        "performance": {
            "execution_time_ms": round(elapsed * 1000, 4),
            "memory_usage_kb": round(current_mem / 1024, 4),
            "operation_count": op_count[0],
        },
        "sorted_array": arr,
    }


# ─── Binary Search ────────────────────────────────────────────────────────────

def binary_search(array: List[int], target: int) -> dict:
    """
    Binary Search on a sorted array.
    Returns states[] and performance{}.
    NOTE: array must be sorted. If not sorted, we sort it first and note that.
    """
    start_time = time.perf_counter()
    tracemalloc.start()

    arr = list(array)
    states = []
    op_count = 0

    # Check if sorted
    is_sorted = arr == sorted(arr)
    if not is_sorted:
        original = list(arr)
        arr.sort()
        states.append(_make_state(
            arr, None, "start",
            f"Array was not sorted. Sorted automatically: {arr} (original: {original})"
        ))
    else:
        states.append(_make_state(
            arr, None, "start",
            f"Starting Binary Search for {target} in sorted array {arr}"
        ))

    low = 0
    high = len(arr) - 1
    found_index = None

    while low <= high:
        op_count += 1
        mid = (low + high) // 2

        # Show search range with highlight on mid
        state = {
            "type": "array",
            "elements": list(arr),
            "highlight": mid,
            "highlight_range": [low, high],
            "operation": "compare",
            "message": f"Search range [{low}..{high}]. Mid index={mid}, arr[mid]={arr[mid]}, target={target}",
            "comparison_value": target,
        }
        states.append(state)

        if arr[mid] == target:
            states.append(_make_state(
                arr, mid, "found",
                f"Found {target} at index {mid}!",
                comparison_value=target
            ))
            found_index = mid
            break
        elif arr[mid] < target:
            states.append(_make_state(
                arr, mid, "compare",
                f"arr[{mid}]={arr[mid]} < {target} — search right half [{mid+1}..{high}]",
                comparison_value=target
            ))
            low = mid + 1
        else:
            states.append(_make_state(
                arr, mid, "compare",
                f"arr[{mid}]={arr[mid]} > {target} — search left half [{low}..{mid-1}]",
                comparison_value=target
            ))
            high = mid - 1

    if found_index is None:
        states.append(_make_state(
            arr, None, "not_found",
            f"{target} not found in the array",
            comparison_value=target
        ))

    current_mem, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start_time

    return {
        "states": states,
        "performance": {
            "execution_time_ms": round(elapsed * 1000, 4),
            "memory_usage_kb": round(current_mem / 1024, 4),
            "operation_count": op_count,
        },
        "found": found_index is not None,
        "index": found_index,
    }
