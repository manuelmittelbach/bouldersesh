import * as React from "react";

/**
 * SessionCard props.
 *
 * @startingPoint section="App" subtitle="Boulder Buddy feed session card" viewport="380x150"
 */
export interface SessionCardProps {
  /** Creator display name. */
  name: string;
  avatarTone?: "rock" | "orange" | "slate" | "moss" | "clay";
  /** Grade text for the GradePill, e.g. "6a – 6c". */
  grade?: string;
  band?: "beginner" | "intermediate" | "advanced" | "pro" | "neutral";
  /** When — e.g. "Heute · 18:00 – 21:00". */
  time?: React.ReactNode;
  /** Where — gym name. */
  gym?: React.ReactNode;
  /** Optional note (clamped to 2 lines). */
  note?: React.ReactNode;
  /** Footer slot — e.g. a match Badge. */
  footer?: React.ReactNode;
  /** Icon nodes for the time / gym rows. */
  timeIcon?: React.ReactNode;
  gymIcon?: React.ReactNode;
  online?: boolean;
  onClick?: () => void;
}

/**
 * The signature feed unit — who's climbing, when, where, at what grade.
 * Composes Avatar + GradePill + Card.
 */
export function SessionCard(props: SessionCardProps): JSX.Element;
