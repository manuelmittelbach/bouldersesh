import * as React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Full name — initials are derived from it. */
  name?: string;
  /** Explicit initials override. */
  initials?: string;
  /** Background tone. */
  tone?: "rock" | "orange" | "slate" | "moss" | "clay";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Show a green online dot. */
  online?: boolean;
  /** Optional image URL — replaces initials. */
  src?: string;
}

/**
 * Initials avatar with a calm cool tone set and optional online dot.
 */
export function Avatar(props: AvatarProps): JSX.Element;
