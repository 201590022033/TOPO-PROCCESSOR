# Renderer-Independent Patient Eye Engine

The M3 engine lives under `shared/geometry/eye/` and emits plain TypeScript data. It has no Blender, browser, UI, database, or mesh dependency.

The canonical eye-local frame is versioned in `geometry-types.ts`: origin at the anterior corneal apex, +X posterior along the optical axis, +Y nasal, +Z superior, right-handed, millimetres. OD/OS mirroring into world or viewer coordinates is intentionally external.

`buildGullstrandReferenceEye()` creates a complete relaxed spherical reference model with `reference` provenance. `buildPatientEye()` is separate and never falls back to reference geometry. Patient components report `resolved`, `partial`, or `unavailable` independently, with reasons.

The current topography contract can resolve patient anterior principal radii from K1/K2 using `radius_mm = 337.5 / power_D` (keratometric index 1.3375). This is a keratometric conversion, not posterior-cornea measurement, total corneal power, tomography, or ray tracing. Without K axes, the oriented bitoric surface remains unavailable; eccentricity remains metadata.

Geometry primitives are points, vectors, spherical/conic descriptions, sampled-surface references, and landmarks. No triangle meshes are generated. Future viewer adapters may sample these descriptions.

