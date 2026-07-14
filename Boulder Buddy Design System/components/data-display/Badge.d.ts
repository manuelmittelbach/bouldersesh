import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Functional colour. */
  tone?: "neutral" | "success" | "warning" | "danger" | "brand";
  /** Optional leading icon node. */
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Small status marker — "Verifiziert", "Wartet", "Passt zu deinem Level".
 */
export function Badge(props: BadgeProps): JSX.Element;
