# Placido Calibration-Eye Validation Plan

## Must have

- Raw original calibration-eye image, with unmodified dimensions and acquisition metadata.
- Authoritative calibration-eye sphere radius in mm, or manufacturer specification identifying its physical basis.
- Device/Placido target ring count and physical ring radii/heights, with specification source.
- Camera intrinsics available for the acquisition: focal length and sensor/image geometry, or a documented equivalent.
- Working distance and alignment/reference-centre measurement for the image.
- Calibration provenance and repeatability information.

## Nice to have

- Distortion model and distortion coefficients.
- Raw detected ring points plus rejected/occluded observations.
- Multiple distances and repeated captures.
- Independent expected curvature/residual acceptance criteria.

## Derivable after the above is supplied

- Ring correspondence and predicted image positions through a documented forward model.
- Calibration residuals in px and physical reconstruction residuals in mm, with observation coverage.
- Whether the selected retained arc-step model is numerically stable for the device.

## Unknown today

The repository contains no calibration-eye image or known radius, no complete device specification, and no verified camera-intrinsic record for the active path. The legacy Python path mentions sensor dimensions, focal length, target model file, working distance, and gap functions, but its calibration files are absent and it is not wired to the active server.

Validation must compare predicted ring positions against observed points and compare reconstructed sphere radius/sag against the authoritative sphere. Residual fit quality is calibration quality, not clinical accuracy. No production reconstruction should be enabled until this evidence is available and independently reviewed.

