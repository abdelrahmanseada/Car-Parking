import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { mockPayment } from "@/services/api";
import type { PaymentIntent } from "@/types";
import { useAppContext } from "@/context/AppContext";

const methods = [
  { value: "card", label: "Card" },
  { value: "wallet", label: "Wallet" },
  { value: "cash", label: "Cash" },
];

export function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();
  const booking = (location.state as { booking?: typeof state.activeBooking } | undefined)?.booking ?? state.activeBooking;
  const [method, setMethod] = useState(methods[0].value);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  if (!booking) {
    return <p className="text-danger">No booking to pay for.</p>;
  }

  const handlePayment = async () => {
    setLoading(true);
    setStatus("");
    try {
      await mockPayment({
        bookingId: booking.id,
        amount: booking.totalPrice,
        method: method as PaymentIntent["method"],
        status: "pending",
      });
      setStatus("Payment captured. Redirecting to active tracking...");
      setTimeout(() => navigate(`/booking/active/${booking.id}`, { state: { bookingId: booking.id } }), 500);
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm text-text-muted">Step 3</p>
        <h1 className="text-3xl font-heading">Payment</h1>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 1 }} className="space-y-4 rounded-3xl bg-white p-6 shadow">
          <h2 className="text-xl font-heading">Booking summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Garage</dt>
              <dd className="font-semibold">{booking.garageId}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Slot</dt>
              <dd className="font-semibold">{booking.slotId}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Vehicle</dt>
              <dd>{booking.vehiclePlate}</dd>
            </div>
          </dl>
          <div className="rounded-2xl bg-surface p-4">
            <p className="text-sm text-text-muted">Total</p>
            <p className="text-3xl font-heading">${booking.totalPrice.toFixed(2)}</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 1 }} className="space-y-4 rounded-3xl bg-white p-6 shadow">
          <h3 className="text-xl font-heading">Payment method</h3>
          <div className="grid gap-3">
            {methods.map((item) => (
              <button
                key={item.value}
                onClick={() => setMethod(item.value)}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  method === item.value ? "border-brand bg-brand-muted/40" : "border-slate-200 bg-white"
                }`}
              >
                <span>{item.label}</span>
                {method === item.value && <span className="text-brand">Selected</span>}
              </button>
            ))}
          </div>
          <Button className="w-full" onClick={handlePayment} disabled={loading}>
            {loading ? "Processing..." : "Pay now"}
          </Button>
          {status && <p className="text-sm text-brand">{status}</p>}
        </motion.div>
      </div>
    </section>
  );
}
