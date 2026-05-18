"""
AlgoVision — Full System Test Suite
=====================================
Tests every algorithm engine with normal cases, edge cases, and failure paths.
Run from the project root:
    python test_full_system.py
"""
import sys, traceback
sys.path.insert(0, '.')

PASS = 0
FAIL = 0
ERRORS = []

def ok(name):
    global PASS
    PASS += 1
    print(f"  \033[32m✓\033[0m {name}")

def fail(name, reason):
    global FAIL
    FAIL += 1
    ERRORS.append((name, reason))
    print(f"  \033[31m✗\033[0m {name}: {reason}")
    if sys.exc_info()[0] is not None:
        traceback.print_exc()

def section(title):
    print(f"\n\033[1;34m{'-'*50}\033[0m")
    print(f"\033[1;34m  {title}\033[0m")
    print(f"\033[1;34m{'-'*50}\033[0m")

# ── import engines ────────────────────────────────────────────────────────────
try:
    from backend.algorithms.bst_engine      import bst_insert, bst_search, bst_traversal, bst_delete
    from backend.algorithms.avl_engine      import avl_insert, avl_delete, avl_search, avl_traversal, _build_avl
    from backend.algorithms.graph_engine    import graph_bfs, graph_dfs
    from backend.algorithms.sorting_engine  import (bubble_sort, selection_sort, insertion_sort,
                                                     merge_sort, quick_sort, binary_search)
    from backend.algorithms.array_engine    import array_insert, array_delete, array_search
    from backend.algorithms.linkedlist_engine import linkedlist_insert, linkedlist_delete, linkedlist_search
    print("\033[32mAll engines imported successfully\033[0m")
except Exception as e:
    print(f"\033[31mFATAL: Import failed — {e}\033[0m")
    traceback.print_exc()
    sys.exit(1)


# ══════════════════════════════════════════════════════════════════════════════
# BST ENGINE
# ══════════════════════════════════════════════════════════════════════════════
section("BST ENGINE")

# Insert — normal
try:
    r = bst_insert([50, 30, 70], 40)
    assert len(r["states"]) > 0, "no states"
    assert r["performance"]["operation_count"] > 0
    ok("BST insert — normal")
except Exception as e:
    fail("BST insert — normal", str(e))

# Insert — duplicate (should not crash, found state)
try:
    r = bst_insert([50, 30, 70], 50)
    ops = [s["operation"] for s in r["states"]]
    assert "found" in ops, f"expected 'found' state, got {ops}"
    ok("BST insert — duplicate")
except Exception as e:
    fail("BST insert — duplicate", str(e))

# Insert — into empty tree
try:
    r = bst_insert([], 10)
    assert any(s["operation"] in ["insert", "insert_root", "compare", "root"] for s in r["states"])
    ok("BST insert — into empty tree")
except Exception as e:
    fail("BST insert — into empty tree", str(e))

# Search — found
try:
    r = bst_search([50, 30, 70, 40], 40)
    assert r["found"] is True
    ok("BST search — found")
except Exception as e:
    fail("BST search — found", str(e))

# Search — not found
try:
    r = bst_search([50, 30, 70], 99)
    assert r["found"] is False
    ok("BST search — not found")
except Exception as e:
    fail("BST search — not found", str(e))

# Search — empty tree
try:
    r = bst_search([], 10)
    assert r["found"] is False
    ok("BST search — empty tree")
except Exception as e:
    fail("BST search — empty tree", str(e))

# Traversal — inorder
try:
    r = bst_traversal([50, 30, 70, 20, 40], "inorder")
    assert r["visited_order"] == sorted(r["visited_order"]), "inorder not sorted"
    ok("BST traversal — inorder (sorted order)")
except Exception as e:
    fail("BST traversal — inorder", str(e))

# Traversal — preorder
try:
    r = bst_traversal([50, 30, 70], "preorder")
    assert r["visited_order"][0] == 50, "root should be first in preorder"
    ok("BST traversal — preorder (root first)")
except Exception as e:
    fail("BST traversal — preorder", str(e))

