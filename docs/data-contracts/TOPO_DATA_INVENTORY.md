# Topography Data Inventory

Unavailable means the repository does not currently provide the field as a trustworthy persisted/exported numeric output.

| Field | Source | Unit | Coordinate system | Measured/derived | Internal representation | Persistence | Export availability | Confidence/validity |
|---|---|---|---|---|---|---|---|---|
| Sim K1 | TypeScript processor or seeded reference | D (implied) | Unspecified image plane | Derived/seeded | JSON number | Yes | Yes, generic CSV | No field-level confidence |
| Sim K2 | TypeScript processor or seeded reference | D (implied) | Unspecified image plane | Derived/seeded | JSON number | Yes | Yes, generic CSV | No field-level confidence |
| Astigmatism | Difference of Sim K values | D (implied) | Unspecified | Derived | JSON number | Yes | Yes | No field-level confidence |
| Eccentricity | Elevation standard deviation heuristic | Unspecified | Unspecified | Derived | JSON number | Yes | Yes | No field-level confidence |
| Image quality | Ring-power variation heuristic | Unspecified score | Unspecified | Derived | JSON number | Yes | Yes | No validity mask |
| Rings detected | Image/ring detection | count | Image pixels | Derived | JSON number | Yes | Yes | Ring detection quality absent |
| Center X/Y | Processor center detection | pixels | Image origin/direction undocumented | Derived | JSON numbers | Yes | Yes | No uncertainty |
| Working distance | User configuration | mm (UI label) | N/A | Input/configuration | SQLite integer | Yes | Yes | No calibration provenance |
| Zernike degree | User configuration | polynomial degree | N/A | Configuration only | SQLite integer | Yes | Yes | Coefficients unavailable |
| Elevation field | Processor array, rendered | mm is stated in source | Unspecified image grid | Derived heuristic | transient Float32Array | No | No numeric export | Invalid pixels become NaN, no persisted mask |
| Axial/tangential maps | Processor PNGs/reference images | color scale implies D; not encoded numerically | Image pixels | Rendered | PNG path | Path only | No numeric map | No machine-readable validity |
| Raw measurement points | No active output found | Unavailable | Unavailable | Unavailable | Unavailable | No | No | Unavailable |
| Pachymetry/thickness | No active output found | Unavailable | Unavailable | Unavailable | Unavailable | No | No | Unavailable |
| Laterality | Reference description only (OD/OS) | N/A | Unspecified | Metadata/display | Not a schema field | No | Only in descriptive text | Not contractually enforced |

Keratometry axes, mean K, corneal/apex/pupil/limbus coordinates, curvature families beyond rendered labels, calibration constants, pixel-to-mm conversion, valid masks, and confidence metrics are unavailable as structured outputs.

