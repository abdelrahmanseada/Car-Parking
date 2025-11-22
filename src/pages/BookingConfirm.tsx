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
  const selection = location.state as { garageId?: string; slotId?: string; duration?: number } | undefined;
  const [garage, setGarage] = useState<Garage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: { vehiclePlate: "AB12345", duration: String(selection?.duration ?? 2) },
  });

  useEffect(() => {
    const load = async () => {
      if (!selection?.garageId) {
        setError("Start from the garage page to make a booking.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const g = await fetchGarage(selection.garageId);
        setGarage(g);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [selection?.garageId]);

  const slot: Slot | undefined = useMemo(() => {
    if (!garage || !selection?.slotId) return undefined;
    return garage.floors?.flatMap((floor) => floor.layout ?? []).find((s) => s.id === selection.slotId);
  }, [garage, selection?.slotId]);

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
      navigate("/payment", { state: { booking } });
    } catch (err) {
      setError((err as Error).message);
    }
  });

  if (loading) {
    return <p className="text-sm text-text-muted">Loading summary...</p>;
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  if (!garage || !slot) {
    return <p className="text-danger">Select a slot before confirming.</p>;
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
