import { currentImageCoordinateSystem } from "./coordinate-system";
import type { CorneaData } from "./cornea-data";

const derived = { origin: "derived" as const, sourceModality: "Placido-disc image", algorithm: "current TypeScript processor", algorithmVersion: "baseline", sourceId: "synthetic-development-example" };
const unavailable = (reason: string) => ({ status: "unavailable" as const, reason });

export const currentApplicationCorneaExample: CorneaData = {
  schemaVersion: "1.0", laterality: "UNKNOWN", coordinateSystem: currentImageCoordinateSystem("UNKNOWN"), provenance: derived,
  quality: { score: { status: "available", value: 98.4 }, ringCount: { status: "available", value: 22 } },
  keratometry: {
    K1: { status: "available", value: { value: 44.25, unit: "D", meaning: "flat-meridian", provenance: derived } },
    K2: { status: "available", value: { value: 43.10, unit: "D", meaning: "steep-meridian", provenance: derived } },
    axis: unavailable("not-calculated"), meanK: unavailable("not-calculated"),
    astigmatism: { status: "available", value: { value: 1.15, unit: "D" } },
  },
  asphericity: { eccentricity: { status: "available", value: { value: 0.421, unit: "unitless", meaning: "processor eccentricity heuristic", provenance: derived } }, Q: unavailable("unsupported-by-source") },
  landmarks: { imageCentre: { status: "available", value: { x: 256, y: 256, unit: "px" } }, cornealCentre: unavailable("not-calculated"), apex: unavailable("unsupported-by-source"), pupilCentre: unavailable("unsupported-by-source"), limbus: unavailable("unsupported-by-source") },
  anteriorSurface: unavailable("unsupported-by-source"), posteriorSurface: unavailable("unsupported-by-source"), pachymetry: unavailable("unsupported-by-source"), validityMask: unavailable("not-calculated"), pointConfidence: unavailable("unsupported-by-source"),
};

