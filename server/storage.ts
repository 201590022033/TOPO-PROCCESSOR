import { db } from "./db";
import {
  analysis,
  type Analysis,
  type InsertAnalysis,
  type CreateAnalysisRequest
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createAnalysis(analysis: CreateAnalysisRequest): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  listAnalyses(): Promise<Analysis[]>;
  updateAnalysisStatus(id: number, status: string, results?: any, outputFiles?: any, errorMessage?: string): Promise<Analysis>;
}

export class MemStorage implements IStorage {
  private analyses: Map<number, Analysis> = new Map();
  private currentId = 1;

  constructor() {
    const defaultItem: Analysis = {
      id: 1,
      imageUrl: "/images/sample_placido_normal.png",
      status: "completed",
      startAngle: 0,
      endAngle: 360,
      nMires: 22,
      workingDistance: 75,
      zernikeDegree: 8,
      mireSegMethod: "dl",
      results: {
        simK1: 44.25,
        simK2: 43.10,
        astigmatism: 1.15,
        eccentricity: 0.421,
        imageQuality: 98.4,
        ringsDetected: 22,
        centerX: 256,
        centerY: 256,
        workingDistance: 75,
        analysisNote: "Baseline clinical corneal topography reconstruction from Placido disc.",
      },
      outputFiles: {
        surfaceMap: "/images/analysis_1/corneal_surface_3d.png",
        axialMap: "/images/analysis_1/axial_heatmap.png",
        mireDetection: "/images/analysis_1/mire_detection.png",
      },
      errorMessage: null,
      createdAt: new Date(),
    };
    this.analyses.set(1, defaultItem);
    this.currentId = 2;
  }

  async createAnalysis(insertAnalysis: CreateAnalysisRequest): Promise<Analysis> {
    const id = this.currentId++;
    const newItem: Analysis = {
      id,
      imageUrl: insertAnalysis.imageUrl,
      status: "pending",
      startAngle: insertAnalysis.startAngle ?? 0,
      endAngle: insertAnalysis.endAngle ?? 360,
      nMires: insertAnalysis.nMires ?? 22,
      workingDistance: insertAnalysis.workingDistance ?? 75,
      zernikeDegree: insertAnalysis.zernikeDegree ?? 8,
      mireSegMethod: insertAnalysis.mireSegMethod ?? "dl",
      results: null,
      outputFiles: null,
      errorMessage: null,
      createdAt: new Date(),
    };
    this.analyses.set(id, newItem);
    return newItem;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async listAnalyses(): Promise<Analysis[]> {
    return Array.from(this.analyses.values()).sort(
      (a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    );
  }

  async updateAnalysisStatus(
    id: number,
    status: string,
    results?: any,
    outputFiles?: any,
    errorMessage?: string
  ): Promise<Analysis> {
    const existing = this.analyses.get(id);
    if (!existing) {
      throw new Error(`Analysis ${id} not found`);
    }
    const updated: Analysis = {
      ...existing,
      status,
      results: results !== undefined ? results : existing.results,
      outputFiles: outputFiles !== undefined ? outputFiles : existing.outputFiles,
      errorMessage: errorMessage !== undefined ? errorMessage : existing.errorMessage,
    };
    this.analyses.set(id, updated);
    return updated;
  }
}

export class DatabaseStorage implements IStorage {
  private fallback = new MemStorage();

  async createAnalysis(insertAnalysis: CreateAnalysisRequest): Promise<Analysis> {
    if (!db) return this.fallback.createAnalysis(insertAnalysis);
    try {
      const [newItem] = await db.insert(analysis).values(insertAnalysis).returning();
      return newItem;
    } catch (err) {
      console.warn("[AI Studio] Database insert error, falling back to in-memory:", err);
      return this.fallback.createAnalysis(insertAnalysis);
    }
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    if (!db) return this.fallback.getAnalysis(id);
    try {
      const [item] = await db.select().from(analysis).where(eq(analysis.id, id));
      return item ?? this.fallback.getAnalysis(id);
    } catch (err) {
      console.warn("[AI Studio] Database select error, falling back to in-memory:", err);
      return this.fallback.getAnalysis(id);
    }
  }

  async listAnalyses(): Promise<Analysis[]> {
    if (!db) return this.fallback.listAnalyses();
    try {
      return await db.select().from(analysis).orderBy(desc(analysis.createdAt));
    } catch (err) {
      console.warn("[AI Studio] Database list error, falling back to in-memory:", err);
      return this.fallback.listAnalyses();
    }
  }

  async updateAnalysisStatus(
    id: number, 
    status: string, 
    results?: any, 
    outputFiles?: any,
    errorMessage?: string
  ): Promise<Analysis> {
    if (!db) return this.fallback.updateAnalysisStatus(id, status, results, outputFiles, errorMessage);
    try {
      const updates: Partial<Analysis> = { status };
      if (results) updates.results = results;
      if (outputFiles) updates.outputFiles = outputFiles;
      if (errorMessage) updates.errorMessage = errorMessage;
      
      const [updated] = await db.update(analysis)
        .set(updates)
        .where(eq(analysis.id, id))
        .returning();
      return updated ?? this.fallback.updateAnalysisStatus(id, status, results, outputFiles, errorMessage);
    } catch (err) {
      console.warn("[AI Studio] Database update error, falling back to in-memory:", err);
      return this.fallback.updateAnalysisStatus(id, status, results, outputFiles, errorMessage);
    }
  }
}

export const storage = new DatabaseStorage();