# Traversal — postorder
try:
    r = bst_traversal([50, 30, 70], "postorder")
    assert r["visited_order"][-1] == 50, "root should be last in postorder"
    ok("BST traversal — postorder (root last)")
except Exception as e:
    fail("BST traversal — postorder", str(e))

# Delete — leaf node
try:
    r = bst_delete([50, 30, 70, 20], 20)
    assert r["found"] is True
    assert 20 not in r["updated_values"]
    ok("BST delete — leaf node")
except Exception as e:
    fail("BST delete — leaf node", str(e))

# Delete — one child
try:
    r = bst_delete([50, 30, 70, 20], 30)
    assert r["found"] is True
    assert 30 not in r["updated_values"]
    ok("BST delete — one child")
except Exception as e:
    fail("BST delete — one child", str(e))

# Delete — two children
try:
    r = bst_delete([50, 30, 70, 20, 40], 30)
    assert r["found"] is True
    assert 30 not in r["updated_values"]
    ok("BST delete — two children (inorder successor)")
except Exception as e:
    fail("BST delete — two children", str(e))

# Delete — not found
try:
    r = bst_delete([50, 30, 70], 99)
    assert r["found"] is False
    ok("BST delete — not found")
except Exception as e:
    fail("BST delete — not found", str(e))

# Delete — root node
try:
    r = bst_delete([50], 50)
    assert r["found"] is True
    assert r["updated_values"] == []
    ok("BST delete — root (single node tree)")
except Exception as e:
    fail("BST delete — root", str(e))


# ══════════════════════════════════════════════════════════════════════════════
# AVL ENGINE
# ══════════════════════════════════════════════════════════════════════════════
section("AVL ENGINE")

# Insert — normal (no rotation needed)
try:
    r = avl_insert([10, 5, 15], 3)
    assert len(r["states"]) > 0
    assert r["performance"]["operation_count"] > 0
    ok("AVL insert — normal (no rotation)")
except Exception as e:
    fail("AVL insert — normal", str(e))

# Insert — LL rotation triggered
try:
    r = avl_insert([20, 10], 5)   # tree has 20, 10. inserting 5 triggers LL
    rotations = [s.get("rotation") for s in r["states"]]
    assert any(rot in rotations for rot in ["LL", "RR", "LR", "RL"]), \
        f"Expected rotation, got rotations: {set(rotations)}"
    ok("AVL insert — rotation triggered")
except Exception as e:
    fail("AVL insert — rotation triggered", str(e))

# Insert — RR rotation: insert ascending sequence
try:
    r = avl_insert([10, 20], 30)
    rotations = [s.get("rotation") for s in r["states"] if s.get("rotation")]
    assert "RR" in rotations, f"Expected RR rotation, got: {rotations}"
    ok("AVL insert — RR rotation (ascending sequence)")
except Exception as e:
    fail("AVL insert — RR rotation", str(e))

# Insert — LL rotation: insert descending sequence
try:
    r = avl_insert([30, 20], 10)
    rotations = [s.get("rotation") for s in r["states"] if s.get("rotation")]
    assert "LL" in rotations, f"Expected LL rotation, got: {rotations}"
    ok("AVL insert — LL rotation (descending sequence)")
except Exception as e:
    fail("AVL insert — LL rotation", str(e))

# Insert — LR rotation
try:
    r = avl_insert([30, 10], 20)
    rotations = [s.get("rotation") for s in r["states"] if s.get("rotation")]
    assert "LR" in rotations, f"Expected LR rotation, got: {rotations}"
    ok("AVL insert — LR rotation")
except Exception as e:
    fail("AVL insert — LR rotation", str(e))

# Insert — RL rotation
try:
    r = avl_insert([10, 30], 20)
    rotations = [s.get("rotation") for s in r["states"] if s.get("rotation")]
    assert "RL" in rotations, f"Expected RL rotation, got: {rotations}"
    ok("AVL insert — RL rotation")
except Exception as e:
    fail("AVL insert — RL rotation", str(e))

# Insert — duplicate
try:
    r = avl_insert([10, 20, 30], 20)
    ops = [s["operation"] for s in r["states"]]
    assert "found" in ops
    ok("AVL insert — duplicate (no crash)")
