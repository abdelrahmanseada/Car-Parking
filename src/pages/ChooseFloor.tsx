import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchFloors, fetchGarage } from "@/services/api";
import type { Floor, Garage, Slot } from "@/types";
import { ParkingLayout } from "@/components/ParkingLayout";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function ChooseFloorPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [garage, setGarage] = useState<Garage | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const [garageData, floorsData] = await Promise.all([fetchGarage(id), fetchFloors(id)]);
        setGarage(garageData);
        setFloors(floorsData);
        setSelectedFloorId((location.state as { floorId?: string })?.floorId ?? floorsData[0]?.id ?? null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [id, location.state]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedFloorId]);

  const selectedFloor = useMemo(() => floors.find((floor) => floor.id === selectedFloorId) ?? null, [floors, selectedFloorId]);

  const handleContinue = () => {
    if (!garage || !selectedSlot) return;
    
    navigate("/booking/confirm", {
      state: {
        garage: garage,
        slot: selectedSlot,
        garageId: garage.id,
        slotId: selectedSlot.id,
        floorId: selectedFloor?.id,
      },
    });
  };

  if (loading) {
    return <LoadingSpinner label="Loading floor map" />;
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-red-800 dark:text-red-200">
        <p className="font-medium text-lg">Failed to load floor data</p>
        <p className="text-sm mt-2">{error}</p>
        <button onClick={() => navigate('/garages')} className="mt-4 text-sm underline">
          Back to garages
        </button>
      </div>
    );
  }

  if (!garage || !selectedFloor) {
    return <p className="text-danger">No floor data available.</p>;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm text-text-muted">Choose a level in {garage.name}</p>
        <h1 className="text-3xl font-heading">{selectedFloor.name}</h1>
      </header>
      <div className="flex flex-wrap gap-3">
        {floors.map((floor) => {
          const isActive = floor.id === selectedFloorId;
          return (
            <button
              key={floor.id}
              onClick={() => setSelectedFloorId(floor.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive ? "bg-brand text-white" : "bg-surface text-text hover:bg-brand-muted hover:text-brand"
              }`}
            >
              Level {floor.level + 1}
            </button>
          );
        })}
      </div>
      <motion.div initial={{ opacity: 0.8 }} animate={{ opacity: 1 }} className="rounded-3xl bg-white p-6 shadow">
        <ParkingLayout slots={selectedFloor.layout ?? []} selectedSlotId={selectedSlot?.id} onSelect={setSelectedSlot} />
      </motion.div>
      <div className="flex flex-col gap-2 rounded-3xl bg-brand text-white p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em]">Selected slot</p>
          <p className="text-3xl font-heading">{selectedSlot ? `#${selectedSlot.number}` : "Pick a slot"}</p>
        </div>
        <Button variant="secondary" disabled={!selectedSlot} onClick={handleContinue}>
          Continue to summary
        </Button>
      </div>
    </section>
  );
}
