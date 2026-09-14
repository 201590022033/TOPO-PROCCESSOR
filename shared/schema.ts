import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const analysis = pgTable("analysis", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  // Configuration parameters matches python argparse
  startAngle: integer("start_angle").notNull().default(0),
  endAngle: integer("end_angle").notNull().default(360),
  nMires: integer("n_mires").notNull().default(22),
  workingDistance: integer("working_distance").notNull().default(75),
  zernikeDegree: integer("zernike_degree").notNull().default(8),
  mireSegMethod: text("mire_seg_method").notNull().default("dl"), // assuming dl as default from imports
  
  // Results
  results: jsonb("results"), // for numerical metrics like simK, astigmatism
  outputFiles: jsonb("output_files"), // for paths to generated plots
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===
export const insertAnalysisSchema = createInsertSchema(analysis).omit({ 
  id: true, 
  createdAt: true,
  status: true, 
  results: true, 
  outputFiles: true,
  errorMessage: true 
});

// === EXPLICIT API CONTRACT TYPES ===
export type Analysis = typeof analysis.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;

export type CreateAnalysisRequest = InsertAnalysis;

export type AnalysisResponse = Analysis;
export type AnalysisListResponse = Analysis[];

export type FileUploadResponse = {
  url: string;
  filename: string;
};

// Types for the Python script parameters to ensure type safety
export interface AnalysisParams {
  startAngle: number;
  endAngle: number;
  nMires: number;
  workingDistance: number;
  zernikeDegree: number;
  mireSegMethod: string;
}
