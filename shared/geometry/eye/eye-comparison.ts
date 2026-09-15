import type { CorneaData } from "../../clinical/cornea-data";
import type { Provenance } from "../../clinical/provenance";
import type { GullstrandReferenceEye } from "./gullstrand-reference";
import type { PatientEyeModel } from "./patient-eye-model";

export type ComparisonStatus = "comparable" | "partially-comparable" | "not-comparable";
export type ScalarDifference = { reference: number; patient: number; delta: number; unit: "mm" | "um" | "D" | "deg" | "px" | "unitless"; provenance: Provenance };
export type ComponentComparison = { status: ComparisonStatus; reasons: string[]; scalars: Record<string, ScalarDifference>; provenance: Provenance };
export type EyeComparison = { schemaVersion: "1.0"; referenceModel: "gullstrand-relaxed-reference"; patientModel: "patient"; anteriorCornea: ComponentComparison; components: Record<string, ComponentComparison>; summary: { differenceConvention: "patient - reference"; differenceSurface: { status: "unavailable"; reason: string }; provenance: Provenance } };

const provenance: Provenance = { origin: "derived", sourceModality: "reference versus patient geometry", algorithm: "eye-comparison", algorithmVersion: "M4" };
const notComparable = (reason: string): ComponentComparison => ({ status: "not-comparable", reasons: [reason], scalars: {}, provenance });
const difference = (reference: number, patient: number, unit: ScalarDifference["unit"]): ScalarDifference => ({ reference, patient, delta: patient - reference, unit, provenance });

export function referenceKeratometricPower(radiusMm: number): number {
  if (!Number.isFinite(radiusMm) || radiusMm <= 0) throw new Error("Reference radius must be finite and positive");
  return 337.5 / radiusMm;
}

export function compareEyes(reference: GullstrandReferenceEye, patient: PatientEyeModel): EyeComparison {
  const patientCornea = patient.anteriorCornea;
  const refK = referenceKeratometricPower(reference.surfaces.anteriorCornea.signedRadiusMm);
  const scalars: Record<string, ScalarDifference> = {};
  const reasons = ["K magnitudes and principal keratometric radii are comparable", "K-axis orientation is unavailable", "physical surfaces and posterior shape are unavailable"];
  if (patientCornea) {
    scalars.K1 = difference(refK, patientCornea.principalRadius1Mm.sourcePowerD, "D");
    scalars.K2 = difference(refK, patientCornea.principalRadius2Mm.sourcePowerD, "D");
    scalars.principalRadius1 = difference(reference.surfaces.anteriorCornea.signedRadiusMm, patientCornea.principalRadius1Mm.value, "mm");
    scalars.principalRadius2 = difference(reference.surfaces.anteriorCornea.signedRadiusMm, patientCornea.principalRadius2Mm.value, "mm");
    scalars.astigmatism = difference(0, patientCornea.astigmatismD, "D");
  }
  const anteriorCornea: ComponentComparison = { status: "partially-comparable", reasons, scalars, provenance };
  const components = { posteriorCornea: notComparable("patient posterior surface unavailable"), anteriorChamber: notComparable("patient ACD unavailable"), lens: notComparable("patient lens unavailable"), globe: notComparable("patient axial/globe geometry unavailable"), retina: notComparable("patient retina unavailable"), fovea: notComparable("patient fovea unavailable"), ONH: notComparable("patient ONH unavailable") };
  return { schemaVersion: "1.0", referenceModel: "gullstrand-relaxed-reference", patientModel: patient.modelKind, anteriorCornea, components, summary: { differenceConvention: "patient - reference", differenceSurface: { status: "unavailable", reason: "numeric patient and reference surfaces are not both available" }, provenance } };
}
