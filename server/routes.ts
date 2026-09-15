import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import express from 'express';
import { PNG } from "pngjs";
import { processTopographyAnalysis, generateSyntheticPlacidoImage } from "./topography_processor";

// Setup multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Ensure public/images exists for serving processed images
const publicImagesDir = path.join(process.cwd(), 'client', 'public', 'images');
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
}

// Seed sample Placido images if missing
function ensureSamplePlacidoImages() {
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
  const output1 = path.join(publicImagesDir, "analysis_1");
  if (!fs.existsSync(output1)) {
    processTopographyAnalysis(1).catch((err) => console.error("Initial analysis generation error:", err));
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
  app.post(api.upload.create.path, upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!req.file.mimetype.startsWith("image/")) {
      fs.rmSync(req.file.path, { force: true });
      return res.status(400).json({ message: 'Only image files are supported' });
    }

    // Keep the original extension for image decoders and remove path segments
    // from user-provided filenames before moving the upload.
    const safeOriginalName = path.basename(req.file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}_${safeOriginalName}`;
    const targetPath = path.join(publicImagesDir, filename);
    
    fs.renameSync(req.file.path, targetPath);
    
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
        name: "Standard Placido Disc (Normal Cornea)",
        url: "/images/sample_placido_normal.png",
        description: "Regular concentric Placido mires, 22 rings, normal asphericity.",
      },
      {
        name: "Keratoconus Placido Disc (Inferior Steepening)",
        url: "/images/sample_placido_keratoconus.png",
        description: "Irregular mire compression and paracentral steepening.",
      },
    ]);
  });

  return httpServer;
}

async function processAnalysis(id: number) {
  await processTopographyAnalysis(id);
}