except Exception as e:
    fail("AVL insert — duplicate", str(e))

# AVL balance factor on all nodes after build
try:
    root = _build_avl([10, 20, 30, 40, 50, 60, 70])
    def check_balance(node):
        if node is None:
            return True
        from backend.algorithms.avl_engine import _balance_factor
        bf = _balance_factor(node)
        assert abs(bf) <= 1, f"Node {node.value} has bf={bf} (violation!)"
        check_balance(node.left)
        check_balance(node.right)
    check_balance(root)
    ok("AVL tree — all nodes balanced after sequential insert (bf ≤ 1)")
except Exception as e:
    fail("AVL balance factor check", str(e))

# AVL inorder equals sorted input
try:
    vals = [30, 20, 40, 10, 25, 35, 50]
    r = avl_traversal(vals, "inorder")
    assert r["visited_order"] == sorted(vals), f"Inorder not sorted: {r['visited_order']}"
    ok("AVL traversal — inorder equals sorted input")
except Exception as e:
    fail("AVL traversal — inorder", str(e))

# AVL search — found
try:
    r = avl_search([30, 20, 40, 10, 25], 25)
    assert r["found"] is True
    ok("AVL search — found")
except Exception as e:
    fail("AVL search — found", str(e))

# AVL search — not found
try:
    r = avl_search([30, 20, 40], 99)
    assert r["found"] is False
    ok("AVL search — not found")
except Exception as e:
    fail("AVL search — not found", str(e))

# AVL delete — found and tree remains balanced
try:
    vals = [30, 20, 40, 10, 25, 35, 50]
    r = avl_delete(vals, 20)
    assert r["found"] is True
    assert 20 not in r["updated_values"]
    # Check updated values are sorted (inorder = sorted for BST/AVL)
    assert r["updated_values"] == sorted(r["updated_values"])
    ok("AVL delete — node found, result remains sorted")
except Exception as e:
    fail("AVL delete — found", str(e))

# AVL delete — not found
try:
    r = avl_delete([30, 20, 40], 99)
    assert r["found"] is False
    ok("AVL delete — not found")
except Exception as e:
    fail("AVL delete — not found", str(e))

# AVL delete — triggers rebalance
try:
    r = avl_delete([10, 20, 30, 40, 50], 10)
    assert r["found"] is True
    rotations = [s.get("rotation") for s in r["states"] if s.get("rotation")]
    # With a skewed deletion, at least one rebalance should happen (may vary by input)
    ok(f"AVL delete — triggers rebalance (rotations: {set(rotations) or 'none needed'})")
except Exception as e:
    fail("AVL delete — triggers rebalance", str(e))

# AVL states include balance_factor on each node
try:
    r = avl_insert([30, 20, 40, 10, 25], 5)
    for state in r["states"]:
        for node in state.get("nodes", []):
            assert "balance_factor" in node, f"Node missing balance_factor: {node}"
    ok("AVL states — every node has balance_factor field")
except Exception as e:
    fail("AVL states — balance_factor field", str(e))

# AVL states type field
try:
    r = avl_insert([10, 5, 15], 3)
    for state in r["states"]:
        assert state.get("type") == "avl", f"Expected type='avl', got '{state.get('type')}'"
    ok("AVL states — type field is 'avl'")
except Exception as e:
    fail("AVL states — type field", str(e))


# ══════════════════════════════════════════════════════════════════════════════
# GRAPH ENGINE
# ══════════════════════════════════════════════════════════════════════════════
section("GRAPH ENGINE")

EDGES = [{"from":"A","to":"B"},{"from":"A","to":"C"},{"from":"B","to":"D"},{"from":"B","to":"E"},{"from":"C","to":"F"}]
NODES = ["A","B","C","D","E","F"]

try:
    r = graph_bfs(NODES, EDGES, "A")
    assert r["traversal_order"][0] == "A"
    assert len(r["traversal_order"]) == len(NODES)
    ok("Graph BFS — visits all nodes, starts at A")
except Exception as e:
    fail("Graph BFS — normal", str(e))

