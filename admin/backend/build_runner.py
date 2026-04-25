"""Run build_pages.py and git push for deploy."""

import pathlib
import subprocess

PROJECT = pathlib.Path("/project")


def run_build() -> dict:
    """Execute build_pages.py and return stdout/stderr."""
    result = subprocess.run(
        ["python", "build_pages.py"],
        cwd=PROJECT,
        capture_output=True,
        text=True,
    )
    return {
        "returncode": result.returncode,
        "stdout": result.stdout,
        "stderr": result.stderr,
    }


def git_push(commit_msg: str = "chore(admin): content update") -> dict:
    """Stage site/ changes, commit, and push to origin main."""
    cmds = [
        ["git", "add", "site/"],
        ["git", "commit", "-m", commit_msg],
        ["git", "push", "origin", "main"],
    ]
    log = []
    for cmd in cmds:
        r = subprocess.run(cmd, cwd=PROJECT, capture_output=True, text=True)
        log.append({
            "cmd": " ".join(cmd),
            "returncode": r.returncode,
            "out": r.stdout + r.stderr,
        })
        if r.returncode != 0 and "nothing to commit" not in (r.stdout + r.stderr):
            break
    return {"steps": log}
