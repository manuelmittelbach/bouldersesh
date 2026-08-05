import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement & HTMLTextAreaElement> {
  /** Uppercase eyebrow label above the field. */
  label?: string;
  /** Leading icon node (Lucide / inline svg). */
  icon?: React.ReactNode;
  /** Render a multiline textarea instead of a single-line input. */
  as?: "input" | "textarea";
  /** Helper text below the field. */
  hint?: string;
  /** Error message — turns border/text red. */
  error?: string;
}

/**
 * Single-line text field or textarea with optional eyebrow label, leading icon,
 * hint and error state. Orange focus ring.
 */
export function Input(props: InputProps): JSX.Element;
