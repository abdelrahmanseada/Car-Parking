import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { fetchGarages, fetchParkingSlots } from "@/services/api";
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
  const [selectedGarageSlots, setSelectedGarageSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
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

  // Capture the numeric duration value
  const selectedDuration = useMemo(() => {
    const duration = Number(durationValue ?? "2");
    return Number.isNaN(duration) ? 2 : duration;
  }, [durationValue]);

  const durationLabel = useMemo(() => {
    return `${selectedDuration} hour${selectedDuration > 1 ? "s" : ""}`;
  }, [selectedDuration]);

  // Dynamic calculation: total price = hourly rate × duration
  const totalPrice = useMemo(() => {
    if (!selectedSlot) return 0;
    return selectedSlot.pricePerHour * selectedDuration;
  }, [selectedSlot, selectedDuration]);

  // Function to handle garage selection and fetch its slots
  const handleGarageSelect = useCallback(async (garage: Garage | null) => {
    setSelectedGarage(garage);
    setSelectedSlot(null);
    setSelectedGarageSlots([]);
    
    if (!garage) {
      return;
    }
    
    // Fetch parking slots for the selected garage
    setLoadingSlots(true);
    try {
      const slots = await fetchParkingSlots(garage.id);
      setSelectedGarageSlots(slots);
    } catch (err) {
      console.error("❌ Error fetching slots:", err);
      setSelectedGarageSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const loadGarages = useCallback(async (params?: FiltersForm) => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchGarages({ q: params?.search });
      setGarages(list);
      
      // Auto-select first garage and fetch its slots
      const firstGarage = list[0] ?? null;
      if (firstGarage) {
        await handleGarageSelect(firstGarage);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [handleGarageSelect]);

  useEffect(() => {
    loadGarages();
  }, [loadGarages]);

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
        garage: selectedGarage,
        slot: selectedSlot,
        garageId: selectedGarage.id,
        slotId: selectedSlot.id,
        duration: selectedDuration,
        totalPrice: totalPrice,
      },
    });
  };

  return (
    <section className="space-y-10 pb-20">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-muted/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand">
          <img src="/favicon.png" alt="ParkSpot" className="h-4 w-4" />
          <span>ParkSpot</span>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="text-3xl font-bold font-heading text-text dark:text-text-dark-on-surface lg:text-4xl">
            Find Your Perfect Spot in Seconds
          </h1>
          <p className="text-base text-text-muted dark:text-text-dark-on-surface/70">
            Secure, convenient parking at your fingertips. Book instantly, park stress-free.
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
            Find Parking Now
          </Button>
        </div>
      </motion.form>

      {loading && <LoadingSpinner label="Loading garages" />}
      {error && <p className="text-danger dark:text-danger">{error}</p>}

      {!loading && selectedGarage && (
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <MapView garages={garages} onSelect={handleGarageSelect} selectedGarageId={selectedGarage?.id} />
            <div className="glass-card space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-heading dark:text-text-dark-on-surface">{selectedGarage.name}</h2>
                  <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70 mt-1">{selectedGarage.location.address}</p>
                </div>
                <span className="rounded-full bg-brand-muted px-5 py-2.5 font-bold text-lg text-brand">
                  ${selectedGarage.pricePerHour}/h
                </span>
              </div>
              <p className="text-text-muted dark:text-text-dark-on-surface/80">{selectedGarage.description}</p>
              <div className="flex flex-wrap gap-2 text-sm text-text-muted dark:text-text-dark-on-surface/70">
                {selectedGarage.amenities?.map((amenity) => (
                  <span key={amenity} className="rounded-full bg-surface px-3 py-1 dark:bg-surface-dark dark:text-text-dark-on-surface/80">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div className="glass-card space-y-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <header className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">Selected duration</p>
                <h3 className="text-xl font-bold dark:text-text-dark-on-surface">{durationLabel}</h3>
              </div>
              <Button variant="secondary" disabled={!selectedSlot} onClick={handleBookNow}>
                {selectedSlot ? "Reserve My Spot" : "Select a slot"}
              </Button>
            </header>
            
            {loadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand mx-auto mb-3"></div>
                  <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">Loading parking slots...</p>
                </div>
              </div>
            ) : selectedGarageSlots.length > 0 ? (
              <ParkingLayout
                slots={selectedGarageSlots}
                selectedSlotId={selectedSlot?.id}
                onSelect={(slot) => setSelectedSlot(slot)}
                selectedDuration={selectedDuration}
              />
            ) : (
              <div className="rounded-2xl bg-surface/50 dark:bg-surface-dark/50 p-8 text-center">
                <p className="text-text-muted dark:text-text-dark-on-surface/70">No parking slots available for this garage.</p>
              </div>
            )}
            
            {selectedSlot && (
              <div className="rounded-2xl bg-brand-muted/40 p-6 text-text dark:bg-brand-muted/20 dark:text-text-dark-on-surface dark:border dark:border-brand/30 shadow-lg">
                <p className="text-sm font-medium text-text-muted dark:text-text-dark-on-surface/70">Selected Slot</p>
                <p className="text-3xl font-bold font-heading dark:text-text-dark-on-surface mt-1">#{selectedSlot.number}</p>
                <div className="mt-3 space-y-1">
                  <p className="text-lg font-semibold text-brand dark:text-brand">
                    Total: ${totalPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">
                    ({selectedDuration} {selectedDuration === 1 ? "hour" : "hours"} × ${selectedSlot.pricePerHour.toFixed(2)}/h)
                  </p>
                </div>
              </div>
            )}
            {ctaMessage && <p className="rounded-2xl bg-danger/10 p-3 text-sm text-danger dark:bg-danger/20 dark:text-danger">{ctaMessage}</p>}
          </motion.div>
        </div>
      )}

      {!loading && garages.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 mt-12">
          <h3 className="text-2xl font-bold font-heading dark:text-text-dark-on-surface">Recommended garages</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {garages.map((garage) => (
                <article
                  key={garage.id}
                  className={`glass-card flex gap-5 border border-transparent transition-all hover:border-brand hover:scale-[1.02] cursor-pointer dark:border-slate-700/50 ${
                    selectedGarage?.id === garage.id ? "border-brand shadow-2xl" : ""
                  }`}
                >
                  <div className="relative h-32 w-44 flex-shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-brand/30 to-accent/30 shadow-md">
                  {garage.image && garage.image !== "" && garage.image !== "null" && garage.image !== "undefined" ? (
                    <img
                      src={garage.image}
                      alt={garage.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ zIndex: 1 }}
                      loading="lazy"
                      onError={(event) => {
                        // Try fallback image silently
                        if (event.currentTarget.src !== window.location.origin + "/images/parking-lot.png") {
                          event.currentTarget.src = "/images/parking-lot.png";
                        } else {
                          event.currentTarget.style.display = "none";
                        }
                      }}
                    />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/60 text-xs p-2">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto mb-1 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                          </svg>
                          <p className="text-xs">No image</p>
                        </div>
                      </div>
                    )}
                  </div>
                <div className="flex flex-1 flex-col justify-between py-1">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold dark:text-text-dark-on-surface">{garage.name}</h4>
                      <span className="text-brand font-bold text-lg">${garage.pricePerHour}/h</span>
                    </div>
                    <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">{garage.location.address}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-muted dark:text-text-dark-on-surface/70">
                    <span>{garage.availableSlots} spots available</span>
                    <Button variant="ghost" size="sm" onClick={() => handleGarageSelect(garage)}>
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


