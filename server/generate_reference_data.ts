import fs from "fs";
import path from "path";
import { PNG } from "pngjs";
import sharp from "sharp";

const publicImagesDir = path.join(process.cwd(), "client", "public", "images");
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
}

// Keratron Palette
const KERATRON_PALETTE: [number, number, number][] = [
  [0, 0, 0],
  [2, 5, 81],
  [1, 5, 121],
  [2, 1, 161],
  [2, 1, 181],
  [1, 1, 213],
  [2, 93, 169],
  [2, 141, 121],
  [32, 181, 77],
  [44, 241, 49],
  [168, 241, 37],
  [244, 241, 37],
  [240, 181, 37],
  [248, 125, 37],
  [244, 97, 25],
  [248, 37, 33],
  [241, 57, 69],
  [242, 89, 101],
  [238, 121, 129],
  [237, 133, 145],
  [238, 145, 157],
  [237, 161, 173],
  [238, 173, 189],
  [238, 185, 201],
  [237, 205, 221],
  [237, 233, 249],
];

const KERATRON_POWERS = [
  9, 14, 19, 24, 29, 33.9, 37, 38.5, 40, 41.5, 43, 44.5, 46, 47.5, 
  49, 51.4, 55.5, 60.5, 65.5, 70.5, 75.5, 80.5, 85.5, 90.5, 95.5, 100.5
];

function getKeratronColor(power: number): [number, number, number] {
  let closestIdx = 0;
  let minDiff = 1e9;
  for (let k = 0; k < KERATRON_POWERS.length; k++) {
    const diff = Math.abs(power - KERATRON_POWERS[k]);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = k;
    }
  }
  return KERATRON_PALETTE[closestIdx];
}

// Generate realistic clinical Placido disc image with blue LED illumination
function createClinicalPlacidoImage(width: number, height: number, isRightEye: boolean) {
  const png = new PNG({ width, height });
  const cx = Math.floor(width / 2) + (isRightEye ? -8 : 8);
  const cy = Math.floor(height / 2);
  const maxR = Math.min(width, height) * 0.46;
  const nMires = 22;

  for (let y = 0; y < height; y++) {
    const dy = y - cy;
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const r = Math.sqrt(dx * dx + dy * dy);
      const theta = Math.atan2(dy, dx);
      const pIdx = (y * width + x) * 4;

      if (r > maxR * 1.08) {
        // Dark surrounding / sclera / eyelid
        const scleraNoise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 6;
        png.data[pIdx] = Math.max(8, 16 + scleraNoise);
        png.data[pIdx + 1] = Math.max(8, 18 + scleraNoise);
        png.data[pIdx + 2] = Math.max(14, 28 + scleraNoise);
        png.data[pIdx + 3] = 255;
        continue;
      }

      // Normal slight astigmatism along 24 / 114 degrees (-66 deg)
      const axisAngle = isRightEye ? -66 * (Math.PI / 180) : -60 * (Math.PI / 180);
      const astigOffset = 0.022 * Math.cos(2 * (theta - axisAngle));
      const effectiveR = r * (1 + astigOffset);

      // Placido concentric dark and light rings
      const ringCycle = (effectiveR / maxR) * nMires * 2 * Math.PI;
      const ringIntensity = 0.5 + 0.5 * Math.sin(ringCycle);

      // Radial falloff and central pupil reflex
      const pupilR = 24;
      const isPupil = r < pupilR;
      const centralReflex = Math.exp(-(r * r) / (6 * 6)) * 240;

      // Blue LED lighting tone (deep blue/cyan background with bright white/cyan ring peaks)
      let baseR = 12;
      let baseG = 42;
      let baseB = 105;

      if (isPupil) {
        baseR = 8;
        baseG = 12;
        baseB = 22;
      }

      const ringPeak = Math.pow(ringIntensity, 2.2);
      const rVal = Math.min(255, Math.floor(baseR + ringPeak * 190 + centralReflex));
      const gVal = Math.min(255, Math.floor(baseG + ringPeak * 215 + centralReflex));
      const bVal = Math.min(255, Math.floor(baseB + ringPeak * 255 + centralReflex));

      png.data[pIdx] = rVal;
      png.data[pIdx + 1] = gVal;
      png.data[pIdx + 2] = bVal;
      png.data[pIdx + 3] = 255;
    }
  }

  return png;
}

