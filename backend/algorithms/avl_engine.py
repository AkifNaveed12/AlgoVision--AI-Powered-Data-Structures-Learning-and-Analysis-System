"""
AVL Tree Algorithm Engine
==========================
Generates step-by-step state snapshots for AVL tree operations,
including Left-Left (LL), Right-Right (RR), Left-Right (LR) and
Right-Left (RL) balancing rotations visualised as discrete animation frames.
No database calls — pure stateless computation.
"""

import time
import tracemalloc
from typing import List, Optional


# ─── Node ─────────────────────────────────────────────────────────────────────

class AVLNode:
    def __init__(self, value: int, node_id: str):
        self.value    = value
        self.node_id  = node_id
        self.left:  Optional['AVLNode'] = None
        self.right: Optional['AVLNode'] = None
        self.height: int = 1          # leaf height = 1


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _height(node: Optional[AVLNode]) -> int:
    return node.height if node else 0


def _balance_factor(node: Optional[AVLNode]) -> int:
    return _height(node.left) - _height(node.right) if node else 0


def _update_height(node: AVLNode) -> None:
    node.height = 1 + max(_height(node.left), _height(node.right))


# ─── Position assignment ──────────────────────────────────────────────────────

def _assign_positions(root: Optional[AVLNode]) -> dict:
    """Compute (x, y) pixel positions using recursive in-order x-counter."""
    positions: dict = {}
    counter = [0]

    def _place(node: Optional[AVLNode], depth: int):
        if node is None:
            return
        _place(node.left, depth + 1)
        positions[node.node_id] = {"x": counter[0] * 90, "y": depth * 100}
        counter[0] += 1
        _place(node.right, depth + 1)

    _place(root, 0)
    return positions


# ─── Serialise tree ───────────────────────────────────────────────────────────

def _serialize(root: Optional[AVLNode]) -> tuple:
    """Return (nodes_list, edges_list) for the frontend."""
    if not root:
        return [], []

    positions = _assign_positions(root)
    nodes: list = []
    edges: list = []

    def _walk(node: Optional[AVLNode]):
        if node is None:
            return
        pos = positions.get(node.node_id, {"x": 0, "y": 0})
        nodes.append({
            "id":             node.node_id,
            "value":          node.value,
            "x":              pos["x"],
            "y":              pos["y"],
            "height":         node.height,
            "balance_factor": _balance_factor(node),
        })
        if node.left:
            edges.append({"from": node.node_id, "to": node.left.node_id})
            _walk(node.left)
        if node.right:
            edges.append({"from": node.node_id, "to": node.right.node_id})
            _walk(node.right)

    _walk(root)
    return nodes, edges


def _snap(root, highlight, operation, message, rotation=None, **extra) -> dict:
    """Build a single animation frame dict."""
    nodes, edges = _serialize(root)
    frame = {
        "type":      "avl",
        "nodes":     nodes,
        "edges":     edges,
        "highlight": highlight,
        "operation": operation,
        "message":   message,
        "rotation":  rotation,       # None | 'LL' | 'RR' | 'LR' | 'RL'
    }
    frame.update(extra)
    return frame


# ─── Rotations ────────────────────────────────────────────────────────────────

def _rotate_right(z: AVLNode) -> AVLNode:
    y      = z.left
    T3     = y.right
    y.right = z
    z.left  = T3
    _update_height(z)
    _update_height(y)
    return y


def _rotate_left(z: AVLNode) -> AVLNode:
    y      = z.right
    T2     = y.left
    y.left  = z
    z.right = T2
    _update_height(z)
    _update_height(y)
    return y


# ─── Insert ───────────────────────────────────────────────────────────────────

