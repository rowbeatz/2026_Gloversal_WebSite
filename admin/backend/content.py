"""Read/write content-data.js via Node.js VM for safe JS object parsing."""

import json
import pathlib
import subprocess

DATA_JS = pathlib.Path("/project/site/js/content-data.js")


def read_content() -> dict:
    """Parse content-data.js using Node.js, return Python dict."""
    file_path = str(DATA_JS).replace("\\", "/")
    script = (
        "const vm = require('vm');"
        "const fs = require('fs');"
        f"const src = fs.readFileSync('{file_path}', 'utf8');"
        "const ctx = { window: {} };"
        "vm.createContext(ctx);"
        "vm.runInContext(src, ctx);"
        "console.log(JSON.stringify(ctx.window.__GLV_CONTENT__));"
    )
    result = subprocess.run(
        ["node", "-e", script],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(result.stdout.strip())


def write_content(data: dict):
    """Write Python dict back to content-data.js format."""
    j = json.dumps(data, ensure_ascii=False, indent=2)
    content = f"""/* =============================================================
   Gloversal — content-data.js  [managed by admin panel]
   ============================================================= */
window.__GLV_CONTENT__ = {j};
"""
    DATA_JS.write_text(content, encoding="utf-8")
