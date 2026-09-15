import { useState } from "react";
import { useRoute } from "wouter";
import { useAnalysis } from "@/hooks/use-analysis";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Download, FileText, AlertTriangle, Loader2, ZoomIn, X, Info } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const MAP_METADATA: Record<string, { title: string; description: string; tag: string }> = {
  axialMap: {
    title: "Axial (Sagittal) Curvature Map",
    description: "Standard dioptric power distribution with reference sphere curvature.",
    tag: "Axial",
  },
  tangentialMap: {
    title: "Tangential (Instantaneous) Map",
    description: "High-contrast local curvature map highlighting paracentral steepening and cone boundaries.",
    tag: "Instantaneous",
  },
  surfaceMap: {
    title: "Corneal Surface Elevation",
    description: "Height profile relative to best-fit reference sphere (BFS ±0.80 mm).",
    tag: "Elevation",
  },
  mireDetection: {
    title: "Placido Mire Detection & Centration",
    description: "Extracted mire ring contours, eccentricity evaluation, and pupil reflex alignment.",
    tag: "Placido",
  },
};

export default function AnalysisDetails() {
  const [, params] = useRoute("/analysis/:id");
  const id = parseInt(params?.id || "0");
  const { data: analysis, isLoading, error } = useAnalysis(id);
  const [selectedModalImage, setSelectedModalImage] = useState<{ url: string; title: string } | null>(null);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </Layout>
    );
  }

  if (error || !analysis) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Analysis Not Found</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            The analysis you are looking for does not exist or an error occurred while loading it.
          </p>
          <Link href="/">
            <button className="mt-6 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Parse results if available
  const results = analysis.results as Record<string, any> | null;
  const outputFiles = analysis.outputFiles as Record<string, string> | null;
  const isProcessing = analysis.status === "processing" || analysis.status === "pending";

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold text-slate-900">Analysis #{analysis.id}</h1>
              <StatusBadge status={analysis.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Created on {analysis.createdAt && format(new Date(analysis.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
      </div>

      {/* Processing State Banner */}
      {isProcessing && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-center gap-4">
          <Loader2 className="w-6 h-6 text-primary animate-spin shrink-0" />
          <div>
            <h3 className="font-semibold text-slate-900">Corneal Topography Pipeline Active</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Extracting Placido mire contours, fitting Zernike polynomial surface, and rendering Keratron axial and tangential curvature maps.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Images */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg text-slate-900">Input Placido Disc Image</h3>
              <button
                onClick={() => setSelectedModalImage({ url: analysis.imageUrl, title: "Input Placido Disc Image" })}
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                Inspect Full Resolution
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-200 flex items-center justify-center p-2">
              <img
                src={analysis.imageUrl}
                alt="Original Placido Disc"
                className="w-full h-auto max-h-[460px] object-contain mx-auto rounded-lg"
              />
            </div>
          </div>

          {analysis.status === "completed" && outputFiles && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-slate-900">Topography & Curvature Maps</h3>
                <span className="text-xs text-muted-foreground font-mono">Keratron Clinical Palette</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Object.entries(outputFiles).map(([key, url]) => {
                  const meta = MAP_METADATA[key] || {
                    title: key.replace(/_/g, " "),
                    description: "",
                    tag: "Map",
                  };

                  return (
                    <div
                      key={key}
                      className="group border border-slate-200 rounded-xl p-3 bg-white hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <p className="text-sm font-bold text-slate-900 truncate">{meta.title}</p>
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {meta.tag}
                          </span>
                        </div>
                        {meta.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-2.5">
                            {meta.description}
                          </p>
                        )}
                      </div>

                      <div
                        onClick={() => setSelectedModalImage({ url, title: meta.title })}
                        className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-200 aspect-square flex items-center justify-center cursor-pointer group-hover:ring-2 group-hover:ring-primary/20 transition-all"
                      >
                        <img
                          src={url}
                          alt={meta.title}
                          className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1 backdrop-blur-[1px]">
                          <ZoomIn className="w-4 h-4" />
                          Click to Expand
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {analysis.errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-800">
              <div className="flex items-center gap-2 mb-2 font-semibold">
                <AlertTriangle className="w-5 h-5" />
                Analysis Failed
              </div>
              <p className="text-sm">{analysis.errorMessage}</p>
            </div>
          )}
        </div>

        {/* Sidebar: Metrics & Config */}
        <div className="lg:col-span-1 space-y-6">
          {/* Results Card */}
          {analysis.status === "completed" && results && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border animate-in fade-in slide-in-from-right-4 duration-500">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Key Keratometry Metrics
              </h3>
              <div className="space-y-3">
                {Object.entries(results).map(([key, value]) => {
                  if (key === "analysisNote") {
                    return (
                      <div
                        key={key}
                        className="rounded-xl bg-blue-50/60 border border-blue-100 p-3 text-xs leading-relaxed text-slate-700 mt-3"
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-blue-900 mb-1">
                          <Info className="w-3.5 h-3.5" />
                          Clinical Note
                        </div>
                        {String(value)}
                      </div>
                    );
                  }

                  const formattedValue = formatMetricValue(key, value);

                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                    >
                      <span className="text-sm text-muted-foreground">{formatMetricLabel(key)}</span>
                      <span className="font-mono font-semibold text-slate-900">{formattedValue}</span>
                    </div>
                  );
                })}
              </div>

              <a
                href={`/api/analysis/${analysis.id}/export`}
                download
                className="w-full mt-6 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Export CSV Report
              </a>
            </div>
          )}

          {/* Configuration Summary */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-4 tracking-wider">
              Acquisition Parameters
            </h3>
            <div className="space-y-3">
              <ConfigItem label="Start Angle" value={`${analysis.startAngle}°`} />
              <ConfigItem label="End Angle" value={`${analysis.endAngle}°`} />
              <ConfigItem label="Placido Mires" value={analysis.nMires} />
              <ConfigItem label="Working Distance" value={`${analysis.workingDistance} mm`} />
              <ConfigItem label="Zernike Degree" value={`Degree ${analysis.zernikeDegree}`} />
              <ConfigItem label="Mire Method" value={analysis.mireSegMethod === "dl" ? "Deep Learning (DL)" : "Traditional CV"} />
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom Modal */}
      {selectedModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedModalImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl p-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-white">
              <h3 className="font-semibold text-base">{selectedModalImage.title}</h3>
              <button
                onClick={() => setSelectedModalImage(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={selectedModalImage.url}
              alt={selectedModalImage.title}
              className="max-h-[75vh] w-auto object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </Layout>
  );
}

function ConfigItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}

function formatMetricLabel(key: string) {
  const map: Record<string, string> = {
    simK1: "Sim K1 (Flattest)",
    simK2: "Sim K2 (Steepest)",
    astigmatism: "Corneal Astigmatism",
    eccentricity: "Asphericity / Eccentricity (e)",
    imageQuality: "Image Quality Index",
    ringsDetected: "Mire Rings Detected",
    centerX: "Apex Center X",
    centerY: "Apex Center Y",
    workingDistance: "Calibrated Working Distance",
  };
  return (
    map[key] ||
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

function formatMetricValue(key: string, value: any): string {
  if (typeof value !== "number") return String(value);
  if (key === "simK1" || key === "simK2" || key === "astigmatism") {
    return `${value.toFixed(2)} D`;
  }
  if (key === "eccentricity") {
    return value.toFixed(3);
  }
  if (key === "imageQuality") {
    return `${value.toFixed(1)}%`;
  }
  if (key === "workingDistance") {
    return `${value} mm`;
  }
  if (key === "centerX" || key === "centerY") {
    return `${Math.round(value)} px`;
  }
  return value.toFixed(2);
}
