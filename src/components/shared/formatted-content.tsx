"use client";

import React from "react";
import { MENTION_REGEX, MENTION_CHIP_CLASSES } from "@/lib/utils/mentions";

interface Props {
  content: string;
  className?: string;
}

/**
 * FormattedContent handles the parsing and rendering of signal content, 
 * including @mentions structured as @[Name](id).
 */
export function FormattedContent({ content, className }: Props) {
  if (!content) return null;

  return (
    <div className={className}>
      {content.split(MENTION_REGEX).map((part, i) => {
        const match = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          const name = match[1];
          return (
            <span
              key={i}
              className={MENTION_CHIP_CLASSES}
            >
              {name}
            </span>
          );
        }
        return part;
      })}
    </div>
  );
}
