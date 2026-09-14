import { z } from 'zod';
import { insertAnalysisSchema, analysis } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  analysis: {
    list: {
      method: 'GET' as const,
      path: '/api/analysis',
      responses: {
        200: z.array(z.custom<typeof analysis.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/analysis/:id',
      responses: {
        200: z.custom<typeof analysis.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/analysis',
      input: insertAnalysisSchema,
      responses: {
        201: z.custom<typeof analysis.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  // Separate endpoint for file upload
  upload: {
    create: {
      method: 'POST' as const,
      path: '/api/upload',
      // input is FormData, not strictly typed here in Zod for body
      responses: {
        201: z.object({
          url: z.string(),
          filename: z.string(),
        }),
        400: errorSchemas.validation,
      },
    }
  }
};

// ============================================
// HELPER
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
