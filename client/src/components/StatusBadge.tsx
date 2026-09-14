import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";

type Status = "pending" | "processing" | "completed" | "failed" | string;

export function StatusBadge({ status }: { status: Status }) {
  const normalizedStatus = status.toLowerCase();
  
  const styles = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    processing: "bg-blue-50 text-blue-700 border-blue-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    failed: "bg-red-50 text-red-700 border-red-200",
    default: "bg-slate-50 text-slate-700 border-slate-200",
  };

  const icons = {
    pending: <Clock className="w-3.5 h-3.5" />,
    processing: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    completed: <CheckCircle2 className="w-3.5 h-3.5" />,
    failed: <AlertCircle className="w-3.5 h-3.5" />,
    default: <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />,
  };

  const currentStyle = styles[normalizedStatus as keyof typeof styles] || styles.default;
  const currentIcon = icons[normalizedStatus as keyof typeof icons] || icons.default;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
      currentStyle
    )}>
      {currentIcon}
      <span className="capitalize">{status}</span>
    </span>
  );
}
