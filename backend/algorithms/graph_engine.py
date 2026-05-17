"""
Graph Algorithm Engine
======================
Generates step-by-step state snapshots for Graph BFS and DFS.
Graph is represented as adjacency list.
No database calls — pure stateless computation.
"""

import time
import tracemalloc
from typing import List, Dict, Optional
from collections import deque


def _make_graph_state(nodes: list, edges: list, visited: list, queue_or_stack: list,
                       current: Optional[str], operation: str, message: str, **extra) -> dict:
    """Build a single GraphState dict."""
    state = {
        "type": "graph",
        "nodes": nodes,           # list of {id, label, x, y}
        "edges": edges,           # list of {from, to, directed}
        "visited": visited,       # list of node ids visited so far
        "frontier": queue_or_stack,  # current queue (BFS) or stack (DFS)
        "current": current,       # currently being processed node id
        "operation": operation,
        "message": message,
    }
    state.update(extra)
    return state


def _layout_nodes(node_ids: list) -> dict:
    """Arrange nodes in a circle layout."""
    import math
    n = len(node_ids)
    positions = {}
    for i, nid in enumerate(node_ids):
        angle = (2 * math.pi * i) / max(n, 1)
        positions[nid] = {
            "x": round(300 * math.cos(angle)),
            "y": round(300 * math.sin(angle)),
        }
    return positions


def _serialize_graph(node_ids: list, adj: dict, positions: dict) -> tuple:
    """Convert graph to nodes/edges lists for frontend."""
    nodes = []
    for nid in node_ids:
        pos = positions.get(nid, {"x": 0, "y": 0})
        nodes.append({
            "id": nid,
            "label": nid,
            "x": pos["x"],
            "y": pos["y"],
        })

    edges = []
    seen = set()
    for src, neighbors in adj.items():
        for dst in neighbors:
            pair = tuple(sorted([src, dst]))
            if pair not in seen:
                edges.append({"from": src, "to": dst, "directed": False})
                seen.add(pair)

    return nodes, edges


# ─── Graph BFS ────────────────────────────────────────────────────────────────

def graph_bfs(node_ids: List[str], edges_input: List[dict], start_node: str) -> dict:
    """
    Breadth-First Search on undirected graph.
    edges_input: list of {from, to}
    Returns states[] and performance{}.
    """
    start_time = time.perf_counter()
    tracemalloc.start()

    states = []

    # Build adjacency list
    adj: Dict[str, List[str]] = {nid: [] for nid in node_ids}
    for e in edges_input:
        src, dst = e["from"], e["to"]
        if src in adj:
            adj[src].append(dst)
        if dst in adj:
            adj[dst].append(src)

    positions = _layout_nodes(node_ids)
    nodes, edges = _serialize_graph(node_ids, adj, positions)

    states.append(_make_graph_state(
        nodes, edges, [], [start_node], start_node, "start",
        f"Starting BFS from node {start_node}"
    ))

    visited = []
    visited_set = set()
    queue = deque([start_node])
    in_queue = {start_node}
    op_count = 0

    while queue:
        current = queue.popleft()
        if current in visited_set:
            continue
        visited_set.add(current)
        visited.append(current)
        op_count += 1

        frontier = list(queue)
        states.append(_make_graph_state(
            nodes, edges, list(visited), frontier, current, "visit",
            f"Visiting node {current}. Visited: {visited}"
        ))

        for neighbor in sorted(adj[current]):
            if neighbor not in visited_set and neighbor not in in_queue:
                queue.append(neighbor)
                in_queue.add(neighbor)
                frontier = list(queue)
                states.append(_make_graph_state(
                    nodes, edges, list(visited), frontier, current, "explore",
                    f"Adding neighbor {neighbor} to queue"
                ))

    states.append(_make_graph_state(
        nodes, edges, list(visited), [], None, "done",
        f"BFS complete. Traversal order: {visited}"
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
        "traversal_order": visited,
    }


# ─── Graph DFS ────────────────────────────────────────────────────────────────

def graph_dfs(node_ids: List[str], edges_input: List[dict], start_node: str) -> dict:
    """
    Depth-First Search on undirected graph (iterative with explicit stack).
    Returns states[] and performance{}.
    """
    start_time = time.perf_counter()
    tracemalloc.start()

    states = []

    # Build adjacency list
    adj: Dict[str, List[str]] = {nid: [] for nid in node_ids}
    for e in edges_input:
        src, dst = e["from"], e["to"]
        if src in adj:
            adj[src].append(dst)
        if dst in adj:
            adj[dst].append(src)

    positions = _layout_nodes(node_ids)
    nodes, edges = _serialize_graph(node_ids, adj, positions)

    states.append(_make_graph_state(
        nodes, edges, [], [start_node], start_node, "start",
        f"Starting DFS from node {start_node}"
    ))

    visited = []
    visited_set = set()
    stack = [start_node]
    op_count = 0

    while stack:
        current = stack.pop()
        if current in visited_set:
            continue
        visited_set.add(current)
        visited.append(current)
        op_count += 1

        frontier = list(stack)
        states.append(_make_graph_state(
            nodes, edges, list(visited), frontier, current, "visit",
            f"Visiting node {current}. Stack: {stack}"
        ))

        for neighbor in sorted(adj[current], reverse=True):
            if neighbor not in visited_set:
                stack.append(neighbor)
                frontier = list(stack)
                states.append(_make_graph_state(
                    nodes, edges, list(visited), frontier, current, "explore",
                    f"Pushing neighbor {neighbor} onto stack"
                ))

    states.append(_make_graph_state(
        nodes, edges, list(visited), [], None, "done",
        f"DFS complete. Traversal order: {visited}"
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
        "traversal_order": visited,
    }
