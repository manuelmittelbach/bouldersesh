import * as React from "react";

export interface MessageBubbleProps {
  /** True for the current user's messages (orange, right-aligned). */
  mine?: boolean;
  /** Timestamp shown under the bubble (mono). */
  time?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Chat bubble — orange + right for `mine`, rock-100 + left for the other person.
 * Mono timestamp underneath.
 */
export function MessageBubble(props: MessageBubbleProps): JSX.Element;
