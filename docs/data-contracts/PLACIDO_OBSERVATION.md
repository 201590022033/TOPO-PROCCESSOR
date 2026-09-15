# Placido Observation Contract

`shared/clinical/placido/placido-observation.ts` represents image observations, not corneal geometry. The active boundary `createRadialPlacidoObservation()` receives the existing image dimensions, detected centre, and radial-profile ring radii from `server/topography_processor.ts`.

Current exported values are image width/height, centre X/Y, detected ring index/order, observed radial distance, and `detected` status. Distances and centres are `px`. Meridian angle is unavailable because the active radial detector retains no meridian samples. Correspondence to physical target rings is unresolved; detected order is not silently treated as device identity. Calibration status is explicitly `UNCALIBRATED`.

