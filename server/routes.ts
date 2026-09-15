import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import express from 'express';
import { PNG } from "pngjs";
import { processTopographyAnalysis, generateSyntheticPlacidoImage } from "./topography_processor";
import { ensureAllReferenceDatasets } from "./generate_reference_data";

// Setup multer with memory storage for zero-disk-conflict, high-performance uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Ensure public/images exists for serving processed images
const publicImagesDir = path.join(process.cwd(), 'client', 'public', 'images');
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
}

// Seed sample Placido images and clinical reference datasets if missing
async function ensureSamplePlacidoImages() {
  try {
    await ensureAllReferenceDatasets();
  } catch (err) {
    console.error("Error ensuring reference datasets:", err);
  }

  const normalPath = path.join(publicImagesDir, "sample_placido_normal.png");
  const kcPath = path.join(publicImagesDir, "sample_placido_keratoconus.png");

  if (!fs.existsSync(normalPath)) {
    const normal = generateSyntheticPlacidoImage(512, 512, 22);
    const png = new PNG({ width: normal.width, height: normal.height });
    png.data = Buffer.from(normal.data);
    fs.writeFileSync(normalPath, PNG.sync.write(png));
  }

  if (!fs.existsSync(kcPath)) {
    const kc = generateSyntheticPlacidoImage(512, 512, 24);
    const png = new PNG({ width: kc.width, height: kc.height });
    png.data = Buffer.from(kc.data);
    fs.writeFileSync(kcPath, PNG.sync.write(png));
  }
  const normalRecord = await storage.getAnalysisByImageUrl("/images/sample_placido_normal.png");
  if (normalRecord) {
    const outputTan = path.join(publicImagesDir, `analysis_${normalRecord.id}`, "tangential_heatmap.png");
    if (!fs.existsSync(outputTan)) {
      processTopographyAnalysis(normalRecord.id).catch((err) => console.error("Initial analysis generation error:", err));
    }
  }
}
ensureSamplePlacidoImages();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Serve uploaded images statically
  app.use('/images', express.static(path.join(process.cwd(), 'client', 'public', 'images')));

  // === FILE UPLOAD ===
  app.post(api.upload.create.path, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File is too large. Maximum supported image size is 50MB.' });
        }
        return res.status(400).json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: `Upload failed: ${err.message}` });
      }
      next();
    });
  }, async (req, res) => {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No file uploaded or file is empty' });
    }

    const isImageMime = req.file.mimetype.startsWith("image/");
    const isImageExt = /\.(jpe?g|png|webp|bmp|tif|tiff|gif)$/i.test(req.file.originalname);
    if (!isImageMime && !isImageExt) {
      return res.status(400).json({ message: 'Only image files (JPEG, PNG, WebP, TIFF, BMP) are supported' });
    }

    const safeOriginalName = path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}_${safeOriginalName}`;
    const targetPath = path.join(publicImagesDir, filename);

    try {
      // Auto-orient and normalize image to ensure corruption-free format
      await sharp(req.file.buffer)
        .rotate()
        .toFile(targetPath);
    } catch {
      // Fallback: write raw uploaded buffer directly to disk
      fs.writeFileSync(targetPath, req.file.buffer);
    }

    const url = `/images/${filename}`;
    res.status(201).json({ url, filename });
  });

  // === ANALYSIS ROUTES ===
  app.get(api.analysis.list.path, async (req, res) => {
    const items = await storage.listAnalyses();
    res.json(items);
  });

  app.get(api.analysis.get.path, async (req, res) => {
    const item = await storage.getAnalysis(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Analysis not found' });
    }
    res.json(item);
  });

  app.get("/api/analysis/:id/export", async (req, res) => {
    const item = await storage.getAnalysis(Number(req.params.id));
    if (!item) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    const rows = [
      ["metric", "value"],
      ...Object.entries((item.results ?? {}) as Record<string, unknown>).map(([key, value]) => [key, String(value)]),
      ["startAngle", String(item.startAngle)],
      ["endAngle", String(item.endAngle)],
      ["nMires", String(item.nMires)],
      ["workingDistance", String(item.workingDistance)],
      ["zernikeDegree", String(item.zernikeDegree)],
      ["mireSegMethod", item.mireSegMethod],
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="analysis-${item.id}.csv"`);
    res.send(`${csv}\n`);
  });

  app.post(api.analysis.create.path, async (req, res) => {
    try {
      const input = api.analysis.create.input.parse(req.body);
      const analysis = await storage.createAnalysis(input);
      
      // Trigger async processing; the client polls the record until it settles.
      processAnalysis(analysis.id);

      res.status(201).json(analysis);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // === SAMPLE IMAGES ===
  app.get("/api/samples", (_req, res) => {
    res.json([
      {
        name: "Clinical Reference OD: nokc_right.jpg (Normal Right Eye)",
        url: "/images/nokc_right.jpg",
        description: "Standard reference cornea dataset (OD) with concentric mires and ~38.7D average keratometry.",
        isReference: true,
      },
      {
        name: "Clinical Reference OS: nokc_left.jpg (Normal Left Eye)",
        url: "/images/nokc_left.jpg",
        description: "Standard reference cornea dataset (OS) with symmetric regular astigmatic distribution.",
        isReference: true,
      },
      {
        name: "Standard Placido Disc (Synthetic Normal Cornea)",
        url: "/images/sample_placido_normal.png",
        description: "Regular concentric Placido mires, 22 rings, normal asphericity.",
        isReference: false,
      },
      {
        name: "Keratoconus Screening Disc (Inferior Steepening)",
        url: "/images/sample_placido_keratoconus.png",
        description: "Irregular mire compression and paracentral keratoconic steepening.",
        isReference: false,
      },
    ]);
  });

  return httpServer;
}

async function processAnalysis(id: number) {
  await processTopographyAnalysis(id);
}
