import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertAnalysis } from "@shared/schema";

// GET /api/analysis
export function useAnalyses() {
  return useQuery({
    queryKey: [api.analysis.list.path],
    queryFn: async () => {
      const res = await fetch(api.analysis.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analysis history");
      return api.analysis.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/analysis/:id
export function useAnalysis(id: number) {
  return useQuery({
    queryKey: [api.analysis.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.analysis.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch analysis");
      return api.analysis.get.responses[200].parse(await res.json());
    },
    // Poll every 2 seconds if status is pending or processing
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'pending' || data.status === 'processing')) {
        return 2000;
      }
      return false;
    }
  });
}

// POST /api/analysis
export function useCreateAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertAnalysis) => {
      const res = await fetch(api.analysis.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.analysis.create.responses[400].parse(await res.json());
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create analysis");
      }
      return api.analysis.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.analysis.list.path] });
    },
  });
}

// POST /api/upload
export function useUploadFile() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(api.upload.create.path, {
        method: "POST",
        body: formData,
        credentials: "include", // Important for sessions if needed
      });

      if (!res.ok) {
        throw new Error("File upload failed");
      }
      return api.upload.create.responses[201].parse(await res.json());
    },
  });
}
