import { NavLink } from "react-router-dom";
import type { ToastMessage } from "@/components/ui/Toast";

const navItems = [
  { label: "Home", to: "/home" },
  { label: "Garages", to: "/garages" },
  { label: "Bookings", to: "/bookings" },
  { label: "Profile", to: "/profile" },
];

interface TopbarProps {
  onToast?: (toast: ToastMessage) => void;
}

export function Topbar({ onToast }: TopbarProps) {
  return (
    <header className="glass-card relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 blur-3xl" aria-hidden>
        <div className="h-32 w-32 rounded-full bg-accent/60" />
      </div>
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-muted/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand">
            <img src="/favicon.png" alt="ParkSpot" className="h-4 w-4" />
            <span>ParkSpot</span>
          </div>
          <h1 className="mt-3 text-3xl font-heading text-text dark:text-text-dark-on-surface">
            ParkSpot: Simplifying Urban Mobility
          </h1>
          <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">
            Premium parking locations with real-time availability and instant booking.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 text-sm font-medium">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition ${
                  isActive
                    ? "bg-gradient-to-r from-brand to-accent text-white shadow-lg"
                    : "bg-surface-elevated/70 text-text shadow dark:bg-surface-elevated-dark/70 dark:text-text-dark-on-surface"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  );
}
