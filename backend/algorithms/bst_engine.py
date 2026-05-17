"""
BST (Binary Search Tree) Algorithm Engine
==========================================
Generates step-by-step state snapshots for BST operations.
Tree is represented as a list of nodes with left/right children (index-based).
No database calls — pure stateless computation.
"""

import time
import tracemalloc
from typing import List, Optional, Dict, Any


def _make_tree_state(nodes: list, edges: list, highlight: Optional[str], operation: str, message: str, **extra) -> dict:
    """Build a single BSTState dict."""
    state = {
        "type": "bst",
        "nodes": nodes,        # list of {id, value, x, y}
        "edges": edges,        # list of {from, to}
        "highlight": highlight,  # node id to highlight
        "operation": operation,
        "message": message,
    }
    state.update(extra)
    return state


class BSTNode:
    def __init__(self, value: int, node_id: str):
        self.value = value
        self.node_id = node_id
        self.left: Optional['BSTNode'] = None
        self.right: Optional['BSTNode'] = None


def _assign_positions(root: Optional[BSTNode]) -> dict:
    """Compute x,y positions for each node using level-order with spacing."""
    if not root:
        return {}
    positions = {}
    queue = [(root, 0, 0, -400, 400)]  # node, level, x_offset, x_min, x_max
    while queue:
        node, level, x, x_min, x_max = queue.pop(0)
        positions[node.node_id] = {"x": x, "y": level * 100}
        mid = (x_min + x_max) / 2
        if node.left:
            queue.append((node.left, level + 1, (x_min + x) / 2, x_min, x))
        if node.right:
            queue.append((node.right, level + 1, (x + x_max) / 2, x, x_max))
    return positions


def _serialize_tree(root: Optional[BSTNode]) -> tuple:
    """Convert BST to nodes list and edges list for frontend."""
    if not root:
        return [], []

    positions = _assign_positions(root)
    nodes = []
    edges = []

    def traverse(node: Optional[BSTNode]):
        if not node:
            return
        pos = positions.get(node.node_id, {"x": 0, "y": 0})
        nodes.append({
            "id": node.node_id,
            "value": node.value,
            "x": pos["x"],
            "y": pos["y"],
        })
        if node.left:
            edges.append({"from": node.node_id, "to": node.left.node_id})
            traverse(node.left)
        if node.right:
            edges.append({"from": node.node_id, "to": node.right.node_id})
            traverse(node.right)

    traverse(root)
    return nodes, edges


def _build_bst_from_list(values: List[int]) -> Optional[BSTNode]:
    """Build a BST from a list of values."""
    root = None
    counter = [0]

    def insert(node, val):
        counter[0] += 1
        nid = f"n{counter[0]}"
        new_node = BSTNode(val, nid)
        if node is None:
            return new_node
        if val < node.value:
            node.left = insert(node.left, val)
        elif val > node.value:
            node.right = insert(node.right, val)
        return node

    for v in values:
        root = insert(root, v)
    return root


# ─── BST Insert ───────────────────────────────────────────────────────────────

def bst_insert(values: List[int], new_value: int) -> dict:
    """
    Insert new_value into BST formed from values list.
    Returns states[] and performance{}.
    """
    start_time = time.perf_counter()
    tracemalloc.start()

    states = []
    counter = [0]

    def make_id():
        counter[0] += 1
        return f"n{counter[0]}"

    root = None

    def insert_node(node, val, nid=None):
        if nid is None:
            nid = make_id()
        if node is None:
            return BSTNode(val, nid)
        if val < node.value:
            node.left = insert_node(node.left, val)
        elif val > node.value:
            node.right = insert_node(node.right, val)
        return node

    for v in values:
        root = insert_node(root, v)

    nodes, edges = _serialize_tree(root)
    states.append(_make_tree_state(
        nodes, edges, None, "start",
        f"Starting BST insert of {new_value}"
    ))

    # Traverse to find insertion point
    op_count = 0
    current = root
    while current is not None:
        op_count += 1
        nodes, edges = _serialize_tree(root)
        if new_value < current.value:
            states.append(_make_tree_state(
                nodes, edges, current.node_id, "compare",
                f"{new_value} < {current.value} — go left"
            ))
            if current.left is None:
                # Insert here
                new_id = make_id()
                current.left = BSTNode(new_value, new_id)
                nodes, edges = _serialize_tree(root)
                states.append(_make_tree_state(
                    nodes, edges, new_id, "insert",
                    f"Inserted {new_value} as left child of {current.value}"
                ))
                break
            current = current.left
        elif new_value > current.value:
            states.append(_make_tree_state(
                nodes, edges, current.node_id, "compare",
                f"{new_value} > {current.value} — go right"
            ))
            if current.right is None:
                new_id = make_id()
                current.right = BSTNode(new_value, new_id)
                nodes, edges = _serialize_tree(root)
                states.append(_make_tree_state(
                    nodes, edges, new_id, "insert",
                    f"Inserted {new_value} as right child of {current.value}"
                ))
                break
            current = current.right
        else:
            states.append(_make_tree_state(
                nodes, edges, current.node_id, "found",
                f"{new_value} already exists in the BST — no duplicate inserted"
            ))
            break

    current_mem, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start_time

    return {
        "states": states,
        "performance": {
            "execution_time_ms": round(elapsed * 1000, 4),
            "memory_usage_kb": round(current_mem / 1024, 4),
            "operation_count": op_count,
        }
    }


