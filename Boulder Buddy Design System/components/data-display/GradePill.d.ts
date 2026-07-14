import * as React from "react";

export interface GradePillProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Fb-scale grade text, e.g. "6a – 6c", "7a+", "5+". */
  grade: string;
  /** Colour band by skill level. */
  band?: "beginner" | "intermediate" | "advanced" | "pro" | "neutral";
  size?: "sm" | "md";
}

/**
 * Climbing-grade chip — mono numerals on a muted level-coloured surface.
 * The signature data element of the feed.
 */
export function GradePill(props: GradePillProps): JSX.Element;
