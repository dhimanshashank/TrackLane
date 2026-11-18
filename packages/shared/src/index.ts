export const ITERATION_TYPES = [
  "initial_integration",
  "ui_fixes",
  "improvement",
  "bug_fix",
  "requirement_update",
] as const;

export type IterationType = (typeof ITERATION_TYPES)[number];
