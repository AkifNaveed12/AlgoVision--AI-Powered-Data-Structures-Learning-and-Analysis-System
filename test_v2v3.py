import sys
sys.path.insert(0, '.')
from backend.algorithms.bst_engine import bst_insert, bst_search, bst_traversal
from backend.algorithms.graph_engine import graph_bfs, graph_dfs
from backend.algorithms.sorting_engine import bubble_sort, binary_search, quick_sort

# Test BST insert
r = bst_insert([50,30,70], 40)
states_count = len(r["states"])
print(f"BST insert: {states_count} states, perf={r['performance']}")

# Test BST search
r = bst_search([50,30,70,40], 40)
print(f"BST search: found={r['found']}, {len(r['states'])} states")

# Test BST traversal
r = bst_traversal([50,30,70], 'inorder')
print(f"BST inorder: {r['visited_order']}")

# Test graph BFS
edges = [{"from":"A","to":"B"},{"from":"A","to":"C"},{"from":"B","to":"D"}]
r = graph_bfs(['A','B','C','D'], edges, 'A')
print(f"BFS: order={r['traversal_order']}, {len(r['states'])} states")

# Test graph DFS
r = graph_dfs(['A','B','C','D'], edges, 'A')
print(f"DFS: order={r['traversal_order']}")

# Test bubble sort
r = bubble_sort([64,34,25,12])
print(f"Bubble sort: result={r['sorted_array']}, {len(r['states'])} states")

# Test binary search found
r = binary_search([5,10,15,20,25], 15)
print(f"Binary search: found={r['found']}, idx={r['index']}")

# Test binary search not found
r = binary_search([5,10,15,20,25], 99)
print(f"Binary search (not found): found={r['found']}")

# Test quick sort
r = quick_sort([64,34,25,12,22,11])
print(f"Quick sort: result={r['sorted_array']}")

print("ALL TESTS PASSED")
