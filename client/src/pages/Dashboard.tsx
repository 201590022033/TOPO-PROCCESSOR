import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useAnalyses } from "@/hooks/use-analysis";
import { Link } from "wouter";
import { Plus, ArrowRight, Search, Filter, CalendarDays } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: analyses, isLoading, isError } = useAnalyses();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAnalyses = analyses?.filter((a) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const note = (a.results as any)?.analysisNote ? String((a.results as any).analysisNote).toLowerCase() : "";
    return (
      a.id.toString().includes(term) ||
      a.status.toLowerCase().includes(term) ||
      a.imageUrl.toLowerCase().includes(term) ||
      note.includes(term)
    );
  });

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage and view your corneal topography analyses.</p>
        </div>
        <Link href="/new">
          <button className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 group">
            <Plus className="w-4 h-4" />
            New Analysis
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-muted-foreground">Total Analyses</p>
          <p className="text-3xl font-display font-bold text-slate-900 mt-2">{analyses?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-muted-foreground">Completed</p>
          <p className="text-3xl font-display font-bold text-emerald-600 mt-2">
            {analyses?.filter(a => a.status === 'completed').length || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-muted-foreground">Processing</p>
          <p className="text-3xl font-display font-bold text-blue-600 mt-2">
            {analyses?.filter(a => a.status === 'processing' || a.status === 'pending').length || 0}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50/50">
          <h2 className="font-semibold text-slate-900">Recent Activity</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                placeholder="Search..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-48 transition-all"
              />
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-muted-foreground hover:text-foreground transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-red-500">
            Failed to load analyses. Please try refreshing.
          </div>
        ) : analyses?.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <CalendarDays className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No analyses yet</h3>
            <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
              Start by creating a new analysis to process corneal topography images.
            </p>
            <Link href="/new" className="mt-6">
              <button className="px-4 py-2 bg-white border border-slate-200 hover:border-primary/50 text-slate-700 font-medium rounded-lg transition-colors">
                Create First Analysis
              </button>
            </Link>
          </div>
        ) : filteredAnalyses?.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <p className="text-muted-foreground">No analyses found matching "{searchTerm}".</p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-3 text-sm text-primary font-medium hover:underline"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAnalyses?.map((analysis) => (
              <Link key={analysis.id} href={`/analysis/${analysis.id}`}>
                <div className="p-4 hover:bg-slate-50 transition-colors duration-150 cursor-pointer group flex items-center gap-4">
                  {/* Thumbnail Placeholder - would be the image if we had secure url */}
                  <div className="w-16 h-16 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0 border border-slate-200">
                     {/* In a real app we'd use analysis.imageUrl but simplified for now */}
                     <img src={analysis.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300" alt="" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 truncate group-hover:text-primary transition-colors">
                        Analysis #{analysis.id}
                      </h3>
                      <StatusBadge status={analysis.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {analysis.createdAt && format(new Date(analysis.createdAt), "MMM d, yyyy • h:mm a")}
                      </span>
                      <span>•</span>
                      <span>Working Dist: {analysis.workingDistance}mm</span>
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