def avl_insert(values: List[int], new_value: int) -> dict:
    """
    Insert new_value into an AVL tree seeded with values.
    Returns states[], performance{}.
    """
    start_time = time.perf_counter()
    tracemalloc.start()

    states:   list = []
    counter:  list = [0]
    op_count: list = [0]

    def _make_id() -> str:
        counter[0] += 1
        return f"n{counter[0]}"

    # ── Build initial tree silently ──────────────────────────────────────────
    def _silent_insert(node: Optional[AVLNode], val: int) -> AVLNode:
        if node is None:
            return AVLNode(val, _make_id())
        if val < node.value:
            node.left = _silent_insert(node.left, val)
        elif val > node.value:
            node.right = _silent_insert(node.right, val)
        else:
            return node
        _update_height(node)
        bf = _balance_factor(node)
        if bf > 1:
            if val < node.left.value:          # LL
                return _rotate_right(node)
            else:                              # LR
                node.left = _rotate_left(node.left)
                return _rotate_right(node)
        if bf < -1:
            if val > node.right.value:         # RR
                return _rotate_left(node)
            else:                              # RL
                node.right = _rotate_right(node.right)
                return _rotate_left(node)
        return node

    root: Optional[AVLNode] = None
    for v in values:
        root = _silent_insert(root, v)

    # Initial state
    states.append(_snap(root, None, "start", f"AVL tree ready — inserting {new_value}"))

    # ── Animated insert ──────────────────────────────────────────────────────
    def _insert(node: Optional[AVLNode], val: int) -> AVLNode:
        nonlocal root
        op_count[0] += 1

        if node is None:
            new_node = AVLNode(val, _make_id())
            # Temporarily attach so we can serialise
            # We return it; the parent will attach and we'll snap there
            return new_node

        if val < node.value:
            states.append(_snap(root, node.node_id, "compare",
                                 f"{val} < {node.value} — go left"))
            node.left = _insert(node.left, val)
        elif val > node.value:
            states.append(_snap(root, node.node_id, "compare",
                                 f"{val} > {node.value} — go right"))
            node.right = _insert(node.right, val)
        else:
            states.append(_snap(root, node.node_id, "found",
                                 f"{val} already exists — no duplicate inserted"))
            return node

        _update_height(node)
        bf = _balance_factor(node)

        # ── LL rotation ──────────────────────────────────────────────────
        if bf > 1 and val < node.left.value:
            states.append(_snap(root, node.node_id, "unbalanced",
                                 f"Balance factor = {bf} at node {node.value} — LL case detected",
                                 rotation="LL"))
            new_root = _rotate_right(node)
            root = _get_root_after_rotation(root, node, new_root)
            states.append(_snap(root, new_root.node_id, "rotate",
                                 f"Right rotation applied — tree balanced at {new_root.value}",
                                 rotation="LL"))
            return new_root

        # ── RR rotation ──────────────────────────────────────────────────
        if bf < -1 and val > node.right.value:
            states.append(_snap(root, node.node_id, "unbalanced",
                                 f"Balance factor = {bf} at node {node.value} — RR case detected",
                                 rotation="RR"))
            new_root = _rotate_left(node)
            root = _get_root_after_rotation(root, node, new_root)
            states.append(_snap(root, new_root.node_id, "rotate",
                                 f"Left rotation applied — tree balanced at {new_root.value}",
                                 rotation="RR"))
            return new_root

        # ── LR rotation ──────────────────────────────────────────────────
        if bf > 1 and val > node.left.value:
            states.append(_snap(root, node.node_id, "unbalanced",
                                 f"Balance factor = {bf} at node {node.value} — LR case detected",
                                 rotation="LR"))
            node.left = _rotate_left(node.left)
            new_root  = _rotate_right(node)
            root = _get_root_after_rotation(root, node, new_root)
            states.append(_snap(root, new_root.node_id, "rotate",
                                 f"Left-Right rotation applied — tree balanced at {new_root.value}",
                                 rotation="LR"))
            return new_root

        # ── RL rotation ──────────────────────────────────────────────────
        if bf < -1 and val < node.right.value:
            states.append(_snap(root, node.node_id, "unbalanced",
                                 f"Balance factor = {bf} at node {node.value} — RL case detected",
                                 rotation="RL"))
            node.right = _rotate_right(node.right)
            new_root   = _rotate_left(node)
            root = _get_root_after_rotation(root, node, new_root)
            states.append(_snap(root, new_root.node_id, "rotate",
                                 f"Right-Left rotation applied — tree balanced at {new_root.value}",
                                 rotation="RL"))
            return new_root

        return node

    def _get_root_after_rotation(current_root, old_node, new_node):
        """Replace old_node with new_node in the tree (used only for root replacement)."""
        if current_root is old_node:
            return new_node
        return current_root

    root = _insert(root, new_value)

    # Show insertion highlight
    def _find_node_id(node, val):
        if node is None:
            return None
        if node.value == val:
            return node.node_id
        if val < node.value:
            return _find_node_id(node.left, val)
        return _find_node_id(node.right, val)

    inserted_id = _find_node_id(root, new_value)
    states.append(_snap(root, inserted_id, "insert",
                         f"Inserted {new_value} — AVL tree is balanced"))

    current_mem, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start_time

    return {
        "states": states,
        "performance": {
            "execution_time_ms": round(elapsed * 1000, 4),
            "memory_usage_kb":   round(current_mem / 1024, 4),
            "operation_count":   op_count[0],
        },
    }


# ─── Search ───────────────────────────────────────────────────────────────────

