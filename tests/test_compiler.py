"""Quick test of the new subprocess compiler service."""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.services.compiler_service import execute_code

async def main():
    tests = [
        {
            "name": "Python 3",
            "lang_id": 71,
            "code": 'print("Hello from Python!")\nprint(2 + 2)',
        },
        {
            "name": "JavaScript",
            "lang_id": 63,
            "code": 'console.log("Hello from JavaScript!");\nconsole.log(2 + 2);',
        },
        {
            "name": "Java",
            "lang_id": 62,
            "code": 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n        System.out.println(2 + 2);\n    }\n}',
        },
        {
            "name": "C++",
            "lang_id": 54,
            "code": '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello from C++!" << endl;\n    cout << 2 + 2 << endl;\n    return 0;\n}',
        },
    ]

    for test in tests:
        print(f"\n{'='*50}")
        print(f"Testing: {test['name']}")
        print(f"{'='*50}")
        result = await execute_code(test["code"], test["lang_id"])
        print(f"  Status  : {result['status']}")
        print(f"  Stdout  : {repr(result['stdout'])}")
        print(f"  Stderr  : {repr(result['stderr'])}")
        print(f"  Compile : {repr(result['compile_output'])}")
        print(f"  Time    : {result['time']}s")

asyncio.run(main())
