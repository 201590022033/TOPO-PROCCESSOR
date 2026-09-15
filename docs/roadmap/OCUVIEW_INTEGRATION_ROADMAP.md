# OcuView3D Integration Roadmap

These are proposed future milestones; none are started here.

1. M0 — Repository audit and explicit data/coordinate contracts (this milestone).
2. M1 — Versioned normalized `CorneaData` contract with provenance and quality.
3. M2 — Topography adapter that maps only verified current outputs.
4. M3 — Patient biometric eye model and explicit laterality transforms.
5. M4 — Reference versus patient geometry separation/comparison.
6. M5 — Numeric topography/tomography anterior/posterior surface import.
7. M6 — Fundus registration and landmark contract.
8. M7 — Wavefront OPD contract and optical propagation, separate from surface elevation.
9. M8 — Ray tracing and PSF analysis.
10. M9 — Retinal/OCT integration.
11. M10 — Standalone clinical viewer adapters.

M1 must precede M2 because the current repository has no typed, unit-aware normalized output. M5 also requires a real numeric surface source; current PNG heatmaps are insufficient.

