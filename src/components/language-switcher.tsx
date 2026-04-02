'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';

/**
 * Premium Language Switcher (Alignment Fixed)
 * Perfectly centered slots for ID and EN with a sliding brand-yellow indicator.
 */
export function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  function handleToggle() {
    const nextLocale = locale === 'en' ? 'id' : 'en';
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div className="flex items-center">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          "relative flex h-8 w-24 items-center rounded-full bg-muted/30 p-1 transition-all hover:bg-muted/50 active:scale-95 disabled:opacity-50 cursor-pointer overflow-hidden border border-border/40 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]",
        )}
        aria-label="Toggle language"
      >
        {/* Sliding Indicator */}
        {/* Width is 50% of parent minus padding */}
        <div
          className={cn(
            "absolute h-6 w-[calc(50%-4px)] rounded-full bg-[#FFD300] shadow-sm transition-all duration-300 ease-in-out",
            locale === 'en' ? "translate-x-full" : "translate-x-0"
          )}
        />

        {/* Labels Layer */}
        <div className="relative z-10 flex w-full items-center text-[10px] font-black uppercase tracking-widest">
          <span className={cn(
            "flex-1 text-center transition-colors duration-300", 
            locale === 'id' ? "text-black" : "text-muted-foreground/60"
          )}>
            ID
          </span>
          <span className={cn(
            "flex-1 text-center transition-colors duration-300",
            locale === 'en' ? "text-black" : "text-muted-foreground/60"
          )}>
            EN
          </span>
        </div>
      </button>
    </div>
  );
}
