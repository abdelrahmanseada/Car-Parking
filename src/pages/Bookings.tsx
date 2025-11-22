import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchUserBookings } from "@/services/api";
import type { Booking } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function BookingsPage() {
  const { state } = useAppContext();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const list = await fetchUserBookings(state.user?.id ?? "user-mock");
      setBookings(list);
      setLoading(false);
    };
    void run();
  }, [state.user?.id]);

  if (loading) {
    return <LoadingSpinner label="Loading bookings" />;
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-heading">Your bookings</h1>
        <p className="text-text-muted">Invoices & receipts.</p>
      </header>
      <div className="space-y-4">
        {bookings.length === 0 && <p className="text-text-muted">No bookings yet. Reserve a slot from the Home tab.</p>}
        {bookings.map((booking) => (
          <article key={booking.id} className="flex flex-wrap items-center justify-between rounded-3xl bg-white p-6 shadow">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-text-muted">#{booking.id}</p>
              <h2 className="text-2xl font-heading">Garage {booking.garageId}</h2>
              <p className="text-sm text-text-muted">Slot {booking.slotId}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-heading">${booking.totalPrice.toFixed(2)}</p>
              <p className="text-sm text-text-muted">Status: {booking.status}</p>
              <Link to={`/booking/active/${booking.id}`} className="text-brand">
                View tracking
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
