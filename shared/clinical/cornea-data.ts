import { z } from "zod";
import { coordinateSystemSchema, type CoordinateSystem } from "./coordinate-system";
import { provenanceSchema, type Provenance } from "./provenance";
import { lateralityValues, unitValues, type ClinicalUnit, type Laterality } from "./units";

export const unavailableReasonValues = ["unsupported-by-source", "not-calculated", "missing"] as const;

export const unavailableSchema = z.object({
  status: z.literal("unavailable"),
  reason: z.string().min(1),
});

export const clinicalAvailabilitySchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.discriminatedUnion("status", [
    z.object({ status: z.literal("available"), value: valueSchema }),
    unavailableSchema,
  ]);

export type ClinicalAvailability<T> =
  | { status: "available"; value: T }
  | { status: "unavailable"; reason: string };

const finiteNumber = z.number().finite();
const quantitySchema = z.object({ value: finiteNumber, unit: z.enum(unitValues) });
const angleSchema = z.object({ value: finiteNumber, unit: z.literal("deg") });
const dioptreSchema = z.object({ value: finiteNumber, unit: z.literal("D") });
const pixelPointSchema = z.object({ x: finiteNumber, y: finiteNumber, unit: z.literal("px") });

export const surfaceSchema = z.object({
  representation: z.literal("regular-grid"),
  units: z.literal("mm"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  x: z.array(finiteNumber),
  y: z.array(finiteNumber),
  values: z.array(finiteNumber),
  coordinateSystem: coordinateSystemSchema,
  validMask: z.array(z.boolean()).optional(),
  provenance: provenanceSchema,
  quality: z.record(z.string(), finiteNumber).optional(),
}).superRefine((surface, ctx) => {
  const expected = surface.width * surface.height;
  for (const [name, array] of [["x", surface.x], ["y", surface.y], ["values", surface.values]] as const) {
    if (array.length !== expected) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [name], message: `${name} length must equal width × height` });
  }
  if (surface.validMask && surface.validMask.length !== expected) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["validMask"], message: "validMask length must equal width × height" });
  }
});

export type SurfaceData = z.infer<typeof surfaceSchema>;

const availability = <T extends z.ZodTypeAny>(schema: T) => clinicalAvailabilitySchema(schema);
const namedMetric = z.object({ value: finiteNumber, unit: z.enum(unitValues), meaning: z.string().min(1), provenance: provenanceSchema });
const keratometryMetric = z.object({ value: finiteNumber, unit: z.literal("D"), meaning: z.enum(["flat-meridian", "steep-meridian"]), axis: angleSchema.optional(), provenance: provenanceSchema });

export const corneaDataSchema = z.object({
  schemaVersion: z.literal("1.0"),
  laterality: z.enum(lateralityValues),
  coordinateSystem: coordinateSystemSchema,
  provenance: provenanceSchema,
  quality: z.object({ score: availability(z.number().finite()), ringCount: availability(z.number().int().nonnegative()) }),
  keratometry: z.object({
    K1: availability(keratometryMetric),
    K2: availability(keratometryMetric),
    axis: availability(angleSchema),
    meanK: availability(dioptreSchema),
    astigmatism: availability(dioptreSchema),
  }),
  asphericity: z.object({
    eccentricity: availability(namedMetric),
    Q: availability(namedMetric),
  }),
  landmarks: z.object({
    imageCentre: availability(pixelPointSchema),
    cornealCentre: availability(pixelPointSchema),
    apex: availability(quantitySchema),
    pupilCentre: availability(pixelPointSchema),
    limbus: availability(quantitySchema),
  }),
  anteriorSurface: availability(surfaceSchema),
  posteriorSurface: availability(surfaceSchema),
  pachymetry: availability(surfaceSchema),
  validityMask: availability(z.array(z.boolean())),
  pointConfidence: availability(z.array(finiteNumber)),
});

export type CorneaData = z.infer<typeof corneaDataSchema>;
export function parseCorneaData(input: unknown): CorneaData { return corneaDataSchema.parse(input); }
export function isCorneaData(input: unknown): input is CorneaData { return corneaDataSchema.safeParse(input).success; }
