import json
import os
import subprocess
import sys


def main():
    data = json.load(sys.stdin)
    tool_input = data.get("tool_input", {}) or {}
    tool_response = data.get("tool_response", {}) or {}
    file_path = tool_input.get("file_path") or tool_response.get("filePath") or ""

    if not file_path.endswith((".js", ".jsx")):
        return
    if not os.path.isfile(file_path):
        return

    result = subprocess.run(
        ["npx", "oxlint", file_path],
        capture_output=True,
        text=True,
        shell=True,
    )
    output = (result.stdout + result.stderr).strip()
    if output:
        print(output)


if __name__ == "__main__":
    main()
