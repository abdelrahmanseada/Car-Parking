import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchActiveBooking, fetchGarage, cancelBooking } from "@/services/api";
import type { Booking, Garage } from "@/types";
import { MapView } from "@/components/map/MapView";
import { Button } from "@/components/ui/Button";
import { socketClient } from "@/services/socket";

export function ActiveBookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [garage, setGarage] = useState<Garage | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Connecting to live updates...");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const active = await fetchActiveBooking(id);
      setBooking(active);
      setStatusMessage("Active booking");
      const details = await fetchGarage(active.garageId);
      setGarage(details);
    };
    void load();
  }, [id]);

  useEffect(() => {
    socketClient.connect();
    const unsub = socketClient.subscribe("booking:update", (payload: { status: Booking["status"]; bookingId: string }) => {
      if (payload.bookingId === booking?.id && payload.status) {
        setBooking((prev) => (prev ? { ...prev, status: payload.status } : prev));
        setStatusMessage(`Status: ${payload.status}`);
      }
    });
    return () => {
      unsub?.();
      socketClient.disconnect();
    };
  }, [booking?.id]);

  const remainingMinutes = useMemo(() => {
    if (!booking?.time) return 0;
    const end = new Date(booking.time.end).getTime();
    return Math.max(0, Math.round((end - Date.now()) / 60000));
  }, [booking?.time]);

  const handleEndParking = async () => {
    if (!booking) return;
    await cancelBooking(booking.id);
    navigate("/bookings");
  };

  if (!booking) {
    return <p className="text-text-muted">Loading booking...</p>;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.5em] text-brand">Live session</p>
        <h1 className="text-3xl font-heading">Booking #{booking.id}</h1>
        <p className="text-text-muted">{statusMessage}</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 1 }} className="space-y-4 rounded-3xl bg-white p-6 shadow">
          <h2 className="text-xl font-heading">Timer</h2>
          <p className="text-5xl font-heading text-brand">{remainingMinutes}m</p>
          <p className="text-text-muted">Ends at {new Date(booking.time.end).toLocaleTimeString()}</p>
          <Button
            variant="secondary"
            onClick={() => {
              void handleEndParking();
            }}
          >
            End parking
          </Button>
        </motion.div>
        <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 1 }} className="space-y-4 rounded-3xl bg-white p-6 shadow">
          <h2 className="text-xl font-heading">Garage view</h2>
          {garage ? <MapView garages={[garage]} selectedGarageId={garage.id} /> : <p className="text-sm text-text-muted">Loading map...</p>}
          <div className="rounded-2xl bg-surface p-4 text-sm">
            <p>Garage: {booking.garageId}</p>
            <p>Slot: {booking.slotId}</p>
            <p>Vehicle: {booking.vehiclePlate}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
