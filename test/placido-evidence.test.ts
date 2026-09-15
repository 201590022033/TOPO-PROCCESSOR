import assert from "node:assert/strict";
import { currentApplicationCorneaExample } from "../shared/clinical/cornea-data.example";
import { createRadialPlacidoObservation } from "../shared/clinical/placido/placido-observation";
import { compareObservationRepeatability, validateCalibrationEvidence } from "../shared/clinical/placido/calibration-evidence";

const provenance = { origin: "measured" as const, sourceModality: "calibration evidence", sourceId: "test" };
const o1 = createRadialPlacidoObservation(512, 512, 256, 256, [10, 20], "calibration-01/source.png");
const o2 = createRadialPlacidoObservation(512, 512, 257, 256, [10.2, 19.8], "calibration-02/source.png");
const repeated = compareObservationRepeatability([o1, o2]);
assert.equal(o1.sourceImageIdentifier, "calibration-01/source.png"); assert.equal(o1.rings[0].unit, "px"); assert.equal(repeated.units, "px"); assert.equal(repeated.centreDisplacementPx[0], 1); assert.ok(Math.abs(repeated.ringRadiusRangePx[0] - 0.2) < 1e-12); assert.match(repeated.interpretation, /not clinical accuracy/);
const unknown = { status: "unavailable", reason: "not supplied" } as const;
const pkg = { schemaVersion: "1.0", instrument: { identificationSource: "unknown" }, calibration: { schemaVersion: "1.0", provenance, device: { ringCount: unknown, ringRadii: unknown, targetGeometry: { status: "available", value: { targetType: "conical", rings: [{ ringNumber: 1, radiusMm: 10, axialPositionMm: 2 }], centralApertureMm: 3 } }, cameraToTarget: unknown, opticalAxis: unknown }, camera: { imageDimensions: { status: "available", value: { widthPx: 512, heightPx: 512 } }, principalPoint: unknown, focalLength: unknown, distortionModel: unknown }, acquisition: { workingDistance: { status: "available", value: { value: 75, unit: "mm" } }, alignment: unknown, referenceCenter: { status: "available", value: { x: 256, y: 256, unit: "px" } } }, calibrationSurface: unknown }, calibrationObject: { schemaVersion: "1.0", objectType: "calibration eye", surfaceType: "unknown", radiusMm: { status: "UNKNOWN", reason: "not supplied" }, provenance: "unknown" }, acquisitions: [{ id: "calibration-01", sourceImage: "source.png", recordedDimensions: { widthPx: 512, heightPx: 512 }, observation: o1 }] };
assert.equal(validateCalibrationEvidence(pkg).calibration.device.targetGeometry.value.rings[0].axialPositionMm, 2); assert.deepEqual(JSON.parse(JSON.stringify(pkg.calibrationObject)), pkg.calibrationObject); assert.equal(currentApplicationCorneaExample.anteriorSurface.status, "unavailable");
assert.throws(() => validateCalibrationEvidence({ ...pkg, acquisitions: [{ ...pkg.acquisitions[0], recordedDimensions: { widthPx: 500, heightPx: 512 } }] }));
assert.throws(() => validateCalibrationEvidence({ ...pkg, calibrationObject: { ...pkg.calibrationObject, radiusMm: { status: "UNKNOWN" } } }));
assert.throws(() => validateCalibrationEvidence({ ...pkg, calibration: { ...pkg.calibration, device: { ...pkg.calibration.device, targetGeometry: { status: "available", value: { targetType: "conical", rings: [{ ringNumber: 1, radiusMm: -1 }] } } } } }));
console.log("Placido evidence package tests passed (13 assertions).");
