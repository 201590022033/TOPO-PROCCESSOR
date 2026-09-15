# Placido Numeric Surface Audit (M5)

## Data flow actually present

The active server path is:

```text
upload/sample path
  -> server/routes.ts
  -> processTopographyAnalysis()
  -> decodeImage() [Sharp, rotate, optional max-1024 downsample]
  -> grayscale Float32Array [image pixels]
  -> fixed image-centre and radial profile
  -> 7-point smoothed radial profile
  -> peak ring radii (pixel numbers), with evenly-spaced fallback
  -> powerMap/elevationMap Float32Array
  -> scalar Sim K/eccentricity/quality metrics
  -> PNG heatmaps + metrics.csv + SQLite JSON results
```

The active TypeScript implementation is the application path and is the one used by `server/routes.ts`. The Python tree is retained legacy/prototype material and is not invoked by that route.

## Intermediate numerical data

`server/topography_processor.ts` contains grayscale pixels, radial profile arrays, smoothed radial profile arrays, detected `ringRadii`, `powerMap`, `elevationMap`, and `normalizedRadiusMap`, all indexed in image pixels. `cx`, `cy`, and `maxRadius` are pixel values. No polar sample table, ring-by-meridian radii, calibrated XYZ points, normal vectors, valid-sample flags, or physical coordinate grid leaves the function.

The retained `attached_assets` Python prototype contains richer intermediate structures (`r_pixels`, `coords`, `flagged_points`, meridian angles, `arc_step_k`, `ozs`, `oys`, `plot_x/y/z`, `rocs_map`, and `elevation_map`). Its `arc_step_method.py` can construct an experimental surface from camera/model inputs, but that path is not the active server pipeline, has no shipped calibration/model fixture, and is not a verified current clinical output.

## Map-driving scalars and mathematics

The active axial map is driven by `powerMap[idx]`, a bounded application-specific power-like scalar in an intended dioptre display range. It is computed from radial intensity variation, local grayscale signal, and angular terms, then clamped to 35–55. The tangential map derives another display scalar from `powerMap`, radial signal variation, and an angular term. These are not reusable calibrated curvature fields.

The active elevation display is driven by a hard-coded formula using `cos(angle)`, `sin(2*angle)`, normalized pixel radius, and a central term, clamped to ±0.8 and commented “Elevation in mm”. It is not recovered from Placido reflection geometry, calibrated sag, or measured surface points. It is converted to colors and written as `corneal_surface_3d.png`; the underlying array is not exported or persisted.

Sim K1/K2 are percentiles of synthetic/heuristic `powerMap` regions; astigmatism is their absolute difference. Eccentricity is a scaled standard deviation of the heuristic elevation array. Quality is derived from inner power variation. Ring count is detected peak count. These are model parameters/scalars, not a recoverable physical surface.

## Calibration audit

The active path uses configurable working distance (default 75, displayed as mm), image dimensions, requested mire count, and a fixed image-radius normalization. It contains no camera focal length, sensor dimensions, Placido target dimensions, mire spacing, pixel-to-mm conversion, calibration-eye fit, reflection geometry, or calibration identifier. Working distance alone is insufficient to recover physical corneal coordinates.

The legacy Python prototype accepts working distance, sensor dimensions, focal length, a Placido model file, and gap functions. Those inputs are not present as a verified fixture in this repository and the worker currently uses the separate deterministic visualization implementation. No calibration quantity is therefore promoted into `CorneaData`.

## Coordinate and validity state

The active coordinate system is image pixels: top-left array origin, +X increasing columns, +Y increasing rows, with image-angle convention inferred from `atan2(dy, dx)`. Handedness, Z direction, superior/inferior, nasal/temporal, OD/OS, anatomical axis, and pixel-to-mm scale are unknown. The outer region (`normR > 0.98`) becomes `NaN` internally, but no validity mask is exported; this is not enough to claim a clinical validity domain.

## Recoverability gate

**Gate C + Gate D — model parameters only and display-only map.**

Gate A is not met because no active verified physical XYZ/sag/elevation representation is exported. Gate B is not met because the active `powerMap` is heuristic and not a calibrated curvature field. The displayed “surface elevation” PNG cannot be treated as geometry, and the active elevation formula must not be normalized as measured data.

## Fixtures, missing evidence, and future validation

Repository fixtures are sample Placido/reference images and seeded scalar values. They provide no numeric ground-truth surface, calibration-eye radius, expected physical sag, or verified ring-position table. The historical Python files include no complete calibration dataset in the repository.

A future reconstruction milestone would first need the actual active algorithm path selected, a calibration eye with known sphere radius/curvature and measurement conditions, verified camera focal length and sensor dimensions, Placido target ring radii/heights or equivalent device model, working distance/gap definitions, image resolution/cropping rules, and expected physical XYZ/sag values. Those requirements follow the legacy arc-step inputs; they must be validated against the chosen production algorithm before implementation.

## Risks

Treating heuristic elevation as clinical geometry, treating RGB heatmaps as numeric data, assuming working distance supplies scale, conflating power with curvature radius or sag, inferring axes/laterality from image orientation, and using inactive legacy Python structures as current outputs would all create false clinical claims. `CorneaData.anteriorSurface` remains explicitly unavailable.