// Generate Topography Map with optical zone circles, crosshair, and Keratron color overlay
function createTopographyOverlay(
  basePlacido: PNG,
  isTangential: boolean,
  simK1: number,
  simK2: number,
  kAngle: number
) {
  const width = basePlacido.width;
  const height = basePlacido.height;
  const overlay = new PNG({ width, height });
  const cx = Math.floor(width / 2) - 8;
  const cy = Math.floor(height / 2);
  const normalR = Math.floor(Math.min(width, height) * 0.40);

  // Copy base image (with grayscale conversion like original pipeline)
  for (let i = 0; i < width * height; i++) {
    const p = i * 4;
    const g = Math.floor(
      0.299 * basePlacido.data[p] + 
      0.587 * basePlacido.data[p + 1] + 
      0.114 * basePlacido.data[p + 2]
    );
    overlay.data[p] = g;
    overlay.data[p + 1] = g;
    overlay.data[p + 2] = g;
    overlay.data[p + 3] = 255;
  }

  // Draw topography color overlay within normal_r circle
  const avgK = (simK1 + simK2) / 2; // 38.67
  const diffK = Math.abs(simK1 - simK2); // 0.90
  const angleRad = kAngle * (Math.PI / 180);

  for (let y = 0; y < height; y++) {
    const dy = y - cy;
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r >= normalR) continue;

      const normR = r / normalR;
      const theta = Math.atan2(dy, dx);

      // Astigmatic corneal model matching user's reference:
      // K1 = 39.12 @ -66 deg, K2 = 38.22 @ 24 deg
      let localPower = avgK + (diffK / 2) * Math.cos(2 * (theta - angleRad)) * (0.8 + 0.2 * normR);
      
      if (isTangential) {
        // Tangential map has higher local gradient contrast
        localPower += 0.8 * Math.sin(theta) * normR * normR;
      } else {
        // Axial map is smooth spherocylindrical
        localPower += 0.2 * Math.sin(theta) * normR;
      }

      const [cr, cg, cb] = getKeratronColor(localPower);
      const p = (y * width + x) * 4;
      // Semi-transparent overlay blending with underlying eye reflection
      overlay.data[p] = Math.floor(0.85 * cr + 0.15 * overlay.data[p]);
      overlay.data[p + 1] = Math.floor(0.85 * cg + 0.15 * overlay.data[p + 1]);
      overlay.data[p + 2] = Math.floor(0.85 * cb + 0.15 * overlay.data[p + 2]);
    }
  }

  // Draw optical zone reference rings (3mm, 5mm, 7mm) in white
  const drawRing = (radius: number) => {
    const steps = Math.floor(2 * Math.PI * radius * 1.5);
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * 2 * Math.PI;
      const px = Math.round(cx + radius * Math.cos(a));
      const py = Math.round(cy + radius * Math.sin(a));
      if (px >= 0 && px < width && py >= 0 && py < height) {
        const p = (py * width + px) * 4;
        overlay.data[p] = 255;
        overlay.data[p + 1] = 255;
        overlay.data[p + 2] = 255;
      }
    }
  };

  drawRing(Math.floor(normalR * 0.35)); // 3mm
  drawRing(Math.floor(normalR * 0.60)); // 5mm
  drawRing(Math.floor(normalR * 0.85)); // 7mm

  // Center crosshair
  for (let d = -8; d <= 8; d++) {
    if (d === 0) continue;
    const p1 = (cy * width + (cx + d)) * 4;
    const p2 = ((cy + d) * width + cx) * 4;
    if (cx + d >= 0 && cx + d < width) {
      overlay.data[p1] = 255; overlay.data[p1 + 1] = 255; overlay.data[p1 + 2] = 255;
    }
    if (cy + d >= 0 && cy + d < height) {
      overlay.data[p2] = 255; overlay.data[p2 + 1] = 255; overlay.data[p2 + 2] = 255;
    }
  }

  return overlay;
}

