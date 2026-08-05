import * as React from "react";

export interface ChipProps extends React.HTMLAttributes<HTMLElement> {
  /** Selected state — fills with ink (rock-900). */
  active?: boolean;
  /** Leading icon node. */
  icon?: React.ReactNode;
  /** Trailing icon node (e.g. chevron for dropdown chips). */
  trailingIcon?: React.ReactNode;
  /** Element to render. Default "button". */
  as?: "button" | "div";
  children?: React.ReactNode;
}

/**
 * Pill filter / selection chip for the feed filter bar and level pickers.
 */
export function Chip(props: ChipProps): JSX.Element;