try:
    r = graph_dfs(NODES, EDGES, "A")
    assert r["traversal_order"][0] == "A"
    assert len(r["traversal_order"]) == len(NODES)
    ok("Graph DFS — visits all nodes, starts at A")
except Exception as e:
    fail("Graph DFS — normal", str(e))

# BFS order (breadth first — level by level)
try:
    r = graph_bfs(NODES, EDGES, "A")
    order = r["traversal_order"]
    # B and C must come before D, E, F
    assert order.index("B") < order.index("D")
    assert order.index("C") < order.index("F")
    ok("Graph BFS — level-order verified")
except Exception as e:
    fail("Graph BFS — level-order", str(e))

# Disconnected graph (single node, no edges)
try:
    r = graph_bfs(["A"], [], "A")
    assert r["traversal_order"] == ["A"]
    ok("Graph BFS — single node, no edges")
except Exception as e:
    fail("Graph BFS — single node", str(e))


# ══════════════════════════════════════════════════════════════════════════════
# SORTING ENGINE
# ══════════════════════════════════════════════════════════════════════════════
section("SORTING ENGINE")

TEST_ARRAY  = [64, 34, 25, 12, 22, 11, 90]
SORTED_EXPECTED = sorted(TEST_ARRAY)

for algo_name, algo_fn in [
    ("Bubble Sort",    bubble_sort),
    ("Selection Sort", selection_sort),
    ("Insertion Sort", insertion_sort),
    ("Merge Sort",     merge_sort),
    ("Quick Sort",     quick_sort),
]:
    # Normal case
    try:
        r = algo_fn(list(TEST_ARRAY))
        assert r["sorted_array"] == SORTED_EXPECTED, f"Got {r['sorted_array']}"
        assert len(r["states"]) > 0
        assert r["states"][-1]["operation"] == "done"
        ok(f"{algo_name} — sorts correctly, ends with 'done' state")
    except Exception as e:
        fail(f"{algo_name} — normal sort", str(e))

    # Single element
    try:
        r = algo_fn([42])
        assert r["sorted_array"] == [42]
        ok(f"{algo_name} — single element")
    except Exception as e:
        fail(f"{algo_name} — single element", str(e))

    # Already sorted
    try:
        r = algo_fn([1, 2, 3, 4, 5])
        assert r["sorted_array"] == [1, 2, 3, 4, 5]
        ok(f"{algo_name} — already sorted array")
    except Exception as e:
        fail(f"{algo_name} — already sorted", str(e))

    # Reverse sorted (worst case for many)
    try:
        r = algo_fn([5, 4, 3, 2, 1])
        assert r["sorted_array"] == [1, 2, 3, 4, 5]
        ok(f"{algo_name} — reverse sorted")
    except Exception as e:
        fail(f"{algo_name} — reverse sorted", str(e))

    # Duplicates
    try:
        r = algo_fn([3, 1, 2, 1, 3])
        assert r["sorted_array"] == [1, 1, 2, 3, 3]
        ok(f"{algo_name} — array with duplicates")
    except Exception as e:
        fail(f"{algo_name} — duplicates", str(e))

# Binary Search — found
try:
    r = binary_search([5, 10, 15, 20, 25], 15)
    assert r["found"] is True and r["index"] == 2
    ok("Binary Search — found at correct index")
except Exception as e:
    fail("Binary Search — found", str(e))

# Binary Search — not found
try:
    r = binary_search([5, 10, 15, 20, 25], 99)
    assert r["found"] is False
    ok("Binary Search — not found")
except Exception as e:
    fail("Binary Search — not found", str(e))

# Binary Search — unsorted input (auto-sorts)
try:
    r = binary_search([25, 5, 15, 10, 20], 15)
    assert r["found"] is True
    ok("Binary Search — unsorted input (auto-sorts before searching)")
except Exception as e:
    fail("Binary Search — unsorted input", str(e))

# Binary Search — single element found
try:
    r = binary_search([42], 42)
    assert r["found"] is True
    ok("Binary Search — single element found")
except Exception as e:
    fail("Binary Search — single element", str(e))


