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

export class DatabaseStorage implements IStorage {
  async createAnalysis(insertAnalysis: CreateAnalysisRequest): Promise<Analysis> {
    const [newItem] = await db.insert(analysis).values(insertAnalysis).returning();
    return newItem;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const [item] = await db.select().from(analysis).where(eq(analysis.id, id));
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
    const updates: Partial<Analysis> = { status };
    if (results) updates.results = results;
    if (outputFiles) updates.outputFiles = outputFiles;
    if (errorMessage) updates.errorMessage = errorMessage;
    
    const [updated] = await db.update(analysis)
      .set(updates)
      .where(eq(analysis.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
