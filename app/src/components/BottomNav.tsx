import { NavLink } from "react-router-dom";
import { Home, MessageCircle, User } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/chats", icon: MessageCircle, label: "Chats", end: false },
  { to: "/profile", icon: User, label: "Profil", end: false },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-md bg-rock-0 border-t border-rock-100 shadow-nav px-6 pt-2 pb-6">
      <div className="flex items-center justify-around">
        {items.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 transition-colors ease-out",
                isActive ? "text-brand-500" : "text-rock-400",
              )
            }
          >
            <Icon className="w-6 h-6" />
            <span className="text-[11px] font-semibold tracking-[-0.01em]">
              {label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
