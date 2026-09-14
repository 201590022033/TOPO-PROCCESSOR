import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import express from 'express';
import { execFileSync, spawn } from "child_process";

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

  return httpServer;
}

async function processAnalysis(id: number) {
  try {
    await storage.updateAnalysisStatus(id, 'processing');
    
    const analysis = await storage.getAnalysis(id);
    if (!analysis) return;

    // Use absolute paths for the python script and directories
    const pythonScript = path.join(process.cwd(), 'server', 'python_analysis', 'main.py');
    const baseDir = path.join(process.cwd(), 'client', 'public', 'images');
    const outputDir = path.join(process.cwd(), 'client', 'public', 'images', `analysis_${id}`);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const args = [
      pythonScript,
      '--image_name', path.basename(analysis.imageUrl),
      '--base_dir', baseDir,
      '--start_angle', analysis.startAngle.toString(),
      '--end_angle', analysis.endAngle.toString(),
      '--n_mires', analysis.nMires.toString(),
      '--working_distance', analysis.workingDistance.toString(),
      '--zernike_degree', analysis.zernikeDegree.toString(),
      '--mire_seg_method', analysis.mireSegMethod,
      '--mire_loc_method', 'radial_scan', // Default
      '--output_dir', outputDir
    ];

    // Replit's Python module exposes the installed packages to python3 via
    // sitecustomize. The uv-created .pythonlibs binary can be a different
    // Python minor version, so prefer the runtime that matches the Nix stack.
    const pythonExecutable = 'python3';
    const pythonEnv: NodeJS.ProcessEnv = { ...process.env, PYTHONUNBUFFERED: "1" };
    try {
      // Wheels installed through uv need the C++ runtime explicitly exposed in
      // Replit's Nix shell. Keep this lookup dynamic because Nix store paths
      // change when the toolchain is refreshed.
      const libstdcPath = execFileSync("gcc", ["-print-file-name=libstdc++.so.6"], {
        encoding: "utf8",
      }).trim();
      if (path.isAbsolute(libstdcPath)) {
        pythonEnv.LD_LIBRARY_PATH = [
          process.env.PYTHON_LD_LIBRARY_PATH,
          process.env.REPLIT_LD_LIBRARY_PATH,
          path.dirname(libstdcPath),
          process.env.LD_LIBRARY_PATH,
        ].filter(Boolean).join(":");
      }
    } catch {
      // The system Python may already have a working native runtime.
    }
    const pythonProcess = spawn(pythonExecutable, args, {
      cwd: process.cwd(),
      env: pythonEnv,
    });
    let output = '';
    let errorOutput = '';
    let settled = false;

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('error', async (error) => {
      if (settled) return;
      settled = true;
      await storage.updateAnalysisStatus(id, 'failed', undefined, undefined, `Could not start Python analysis: ${error.message}`);
    });

    pythonProcess.on('close', async (code) => {
      if (settled) return;
      settled = true;
      if (code !== 0) {
        const details = errorOutput.trim() || output.trim() || `process exited with code ${code}`;
        console.error(`Python process failed with code ${code}: ${details}`);
        await storage.updateAnalysisStatus(id, 'failed', undefined, undefined, `Python error: ${details}`);
        return;
      }

      // Parse output for RESULTS: prefix
      const resultsMatch = output.match(/RESULTS:({.*})/);
      let results = {};
      if (resultsMatch) {
        try {
          results = JSON.parse(resultsMatch[1]);
        } catch (e) {
          console.error("Failed to parse results JSON", e);
        }
      }

      const outputFiles = {
        surfaceMap: `/images/analysis_${id}/corneal_surface_3d.png`,
        axialMap: `/images/analysis_${id}/axial_heatmap.png`,
        mireDetection: `/images/analysis_${id}/mire_detection.png`,
      };

      await storage.updateAnalysisStatus(id, 'completed', results, outputFiles);
    });
    
  } catch (error) {
    console.error("Analysis failed:", error);
    await storage.updateAnalysisStatus(id, 'failed', undefined, undefined, String(error));
  }
}
