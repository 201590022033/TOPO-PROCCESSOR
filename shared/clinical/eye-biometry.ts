import { z } from "zod";
import { clinicalAvailabilitySchema, type ClinicalAvailability } from "./cornea-data";
import { provenanceSchema, type Provenance } from "./provenance";
import { lateralityValues } from "./units";

const mm = z.object({ value: z.number().finite(), unit: z.literal("mm") });
const umOrMm = z.object({ value: z.number().finite(), unit: z.enum(["um", "mm"]) });
const available = <T extends z.ZodTypeAny>(schema: T) => clinicalAvailabilitySchema(schema);

export const eyeBiometrySchema = z.object({
  schemaVersion: z.literal("1.0"),
  laterality: z.enum(lateralityValues),
  provenance: provenanceSchema,
  axialLength: available(mm),
  anteriorChamberDepth: available(mm),
  centralCornealThickness: available(umOrMm),
  whiteToWhite: available(mm),
  pupilDiameter: available(mm),
  lensThickness: available(mm),
});

export type EyeBiometry = z.infer<typeof eyeBiometrySchema>;
export type BiometricAvailability<T> = ClinicalAvailability<T>;

