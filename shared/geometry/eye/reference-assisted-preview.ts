import type { GullstrandReferenceEye } from "./gullstrand-reference";
import type { PatientEyeModel } from "./patient-eye-model";
import type { Provenance } from "../../clinical/provenance";

export type PreviewSource = "PATIENT" | "REFERENCE" | "MIXED";
export type EyeViewMode = "REFERENCE" | "PATIENT" | "OVERLAY" | "DIFFERENCE" | "REFERENCE_ASSISTED_PREVIEW";
export type ReferenceAssistedPreview = { schemaVersion: "1.0"; modelKind: "reference-assisted-preview"; mode: "REFERENCE_ASSISTED_PREVIEW"; components: Record<string, { source: PreviewSource; displaySource: PreviewSource; reason: string; provenance: Provenance }>; coverage: { patient: number; mixed: number; reference: number; unavailable: number }; provenance: Provenance };

const previewProvenance: Provenance = { origin: "derived", sourceModality: "reference-assisted display composition", algorithm: "reference-assisted-preview", algorithmVersion: "M4" };
export function buildReferenceAssistedPreview(reference: GullstrandReferenceEye, patient: PatientEyeModel): ReferenceAssistedPreview {
  const components = {
    anteriorCornea: { source: patient.anteriorCornea ? "MIXED" as const : "REFERENCE" as const, displaySource: patient.anteriorCornea ? "MIXED" as const : "REFERENCE" as const, reason: "patient principal curvatures constrain a rotationally symmetric mean-curvature preview; orientation remains unknown", provenance: previewProvenance },
    posteriorCornea: { source: "REFERENCE" as const, displaySource: "REFERENCE" as const, reason: "patient posterior surface unavailable", provenance: previewProvenance },
    lens: { source: "REFERENCE" as const, displaySource: "REFERENCE" as const, reason: "patient lens unavailable; reference lens shown for research display only", provenance: reference.provenance },
    retina: { source: "REFERENCE" as const, displaySource: "REFERENCE" as const, reason: "reference-assisted placeholder only", provenance: reference.provenance },
    fovea: { source: "REFERENCE" as const, displaySource: "REFERENCE" as const, reason: "not supplied by patient data", provenance: reference.provenance },
    ONH: { source: "REFERENCE" as const, displaySource: "REFERENCE" as const, reason: "not supplied by patient data", provenance: reference.provenance },
  };
  const counts = Object.values(components).reduce((a, c) => { const source = c.source as PreviewSource; a[source === "MIXED" ? "mixed" : source === "PATIENT" ? "patient" : "reference"]++; return a; }, { patient: 0, mixed: 0, reference: 0, unavailable: 0 });
  return { schemaVersion: "1.0", modelKind: "reference-assisted-preview", mode: "REFERENCE_ASSISTED_PREVIEW", components, coverage: counts, provenance: previewProvenance };
}