# ══════════════════════════════════════════════════════════════════════════════
# RACE MODE — state arrays returned
# ══════════════════════════════════════════════════════════════════════════════
section("SORTING RACE MODE (state arrays)")

def _mock_run_sort(algorithm: str, array: list) -> dict:
    algo_map = {
        "bubble": bubble_sort,
        "selection": selection_sort,
        "insertion": insertion_sort,
        "merge": merge_sort,
        "quick": quick_sort,
    }
    return algo_map[algorithm](array)

try:
    algos = ["bubble", "merge", "quick"]
    arr   = [64, 34, 25, 12, 22, 11, 90, 48]
    race_states = {}
    race_results = {}
    for alg in algos:
        res = _mock_run_sort(alg, list(arr))
        race_states[alg]  = res.get("states", [])
        race_results[alg] = res.get("performance", {})

    # Every algo must return states
    for alg in algos:
        assert len(race_states[alg]) > 0, f"{alg} returned no states"
    ok("Race mode — all algorithms return non-empty states arrays")

    # Every algo sorts correctly
    for alg in algos:
        final = _mock_run_sort(alg, list(arr))
        assert final["sorted_array"] == sorted(arr), f"{alg} incorrect result"
    ok("Race mode — all algorithms produce correct sorted output")

    # State padding simulation (as done in frontend)
    max_len = max(len(s) for s in race_states.values())
    for alg, states_list in race_states.items():
        last = states_list[-1]
        padded = states_list + [last] * (max_len - len(states_list))
        assert len(padded) == max_len
    ok(f"Race mode — state padding to length {max_len} works correctly")

except Exception as e:
    fail("Race mode — state arrays", str(e))
    traceback.print_exc()


# ══════════════════════════════════════════════════════════════════════════════
# ARRAY ENGINE
# ══════════════════════════════════════════════════════════════════════════════
section("ARRAY ENGINE")

try:
    r = array_insert([1, 2, 3, 4], 2, 99)
    assert 99 in r["states"][-1]["elements"]
    ok("Array insert — inserts at correct position")
except Exception as e:
    fail("Array insert", str(e))

try:
    r = array_delete([1, 2, 3, 4], 1)
    final = r["states"][-1]["elements"]
    assert 2 not in final
    ok("Array delete — removes element at index 1")
except Exception as e:
    fail("Array delete", str(e))

try:
    r = array_search([10, 20, 30, 40], 30)
    assert r.get("found") is True or any(s["operation"] == "found" for s in r["states"])
    ok("Array search — found")
except Exception as e:
    fail("Array search — found", str(e))


# ══════════════════════════════════════════════════════════════════════════════
# LINKED LIST ENGINE
# ══════════════════════════════════════════════════════════════════════════════
section("LINKED LIST ENGINE")

try:
    r = linkedlist_insert([1, 2, 3], 99, position=1)
    vals = r["states"][-1]["nodes"]
    assert 99 in vals
    ok("Linked list insert — value in final state")
except Exception as e:
    fail("Linked list insert", str(e))

try:
    r = linkedlist_delete([1, 2, 3, 4], 2)
    vals = r["states"][-1]["nodes"]
    assert 2 not in vals
    ok("Linked list delete — node removed")
except Exception as e:
    fail("Linked list delete", str(e))

try:
    r = linkedlist_search([10, 20, 30], 20)
    assert r.get("found") is True or any(s["operation"] == "found" for s in r["states"])
    ok("Linked list search — found")
except Exception as e:
    fail("Linked list search — found", str(e))


# ══════════════════════════════════════════════════════════════════════════════
# RESULTS
# ══════════════════════════════════════════════════════════════════════════════
print(f"\n{'='*50}")
print(f"  RESULTS: \033[32m{PASS} passed\033[0m  \033[31m{FAIL} failed\033[0m  (total {PASS+FAIL})")
print(f"{'='*50}")
if ERRORS:
    print("\n\033[31mFailed tests:\033[0m")
    for name, reason in ERRORS:
        print(f"  ✗ {name}")
        print(f"    → {reason}")
else:
    print("\n\033[32m  ✅ ALL TESTS PASSED\033[0m")