def avl_search(values: List[int], target: int) -> dict:
    """Search for target in AVL tree seeded with values."""
    start_time = time.perf_counter()
    tracemalloc.start()

    states:   list = []
    op_count: int  = 0

    root = _build_avl(values)
    states.append(_snap(root, None, "start", f"AVL tree ready — searching for {target}"))

    current = root
    found_id = None
    while current:
        op_count += 1
        if target == current.value:
            states.append(_snap(root, current.node_id, "found", f"Found {target}!"))
            found_id = current.node_id
            break
        elif target < current.value:
            states.append(_snap(root, current.node_id, "compare",
                                 f"{target} < {current.value} — search left"))
            current = current.left
        else:
            states.append(_snap(root, current.node_id, "compare",
                                 f"{target} > {current.value} — search right"))
            current = current.right

    if found_id is None:
        states.append(_snap(root, None, "not_found", f"{target} not found in AVL tree"))

    current_mem, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start_time

    return {
        "states": states,
        "performance": {
            "execution_time_ms": round(elapsed * 1000, 4),
            "memory_usage_kb":   round(current_mem / 1024, 4),
            "operation_count":   op_count,
        },
        "found": found_id is not None,
    }


# ─── Traversal ────────────────────────────────────────────────────────────────

def avl_traversal(values: List[int], traversal_type: str) -> dict:
    """Inorder / preorder / postorder traversal of AVL tree."""
    start_time = time.perf_counter()
    tracemalloc.start()

    states:        list = []
    op_count:      int  = 0
    visited_order: list = []

    root = _build_avl(values)
    states.append(_snap(root, None, "start",
                         f"AVL tree ready — starting {traversal_type} traversal"))

    def inorder(node):
        nonlocal op_count
        if not node:
            return
        inorder(node.left)
        op_count += 1
        visited_order.append(node.value)
        states.append(_snap(root, node.node_id, "visit",
                             f"Visit {node.value} — inorder: {visited_order}"))
        inorder(node.right)

    def preorder(node):
        nonlocal op_count
        if not node:
            return
        op_count += 1
        visited_order.append(node.value)
        states.append(_snap(root, node.node_id, "visit",
                             f"Visit {node.value} — preorder: {visited_order}"))
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
        states.append(_snap(root, node.node_id, "visit",
                             f"Visit {node.value} — postorder: {visited_order}"))

    if traversal_type == "inorder":
        inorder(root)
    elif traversal_type == "preorder":
        preorder(root)
    elif traversal_type == "postorder":
        postorder(root)

    states.append(_snap(root, None, "done",
                         f"Traversal complete. Order: {visited_order}"))

    current_mem, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start_time

    return {
        "states": states,
        "performance": {
            "execution_time_ms": round(elapsed * 1000, 4),
            "memory_usage_kb":   round(current_mem / 1024, 4),
            "operation_count":   op_count,
        },
        "visited_order": visited_order,
    }


# ─── Delete ───────────────────────────────────────────────────────────────────

