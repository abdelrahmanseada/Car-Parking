import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchGarages } from "@/services/api";
import type { Garage } from "@/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function GaragesPage() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const result = await fetchGarages({ q: query });
        setGarages(result);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [query]);

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-heading">Nearby garages</h1>
        <p className="text-text-muted">Pick from curated smart facilities across the city.</p>
      </header>
      <div className="rounded-3xl bg-white p-6 shadow">
        <Input label="Search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, district, or amenity" />
      </div>
      {loading && <LoadingSpinner label="Fetching garages" />}
      {!loading && (
        <div className="grid gap-5 md:grid-cols-2">
          {garages.map((garage) => (
            <motion.article key={garage.id} whileHover={{ y: -6 }} className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow">
              <img src={garage.image} alt={garage.name} className="h-52 w-full object-cover" loading="lazy" />
              <div className="flex flex-1 flex-col gap-3 p-6">
                <div>
                  <h2 className="text-2xl font-heading">{garage.name}</h2>
                  <p className="text-sm text-text-muted">{garage.location.address}</p>
                </div>
                <p className="text-text-muted">{garage.description}</p>
                <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                  {garage.amenities?.map((item) => (
                    <span key={item} className="rounded-full bg-surface px-3 py-1">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-lg font-semibold text-brand">${garage.pricePerHour.toFixed(2)}/h</span>
                  <div className="flex gap-2">
                    <Link to={`/garage/${garage.id}`} className="rounded-full border border-brand px-4 py-2 text-brand">
                      Details
                    </Link>
                    <Button size="sm" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                      Book
                    </Button>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
