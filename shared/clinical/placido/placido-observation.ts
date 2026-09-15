import { z } from "zod";
import { provenanceSchema, type Provenance } from "../provenance";

export const placidoObservationSchema = z.object({
  schemaVersion: z.literal("1.0"),
  calibrationStatus: z.literal("UNCALIBRATED"),
  imageDimensions: z.object({ widthPx: z.number().int().positive(), heightPx: z.number().int().positive() }),
  detectedCenter: z.object({ x: z.number().finite(), y: z.number().finite(), unit: z.literal("px") }),
  rings: z.array(z.object({
    detectedRingIndex: z.number().int().nonnegative(),
    observedRadius: z.number().finite().nonnegative(),
    unit: z.literal("px"),
    meridianAngle: z.object({ status: z.literal("unavailable"), reason: z.string().min(1) }),
    targetCorrespondence: z.object({ status: z.literal("unresolved"), reason: z.string().min(1) }),
    validity: z.enum(["detected", "rejected", "unknown"]),
    provenance: provenanceSchema,
  })),
  provenance: provenanceSchema,
});

export type PlacidoObservation = z.infer<typeof placidoObservationSchema>;

export function createRadialPlacidoObservation(widthPx: number, heightPx: number, centerX: number, centerY: number, ringRadii: number[]): PlacidoObservation {
  if (![widthPx, heightPx, centerX, centerY, ...ringRadii].every(Number.isFinite) || widthPx <= 0 || heightPx <= 0 || ringRadii.some((r) => r < 0)) throw new Error("Invalid Placido image observation");
  const provenance: Provenance = { origin: "derived", sourceModality: "Placido-disc image", algorithm: "server/topography_processor.ts:ring detection", algorithmVersion: "current-application" };
  return placidoObservationSchema.parse({
    schemaVersion: "1.0", calibrationStatus: "UNCALIBRATED", imageDimensions: { widthPx, heightPx }, detectedCenter: { x: centerX, y: centerY, unit: "px" },
    rings: ringRadii.map((observedRadius, detectedRingIndex) => ({ detectedRingIndex, observedRadius, unit: "px", meridianAngle: { status: "unavailable", reason: "active radial-profile detector does not retain meridian samples" }, targetCorrespondence: { status: "unresolved", reason: "detected order is not proven to identify a physical target ring" }, validity: "detected", provenance })), provenance,
  });
}

