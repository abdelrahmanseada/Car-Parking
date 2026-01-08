import { useEffect, useState } from "react";
import { fetchGarages, fetchUserBookings } from "@/services/api";
import type { Garage, Booking } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function AdminDashboardPage() {
  const { state } = useAppContext();
  const [garages, setGarages] = useState<Garage[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [garageData, bookingData] = await Promise.all([fetchGarages(), fetchUserBookings(state.user?.id ?? "user-mock")]);
        setGarages(garageData);
        setBookings(bookingData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [state.user?.id]);

  if (loading) {
    return <LoadingSpinner label="Loading admin data" />;
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-red-800 dark:text-red-200">
        <p className="font-medium text-lg">Failed to load admin data</p>
        <p className="text-sm mt-2">{error}</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm text-text-muted">Admin</p>
        <h1 className="text-3xl font-heading">Operations overview</h1>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl bg-white p-6 shadow">
          <p className="text-sm text-text-muted">Garages</p>
          <p className="text-4xl font-heading">{garages.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow">
          <p className="text-sm text-text-muted">Active bookings</p>
          <p className="text-4xl font-heading">{bookings.filter((b) => b.status === "active").length}</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow">
          <p className="text-sm text-text-muted">Monthly revenue</p>
          <p className="text-4xl font-heading"></p>
        </div>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow">
        <h2 className="text-xl font-heading">Fleet utilization</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="text-text-muted">
              <th className="pb-2">Garage</th>
              <th className="pb-2">Spots</th>
              <th className="pb-2">Available</th>
              <th className="pb-2">Hourly</th>
            </tr>
          </thead>
          <tbody>
            {garages.map((garage) => (
              <tr key={garage.id} className="border-t last:border-b">
                <td className="py-3 font-medium">{garage.name}</td>
                <td className="py-3">{garage.totalSlots}</td>
                <td className="py-3">{garage.availableSlots}</td>
                <td className="py-3">/h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
