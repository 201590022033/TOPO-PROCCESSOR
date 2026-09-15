import { z } from "zod";
import { clinicalAvailabilitySchema, type ClinicalAvailability } from "../cornea-data";
import { provenanceSchema, type Provenance } from "../provenance";

const positiveMm = z.object({ value: z.number().finite().positive(), unit: z.literal("mm") });
const availability = <T extends z.ZodTypeAny>(schema: T) => clinicalAvailabilitySchema(schema);
const targetGeometry = z.object({ targetType: z.enum(["flat-disc", "conical", "cylindrical-conical", "other", "unknown"]), rings: z.array(z.object({ ringNumber: z.number().int().positive(), radiusMm: z.number().finite().positive(), axialPositionMm: z.number().finite().optional() })), centralApertureMm: z.number().finite().nonnegative().optional() });
export const knownSphereSchema = z.object({ radius: positiveMm, curvature: availability(z.object({ value: z.number().finite(), unit: z.literal("D"), convention: z.string().min(1) })), provenance: provenanceSchema });
export type KnownSphere = z.infer<typeof knownSphereSchema>;

export const placidoCalibrationSchema = z.object({
  schemaVersion: z.literal("1.0"),
  provenance: provenanceSchema,
  device: z.object({ ringCount: availability(z.number().int().positive()), ringRadii: availability(z.array(positiveMm)), targetGeometry: availability(targetGeometry), cameraToTarget: availability(z.string().min(1)), opticalAxis: availability(z.string().min(1)) }),
  camera: z.object({ imageDimensions: availability(z.object({ widthPx: z.number().int().positive(), heightPx: z.number().int().positive() })), principalPoint: availability(z.object({ x: z.number().finite(), y: z.number().finite(), unit: z.literal("px") })), focalLength: availability(positiveMm), distortionModel: availability(z.string().min(1)) }),
  acquisition: z.object({ workingDistance: availability(positiveMm), alignment: availability(z.string().min(1)), referenceCenter: availability(z.object({ x: z.number().finite(), y: z.number().finite(), unit: z.literal("px") })) }),
  calibrationSurface: availability(knownSphereSchema),
});
export type PlacidoCalibration = z.infer<typeof placidoCalibrationSchema>;
export type CalibrationAvailability<T> = ClinicalAvailability<T>;

export type ForwardModelInput = { calibration: PlacidoCalibration; surface: KnownSphere; ringIndices: number[]; provenance: Provenance };
export type PredictedRingPosition = { ringIndex: number; x: number; y: number; unit: "px"; provenance: Provenance };
export type ForwardModelOutput = { status: "not-implemented"; predictedPositions: { status: "unavailable"; reason: string }; provenance: Provenance };
export type InverseReconstructionBoundary = { observations: string; calibration: string; outputs: ("meridional-slope" | "local-radius" | "physical-xyz" | "sag-elevation")[]; status: "not-implemented" };
export type CalibrationResult = { schemaVersion: "1.0"; solvedParameters: Record<string, number>; residual: { value: number; unit: "px" | "mm" }; observationCount: number; rejectedObservationCount: number; coverage: string; source: Provenance; algorithmVersion: string; valid: boolean };

export function syntheticSphereFixture(radiusMm: 7 | 7.5 | 8 | 9): KnownSphere {
  return { radius: { value: radiusMm, unit: "mm" }, curvature: { status: "unavailable", reason: "not specified for test fixture" }, provenance: { origin: "reference", sourceModality: "synthetic calibration sphere fixture", algorithm: "M6 test harness", algorithmVersion: "1.0", sourceId: `synthetic-sphere-${radiusMm}mm` } };
}
