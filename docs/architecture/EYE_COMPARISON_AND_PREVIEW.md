# Eye Comparison and Reference-Assisted Preview

M4 adds renderer-independent comparison and display-composition layers under `shared/geometry/eye/`.

`compareEyes(reference, patient)` produces only valid differences. Scalar deltas use `patient - reference`, require compatible semantics/units, and carry comparison provenance. Each component is `comparable`, `partially-comparable`, or `not-comparable` with reasons.

`buildReferenceAssistedPreview(reference, patient)` is a research/display composition, not a `PatientEyeModel`. Every component is labelled `PATIENT`, `REFERENCE`, or `MIXED`; it cannot upgrade patient availability. Current anterior cornea is `MIXED`: patient K magnitudes constrain only a rotationally symmetric mean-curvature preview, while orientation remains unknown. The reference lens and posterior anatomy are labelled `REFERENCE`.

For current TOPO data, K magnitudes, principal keratometric radii, and astigmatic magnitude are partially comparable. K axes, eccentricity against spherical Gullstrand, posterior cornea, chamber, lens, globe, retina, fovea, ONH, and numeric surface differences remain non-comparable. The reference anterior radius is converted to a keratometric-equivalent `43.831... D` using `337.5 / radius_mm`; this is not exact optical power.

Source coverage counts are descriptive metadata, never diagnostic confidence. No arbitrary meridian orientation, posterior power, synthetic surface, or patient reference fallback is generated.

