import { z } from "zod";
import { placidoCalibrationSchema, type PlacidoCalibration } from "./placido-calibration";
import { placidoObservationSchema, type PlacidoObservation } from "./placido-observation";

const evidence = z.enum(["MEASURED", "MANUFACTURER_SPECIFIED", "DERIVED", "UNKNOWN"]);
const physical = z.object({ value: z.number().finite().nonnegative(), unit: z.literal("mm"), evidence, method: z.string().optional(), uncertaintyMm: z.number().finite().nonnegative().optional(), source: z.string().optional() });
const unknownPhysical = z.object({ status: z.literal("UNKNOWN"), reason: z.string().min(1) });
const physicalAvailability = z.union([physical, unknownPhysical]);

export const calibrationObjectSchema = z.object({ schemaVersion: z.literal("1.0"), objectType: z.string().min(1), surfaceType: z.enum(["spherical", "aspherical", "unknown"]), radiusMm: physicalAvailability, power: z.object({ value: z.number().finite(), unit: z.literal("D"), convention: z.string().min(1), evidence }).optional(), manufacturer: z.string().optional(), model: z.string().optional(), specificationSource: z.string().optional(), referenceId: z.string().optional(), provenance: z.string().min(1) });
export type CalibrationObjectEvidence = z.infer<typeof calibrationObjectSchema>;

export const evidencePackageSchema = z.object({ schemaVersion: z.literal("1.0"), instrument: z.object({ manufacturer: z.string().optional(), model: z.string().optional(), identifier: z.string().optional(), identificationSource: z.string().min(1) }), calibration: placidoCalibrationSchema, calibrationObject: calibrationObjectSchema, acquisitions: z.array(z.object({ id: z.string().min(1), sourceImage: z.string().min(1), recordedDimensions: z.object({ widthPx: z.number().int().positive(), heightPx: z.number().int().positive() }), observation: placidoObservationSchema, acquisitionNotes: z.string().optional() })).superRefine((items, ctx) => items.forEach((item, i) => { if (item.observation.imageDimensions.widthPx !== item.recordedDimensions.widthPx || item.observation.imageDimensions.heightPx !== item.recordedDimensions.heightPx) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [i, "recordedDimensions"], message: "recorded dimensions disagree with observation" }); })) });
export type CalibrationEvidencePackage = z.infer<typeof evidencePackageSchema>;
export function validateCalibrationEvidence(input: unknown): CalibrationEvidencePackage { return evidencePackageSchema.parse(input); }

export type RepeatabilityResult = { sampleCount: number; centreDisplacementPx: number[]; ringRadiusRangePx: number[]; missingRingFrequency: number[]; ringCountRange: { min: number; max: number }; units: "px"; interpretation: "image-space repeatability, not clinical accuracy" };
export function compareObservationRepeatability(observations: PlacidoObservation[]): RepeatabilityResult {
  if (observations.length < 2) throw new Error("At least two observations are required");
  const first = observations[0];
  return { sampleCount: observations.length, centreDisplacementPx: observations.slice(1).map((o) => Math.hypot(o.detectedCenter.x - first.detectedCenter.x, o.detectedCenter.y - first.detectedCenter.y)), ringRadiusRangePx: first.rings.map((ring, i) => { const values = observations.map((o) => o.rings[i]?.observedRadius).filter((v): v is number => v !== undefined); return values.length ? Math.max(...values) - Math.min(...values) : Number.NaN; }), missingRingFrequency: first.rings.map((_, i) => observations.filter((o) => !o.rings[i]).length / observations.length), ringCountRange: { min: Math.min(...observations.map((o) => o.rings.length)), max: Math.max(...observations.map((o) => o.rings.length)) }, units: "px", interpretation: "image-space repeatability, not clinical accuracy" };
}
