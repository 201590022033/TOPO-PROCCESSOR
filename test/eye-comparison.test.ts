import assert from "node:assert/strict";
import { currentApplicationCorneaExample } from "../shared/clinical/cornea-data.example";
import { buildGullstrandReferenceEye } from "../shared/geometry/eye/gullstrand-reference";
import { buildPatientEye } from "../shared/geometry/eye/patient-eye-builder";
import { compareEyes, referenceKeratometricPower } from "../shared/geometry/eye/eye-comparison";
import { buildReferenceAssistedPreview } from "../shared/geometry/eye/reference-assisted-preview";

const reference = buildGullstrandReferenceEye(); const patient = buildPatientEye(currentApplicationCorneaExample); const comparison = compareEyes(reference, patient); const preview = buildReferenceAssistedPreview(reference, patient);
assert.ok(reference); assert.equal(patient.components.anteriorCornea.status, "partial"); assert.equal(comparison.anteriorCornea.status, "partially-comparable");
assert.equal(referenceKeratometricPower(7.7), 337.5 / 7.7); assert.equal(comparison.anteriorCornea.scalars.K1.unit, "D"); assert.equal(comparison.anteriorCornea.scalars.K1.delta, 44.25 - 337.5 / 7.7); assert.equal(comparison.anteriorCornea.scalars.K2.delta, 43.1 - 337.5 / 7.7); assert.equal(comparison.anteriorCornea.scalars.principalRadius1.unit, "mm"); assert.equal(comparison.anteriorCornea.scalars.astigmatism.delta, 1.15);
assert.equal(comparison.components.posteriorCornea.status, "not-comparable"); assert.equal(comparison.components.anteriorChamber.status, "not-comparable"); assert.equal(comparison.components.lens.status, "not-comparable"); assert.equal(comparison.summary.differenceConvention, "patient - reference"); assert.equal(comparison.summary.differenceSurface.status, "unavailable"); assert.equal(patient.anteriorCornea!.orientation.status, "unavailable");
assert.equal(preview.modelKind, "reference-assisted-preview"); assert.equal(preview.components.lens.source, "REFERENCE"); assert.equal(preview.components.lens.displaySource, "REFERENCE"); assert.equal(preview.components.anteriorCornea.source, "MIXED"); assert.equal(patient.components.lens.status, "unavailable"); assert.equal(preview.provenance.origin, "derived");
assert.deepEqual(JSON.parse(JSON.stringify(preview)), preview); assert.deepEqual(JSON.parse(JSON.stringify(comparison)), comparison); assert.notEqual(preview.modelKind, "patient"); assert.equal(preview.coverage.mixed, 1); assert.equal(preview.coverage.reference, 5);
console.log("Eye comparison and preview tests passed (25 assertions).");

