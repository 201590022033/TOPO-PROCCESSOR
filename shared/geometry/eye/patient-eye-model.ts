import type { CorneaData } from "../../clinical/cornea-data";
import type { EyeBiometry } from "../../clinical/eye-biometry";
import type { Provenance } from "../../clinical/provenance";
import type { ComponentCompleteness } from "./geometry-types";

export type PatientCornea = {
  principalRadius1Mm: { value: number; sourcePowerD: number };
  principalRadius2Mm: { value: number; sourcePowerD: number };
  meanRadiusMm: number;
  astigmatismD: number;
  orientation: { status: "unavailable"; reason: string };
  oriented3DSurface: { status: "unavailable"; reason: string };
  eccentricity: CorneaData["asphericity"]["eccentricity"];
  provenance: Provenance;
};

export type PatientEyeModel = {
  modelKind: "patient";
  schemaVersion: "1.0";
  laterality: CorneaData["laterality"];
  coordinateSystem: string;
  provenance: Provenance;
  biometry: EyeBiometry;
  anteriorCornea: PatientCornea | null;
  components: Record<string, ComponentCompleteness>;
};

