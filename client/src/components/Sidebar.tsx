import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Eye, LayoutDashboard, FilePlus2, Settings, LifeBuoy } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/new", label: "New Analysis", icon: FilePlus2 },
  ];

  const secondaryItems = [
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/help", label: "Help & Support", icon: LifeBuoy },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-10 w-64 bg-white border-r border-border hidden md:flex flex-col">
      <div className="p-6 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Eye className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-tight tracking-tight">OculoMetrics</h1>
          <p className="text-xs text-muted-foreground font-medium">Topography Suite</p>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-8 overflow-y-auto">
        <div>
          <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Platform
          </h3>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                    location === item.href
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", location === item.href ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.label}
                </div>
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            System
          </h3>
          <nav className="space-y-1">
            {secondaryItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                    location === item.href
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", location === item.href ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.label}
                </div>
              </Link>
            ))}
          </nav>
        </div>
      </div>
      
      <div className="p-4 border-t border-border bg-slate-50">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-400"></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">Dr. S. Miller</p>
            <p className="text-xs text-muted-foreground truncate">Ophthalmologist</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
