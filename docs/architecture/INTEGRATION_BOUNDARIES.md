# Integration Boundary Analysis

No adapter is implemented in this milestone.

## Recommended future boundary

Place a future adapter beside the processing subsystem, for example `server/adapters/topography/`, consuming a completed analysis record and its source artifacts through a narrow service interface. It should not import React components or expose Drizzle/SQLite types to OcuView3D.

The adapter can currently populate only a provisional subset: laterality when supplied externally (not from the row), Sim K1/K2, astigmatism, eccentricity, image-quality score, ring count, center pixels, working distance, source image reference, and rendered output references. It cannot honestly populate anterior/posterior numeric surfaces, pachymetry, valid masks, axes, pupil/limbus/apex landmarks, calibration metadata, or field-level quality.

The eventual `CorneaData` contract must carry explicit units, coordinate system, laterality, provenance, validity, and distinguish numeric maps from PNG display artifacts. Surface elevation Zernikes must remain a separate domain from wavefront OPD Zernikes.

The contract is defined at `shared/clinical/cornea-data.ts`; the current scalar adapter is `shared/clinical/adapters/current-topography-adapter.ts`. See `docs/data-contracts/CORNEA_DATA.md` and `docs/data-contracts/TOPO_TO_CORNEA_ADAPTER.md`. This is not yet a production instrument adapter.
