import assert from "node:assert/strict";
import { toCorneaData } from "../shared/clinical/adapters/current-topography-adapter";
import { parseCorneaData } from "../shared/clinical/cornea-data";

const source = { simK1: 44.251234, simK2: 43.101234, astigmatism: 1.15, eccentricity: 0.421, imageQuality: 98.37, ringsDetected: 22, centerX: 256, centerY: 255.5 };
const data = toCorneaData(source, { sourceId: "development-analysis", algorithmVersion: "current-application" });

assert.equal(data.keratometry.K1.value?.unit, "D");
assert.equal(data.keratometry.K2.value?.unit, "D");
assert.equal(data.keratometry.astigmatism.value?.unit, "D");
assert.equal(data.asphericity.eccentricity.value?.unit, "unitless");
assert.deepEqual(data.landmarks.imageCentre.value, { x: 256, y: 255.5, unit: "px" });
assert.equal(data.laterality, "UNKNOWN");
assert.equal(data.keratometry.axis.status, "unavailable");
assert.equal(data.anteriorSurface.status, "unavailable");
assert.equal(data.posteriorSurface.status, "unavailable");
assert.equal(data.pachymetry.status, "unavailable");
assert.equal(data.validityMask.status, "unavailable");
assert.equal(data.quality.score.value, source.imageQuality);
assert.equal(data.quality.ringCount.value, source.ringsDetected);
assert.match(data.keratometry.K1.value!.provenance.algorithm, /topography_processor/);
assert.equal(data.provenance.sourceId, "development-analysis");
assert.deepEqual(parseCorneaData(JSON.parse(JSON.stringify(data))), data);
assert.throws(() => toCorneaData({ ...source, simK1: Number.NaN }));
assert.throws(() => toCorneaData({ ...source, imageQuality: Number.POSITIVE_INFINITY }));
assert.throws(() => toCorneaData({ ...source, ringsDetected: -1 }));
assert.throws(() => parseCorneaData({ ...data, anteriorSurface: { status: "available", value: { image: "axial_heatmap.png" } } }));
console.log("Topography adapter tests passed (18 assertions).");

