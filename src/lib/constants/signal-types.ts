import { AlertCircle, Trophy, Heart, LucideIcon } from "lucide-react";

export type SignalType = "concern" | "achievement" | "appreciation";

export interface SignalTypeConfig {
  id: SignalType;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  hoverBg: string;
  activeBorder: string;
  activeBg: string;
  sendBg: string;
  placeholder: string;
}

export const SIGNAL_TYPES: SignalTypeConfig[] = [
  {
    id: "concern",
    label: "Concern",
    icon: AlertCircle,
    color: "text-red-500",
    bgColor: "bg-red-50",
    hoverBg: "hover:bg-red-100/50",
    activeBorder: "border-red-200",
    activeBg: "bg-red-50",
    sendBg: "bg-red-500",
    placeholder: "What's the risk or blocker?",
  },
  {
    id: "achievement",
    label: "Achievement",
    icon: Trophy,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
    hoverBg: "hover:bg-emerald-100/50",
    activeBorder: "border-emerald-200",
    activeBg: "bg-emerald-50",
    sendBg: "bg-emerald-500",
    placeholder: "What did the team accomplish?",
  },
  {
    id: "appreciation",
    label: "Kudos",
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    hoverBg: "hover:bg-pink-100/50",
    activeBorder: "border-pink-200",
    activeBg: "bg-pink-50",
    sendBg: "bg-brand-primary",
    placeholder: "Who deserves a shoutout?",
  },
];
