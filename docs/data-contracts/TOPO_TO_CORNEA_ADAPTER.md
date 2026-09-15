# Current Topography to `CorneaData` Adapter

The pure adapter is `shared/clinical/adapters/current-topography-adapter.ts`. It accepts the final scalar result shape assembled by `server/topography_processor.ts` and returns validated `CorneaData` v1. It has no UI, route, database, DOM, rendered-image, or Blender dependency.

The integration is parallel: `server/topography_processor.ts` invokes the adapter after constructing its existing `results` object. The existing results, SQLite persistence, output files, and UI behavior are unchanged; normalized data is not persisted or exposed as a patient API in M2.

## Mapped fields

`simK1` and `simK2` map to dioptres with the current application’s labels retained as flat- and steep-meridian meanings. `astigmatism` maps to dioptres, `eccentricity` to unitless, `imageQuality` to an application-specific quality score, `ringsDetected` to a count, and `centerX`/`centerY` to pixel coordinates.

Each populated derived field identifies the Placido-disc modality and the producing `topography_processor.ts` field. No calibration identifier, timestamp, device identifier, or pixel-to-mm conversion is invented.

Laterality is always `UNKNOWN`: current analysis rows and processor results do not carry laterality, and it is not inferred from filenames or reference descriptions. Coordinates retain the current image convention: top-left array origin, detected centre as origin description, +X right, +Y down, pixel angular convention, and unknown Z/handedness. No OcuView3D transform is performed.

## Explicitly unavailable

K axes, mean K, Q, physical corneal centre/apex/pupil/limbus, anterior or posterior numeric surfaces, pachymetry, validity masks, point confidence, and numeric elevation Zernikes remain unavailable. Rendered axial/tangential/elevation PNGs are never accepted as numeric surfaces. Ring count is not a validity mask, and image quality is not a standardized clinical confidence score.

The current Sim K flat/steep semantics are preserved as application labels; their clinical naming and axis convention remain ambiguous because the source calculates no axis.

