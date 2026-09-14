---
name: Replit Python runtime
description: Native library and interpreter behavior for the local image-analysis worker.
---

The image worker should launch Replit's system `python3` and pass the injected
Python/Nix library paths through `LD_LIBRARY_PATH`; a uv-created virtualenv can
use a different Python minor version and may not contain the same native
packages.

**Why:** The project-local Python environment and the Nix Python module exposed
different interpreter/package combinations, and native wheels required shared
libraries that were present only in Replit's injected runtime paths.

**How to apply:** When changing Python dependencies or the worker launcher,
verify imports with the same executable and environment used by the Express
child process, not only with a standalone virtualenv.