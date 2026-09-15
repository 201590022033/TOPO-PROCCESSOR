# Placido Reconstruction Architecture

```text
image observations (px, uncalibrated)
        |
        v
device/target + camera calibration
        |
        v
physical optical/reflection forward model
        |
        v
inverse reconstruction boundary
        |
        v
calibration residual/coverage validation
        |
        v
CorneaData anteriorSurface (future, only after evidence gate)
```

Observations remain distinct from predicted ring positions and physical surface measurements. M6 defines contracts and an uncalibrated active observation export; it does not activate the retained legacy reconstruction code or claim patient geometry.

