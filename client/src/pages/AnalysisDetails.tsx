import { useRoute } from "wouter";
import { useAnalysis } from "@/hooks/use-analysis";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Download, FileText, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function AnalysisDetails() {
  const [, params] = useRoute("/analysis/:id");
  const id = parseInt(params?.id || "0");
  const { data: analysis, isLoading, error } = useAnalysis(id);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Images */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
            <h3 className="font-semibold text-lg mb-4">Input Image</h3>
            <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <img src={analysis.imageUrl} alt="Original" className="w-full h-auto max-h-[500px] object-contain mx-auto" />
            </div>
          </div>

          {analysis.status === "completed" && outputFiles && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
              <h3 className="font-semibold text-lg mb-4">Generated Visualizations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(outputFiles).map(([key, url]) => (
                   <div key={key} className="space-y-2">
                     <p className="text-sm font-medium capitalize text-muted-foreground">{key.replace(/_/g, " ")}</p>
                     <div className="rounded-lg overflow-hidden bg-slate-50 border border-slate-200 aspect-square flex items-center justify-center">
                        <img src={url} alt={key} className="w-full h-full object-contain" />
                     </div>
                   </div>
                ))}
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
                Key Metrics
              </h3>
              <div className="space-y-4">
                {Object.entries(results).map(([key, value]) => (
                  key === "analysisNote" ? (
                    <div key={key} className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                      {String(value)}
                    </div>
                  ) : (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <span className="text-sm text-muted-foreground">{formatMetricLabel(key)}</span>
                      <span className="font-mono font-medium text-slate-900">
                        {typeof value === 'number' ? value.toFixed(2) : String(value)}
                      </span>
                    </div>
                  )
                ))}
              </div>
              
              <a
                href={`/api/analysis/${analysis.id}/export`}
                download
                className="w-full mt-6 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </a>
            </div>
          )}

          {/* Configuration Summary */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
            <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-4 tracking-wider">Configuration</h3>
            <div className="space-y-3">
              <ConfigItem label="Start Angle" value={`${analysis.startAngle}°`} />
              <ConfigItem label="End Angle" value={`${analysis.endAngle}°`} />
              <ConfigItem label="Mires" value={analysis.nMires} />
              <ConfigItem label="Working Dist." value={`${analysis.workingDistance}mm`} />
              <ConfigItem label="Zernike Deg." value={analysis.zernikeDegree} />
              <ConfigItem label="Method" value={analysis.mireSegMethod} />
            </div>
          </div>
        </div>
      </div>
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
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
