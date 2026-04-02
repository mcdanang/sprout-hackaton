"use client";

import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { 
  ViewGrid, 
  Folder, 
  ChatLines, 
  Star, 
  ShieldCheck, 
  Flash,
  Menu,
  Xmark
} from "iconoir-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { LanguageSwitcher } from "@/components/language-switcher";

const navItems = [
  { href: "/dashboard", icon: ViewGrid, label: "dashboard" },
  { href: "/dashboard/projects", icon: Folder, label: "projects" },
  { href: "/dashboard/concerns", icon: ChatLines, label: "myConcern" },
  { href: "/dashboard/achievements", icon: Star, label: "myAchievement" },
  { href: "/dashboard/feedback", icon: ShieldCheck, label: "privateFeedback" },
  { href: "/dashboard/ai-assistant", icon: Flash, label: "aiAssistant" },
];

export function DashboardSidebar() {
  const t = useTranslations("Dashboard");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-background px-4 py-6">
      {/* Logo */}
      <div className="mb-10 px-2">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image 
            src="/signal_logo.svg" 
            alt="Signal Logo" 
            width={32} 
            height={32} 
            className="object-contain"
          />
          <span className="font-open-sans text-[22px] font-bold tracking-tight text-[#081021]">
            Signal
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-[15px] font-medium transition-all duration-200 rounded-full",
                isActive 
                  ? "bg-[#FFD300] text-[#081021] shadow-sm" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
              {t(`nav.${item.label}`)}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Account Settings */}
      <div className="mt-auto border-t pt-6 space-y-4">
        <div className="flex items-center justify-between px-2">
          <LanguageSwitcher />
          <UserButton />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md border"
        >
          {isOpen ? <Xmark className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden w-72 border-r bg-background md:block h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-background shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}
