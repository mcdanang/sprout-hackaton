"use client";

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/** Must render as a descendant of `next/link` (including next-intl `Link`). */
export function LinkPendingIndicator({ className }: { className?: string }) {
	const { pending } = useLinkStatus();
	if (!pending) return null;
	return (
		<Loader2
			className={cn("shrink-0 animate-spin text-[#B09100]", className)}
			aria-hidden
		/>
	);
}
