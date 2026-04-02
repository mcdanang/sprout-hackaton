'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';

/**
 * Premium Language Switcher
 * Redesigned to match the pill-style toggle reference with brand yellow (#FFD300).
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
          "relative flex h-10 w-22 items-center rounded-full bg-[#FFD300] p-1 shadow-[inset_0_1px_4px_rgba(0,0,0,0.1)] transition-all hover:brightness-105 active:scale-95 disabled:opacity-50 cursor-pointer overflow-hidden",
        )}
        aria-label="Toggle language"
      >
        {/* Background Labels (Static) */}
        {/* We use a dark mustard/gold color for the label on the yellow background as seen in the reference */}
        <div className="absolute inset-0 flex items-center justify-between px-4 text-[13px] font-extrabold tracking-tighter text-[#A67C00]">
          <span className="w-6 text-center">ID</span>
          <span className="w-6 text-center">EN</span>
        </div>

        {/* Sliding White Thumb with Active Label */}
        <div
          className={cn(
            "z-10 flex h-8 w-11 items-center justify-center rounded-full bg-white text-[13px] font-extrabold text-[#111] shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all duration-300 ease-in-out",
            locale === 'en' ? "translate-x-9" : "translate-x-0"
          )}
        >
          {locale.toUpperCase()}
        </div>
      </button>
    </div>
  );
}