def avl_delete(values: List[int], target: int) -> dict:
    """
    Delete target from an AVL tree seeded with values.
    Animates the search, deletion, and any rebalancing rotations.
    """
    start_time = time.perf_counter()
    tracemalloc.start()

    states:   list = []
    op_count: list = [0]

    root = _build_avl(values)
    states.append(_snap(root, None, "start", f"AVL tree ready — deleting {target}"))

    if root is None:
        states.append(_snap(root, None, "not_found", "Tree is empty"))
        current_mem, _ = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        elapsed = time.perf_counter() - start_time
        return {
            "states": states,
            "performance": {"execution_time_ms": round(elapsed*1000, 4),
                            "memory_usage_kb": 0, "operation_count": 0},
            "found": False, "updated_values": list(values),
        }

    # Search phase
    found_flag = [False]
    cur = root
    while cur:
        op_count[0] += 1
        if target == cur.value:
            states.append(_snap(root, cur.node_id, "found",
                                 f"Found {target} — preparing deletion"))
            found_flag[0] = True
            break
        elif target < cur.value:
            states.append(_snap(root, cur.node_id, "compare",
                                 f"{target} < {cur.value} — go left"))
            cur = cur.left
        else:
            states.append(_snap(root, cur.node_id, "compare",
                                 f"{target} > {cur.value} — go right"))
            cur = cur.right

    if not found_flag[0]:
        states.append(_snap(root, None, "not_found",
                             f"{target} not found — nothing to delete"))
        current_mem, _ = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        elapsed = time.perf_counter() - start_time
        return {
            "states": states,
            "performance": {"execution_time_ms": round(elapsed*1000, 4),
                            "memory_usage_kb": round(current_mem/1024, 4),
                            "operation_count": op_count[0]},
            "found": False, "updated_values": list(values),
        }

    def _min_node(node: AVLNode) -> AVLNode:
        while node.left:
            node = node.left
        return node

    def _delete(node: Optional[AVLNode], val: int) -> Optional[AVLNode]:
        nonlocal root
        if node is None:
            return None

        if val < node.value:
            node.left = _delete(node.left, val)
        elif val > node.value:
            node.right = _delete(node.right, val)
        else:
            op_count[0] += 1
            if node.left is None:
                states.append(_snap(root, node.node_id, "delete",
                                     f"Removing {node.value} (no left child)"))
                return node.right
            elif node.right is None:
                states.append(_snap(root, node.node_id, "delete",
                                     f"Removing {node.value} (no right child)"))
                return node.left
            else:
                successor = _min_node(node.right)
                states.append(_snap(root, successor.node_id, "compare",
                                     f"Inorder successor: {successor.value} replaces {node.value}"))
                node.value = successor.value
                states.append(_snap(root, node.node_id, "delete",
                                     f"Replaced with {node.value}, removing successor"))
                node.right = _delete(node.right, successor.value)

        _update_height(node)
        bf = _balance_factor(node)

        # Rebalance after deletion
        if bf > 1:
            lbf = _balance_factor(node.left)
            if lbf >= 0:            # LL
                states.append(_snap(root, node.node_id, "unbalanced",
                                     f"bf={bf} at {node.value} — LL rebalance", rotation="LL"))
                new_root = _rotate_right(node)
                root = new_root if root is node else root
                states.append(_snap(root, new_root.node_id, "rotate",
                                     f"Right rotation done", rotation="LL"))
                return new_root
            else:                   # LR
                states.append(_snap(root, node.node_id, "unbalanced",
                                     f"bf={bf} at {node.value} — LR rebalance", rotation="LR"))
                node.left = _rotate_left(node.left)
                new_root = _rotate_right(node)
                root = new_root if root is node else root
                states.append(_snap(root, new_root.node_id, "rotate",
                                     f"Left-Right rotation done", rotation="LR"))
                return new_root

        if bf < -1:
            rbf = _balance_factor(node.right)
            if rbf <= 0:            # RR
                states.append(_snap(root, node.node_id, "unbalanced",
                                     f"bf={bf} at {node.value} — RR rebalance", rotation="RR"))
                new_root = _rotate_left(node)
                root = new_root if root is node else root
                states.append(_snap(root, new_root.node_id, "rotate",
                                     f"Left rotation done", rotation="RR"))
                return new_root
            else:                   # RL
                states.append(_snap(root, node.node_id, "unbalanced",
                                     f"bf={bf} at {node.value} — RL rebalance", rotation="RL"))
                node.right = _rotate_right(node.right)
                new_root = _rotate_left(node)
                root = new_root if root is node else root
                states.append(_snap(root, new_root.node_id, "rotate",
                                     f"Right-Left rotation done", rotation="RL"))
                return new_root

        return node

    root = _delete(root, target)

    if root:
        states.append(_snap(root, None, "done",
                             f"Deleted {target} — AVL tree rebalanced"))
    else:
        states.append(_snap(None, None, "done",
                             f"Deleted {target} — tree is now empty"))

    # Collect updated inorder values
    updated: list = []
    def _inorder(n):
        if not n:
            return
        _inorder(n.left)
        updated.append(n.value)
        _inorder(n.right)
    _inorder(root)

    current_mem, _ = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    elapsed = time.perf_counter() - start_time

    return {
        "states": states,
        "performance": {
            "execution_time_ms": round(elapsed * 1000, 4),
            "memory_usage_kb":   round(current_mem / 1024, 4),
            "operation_count":   op_count[0],
        },
        "found": True,
        "updated_values": updated,
    }


# ─── Internal AVL build (silent) ─────────────────────────────────────────────

def _build_avl(values: List[int]) -> Optional[AVLNode]:
    counter = [0]

    def _make_id():
        counter[0] += 1
        return f"n{counter[0]}"

    def _insert(node: Optional[AVLNode], val: int) -> AVLNode:
        if node is None:
            return AVLNode(val, _make_id())
        if val < node.value:
            node.left = _insert(node.left, val)
        elif val > node.value:
            node.right = _insert(node.right, val)
        else:
            return node
        _update_height(node)
        bf = _balance_factor(node)
        if bf > 1:
            if val < node.left.value:
                return _rotate_right(node)
            node.left = _rotate_left(node.left)
            return _rotate_right(node)
        if bf < -1:
            if val > node.right.value:
                return _rotate_left(node)
            node.right = _rotate_right(node.right)
            return _rotate_left(node)
        return node

    root: Optional[AVLNode] = None
    for v in values:
        root = _insert(root, v)
    return root