# ─── BST Search ───────────────────────────────────────────────────────────────

def bst_search(values: List[int], target: int) -> dict:
    """Search for target in BST."""
    start_time = time.perf_counter()
    tracemalloc.start()

    states = []
    root = _build_bst_from_list(values)
    op_count = 0

    nodes, edges = _serialize_tree(root)
    states.append(_make_tree_state(
        nodes, edges, None, "start",
        f"Starting BST search for {target}"
    ))

    current = root
    found_id = None
    while current is not None:
        op_count += 1
        nodes, edges = _serialize_tree(root)
        if target == current.value:
            states.append(_make_tree_state(
                nodes, edges, current.node_id, "found",
                f"Found {target}!"
            ))
            found_id = current.node_id
            break
        elif target < current.value:
            states.append(_make_tree_state(
                nodes, edges, current.node_id, "compare",
                f"{target} < {current.value} — search left subtree"
            ))
            current = current.left
        else:
            states.append(_make_tree_state(
                nodes, edges, current.node_id, "compare",
                f"{target} > {current.value} — search right subtree"
            ))
            current = current.right

    if found_id is None:
        nodes, edges = _serialize_tree(root)
        states.append(_make_tree_state(
            nodes, edges, None, "not_found",
            f"{target} not found in the BST"
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
        "found": found_id is not None,
    }


# ─── BST Traversal ────────────────────────────────────────────────────────────

def bst_traversal(values: List[int], traversal_type: str) -> dict:
    """
    Perform inorder, preorder, or postorder traversal.
    traversal_type: 'inorder' | 'preorder' | 'postorder'
    """
    start_time = time.perf_counter()
    tracemalloc.start()

    states = []
    root = _build_bst_from_list(values)
    op_count = 0
    visited_order = []

    nodes_init, edges_init = _serialize_tree(root)
    states.append(_make_tree_state(
        nodes_init, edges_init, None, "start",
        f"Starting {traversal_type} traversal"
    ))

    def inorder(node):
        nonlocal op_count
        if not node:
            return
        inorder(node.left)
        op_count += 1
        visited_order.append(node.value)
        n, e = _serialize_tree(root)
        states.append(_make_tree_state(
            n, e, node.node_id, "visit",
            f"Visit node {node.value} — inorder: {visited_order}"
        ))
        inorder(node.right)

    def preorder(node):
        nonlocal op_count
        if not node:
            return
        op_count += 1
        visited_order.append(node.value)
        n, e = _serialize_tree(root)
        states.append(_make_tree_state(
            n, e, node.node_id, "visit",
            f"Visit node {node.value} — preorder: {visited_order}"
        ))
        preorder(node.left)
        preorder(node.right)

    def postorder(node):
        nonlocal op_count
        if not node:
            return
        postorder(node.left)
        postorder(node.right)
        op_count += 1
        visited_order.append(node.value)
        n, e = _serialize_tree(root)
        states.append(_make_tree_state(
            n, e, node.node_id, "visit",
            f"Visit node {node.value} — postorder: {visited_order}"
        ))

    if traversal_type == "inorder":
        inorder(root)
    elif traversal_type == "preorder":
        preorder(root)
    elif traversal_type == "postorder":
        postorder(root)

    n, e = _serialize_tree(root)
    states.append(_make_tree_state(
        n, e, None, "done",
        f"Traversal complete. Order: {visited_order}"
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
        "visited_order": visited_order,
    }


# ─── BST Delete ───────────────────────────────────────────────────────────────────────────────
def bst_delete(values: List[int], target: int) -> dict:
    """
    Delete target from BST formed from values list.
    Handles all 3 BST deletion cases:
      Case 1: Leaf node  -> simply remove
      Case 2: One child  -> replace node with its child
      Case 3: Two children -> replace value with inorder successor, delete successor
    Returns states[], performance{}, found: bool, updated_values: list[int].
    updated_values is the inorder traversal of the resulting tree; the frontend
    uses this to persist tree state for subsequent operations.
    """
    start_time = time.perf_counter()
    tracemalloc.start()

    states = []
    op_count = 0
    root = _build_bst_from_list(values)

    nodes, edges = _serialize_tree(root)
    states.append(_make_tree_state(nodes, edges, None, "start", f"Starting BST deletion of {target}"))

    if root is None:
        states.append(_make_tree_state([], [], None, "not_found", "Tree is empty — nothing to delete"))
        current_mem, _ = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        elapsed = time.perf_counter() - start_time
        return {
            "states": states,
            "performance": {"execution_time_ms": round(elapsed * 1000, 4), "memory_usage_kb": round(current_mem / 1024, 4), "operation_count": 0},
            "found": False, "updated_values": list(values),
        }

    # Show search steps to locate the node
    current = root
    found = False
    while current is not None:
        op_count += 1
        nodes, edges = _serialize_tree(root)
        if target == current.value:
            states.append(_make_tree_state(nodes, edges, current.node_id, "found", f"Found {target} — preparing to delete"))
            found = True
            break
        elif target < current.value:
            states.append(_make_tree_state(nodes, edges, current.node_id, "compare", f"{target} < {current.value} — search left subtree"))
            current = current.left
        else:
            states.append(_make_tree_state(nodes, edges, current.node_id, "compare", f"{target} > {current.value} — search right subtree"))
            current = current.right

    if not found:
        nodes, edges = _serialize_tree(root)
        states.append(_make_tree_state(nodes, edges, None, "not_found", f"{target} not found in BST — nothing to delete"))
        current_mem, _ = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        elapsed = time.perf_counter() - start_time
        return {
            "states": states,
            "performance": {"execution_time_ms": round(elapsed * 1000, 4), "memory_usage_kb": round(current_mem / 1024, 4), "operation_count": op_count},
            "found": False, "updated_values": list(values),
        }

    def _find_min(node: BSTNode) -> BSTNode:
        while node.left is not None:
            node = node.left
        return node

    def _delete_node(node: Optional[BSTNode], val: int) -> Optional[BSTNode]:
        nonlocal op_count
        if node is None:
            return None
        if val < node.value:
            node.left = _delete_node(node.left, val)
        elif val > node.value:
            node.right = _delete_node(node.right, val)
        else:
            op_count += 1
            # Case 1: Leaf node
            if node.left is None and node.right is None:
                ns, es = _serialize_tree(root)
                states.append(_make_tree_state(ns, es, node.node_id, "delete", f"Case 1 — Leaf: remove {node.value}"))
                return None
            # Case 2a: Only right child
            elif node.left is None:
                ns, es = _serialize_tree(root)
                states.append(_make_tree_state(ns, es, node.node_id, "delete", f"Case 2 — One child: replace {node.value} with right child {node.right.value}"))
                return node.right
            # Case 2b: Only left child
            elif node.right is None:
                ns, es = _serialize_tree(root)
                states.append(_make_tree_state(ns, es, node.node_id, "delete", f"Case 2 — One child: replace {node.value} with left child {node.left.value}"))
                return node.left
            # Case 3: Two children — inorder successor
            else:
                ns, es = _serialize_tree(root)
                states.append(_make_tree_state(ns, es, node.node_id, "compare", f"Case 3 — Two children: find inorder successor (min of right subtree)"))
                successor = _find_min(node.right)
                ns, es = _serialize_tree(root)
                states.append(_make_tree_state(ns, es, successor.node_id, "compare", f"Inorder successor: {successor.value} — will replace {node.value}"))
                node.value = successor.value
                ns, es = _serialize_tree(root)
                states.append(_make_tree_state(ns, es, node.node_id, "delete", f"Replaced with {node.value}, deleting successor from right subtree"))
                node.right = _delete_node(node.right, successor.value)
        return node

    root = _delete_node(root, target)

    # Final state showing updated tree
    if root is not None:
        nodes, edges = _serialize_tree(root)
        states.append(_make_tree_state(nodes, edges, None, "done", f"Deleted {target} — tree updated successfully"))
    else:
        states.append(_make_tree_state([], [], None, "done", f"Deleted {target} — tree is now empty"))

    # Collect updated inorder values so frontend can persist the new tree
    updated_values: List[int] = []
    def _inorder(node: Optional[BSTNode]):
        if not node:
            return
        _inorder(node.left)
        updated_values.append(node.value)
        _inorder(node.right)
    _inorder(root)

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
        "found": True,
        "updated_values": updated_values,
    }
