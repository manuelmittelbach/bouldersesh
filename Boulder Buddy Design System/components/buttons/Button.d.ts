import * as React from "react";

/**
 * Button props.
 *
 * @startingPoint section="Buttons" subtitle="Primary, secondary, outline, ghost — 3 sizes" viewport="700x200"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. primary = bold orange, secondary = ink/dark, outline = hairline, ghost = chromeless */
  variant?: "primary" | "secondary" | "outline" | "ghost";
  /** Control size. Default "md" (44px hit target). */
  size?: "sm" | "md" | "lg";
  /** Leading icon node (e.g. a Lucide <i data-lucide> or inline <svg>). */
  icon?: React.ReactNode;
  /** Trailing icon node. */
  trailingIcon?: React.ReactNode;
  /** Stretch to container width. */
  fullWidth?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

/**
 * Boulder Buddy — Button
 * Primary action control. Use one primary (orange) button per view; everything
 * else is secondary/outline/ghost.
 */
export function Button(props: ButtonProps): JSX.Element;
