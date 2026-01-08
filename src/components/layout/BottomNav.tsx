import { HomeIcon, MapIcon, UserIcon, ClockIcon } from "@heroicons/react/24/outline";
import { NavLink } from "react-router-dom";

const mobileNav = [
  { label: "Home", to: "/home", Icon: HomeIcon },
  { label: "Garages", to: "/garages", Icon: MapIcon },
  { label: "Bookings", to: "/bookings", Icon: ClockIcon },
  { label: "Profile", to: "/profile", Icon: UserIcon },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-3 z-40 mx-auto max-w-md rounded-full bg-surface-elevated/95 px-6 py-3 shadow-2xl ring-1 ring-black/5 backdrop-blur dark:bg-surface-elevated-dark/90 md:hidden">
      <ul className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
        {mobileNav.map(({ label, to, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 transition ${
                  isActive ? "text-brand" : "text-text-muted dark:text-text-dark-on-surface/60"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
