import type { CorneaData } from "../../clinical/cornea-data";
import type { EyeBiometry } from "../../clinical/eye-biometry";
import type { Provenance } from "../../clinical/provenance";
import { EYE_LOCAL_COORDINATE_SYSTEM, type ComponentCompleteness } from "./geometry-types";
import type { PatientEyeModel } from "./patient-eye-model";

const unavailable = (reason: string) => ({ status: "unavailable" as const, reason });
const patientProvenance: Provenance = { origin: "derived", sourceModality: "normalized cornea data", algorithm: "patient-eye-builder", algorithmVersion: "M3" };

export function keratometricPowerToRadiusMm(powerD: number): number {
  if (!Number.isFinite(powerD) || powerD <= 0) throw new Error("Keratometric power must be finite and positive");
  return 337.5 / powerD;
}

export function buildPatientEye(cornea: CorneaData, biometry?: EyeBiometry): PatientEyeModel {
  const k1 = cornea.keratometry.K1.status === "available" ? cornea.keratometry.K1.value : undefined;
  const k2 = cornea.keratometry.K2.status === "available" ? cornea.keratometry.K2.value : undefined;
  const astig = cornea.keratometry.astigmatism.status === "available" ? cornea.keratometry.astigmatism.value.value : undefined;
  const anteriorCornea = k1 && k2 && astig !== undefined ? {
    principalRadius1Mm: { value: keratometricPowerToRadiusMm(k1.value), sourcePowerD: k1.value },
    principalRadius2Mm: { value: keratometricPowerToRadiusMm(k2.value), sourcePowerD: k2.value },
    meanRadiusMm: (keratometricPowerToRadiusMm(k1.value) + keratometricPowerToRadiusMm(k2.value)) / 2,
    astigmatismD: astig,
    orientation: unavailable("K1/K2 axes are unavailable in current topography data"),
    oriented3DSurface: unavailable("principal meridian orientation and numeric elevation are unavailable"),
    eccentricity: cornea.asphericity.eccentricity,
    provenance: patientProvenance,
  } : null;
  const partial: ComponentCompleteness = { status: "partial", reasons: ["K1/K2 principal radii available", "meridian axes unavailable", "numeric elevation unavailable"], provenance: patientProvenance };
  const unavailableComponent = (reason: string): ComponentCompleteness => ({ status: "unavailable", reasons: [reason], provenance: patientProvenance });
  return {
    modelKind: "patient", schemaVersion: "1.0", laterality: cornea.laterality, coordinateSystem: EYE_LOCAL_COORDINATE_SYSTEM.name, provenance: patientProvenance,
    biometry: biometry ?? { schemaVersion: "1.0", laterality: cornea.laterality, provenance: patientProvenance, axialLength: unavailable("not supplied"), anteriorChamberDepth: unavailable("not supplied"), centralCornealThickness: unavailable("not supplied"), whiteToWhite: unavailable("not supplied"), pupilDiameter: unavailable("not supplied"), lensThickness: unavailable("not supplied") },
    anteriorCornea,
    components: { anteriorCornea: anteriorCornea ? partial : unavailableComponent("K1/K2 unavailable"), posteriorCornea: unavailableComponent("posterior surface unavailable"), anteriorChamber: unavailableComponent("ACD unavailable"), lens: unavailableComponent("lens biometry unavailable"), retina: unavailableComponent("retinal geometry unavailable"), globe: unavailableComponent("globe geometry unavailable"), fovea: unavailableComponent("foveal landmark unavailable"), ONH: unavailableComponent("optic nerve head landmark unavailable") },
  };
}

