import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { fetchUserBookings } from "@/services/api";
import type { Booking } from "@/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type TabKey = "upcoming" | "history";

const statusBadgeClass: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200",
  confirmed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200",
  upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
  completed: "bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
};

const statusLabel: Record<string, string> = {
  active: "Active",
  confirmed: "Confirmed",
  upcoming: "Upcoming",
  completed: "Completed",
  cancelled: "Cancelled",
  pending: "Pending",
};

export function BookingsPage() {
  const { state } = useAppContext();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [currentBookings, setCurrentBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch bookings from API on mount and whenever component is focused/revisited
  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Clear previous data to ensure fresh fetch
        setCurrentBookings([]);
        setPastBookings([]);
        
        // Fetch from backend - it returns { current: [...], past: [...] }
        const { current, past } = await fetchUserBookings(state.user?.id);
        
        console.log("📋 [Bookings] Fetched bookings:", { current: current.length, past: past.length });
        
        // Use backend categorization directly - no filtering needed
        // Trust the backend's categorization completely
        setCurrentBookings(current || []);
        setPastBookings(past || []);
      } catch (err) {
        console.error("❌ [Bookings] Error loading bookings:", err);
        setError((err as Error).message || "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    void loadBookings();
  }, [state.user?.id, location.key]); // Re-fetch when user changes or page is revisited

  // Use backend categorization directly
  const displayed = activeTab === "upcoming" ? currentBookings : pastBookings;

  const handleCancel = (id: string) => {
    // Update local state optimistically
    setCurrentBookings((prev) => {
      const cancelled = prev.find((b) => b.id === id);
      if (cancelled) {
        // Move to past bookings with cancelled status
        setPastBookings((past) => [
          ...past,
          { ...cancelled, status: "cancelled" as const },
        ]);
      }
      return prev.filter((b) => b.id !== id);
    });
  };

  if (loading) {
    return <LoadingSpinner label="Loading bookings" />;
  }

  if (error) {
    return (
      <section className="space-y-8">
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-red-800 dark:text-red-200">
          <p className="font-medium text-lg">Failed to load bookings</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold font-heading dark:text-text-dark-on-surface">Your bookings</h1>
        <p className="text-base text-text-muted dark:text-text-dark-on-surface/70">
          Manage your reservations, view receipts, and track active sessions.
        </p>
      </header>

      <div className="inline-flex rounded-full bg-surface-elevated dark:bg-surface-elevated-dark p-1.5 shadow-lg">
        <button
          className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === "upcoming"
              ? "bg-brand text-white shadow-lg scale-105"
              : "text-text hover:bg-brand-muted/30 dark:text-text-dark-on-surface"
          }`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming
        </button>
        <button
          className={`rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === "history"
              ? "bg-brand text-white shadow-lg scale-105"
              : "text-text hover:bg-brand-muted/30 dark:text-text-dark-on-surface"
          }`}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
      </div>

      <div className="space-y-5">
        {displayed.length === 0 && (
          <p className="text-base text-text-muted dark:text-text-dark-on-surface/70">
            No bookings found in {activeTab === "upcoming" ? "Upcoming" : "History"}.
          </p>
        )}

        {displayed.map((booking) => {
          const badgeClass = statusBadgeClass[booking.status] ?? "bg-slate-200 text-slate-700";
          const badgeLabel = statusLabel[booking.status] ?? booking.status;

          return (
            <article
              key={booking.id}
              className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-white p-7 shadow-lg hover:shadow-2xl transition-all duration-300 dark:bg-surface-elevated-dark dark:border dark:border-slate-700/50 dark:hover:shadow-2xl dark:hover:shadow-brand/10"
            >
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.4em] font-semibold text-text-muted dark:text-text-dark-on-surface/70">
                  #{booking.id}
                </p>
                <h2 className="text-2xl font-bold font-heading dark:text-text-dark-on-surface">
                  {booking.place?.name || 
                   booking.place?.title || 
                   booking.garage?.name || 
                   booking.garage?.title ||
                   `Garage ${booking.garageId}`}
                </h2>
                <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">
                  Slot {booking.slotId}
                </p>
                <p className="text-xs text-text-muted dark:text-text-dark-on-surface/60">
                  {new Date(booking.date || booking.time?.start || new Date()).toLocaleString()}
                </p>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                  {badgeLabel}
                </span>
              </div>

              <div className="text-right space-y-3">
                <p className="text-3xl font-bold font-heading text-brand dark:text-brand">
                  ${(booking.totalPrice || 0).toFixed(2)}
                </p>
                <p className="text-sm font-medium text-text-muted dark:text-text-dark-on-surface/70">
                  Status: {badgeLabel}
                </p>
                <div className="flex justify-end gap-3">
                  {["upcoming", "confirmed", "active"].includes(booking.status) && (
                    <button
                      className="rounded-full border-2 border-danger px-5 py-2 text-danger hover:bg-danger/10 text-sm font-semibold transition-all hover:scale-105"
                      onClick={() => handleCancel(booking.id)}
                    >
                      Cancel booking
                    </button>
                  )}
                  <Link to={`/booking/active/${booking.id}`} className="text-brand hover:text-accent font-semibold hover:underline text-sm transition-colors">
                    View tracking
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}