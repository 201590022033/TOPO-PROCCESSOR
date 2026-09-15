import type { Provenance } from "../../clinical/provenance";
import { EYE_LOCAL_COORDINATE_SYSTEM, type ComponentCompleteness, type Point3D, type SphereSurface } from "./geometry-types";

const reference: Provenance = { origin: "reference", sourceModality: "published relaxed Gullstrand schematic eye", algorithm: "Gullstrand reference construction", algorithmVersion: "M3", sourceId: "gullstrand-relaxed-reference" };
const point = (x: number): Point3D => ({ x, y: 0, z: 0 });
const sphere = (x: number, radius: number, aperture: number): SphereSurface => ({ kind: "spherical", vertex: point(x), signedRadiusMm: radius, aperture: { radiusMm: aperture }, provenance: reference });

export type GullstrandReferenceEye = {
  modelKind: "reference";
  coordinateSystem: typeof EYE_LOCAL_COORDINATE_SYSTEM;
  provenance: Provenance;
  media: { cornea: number; aqueous: number; lensShell: number; lensNucleus: number; vitreous: number };
  cornealThicknessMm: number;
  surfaces: { anteriorCornea: SphereSurface; posteriorCornea: SphereSurface; anteriorLens: SphereSurface; anteriorNucleus: SphereSurface; posteriorNucleus: SphereSurface; posteriorLens: SphereSurface };
  positionsMm: { anteriorCornea: number; posteriorCornea: number; anteriorLens: number; anteriorNucleus: number; posteriorNucleus: number; posteriorLens: number; imagePlane: number };
  components: Record<string, ComponentCompleteness>;
};

export function buildGullstrandReferenceEye(): GullstrandReferenceEye {
  const anteriorCornea = 0;
  const posteriorCornea = anteriorCornea + 0.5;
  const anteriorLens = posteriorCornea + 3.1;
  const anteriorNucleus = anteriorLens + 0.546;
  const posteriorNucleus = anteriorNucleus + 2.419;
  const posteriorLens = posteriorNucleus + 0.635;
  const imagePlane = posteriorLens + 17.185;
  return {
    modelKind: "reference", coordinateSystem: EYE_LOCAL_COORDINATE_SYSTEM, provenance: reference,
    media: { cornea: 1.376, aqueous: 1.336, lensShell: 1.386, lensNucleus: 1.406, vitreous: 1.336 }, cornealThicknessMm: 0.5,
    surfaces: { anteriorCornea: sphere(anteriorCornea, 7.7, 6), posteriorCornea: sphere(posteriorCornea, 6.8, 5.5), anteriorLens: sphere(anteriorLens, 10, 4.5), anteriorNucleus: sphere(anteriorNucleus, 7.911, 3.5), posteriorNucleus: sphere(posteriorNucleus, -5.76, 3.5), posteriorLens: sphere(posteriorLens, -6, 4.5) },
    positionsMm: { anteriorCornea, posteriorCornea, anteriorLens, anteriorNucleus, posteriorNucleus, posteriorLens, imagePlane },
    components: { anteriorCornea: { status: "resolved", reasons: ["published spherical reference surface"], provenance: reference }, posteriorCornea: { status: "resolved", reasons: ["published spherical reference surface"], provenance: reference }, anteriorChamber: { status: "resolved", reasons: ["published reference depth"], provenance: reference }, lens: { status: "resolved", reasons: ["published reference shell/nucleus surfaces"], provenance: reference }, retina: { status: "unavailable", reasons: ["not specified by this Gullstrand parameter set"], provenance: reference }, globe: { status: "unavailable", reasons: ["not specified by this Gullstrand parameter set"], provenance: reference }, fovea: { status: "unavailable", reasons: ["not specified by this Gullstrand parameter set"], provenance: reference }, ONH: { status: "unavailable", reasons: ["not specified by this Gullstrand parameter set"], provenance: reference } },
  };
}
