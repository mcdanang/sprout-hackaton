import { useTranslations } from "next-intl";
import { AlertCircle, TrendingUp } from "lucide-react";
import { ProjectCard, type Project } from "@/components/dashboard/project-card";
import { ShortInfoCard } from "@/components/dashboard/short-info-card";

// Dummy Data
const DUMMY_PROJECTS: Project[] = [
  {
    id: "1",
    name: "Internal API Platform",
    description: "Modernizing our internal gateway with high-performance edge computing and unified authentication.",
    status: "active",
    health: 45,
    healthStatus: "At Risk",
    team: [
      "https://i.pravatar.cc/150?u=1",
      "https://i.pravatar.cc/150?u=2",
      "https://i.pravatar.cc/150?u=3",
      "https://i.pravatar.cc/150?u=4",
      "https://i.pravatar.cc/150?u=5",
    ],
  },
  {
    id: "2",
    name: "Security Audit 2026",
    description: "Comprehensive review of all data-at-rest and in-transit protocols for the upcoming compliance cycle.",
    status: "planning",
    health: 90,
    healthStatus: "Stable",
    team: [
      "https://i.pravatar.cc/150?u=10",
      "https://i.pravatar.cc/150?u=11",
    ],
  },
  {
    id: "3",
    name: "Dashboard UI Revamp",
    description: "Shifting our admin interface to a more fluid, component-based architecture with better accessibility.",
    status: "completed",
    health: 100,
    healthStatus: "Stable",
    team: [
      "https://i.pravatar.cc/150?u=20",
      "https://i.pravatar.cc/150?u=21",
      "https://i.pravatar.cc/150?u=22",
    ],
  },
  {
    id: "4",
    name: "Cross-platform Mobile App",
    description: "Building the next-gen Signal mobile companion using React Native and shared business logic layers.",
    status: "on-hold",
    health: 20,
    healthStatus: "Critical",
    team: [
      "https://i.pravatar.cc/150?u=30",
      "https://i.pravatar.cc/150?u=31",
      "https://i.pravatar.cc/150?u=32",
      "https://i.pravatar.cc/150?u=33",
    ],
  },
];

export default function ProjectsPage() {
  const t = useTranslations("Projects");

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Hero Section */}
      <div className="space-y-4">
        <p className="font-plus-jakarta text-[12px] font-semibold leading-[16px] tracking-[1.2px] uppercase text-[#B09100]">
          {t("label")}
        </p>
        <h1 className="font-plus-jakarta text-[48px] font-bold leading-[48px] tracking-[-1.2px] text-brand-primary">
          {t("title")}
        </h1>
        <p className="font-plus-jakarta text-[18px] font-normal leading-[28px] text-dashboard-description max-w-2xl">
          {t("subtitle")}
        </p>
      </div>

      {/* Team Stats Overview */}
      <div className="flex flex-wrap gap-4 pt-4">
        <ShortInfoCard 
          title="Concerns" 
          value="12" 
          icon={AlertCircle} 
          iconClassName="text-red-500"
          className="flex-1 min-w-[200px]"
        />
        <ShortInfoCard 
          title="Achievements" 
          value="8" 
          icon={TrendingUp} 
          iconClassName="text-emerald-500"
          className="flex-1 min-w-[200px]"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DUMMY_PROJECTS.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
