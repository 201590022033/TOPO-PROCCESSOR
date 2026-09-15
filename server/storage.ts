import { db } from "./db";
import {
  analysis,
  type Analysis,
  type CreateAnalysisRequest
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createAnalysis(analysis: CreateAnalysisRequest): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAnalysisByImageUrl(imageUrl: string): Promise<Analysis | undefined>;
  listAnalyses(): Promise<Analysis[]>;
  updateAnalysisStatus(id: number, status: string, results?: any, outputFiles?: any, errorMessage?: string): Promise<Analysis>;
}

export class SqliteStorage implements IStorage {
  constructor() {
    this.seedBaselineData();
  }

  /**
   * Idempotently seeds the 2 baseline development reference datasets if they are not already present.
   * Identification uses stable distinguishing image URLs rather than assuming fixed primary key IDs.
   */
  private seedBaselineData() {
    try {
      const existing = db.select().from(analysis).all();
      const hasNormalSeed = existing.some(
        (row) => row.imageUrl === "/images/sample_placido_normal.png"
      );
      const hasNokcSeed = existing.some(
        (row) => row.imageUrl === "/images/nokc_right.jpg"
      );

      if (!hasNormalSeed) {
        const [normalRecord] = db.insert(analysis).values({
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
          outputFiles: null,
          errorMessage: null,
          createdAt: new Date(Date.now() - 3600000),
        }).returning().all();

        if (normalRecord) {
          db.update(analysis).set({
            outputFiles: {
              surfaceMap: `/images/analysis_${normalRecord.id}/corneal_surface_3d.png`,
              axialMap: `/images/analysis_${normalRecord.id}/axial_heatmap.png`,
              tangentialMap: `/images/analysis_${normalRecord.id}/tangential_heatmap.png`,
              mireDetection: `/images/analysis_${normalRecord.id}/mire_detection.png`,
            }
          }).where(eq(analysis.id, normalRecord.id)).run();
        }
      }

      if (!hasNokcSeed) {
        const [nokcRecord] = db.insert(analysis).values({
          imageUrl: "/images/nokc_right.jpg",
          status: "completed",
          startAngle: 0,
          endAngle: 360,
          nMires: 22,
          workingDistance: 75,
          zernikeDegree: 8,
          mireSegMethod: "dl",
          results: {
            simK1: 39.12,
            simK2: 38.22,
            astigmatism: 0.90,
            eccentricity: 0.448,
            imageQuality: 99.2,
            ringsDetected: 22,
            centerX: 248,
            centerY: 256,
            workingDistance: 75,
            analysisNote: "Clinical Reference Dataset: Right Eye (OD) with 38.67 D avg keratometry and verified Keratron axial & tangential maps.",
          },
          outputFiles: null,
          errorMessage: null,
          createdAt: new Date(),
        }).returning().all();

        if (nokcRecord) {
          db.update(analysis).set({
            outputFiles: {
              surfaceMap: `/images/analysis_${nokcRecord.id}/corneal_surface_3d.png`,
              axialMap: "/images/nokc_right_axialmap.png",
              tangentialMap: "/images/nokc_right_tanmap.png",
              mireDetection: `/images/analysis_${nokcRecord.id}/mire_detection.png`,
            }
          }).where(eq(analysis.id, nokcRecord.id)).run();
        }
      }
    } catch (err) {
      console.error("[Storage] Failed to seed baseline data:", err);
    }
  }

  async createAnalysis(insertAnalysis: CreateAnalysisRequest): Promise<Analysis> {
    const [newItem] = await db.insert(analysis).values({
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
    }).returning();
    return newItem;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const [item] = await db.select().from(analysis).where(eq(analysis.id, id));
    return item;
  }

  async getAnalysisByImageUrl(imageUrl: string): Promise<Analysis | undefined> {
    const [item] = await db.select().from(analysis).where(eq(analysis.imageUrl, imageUrl));
    return item;
  }

  async listAnalyses(): Promise<Analysis[]> {
    return await db.select().from(analysis).orderBy(desc(analysis.createdAt));
  }

  async updateAnalysisStatus(
    id: number,
    status: string,
    results?: any,
    outputFiles?: any,
    errorMessage?: string
  ): Promise<Analysis> {
    const updates: Partial<typeof analysis.$inferInsert> = { status };
    if (results !== undefined) updates.results = results;
    if (outputFiles !== undefined) updates.outputFiles = outputFiles;
    if (errorMessage !== undefined) updates.errorMessage = errorMessage;

    const [updated] = await db
      .update(analysis)
      .set(updates)
      .where(eq(analysis.id, id))
      .returning();

    if (!updated) {
      throw new Error(`Analysis ${id} not found`);
    }
    return updated;
  }
}

export const storage = new SqliteStorage();

