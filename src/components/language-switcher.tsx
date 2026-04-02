'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTransition } from 'react';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  function onSelectChange(nextLocale: string) {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-all hover:bg-muted">
        <Languages className="h-4 w-4 text-muted-foreground" />
        <select
          defaultValue={locale}
          disabled={isPending}
          onChange={(e) => onSelectChange(e.target.value)}
          className="appearance-none bg-transparent pr-4 outline-none cursor-pointer disabled:opacity-50"
        >
          <option value="en">EN</option>
          <option value="id">ID</option>
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg
            className="h-3 w-3 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
