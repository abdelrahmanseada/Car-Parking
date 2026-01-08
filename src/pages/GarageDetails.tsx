import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchGarage } from "@/services/api";
import type { Garage } from "@/types";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Fix for Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to ensure map tiles load correctly
function MapInitializer() {
  const map = useMap();
  useEffect(() => {
    // Force map to invalidate size and refresh tiles
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}

export function GarageDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [garage, setGarage] = useState<Garage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const data = await fetchGarage(id);
        console.log("🔍 [GarageDetails] Garage data:", data);
        console.log("🔍 [GarageDetails] Garage location:", data.location);
        setGarage(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [id]);

  if (loading) {
    return <LoadingSpinner label="Loading garage" />;
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-red-800 dark:text-red-200">
        <p className="font-medium text-lg">Failed to load garage</p>
        <p className="text-sm mt-2">{error}</p>
        <button onClick={() => navigate('/garages')} className="mt-4 text-sm underline">
          Back to garages
        </button>
      </div>
    );
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
          <div className="relative h-80 w-full overflow-hidden rounded-3xl bg-gradient-to-br from-brand/20 to-accent/20 shadow-lg">
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
              <div className="absolute inset-0 flex items-center justify-center text-white/70 p-8">
                <div className="text-center">
                  <svg className="w-24 h-24 mx-auto mb-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-lg font-semibold">No image available</p>
                  <p className="text-sm mt-1 opacity-75">{garage.name}</p>
                </div>
              </div>
            )}
          </div>
          {(() => {
            // Extract coordinates with fallback logic
            // Parse as numbers and fallback to NYC if invalid
            const lat = Number(
              garage.location?.lat || 
              garage.location?.latitude ||
              (garage as any).lat ||
              (garage as any).latitude ||
              0
            ) || 40.7580; // Default to NYC if 0 or invalid
            
            const lng = Number(
              garage.location?.lng || 
              garage.location?.longitude ||
              (garage as any).lng ||
              (garage as any).longitude ||
              0
            ) || -73.9855; // Default to NYC if 0 or invalid
            
            // Debug logging
            console.log("🗺️ [GarageDetails] Map coordinates:", { lat, lng });
            console.log("🗺️ [GarageDetails] Garage location object:", garage.location);
            
            // Validate coordinates (not 0,0 which is in the ocean)
            const isValidCoords = lat !== 0 && lng !== 0 && 
                                   !isNaN(lat) && !isNaN(lng) &&
                                   lat >= -90 && lat <= 90 &&
                                   lng >= -180 && lng <= 180;
            
            if (!isValidCoords) {
              console.warn("⚠️ [GarageDetails] Invalid coordinates, using NYC fallback");
            }
            
            return (
              <div className="h-[300px] w-full rounded-xl overflow-hidden">
                <MapContainer
                  key={`map-${garage.id}-${lat}-${lng}`}
                  center={[lat, lng]}
                  zoom={15}
                  className="h-full w-full"
                  style={{ height: '100%', width: '100%', zIndex: 0 }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  <MapInitializer />
                  <Marker
                    position={[lat, lng]}
                    icon={L.divIcon({
                      className: "custom-marker",
                      html: `
                        <div style="
                          display: flex;
                          flex-direction: column;
                          align-items: center;
                          justify-content: center;
                          width: 48px;
                          height: 48px;
                          border-radius: 50%;
                          background: #35C27B;
                          border: 3px solid #ffffff;
                          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                          color: #ffffff;
                          font-weight: bold;
                          font-size: 18px;
                        ">
                          🅿️
                        </div>
                      `,
                      iconSize: [48, 48],
                      iconAnchor: [24, 24],
                    })}
                  >
                    <Popup>
                      <div className="text-center">
                        <strong className="text-lg">{garage.name}</strong>
                        <p className="text-sm text-text-muted mt-1">{garage.location?.address || "Location"}</p>
                        <p className="text-xs text-text-muted mt-1">${garage.pricePerHour}/hour</p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            );
          })()}
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
