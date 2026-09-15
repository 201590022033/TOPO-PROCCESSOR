# Normalized `CorneaData` Contract

The contract is implemented in `shared/clinical/` and is intentionally independent of React, Express routes, SQLite, rendered images, and Blender. It is the boundary for future instrument adapters and the patient-eye engine.

`schemaVersion` is currently `"1.0"`. Every clinical value is either `{ status: "available", value: ... }` or `{ status: "unavailable", reason: ... }`; unavailable values are never represented as zero, null, empty arrays, or heatmap pixels.

Units are explicit and limited to `mm`, `um`, `D`, `deg`, `px`, and `unitless`. Laterality is mandatory: `OD`, `OS`, or explicit `UNKNOWN`.

K1/K2 carry dioptres, a flat/steep meridian meaning, optional degree axis, and provenance. The current application’s Sim K naming is ambiguous and does not calculate axes, so the current example leaves axes unavailable and retains the source-derived values without silently redefining their clinical convention.

Surfaces use a forward-compatible regular grid: physical `mm` coordinates, width/height, scalar values, coordinate-system metadata, optional validity mask/confidence, and provenance. PNG heatmaps cannot satisfy this representation. Surface elevation and wavefront OPD Zernikes remain separate domains.

```json
{
  "schemaVersion": "1.0",
  "laterality": "UNKNOWN",
  "keratometry": { "K1": { "status": "available", "value": { "value": 44.25, "unit": "D", "meaning": "flat-meridian" } }, "K2": { "status": "available", "value": { "value": 43.10, "unit": "D", "meaning": "steep-meridian" } } },
  "posteriorSurface": { "status": "unavailable", "reason": "unsupported-by-source" }
}
```

The current processor can populate scalar Sim K1/K2, astigmatism, eccentricity, image quality, ring count, and image centre pixels. It cannot currently populate numeric anterior/posterior surfaces, pachymetry, axes, physical apex/pupil/limbus landmarks, validity masks, point confidence, or explicit laterality.

