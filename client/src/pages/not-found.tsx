import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="mb-6 p-4 bg-red-50 rounded-full">
            <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">404 Page Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <Link href="/">
          <button className="px-6 py-3 rounded-xl font-semibold bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-200 ease-out">
            Return to Dashboard
          </button>
        </Link>
      </div>
    </Layout>
  );
}
