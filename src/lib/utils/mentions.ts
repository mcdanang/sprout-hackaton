/**
 * Regex for identifying @mentions in signal content.
 * Matches: @[Full Name](uuid-or-id)
 */
export const MENTION_REGEX = /(@\[[^\]]+\]\([^)]+\))/g;

/**
 * Standardized CSS classes for mention chips to ensure vertical centering 
 * and visual consistency between the editor and the rendered feed.
 */
export const MENTION_CHIP_CLASSES = 
  "inline-flex items-center justify-center font-bold text-blue-600 mx-0.5 select-none align-baseline";
