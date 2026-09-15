# Coordinate System Audit

The current application has no explicit clinical coordinate-system contract.

## Observed conventions

- Image arrays use `(x, y)` pixel indexing with row-major `y * width + x`.
- Center coordinates are pixel values; the image origin is therefore effectively the top-left in implementation terms.
- `atan2(dy, dx)` is used, so positive X is rightward and positive Y is downward in image coordinates. Angular zero is +X; increasing angles follow image-clockwise appearance. This is an implementation inference, not a declared clinical convention.
- Radial distances and `maxRadius` are pixels. No pixel-to-mm conversion is implemented for the surface grid.
- Working distance is labelled mm; dioptres are used for power values; elevation is commented as mm. These units are not represented in types or metadata.
- OD/OS appears in sample descriptions (`OD`/`OS`) but laterality is not stored in the analysis schema and no nasal/temporal transformation is implemented.
- Superior/inferior orientation is not declared. The synthetic asymmetry uses image `y` directly.
- Keratometric axis convention is not persisted; seeded text mentions angles but active results contain no axis.
- “BFS ±0.80 mm” is a display label only; reference-sphere parameters are not exported.

## Risks

Do not consume current X/Y, angle, radius, map orientation, or laterality assumptions as a patient-eye contract without an explicit adapter-level convention and tests.

