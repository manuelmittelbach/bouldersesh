import * as React from "react";

export interface BottomNavItem {
  /** Stable key — compared against `active`. */
  key: string;
  label: string;
  /** Icon node (Lucide / inline svg). */
  icon: React.ReactNode;
  /** Show an unread dot. */
  badge?: boolean;
}

export interface BottomNavProps {
  items: BottomNavItem[];
  /** Key of the active tab. */
  active: string;
  onSelect?: (key: string) => void;
  style?: React.CSSProperties;
}

/**
 * Fixed bottom tab bar — Home / Chats / Profil. Active tab orange, rest muted.
 */
export function BottomNav(props: BottomNavProps): JSX.Element;
