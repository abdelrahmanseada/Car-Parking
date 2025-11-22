import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchGarage } from "@/services/api";
import type { Garage } from "@/types";
import { MapView } from "@/components/map/MapView";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function GarageDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [garage, setGarage] = useState<Garage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await fetchGarage(id);
        setGarage(data);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [id]);

  if (loading) {
    return <LoadingSpinner label="Loading garage" />;
  }

  if (!garage) {
    return <p className="text-danger">Garage not found.</p>;
  }

  return (
    <section className="space-y-6">
      <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <p className="text-sm uppercase tracking-[0.5em] text-brand">garage</p>
        <h1 className="text-4xl font-heading">{garage.name}</h1>
        <p className="text-text-muted">{garage.description}</p>
      </motion.header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4">
          <img src={garage.image} alt={garage.name} className="h-80 w-full rounded-3xl object-cover" loading="lazy" />
          <MapView garages={[garage]} selectedGarageId={garage.id} />
        </div>
        <div className="space-y-4 rounded-3xl bg-white p-6 shadow">
          <div>
            <h2 className="text-2xl font-heading">Amenities</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-text-muted">
              {garage.amenities?.map((item) => (
                <span key={item} className="rounded-full bg-surface px-3 py-1">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-heading">Floors</h3>
            <ul className="mt-2 space-y-2">
              {garage.floors?.map((floor) => (
                <li key={floor.id} className="flex items-center justify-between rounded-2xl bg-surface px-4 py-3">
                  <div>
                    <p className="font-semibold">{floor.name}</p>
                    <p className="text-sm text-text-muted">{floor.availableSlots} / {floor.totalSlots} available</p>
                  </div>
                  <Button size="sm" onClick={() => navigate(`/garage/${id}/choose-floor`, { state: { floorId: floor.id } })}>
                    View slots
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-brand text-white p-5">
            <p className="text-sm uppercase tracking-[0.3em]">Rate</p>
            <p className="text-3xl font-heading">${garage.pricePerHour}/hour</p>
            <Button variant="secondary" className="mt-4" onClick={() => navigate(`/garage/${id}/choose-floor`)}>
              Reserve a slot
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
