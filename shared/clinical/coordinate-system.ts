import { z } from "zod";
import { lateralityValues, type Laterality } from "./units";

export const coordinateSystemSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["physical", "pixel", "mixed", "unknown"]),
  origin: z.string().min(1),
  xDirection: z.string().min(1),
  yDirection: z.string().min(1),
  zDirection: z.string().min(1),
  handedness: z.enum(["right-handed", "left-handed", "unknown"]),
  angularZero: z.string().min(1),
  angularDirection: z.enum(["clockwise", "counter-clockwise", "unknown"]),
  imageOrigin: z.string().min(1),
  laterality: z.enum(lateralityValues),
});

export type CoordinateSystem = z.infer<typeof coordinateSystemSchema>;

export const currentImageCoordinateSystem = (laterality: Laterality): CoordinateSystem => ({
  name: "current-topography-image",
  kind: "pixel",
  origin: "image centre where detected",
  xDirection: "+X toward increasing image column (right)",
  yDirection: "+Y toward increasing image row (down)",
  zDirection: "unknown",
  handedness: "unknown",
  angularZero: "+X image direction",
  angularDirection: "clockwise",
  imageOrigin: "top-left pixel for array indexing",
  laterality,
});
