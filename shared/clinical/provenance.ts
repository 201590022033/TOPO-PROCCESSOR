import { z } from "zod";

export const provenanceOriginValues = ["measured", "derived", "fitted", "imported", "reference"] as const;
export type ProvenanceOrigin = (typeof provenanceOriginValues)[number];

export const provenanceSchema = z.object({
  origin: z.enum(provenanceOriginValues),
  sourceModality: z.string().min(1),
  algorithm: z.string().optional(),
  algorithmVersion: z.string().optional(),
  calibration: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  sourceId: z.string().optional(),
});

export type Provenance = z.infer<typeof provenanceSchema>;

