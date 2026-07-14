import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Adds press feedback (scale-down) for tappable cards. */
  interactive?: boolean;
  /** CSS padding value. Default var(--space-4). */
  padding?: string;
  /** Element/tag to render. Default "div". */
  as?: any;
  children?: React.ReactNode;
}

/**
 * The base surface — white, hairline border, 14px radius, low cool shadow.
 * Compose feed cards, session info panels and sheets from it.
 */
export function Card(props: CardProps): JSX.Element;
