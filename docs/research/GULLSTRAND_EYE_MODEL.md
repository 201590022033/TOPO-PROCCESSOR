# Relaxed Gullstrand Reference Eye

M3 implements a renderer-independent, spherical reference model in `shared/geometry/eye/gullstrand-reference.ts`. All values have `reference` provenance and are not patient measurements.

Parameters: anterior cornea radius +7.70 mm, corneal thickness 0.50 mm, posterior cornea radius +6.80 mm, corneal index 1.376; anterior chamber 3.10 mm and aqueous index 1.336; front lens shell radius +10.000 mm and thickness 0.546 mm, shell index 1.386; anterior nucleus radius +7.911 mm, nucleus thickness 2.419 mm, nucleus index 1.406; posterior nucleus radius -5.760 mm, rear shell thickness 0.635 mm; posterior lens radius -6.000 mm; vitreous thickness 17.185 mm and index 1.336.

Positions are cumulatively derived from the apex: cornea 0.000/0.500, anterior lens 3.600, anterior nucleus 4.146, posterior nucleus 6.565, posterior lens 7.200, reference image plane 24.385 mm. The image plane is not the old Blender prototype’s approximate 24.0 mm display value.

These are exact spherical reference surfaces. Modern aspheric/conic or sampled patient surfaces are future enhancements and must not be relabelled exact Gullstrand. The reference parameter set does not provide patient fundus landmarks; retina, fovea, and ONH are therefore unavailable even in this reference geometry unless separately defined as reference data.