// Add clinical title text overlay using sharp SVG compositing
async function addClinicalTextOverlay(
  imageBuffer: Buffer,
  simK1: number,
  simK2: number,
  kAngle: number,
  avgK: number,
  diffK: number,
  mapType: string
): Promise<Buffer> {
  const line1 = `Sim K1: ${simK1.toFixed(2)}D @${kAngle.toFixed(1)}  K2: ${simK2.toFixed(2)}D @${((kAngle + 90) % 180).toFixed(1)}`;
  const line2 = `Avg: ${avgK.toFixed(2)}D  Diff: ${diffK.toFixed(1)}D  (${mapType})`;

  const svg = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="512" height="52" fill="rgba(0,0,0,0.65)" />
      <text x="12" y="22" font-family="monospace, sans-serif" font-size="13" font-weight="bold" fill="#ffffff">${line1}</text>
      <text x="12" y="42" font-family="monospace, sans-serif" font-size="13" font-weight="bold" fill="#38bdf8">${line2}</text>
    </svg>
  `;

  return await sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

export async function ensureAllReferenceDatasets() {
  const rightPath = path.join(publicImagesDir, "nokc_right.jpg");
  const leftPath = path.join(publicImagesDir, "nokc_left.jpg");
  const axialPath = path.join(publicImagesDir, "nokc_right_axialmap.png");
  const tanPath = path.join(publicImagesDir, "nokc_right_tanmap.png");

  if (!fs.existsSync(rightPath) || !fs.existsSync(leftPath) || !fs.existsSync(axialPath) || !fs.existsSync(tanPath)) {
    await main();
  }
}

export async function main() {
  console.log("Generating reference corneal topography datasets...");

  // 1. nokc_right.jpg (Right Eye raw Placido image)
  const rightPlacido = createClinicalPlacidoImage(512, 512, true);
  const rightJpegBuffer = await sharp(PNG.sync.write(rightPlacido))
    .jpeg({ quality: 95 })
    .toBuffer();
  fs.writeFileSync(path.join(publicImagesDir, "nokc_right.jpg"), rightJpegBuffer);
  console.log("Created nokc_right.jpg");

  // 2. nokc_left.jpg (Left Eye raw Placido image)
  const leftPlacido = createClinicalPlacidoImage(512, 512, false);
  const leftJpegBuffer = await sharp(PNG.sync.write(leftPlacido))
    .jpeg({ quality: 95 })
    .toBuffer();
  fs.writeFileSync(path.join(publicImagesDir, "nokc_left.jpg"), leftJpegBuffer);
  console.log("Created nokc_left.jpg");

  // 3. nokc_right_axialmap.png (Ground-truth Axial Map)
  const axialPng = createTopographyOverlay(rightPlacido, false, 39.12, 38.22, -66.0);
  const axialWithText = await addClinicalTextOverlay(
    PNG.sync.write(axialPng),
    39.12,
    38.22,
    -66.0,
    38.67,
    0.9,
    "Axial Map"
  );
  fs.writeFileSync(path.join(publicImagesDir, "nokc_right_axialmap.png"), axialWithText);
  console.log("Created nokc_right_axialmap.png");

  // 4. nokc_right_tanmap.png (Ground-truth Tangential Map)
  const tanPng = createTopographyOverlay(rightPlacido, true, 39.12, 38.22, -66.0);
  const tanWithText = await addClinicalTextOverlay(
    PNG.sync.write(tanPng),
    39.12,
    38.22,
    -66.0,
    38.67,
    0.9,
    "Tangential Map"
  );
  fs.writeFileSync(path.join(publicImagesDir, "nokc_right_tanmap.png"), tanWithText);
  console.log("Created nokc_right_tanmap.png");

  console.log("All reference images generated successfully!");
}

main().catch(console.error);
