export const lateralityValues = ["OD", "OS", "UNKNOWN"] as const;
export type Laterality = (typeof lateralityValues)[number];

export const unitValues = ["mm", "um", "D", "deg", "px", "unitless"] as const;
export type ClinicalUnit = (typeof unitValues)[number];

