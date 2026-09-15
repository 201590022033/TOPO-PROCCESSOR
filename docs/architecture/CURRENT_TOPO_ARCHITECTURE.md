# Current Topography Architecture

This is an audit of the implementation at baseline commit `5d2642917be19957bdccbb46cde3cab75be3f8e8`.

## Data flow

```text
browser upload/sample selection
          |
          v
Express /api/upload -> client/public/images (normalized image file)
          |
          v
POST /api/analysis -> SQLite analysis row (pending)
          |
          v
server/topography_processor.ts
  decode/rotate/downsample -> grayscale/blur -> center/ring detection
          |
          +--> synthetic power/elevation arrays -> derived scalar metrics
          |
          +--> axial/tangential/elevation/mire PNG heatmaps
          |
          +--> metrics.csv
          |
          v
SQLite JSON results/output_files and GET /export CSV
          |
          v
React Dashboard / AnalysisDetails viewer
```

## Components

- `server/index.ts` starts Express, middleware, routes, and Vite/static serving.
- `server/routes.ts` handles uploads, analysis CRUD, sample metadata, and CSV export.
- `server/topography_processor.ts` performs image decoding and the active TypeScript processing/rendering path.
- `server/storage.ts` seeds two reference records and persists analysis rows through Drizzle.
- `server/db.ts` opens `data/topo-processor.db`, enables WAL/foreign keys, and applies migrations.
- `client/src` is a React UI using TanStack Query and Recharts; rendered images are served from `/images`.
- `server/python_analysis` and matching `attached_assets` are retained Python/legacy processing sources. The active route does not invoke them.

## Current limitations

The active processor creates bounded synthetic/heuristic power and elevation fields from image signals. It does not expose a typed surface grid or a normalized clinical contract. Results are an untyped JSON object, output files are paths, and most calibration/orientation metadata is absent.

