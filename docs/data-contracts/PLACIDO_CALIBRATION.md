# Placido Calibration Contract

`shared/clinical/placido/placido-calibration.ts` defines versioned, renderer-independent calibration data. It separates device/target geometry, camera geometry, acquisition geometry, and a known calibration sphere. Every missing item is explicit availability; no camera intrinsics, ring dimensions, or pixel-to-mm scale is defaulted.

The contract also defines boundaries for a future forward model (known surface + device/camera geometry → predicted image ring positions), inverse reconstruction (observations + calibrated device → physical measurements), and calibration results with image/physical residual units. Neither solver is implemented in M6.

`KnownSphere.radius` is fundamental physical geometry in `mm`. Optional dioptres require an explicit convention; M6 does not silently apply keratometry. Synthetic 7.0, 7.5, 8.0, and 9.0 mm sphere fixtures are test objects only.

