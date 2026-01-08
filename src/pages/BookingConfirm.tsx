import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchGarage, createBooking } from "@/services/api";
import type { Garage, Slot } from "@/types";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useAppContext } from "@/context/AppContext";

const bookingFormSchema = z.object({
  vehiclePlate: z.string().min(3, "Plate required"),
  duration: z.string().min(1),
});

type BookingForm = z.infer<typeof bookingFormSchema>;

export function BookingConfirmPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  
  const selection = location.state as { 
    garage?: Garage; 
    slot?: Slot; 
    garageId?: string; 
    slotId?: string; 
    duration?: number;
    totalPrice?: number;
  } | undefined;
  
  const [garage, setGarage] = useState<Garage | null>(selection?.garage || null);
  const [slot, setSlot] = useState<Slot | null>(selection?.slot || null);
  const [loading, setLoading] = useState(!selection?.garage);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: { 
      vehiclePlate: "AB12345", 
      duration: String(selection?.duration ?? 2) 
    },
  });

  useEffect(() => {
    const load = async () => {
      // If we already have garage and slot from state, no need to fetch
      if (selection?.garage && selection?.slot) {
        setGarage(selection.garage);
        setSlot(selection.slot);
        setLoading(false);
        return;
      }
      
      // Fallback: fetch garage if only ID was passed
      if (!selection?.garageId) {
        setError("Please select a garage and slot first.");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const g = await fetchGarage(selection.garageId);
        setGarage(g);
        
        // Try to find slot in garage floors (legacy fallback)
        if (selection?.slotId) {
          const foundSlot = g.floors?.flatMap((floor) => floor.layout ?? []).find((s) => s.id === selection.slotId);
          if (foundSlot) {
            setSlot(foundSlot);
          } else {
            setError("Selected slot not found. Please select again.");
          }
        }
      } catch (err) {
        console.error("❌ Error fetching garage:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [selection?.garageId, selection?.slotId]);

  const duration = Number(watch("duration"));
  const totalPrice = slot ? slot.pricePerHour * (Number.isNaN(duration) ? 1 : duration) : 0;

  const onSubmit = handleSubmit(async (values) => {
    if (!garage || !slot || !selection?.garageId) return;
    setError(null);
    try {
      const booking = await createBooking({
        garageId: garage.id,
        slotId: slot.id,
        userId: state.user?.id ?? "guest",
        vehiclePlate: values.vehiclePlate,
        totalPrice,
        time: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + Number(values.duration) * 60 * 60 * 1000).toISOString(),
          durationHours: Number(values.duration),
        },
      });
      dispatch({ type: "SET_BOOKING", payload: booking });
      navigate("/payment", { 
        state: { 
          booking,
          totalPrice,
          garage,
          slot,
          duration: Number(values.duration),
        } 
      });
    } catch (err) {
      setError((err as Error).message);
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !garage || !slot) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md text-center space-y-4">
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Booking Data Missing</h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error || "Please select a garage and slot before confirming your booking."}
            </p>
            <Button onClick={() => navigate("/")}>
              Go Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-text-muted">Review and confirm</p>
        <h1 className="text-3xl font-heading">{garage.name}</h1>
      </header>
      <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 1 }} className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-4 rounded-3xl bg-white p-6 shadow">
          <h2 className="text-xl font-heading">Reservation details</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-text-muted">Slot</dt>
              <dd className="text-lg font-semibold">#{slot.number}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Level</dt>
              <dd className="text-lg font-semibold">{slot.level + 1}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Garage address</dt>
              <dd>{garage.location.address}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Hourly rate</dt>
              <dd className="text-lg font-semibold">${slot.pricePerHour.toFixed(2)}</dd>
            </div>
          </dl>
        </div>
        <form className="space-y-4 rounded-3xl bg-white p-6 shadow" onSubmit={onSubmit}>
          <h3 className="text-xl font-heading">Driver info</h3>
          <Input label="Vehicle plate" {...register("vehiclePlate") } error={errors.vehiclePlate?.message} />
          <Select
            label="Duration"
            {...register("duration")}
            options={[
              { value: "1", label: "1 hour" },
              { value: "2", label: "2 hours" },
              { value: "4", label: "4 hours" },
              { value: "6", label: "6 hours" },
            ]}
            error={errors.duration?.message}
          />
          <div className="rounded-2xl bg-surface p-4">
            <p className="text-sm text-text-muted">Estimated total</p>
            <p className="text-3xl font-heading">${totalPrice.toFixed(2)}</p>
          </div>
          {error && <p className="text-danger">{error}</p>}
          <Button type="submit" className="w-full">
            Continue to payment
          </Button>
        </form>
      </motion.div>
    </section>
  );
}
