import assert from "node:assert/strict";
import { currentImageCoordinateSystem } from "../shared/clinical/coordinate-system";
import { currentApplicationCorneaExample } from "../shared/clinical/cornea-data.example";
import { parseCorneaData } from "../shared/clinical/cornea-data";

const valid = () => parseCorneaData(JSON.parse(JSON.stringify(currentApplicationCorneaExample)));
assert.equal(valid().schemaVersion, "1.0");
assert.equal(valid().keratometry.K1.value?.unit, "D");
assert.equal(valid().keratometry.K1.value?.axis, undefined);
assert.equal(valid().landmarks.imageCentre.value?.unit, "px");
assert.equal(valid().posteriorSurface.status, "unavailable");
assert.deepEqual(valid().coordinateSystem, currentImageCoordinateSystem("UNKNOWN"));
assert.equal(valid().provenance.sourceModality, "Placido-disc image");

const od = { ...valid(), laterality: "OD" as const, coordinateSystem: currentImageCoordinateSystem("OD") };
const os = { ...valid(), laterality: "OS" as const, coordinateSystem: currentImageCoordinateSystem("OS") };
assert.notEqual(od.laterality, os.laterality);
assert.throws(() => parseCorneaData({ ...valid(), laterality: "right" }));
assert.throws(() => parseCorneaData({ ...valid(), keratometry: { ...valid().keratometry, K1: { status: "available", value: { ...valid().keratometry.K1.value!, value: Number.NaN } } } }));
assert.throws(() => parseCorneaData({ ...valid(), anteriorSurface: { status: "available", value: { representation: "regular-grid", units: "mm", width: 2, height: 2, x: [0], y: [0, 1, 2, 3], values: [0, 1, 2, 3], coordinateSystem: currentImageCoordinateSystem("UNKNOWN"), provenance: valid().provenance } } }));
assert.throws(() => parseCorneaData({ ...valid(), anteriorSurface: { status: "available", value: { image: "heatmap.png" } } }));
console.log("CorneaData contract tests passed (12 assertions). ");

