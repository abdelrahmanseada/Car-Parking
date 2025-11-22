import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { fetchGarages } from "@/services/api";
import type { Garage, Slot } from "@/types";
import { MapView } from "@/components/map/MapView";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ParkingLayout } from "@/components/ParkingLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const filtersSchema = z.object({
  search: z.string().optional(),
  duration: z.string().default("2"),
});

type FiltersForm = z.infer<typeof filtersSchema>;

export function HomePage() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ctaMessage, setCtaMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
  } = useForm<FiltersForm>({
    resolver: zodResolver(filtersSchema),
    defaultValues: { duration: "2" },
  });

  const durationValue = watch("duration");

  const durationLabel = useMemo(() => {
    const duration = Number(durationValue);
    if (Number.isNaN(duration)) return "2 hours";
    return `${duration} hour${duration > 1 ? "s" : ""}`;
  }, [durationValue]);

  const totalPrice = useMemo(() => {
    if (!selectedSlot) return 0;
    const duration = Number(durationValue ?? 1);
    return selectedSlot.pricePerHour * (Number.isNaN(duration) ? 1 : duration);
  }, [selectedSlot, durationValue]);

  const loadGarages = useCallback(async (params?: FiltersForm) => {
    try {
      setLoading(true);
      const list = await fetchGarages({ q: params?.search });
      setGarages(list);
      setSelectedGarage((prev) => list.find((garage) => garage.id === prev?.id) ?? list[0] ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGarages();
  }, [loadGarages]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedGarage?.id]);

  const onSubmit = handleSubmit((values) => {
    void loadGarages(values);
  });

  const handleBookNow = () => {
    if (!selectedGarage) {
      setCtaMessage("Choose a garage to continue.");
      return;
    }
    if (!selectedSlot) {
      setCtaMessage("Tap an available slot to continue.");
      return;
    }
    setCtaMessage(null);
    navigate("/booking/confirm", {
      state: {
        garageId: selectedGarage.id,
        slotId: selectedSlot.id,
        duration: Number(durationValue ?? 1),
      },
    });
  };

  return (
    <section className="space-y-8 pb-16">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-muted/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand">
          live beta
          <span className="text-[10px] font-normal normal-case text-brand-dark">v2</span>
        </p>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="text-3xl font-heading text-text dark:text-text-dark-on-surface lg:text-4xl">
            Reserve curated garages with cinematic guidance
          </h1>
          <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">
            Tap a slot, preview the floor, and check-in in under a minute.
          </p>
        </div>
      </motion.header>

      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card grid gap-4 md:grid-cols-4"
      >
        <Input label="Search a location" placeholder="Downtown" {...register("search")} />
        <Select
          label="Duration"
          {...register("duration")}
          options={[
            { value: "1", label: "1 hour" },
            { value: "2", label: "2 hours" },
            { value: "3", label: "3 hours" },
            { value: "6", label: "6 hours" },
          ]}
        />
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Search
          </Button>
        </div>
      </motion.form>

      {loading && <LoadingSpinner label="Loading garages" />}
      {error && <p className="text-danger">{error}</p>}

      {!loading && selectedGarage && (
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <MapView garages={garages} onSelect={setSelectedGarage} selectedGarageId={selectedGarage?.id} />
            <div className="glass-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-heading">{selectedGarage.name}</h2>
                  <p className="text-sm text-text-muted">{selectedGarage.location.address}</p>
                </div>
                <span className="rounded-full bg-brand-muted px-4 py-2 font-semibold text-brand">
                  ${selectedGarage.pricePerHour}/h
                </span>
              </div>
              <p className="text-text-muted">{selectedGarage.description}</p>
              <div className="flex flex-wrap gap-2 text-sm text-text-muted">
                {selectedGarage.amenities?.map((amenity) => (
                  <span key={amenity} className="rounded-full bg-surface px-3 py-1">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div className="glass-card space-y-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <header className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Selected duration</p>
                <h3 className="text-xl font-semibold">{durationLabel}</h3>
              </div>
              <Button variant="secondary" disabled={!selectedSlot} onClick={handleBookNow}>
                {selectedSlot ? "Book now" : "Select a slot"}
              </Button>
            </header>
            <ParkingLayout
              slots={selectedGarage.floors?.[0]?.layout ?? []}
              selectedSlotId={selectedSlot?.id}
              onSelect={(slot) => setSelectedSlot(slot)}
            />
            {selectedSlot && (
              <div className="rounded-2xl bg-brand-muted/40 p-5 text-text">
                <p className="text-sm text-text-muted">Selected Slot</p>
                <p className="text-2xl font-heading">#{selectedSlot.number}</p>
                <p className="text-text-muted">${totalPrice.toFixed(2)} total</p>
              </div>
            )}
            {ctaMessage && <p className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">{ctaMessage}</p>}
          </motion.div>
        </div>
      )}

      {!loading && garages.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h3 className="text-xl font-heading">Recommended garages</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {garages.map((garage) => (
              <article
                key={garage.id}
                className={`glass-card flex gap-4 border border-transparent transition hover:border-brand ${
                  selectedGarage?.id === garage.id ? "border-brand" : ""
                }`}
              >
                <div className="relative h-28 w-40 overflow-hidden rounded-2xl bg-gradient-to-br from-brand/30 to-accent/30">
                  <img
                    src={garage.image}
                    alt={garage.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.visibility = "hidden";
                    }}
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">{garage.name}</h4>
                      <span className="text-brand">${garage.pricePerHour}/h</span>
                    </div>
                    <p className="text-sm text-text-muted">{garage.location.address}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-muted">
                    <span>{garage.availableSlots} spots available</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedGarage(garage)}>
                      Select
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}


