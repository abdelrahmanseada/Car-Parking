import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchGarages } from "@/services/api";
import type { Garage } from "@/types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export function GaragesPage() {
  const navigate = useNavigate();
  const [garages, setGarages] = useState<Garage[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchGarages({ q: query });
        setGarages(result);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [query]);

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold font-heading dark:text-text-dark-on-surface">Nearby garages</h1>
        <p className="text-base text-text-muted dark:text-text-dark-on-surface/70">Discover premium parking facilities across the city with real-time availability.</p>
      </header>
      <div className="rounded-3xl bg-white p-7 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-surface-elevated-dark dark:border dark:border-slate-700/50 dark:hover:shadow-2xl dark:hover:shadow-brand/10">
        <Input label="Search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, district, or amenity" />
      </div>
      {loading && <LoadingSpinner label="Fetching garages" />}
      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-800 dark:text-red-200">
          <p className="font-medium">Failed to load garages</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}
      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2">
          {garages.map((garage) => (
              <motion.article key={garage.id} whileHover={{ y: -8, scale: 1.02 }} transition={{ duration: 0.3 }} className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg hover:shadow-2xl dark:border-slate-800 dark:bg-surface-elevated-dark dark:hover:shadow-brand/10">
                <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-brand/20 to-accent/20">
                  {garage.image && garage.image !== "" && garage.image !== "null" && garage.image !== "undefined" ? (
                    <img 
                      src={garage.image} 
                      alt={garage.name} 
                      className="absolute inset-0 w-full h-full object-cover"
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
                    <div className="absolute inset-0 flex items-center justify-center text-white/60">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                        </svg>
                        <p className="text-sm">No image available</p>
                      </div>
                    </div>
                  )}
                </div>
              <div className="flex flex-1 flex-col gap-4 p-7">
                <div>
                  <h2 className="text-2xl font-bold font-heading dark:text-text-dark-on-surface">{garage.name}</h2>
                  <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70 mt-1">{garage.location.address}</p>
                </div>
                <p className="text-text-muted dark:text-text-dark-on-surface/80">{garage.description}</p>
                <div className="flex flex-wrap gap-2 text-xs text-text-muted dark:text-text-dark-on-surface/70">
                  {garage.amenities?.map((item) => (
                    <span key={item} className="rounded-full bg-surface px-3 py-1 dark:bg-surface-dark dark:text-text-dark-on-surface/80">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-xl font-bold text-brand">${garage.pricePerHour.toFixed(2)}/h</span>
                  <div className="flex gap-3">
                    <Link to={`/garage/${garage.id}`} className="rounded-full border-2 border-brand px-5 py-2 text-sm font-semibold text-brand hover:bg-brand/10 dark:hover:bg-brand/20 transition-all hover:scale-105">
                      Details
                    </Link>
                    <Button size="sm" onClick={() => navigate(`/garage/${garage.id}/choose-floor`)}>
                      Book Now
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
