import * as React from "react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Surface style. */
  variant?: "ghost" | "soft" | "brand" | "ink";
  size?: "sm" | "md" | "lg";
  /** Accessible label (also used as title tooltip). */
  label: string;
  /** Icon node — a Lucide <i data-lucide> or inline <svg>. */
  children?: React.ReactNode;
}

/**
 * Round, single-icon tap target — header back/close, nav actions, chat send.
 */
export function IconButton(props: IconButtonProps): JSX.Element;
