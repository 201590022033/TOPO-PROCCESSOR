import { currentImageCoordinateSystem } from "../coordinate-system";
import { type CorneaData, parseCorneaData } from "../cornea-data";

export interface CurrentTopographyResult {
  simK1: number;
  simK2: number;
  astigmatism: number;
  eccentricity: number;
  imageQuality: number;
  ringsDetected: number;
  centerX: number;
  centerY: number;
}

export interface CurrentTopographyContext {
  sourceId?: string;
  algorithmVersion?: string;
}

const unavailable = (reason: string) => ({ status: "unavailable" as const, reason });
const derived = (context: CurrentTopographyContext, field: string) => ({
  origin: "derived" as const,
  sourceModality: "Placido-disc image",
  algorithm: `server/topography_processor.ts:${field}`,
  algorithmVersion: context.algorithmVersion ?? "current-application",
  sourceId: context.sourceId,
});
const available = <T>(value: T) => ({ status: "available" as const, value });

/** Converts the final current scalar result without interpreting rendered maps as numeric data. */
export function toCorneaData(result: CurrentTopographyResult, context: CurrentTopographyContext = {}): CorneaData {
  // Parse at the boundary so non-finite source values cannot enter normalized data.
  if (!Number.isFinite(result.simK1) || !Number.isFinite(result.simK2) || !Number.isFinite(result.astigmatism) ||
      !Number.isFinite(result.eccentricity) || !Number.isFinite(result.imageQuality) || !Number.isFinite(result.centerX) ||
      !Number.isFinite(result.centerY) || !Number.isInteger(result.ringsDetected) || result.ringsDetected < 0) {
    throw new Error("Current topography result contains a non-finite or invalid scalar");
  }

  const coordinateSystem = currentImageCoordinateSystem("UNKNOWN");
  const data: CorneaData = {
    schemaVersion: "1.0",
    laterality: "UNKNOWN",
    coordinateSystem,
    provenance: derived(context, "results"),
    quality: {
      score: available(result.imageQuality),
      ringCount: available(result.ringsDetected),
    },
    keratometry: {
      K1: available({ value: result.simK1, unit: "D", meaning: "flat-meridian", provenance: derived(context, "simK1") }),
      K2: available({ value: result.simK2, unit: "D", meaning: "steep-meridian", provenance: derived(context, "simK2") }),
      axis: unavailable("not-calculated"),
      meanK: unavailable("not-calculated"),
      astigmatism: available({ value: result.astigmatism, unit: "D" }),
    },
    asphericity: {
      eccentricity: available({ value: result.eccentricity, unit: "unitless", meaning: "current application eccentricity heuristic", provenance: derived(context, "eccentricity") }),
      Q: unavailable("unsupported-by-source"),
    },
    landmarks: {
      imageCentre: available({ x: result.centerX, y: result.centerY, unit: "px" }),
      cornealCentre: unavailable("not-calculated"),
      apex: unavailable("unsupported-by-source"),
      pupilCentre: unavailable("unsupported-by-source"),
      limbus: unavailable("unsupported-by-source"),
    },
    anteriorSurface: unavailable("unsupported-by-source"),
    posteriorSurface: unavailable("unsupported-by-source"),
    pachymetry: unavailable("unsupported-by-source"),
    validityMask: unavailable("not-calculated"),
    pointConfidence: unavailable("unsupported-by-source"),
  };
  return parseCorneaData(data);
}

