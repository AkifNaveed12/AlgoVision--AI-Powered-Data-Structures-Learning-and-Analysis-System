-- ═══════════════════════════════════════════════════════════════════
-- AlgoVision — Practice Problems Seed Data
-- Run AFTER schema.sql in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO practice_problems (title, difficulty, description, solution, hints, expected_output, language_id) VALUES

('Find Maximum in Array', 'Easy',
'Given an array of integers, find and return the maximum element.

Input (one line, space-separated): 3 1 4 1 5 9
Output: 9',
'arr = list(map(int, input().split()))
print(max(arr))',
'["Iterate through all elements", "Keep track of the current maximum", "Python has a built-in max() function"]',
'9', 71),

('Reverse an Array', 'Easy',
'Given an array, print its elements in reverse order.

Input: 1 2 3 4 5
Output: 5 4 3 2 1',
'arr = list(map(int, input().split()))
print(*arr[::-1])',
'["Use Python slice notation arr[::-1]", "Or use a loop from end to start"]',
'5 4 3 2 1', 71),

('Count Occurrences', 'Easy',
'Given an array and a target value, count how many times the target appears.

First line: array elements
Second line: target

Input:
1 2 3 2 4 2
2
Output: 3',
'arr = list(map(int, input().split()))
target = int(input())
print(arr.count(target))',
'["Use list.count() method", "Or iterate and count manually"]',
'3', 71),

('Check Sorted Array', 'Easy',
'Determine if an array is sorted in ascending order. Print True or False.

Input: 1 2 3 4 5
Output: True',
'arr = list(map(int, input().split()))
print(arr == sorted(arr))',
'["Compare array with its sorted version", "Or check each adjacent pair"]',
'True', 71),

('Sum of Array', 'Easy',
'Compute the sum of all elements in an array.

Input: 1 2 3 4 5
Output: 15',
'arr = list(map(int, input().split()))
print(sum(arr))',
'["Use built-in sum()", "Or use a loop accumulator"]',
'15', 71),

('Remove Duplicates', 'Medium',
'Given an array, print only unique elements in their original order.

Input: 1 2 2 3 4 3 5
Output: 1 2 3 4 5',
'arr = list(map(int, input().split()))
seen = []
[seen.append(x) for x in arr if x not in seen]
print(*seen)',
'["Use a set to track seen elements", "Maintain original order", "Python dict.fromkeys() preserves order"]',
'1 2 3 4 5', 71),

('Second Largest', 'Medium',
'Find the second largest element in an array. Assume all elements are distinct.

Input: 3 1 4 1 5 9 2 6
Output: 6',
'arr = list(map(int, input().split()))
arr = list(set(arr))
arr.sort()
print(arr[-2])',
'["Sort the array", "Access second to last element", "Or use a single pass tracking top-2 values"]',
'6', 71),

('Rotate Array', 'Medium',
'Rotate array to the right by k positions.

First line: array
Second line: k

Input:
1 2 3 4 5
2
Output: 4 5 1 2 3',
'arr = list(map(int, input().split()))
k = int(input())
k = k % len(arr)
print(*arr[-k:] + arr[:-k])',
'["Use Python slice: arr[-k:] + arr[:-k]", "Handle k > len(arr) with modulo", "Consider in-place rotation for efficiency"]',
'4 5 1 2 3', 71),

('Merge Two Sorted Arrays', 'Hard',
'Merge two sorted arrays into one sorted array.

First line: first array
Second line: second array

Input:
1 3 5
2 4 6
Output: 1 2 3 4 5 6',
'a = list(map(int, input().split()))
b = list(map(int, input().split()))
print(*sorted(a+b))',
'["Two-pointer technique is most efficient", "Or simply concatenate and sort", "Think about O(n) vs O(n log n) complexity"]',
'1 2 3 4 5 6', 71),

('Find Missing Number', 'Hard',
'Given an array containing n-1 integers from 1 to n (no duplicates), find the missing number.

Input: 1 2 4 5 6
Output: 3',
'arr = list(map(int, input().split()))
n = len(arr) + 1
print(n*(n+1)//2 - sum(arr))',
'["Sum formula: n*(n+1)/2", "XOR approach is also valid", "What is the expected sum minus actual sum?"]',
'3', 71);
