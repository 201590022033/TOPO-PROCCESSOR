# Repository Constitution

- Keep clinical calculations separate from presentation and UI rendering.
- Preserve traceability from raw source data to every derived result.
- Make units and eye laterality explicit in every clinical contract.
- Centralize coordinate transformations; never rely on implicit orientation.
- Keep Blender outside the clinical core; adapters must use defined contracts.
- Visualization and heatmaps are displays, never the source of clinical truth.
- Keep patient data distinct from Gullstrand/reference data.
- Keep wavefront OPD Zernikes separate from physical corneal-surface elevation.
- Changes to clinical behavior require regression tests.
- Do not hide safety, quality, or diagnostic limitations.
- Follow `docs/DEVELOPMENT_VALIDATION.md` before integration work.
