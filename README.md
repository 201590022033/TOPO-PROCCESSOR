# OculoMetrics

OculoMetrics is a web app for reviewing Placido-disc corneal topography
images. It uploads an image, stores an analysis record in a local SQLite database, runs a
local Python/OpenCV worker, and presents generated exploratory maps and image
derived metrics.

> The included processing is an exploratory prototype. It is not a clinical
> diagnosis or a substitute for validated medical-device software.

## Run locally

1. Make sure Node.js 20 and Python 3.11+ are available.
2. Install JavaScript dependencies with `npm install`.
3. Install Python dependencies with `uv sync` (or use the system package setup).
4. Start the app with `npm run dev`. The local SQLite database (`./data/topo-processor.db`) initializes automatically.

The server runs on port `3000` (or `PORT` configured in environment). The Python worker is launched from
`.pythonlibs/bin/python` when that environment exists, and otherwise falls
back to `python3`.

## App flow

- Upload a PNG, JPEG, or other browser-recognized image up to 10 MB.
- Choose processing parameters and run an analysis.
- Watch the analysis page poll until processing completes or reports an error.
- Review the input image, generated maps, metrics, and download a CSV report.

## Project layout

- `client/` — React/Vite user interface
- `server/` — Express API and database storage
- `server/python_analysis/` — self-contained OpenCV analysis worker
- `shared/` — shared API and database types
- `attached_assets/` — original reference scripts retained as source material

## GitHub

The repository is configured for the `201590022033/Python-Assets` GitHub
remote. Commit the verified changes to `main` and push them after reviewing
the diff.