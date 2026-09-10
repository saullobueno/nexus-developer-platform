import {
  Activity,
  BarChart3,
  FileText,
  Flag,
  GitBranch,
  Home,
  LayoutGrid,
  type LucideIcon,
  Plug,
  Rocket,
  Settings,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Catalog", href: "/catalog", icon: LayoutGrid },
  { label: "Deployments", href: "/deployments", icon: Rocket },
  { label: "Incidents", href: "/incidents", icon: TriangleAlert },
  { label: "Observability", href: "/observability", icon: Activity },
  { label: "APIs", href: "/apis", icon: Plug },
  { label: "Documentation", href: "/docs", icon: FileText },
  { label: "Feature Flags", href: "/feature-flags", icon: Flag },
  { label: "Pipelines", href: "/pipelines", icon: GitBranch },
  { label: "Teams", href: "/teams", icon: Users },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "AI Copilot", href: "/ai-copilot", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings },
];
