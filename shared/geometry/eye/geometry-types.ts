import type { Provenance } from "../../clinical/provenance";

export const EYE_LOCAL_COORDINATE_SYSTEM = {
  schemaVersion: "1.0" as const,
  name: "eye-local-anatomical",
  units: "mm" as const,
  origin: "anterior corneal apex",
  xDirection: "+X posterior along ocular optical axis",
  yDirection: "+Y nasal in eye-local frame",
  zDirection: "+Z superior",
  handedness: "right-handed" as const,
  lateralityMirroring: "none; laterality-specific world/view transforms are external",
};

export type Point3D = { x: number; y: number; z: number };
export type Vector3D = Point3D;
export type Aperture = { radiusMm: number };
export type SurfaceKind = "spherical" | "conic/aspheric" | "sampled/numeric";

export type SphereSurface = {
  kind: "spherical";
  vertex: Point3D;
  signedRadiusMm: number;
  aperture?: Aperture;
  provenance: Provenance;
};

export type ConicSurface = {
  kind: "conic/aspheric";
  vertex: Point3D;
  principalRadiusMm: { x: number; y: number };
  conicConstant: { x: number; y: number };
  orientation: string;
  aperture?: Aperture;
  provenance: Provenance;
};

export type SampledSurfaceReference = {
  kind: "sampled/numeric";
  corneaDataField: "anteriorSurface" | "posteriorSurface" | "pachymetry";
  coordinateSystem: string;
  provenance: Provenance;
};

export type SurfaceDescription = SphereSurface | ConicSurface | SampledSurfaceReference;
export type Landmark3D = { name: string; point: Point3D; provenance: Provenance };

export type ComponentStatus = "resolved" | "partial" | "unavailable";
export type ComponentCompleteness = { status: ComponentStatus; reasons: string[]; provenance?: Provenance };

