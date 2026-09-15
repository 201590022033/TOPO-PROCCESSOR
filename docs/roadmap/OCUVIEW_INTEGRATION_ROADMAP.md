# OcuView3D Integration Roadmap

These are proposed future milestones; none are started here.

1. M0 — Repository audit and explicit data/coordinate contracts (complete).
2. M1 — Versioned normalized `CorneaData` contract with provenance and quality (complete).
3. M2 — Topography adapter that maps only verified current outputs (complete; normalized output is parallel and not persisted).
4. M3 — Patient biometric eye model and explicit laterality transforms (complete; viewer transforms remain future work).
5. M4 — Reference versus patient geometry separation/comparison (complete; numeric surface differences remain unavailable).
6. M5 — Numeric topography/tomography anterior/posterior surface import (complete: Gate C + Gate D no-go; evidence and calibration recovery required).
7. M6 — Placido calibration and physical reconstruction foundation (complete; uncalibrated observation boundary only, no patient reconstruction).
8. M7 — Fundus registration and landmark contract.
9. M8 — Wavefront OPD contract and optical propagation, separate from surface elevation.
10. M9 — Ray tracing and PSF analysis.
11. M10 — Retinal/OCT integration.
12. M11 — Standalone clinical viewer adapters.

M1 must precede M2 because the current repository has no typed, unit-aware normalized output. M5 also requires a real numeric surface source; current PNG heatmaps are insufficient.
