import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchBookingById, fetchGarage, endBooking, fetchParkingSlot } from "@/services/api";
import type { Booking, Garage, Slot } from "@/types";
import { Button } from "@/components/ui/Button";
import { socketClient } from "@/services/socket";

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

export function ActiveBookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [garage, setGarage] = useState<Garage | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Connecting to live updates...");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [endingParking, setEndingParking] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError("No booking ID provided");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch booking directly by ID from backend
        const active = await fetchBookingById(id);
        
        if (!active) {
          throw new Error("Booking data is empty");
        }
        
        setBooking(active);
        setStatusMessage(`Booking Status: ${active.status}`);
        
        // Debug: Log booking data to see what's available
        console.log("🔍 [ActiveBooking] Booking data:", active);
        console.log("🔍 [ActiveBooking] Booking place/garage data:", (active as any).place || (active as any).garage);
        
        // Fetch garage details if we have a garage ID
        if (active.garageId) {
          try {
            const details = await fetchGarage(active.garageId);
            console.log("🔍 [ActiveBooking] Garage data:", details);
            console.log("🔍 [ActiveBooking] Garage location:", details.location);
            setGarage(details);
            
            // Fetch slot details if we have a slot ID
            if (active.slotId) {
              try {
                const slotDetails = await fetchParkingSlot(active.garageId, active.slotId);
                setSlot(slotDetails);
              } catch (slotErr) {
                console.warn("⚠️ Could not load slot details");
              }
            }
          } catch (garageErr) {
            // Don't fail the whole page if garage fetch fails
            console.warn("⚠️ Could not load garage details");
          }
        }
      } catch (err) {
        console.error("❌ Error loading booking:", err);
        const errorMessage = (err as Error).message;
        
        // Check if it's a 404 error
        if (errorMessage.includes("404") || errorMessage.includes("not found")) {
          setError(`Booking #${id} not found. It may have been cancelled or does not exist.`);
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  useEffect(() => {
    socketClient.connect();
    const unsub = socketClient.subscribe("booking:update", (payload: { status: Booking["status"]; bookingId: string }) => {
      if (payload.bookingId === booking?.id && payload.status) {
        setBooking((prev) => (prev ? { ...prev, status: payload.status } : prev));
        setStatusMessage(`Status: ${payload.status}`);
      }
    });
    return () => {
      unsub?.();
      socketClient.disconnect();
    };
  }, [booking?.id]);

  const remainingMinutes = useMemo(() => {
    // Defensive check: ensure booking and time data exist
    if (!booking || !booking.time || !booking.time.end) {
      return 0;
    }
    
    try {
      const endTime = new Date(booking.time.end).getTime();
      const now = Date.now();
      const remainingMs = endTime - now;
      return Math.max(0, Math.round(remainingMs / 60000));
    } catch (err) {
      console.error("❌ Error calculating remaining time:", err);
      return 0;
    }
  }, [booking]);

  const handleEndParking = async () => {
    if (!booking || endingParking) return;
    
    setEndingParking(true);
    setError(null);
    
    try {
      // Make PUT request to end the booking
      const updatedBooking = await endBooking(booking.id);
      
      // Only redirect on success (200 response)
      if (updatedBooking) {
        console.log("✅ [ActiveBooking] Booking ended successfully:", updatedBooking);
        navigate("/bookings");
      }
    } catch (err: any) {
      console.error("❌ [ActiveBooking] Error ending parking:", err);
      
      // Check if it's a 400 error indicating booking is already completed
      const is400Error = err?.response?.status === 400 || err?.status === 400;
      const errorMessage = err?.response?.data?.message || err?.message || "";
      const isAlreadyCompleted = is400Error && (
        errorMessage.toLowerCase().includes("already completed") ||
        errorMessage.toLowerCase().includes("already ended") ||
        errorMessage.toLowerCase().includes("already finished")
      );
      
      if (isAlreadyCompleted) {
        // Treat as success - booking is already completed, just redirect
        console.log("ℹ️ [ActiveBooking] Booking already completed, redirecting to bookings");
        navigate("/bookings");
      } else {
        // Show error for other cases
        setError(err?.response?.data?.message || err?.message || "Failed to end parking. Please try again.");
        setEndingParking(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">Loading booking details...</p>
          <p className="text-xs text-text-muted dark:text-text-dark-on-surface/50 mt-2">Booking #{id}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md text-center space-y-4">
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Error Loading Booking</h2>
            <p className="text-red-700 dark:text-red-300 mb-1">{error}</p>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">Booking ID: #{id}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => navigate('/bookings')}>
                Back to Bookings
              </Button>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md text-center space-y-4">
          <div className="rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-6">
            <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">Booking Not Found</h2>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              Could not load booking #{id}. The booking may not exist or has been deleted.
            </p>
            <Button onClick={() => navigate('/bookings')}>
              Back to Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.5em] text-brand">Live session</p>
        <h1 className="text-3xl font-heading">Booking #{booking.id}</h1>
        <p className="text-text-muted">{statusMessage}</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 1 }} className="space-y-4 rounded-3xl bg-white p-6 shadow dark:bg-surface-elevated-dark">
          <h2 className="text-xl font-heading dark:text-text-dark-on-surface">Timer</h2>
          <p className="text-5xl font-heading text-brand">{remainingMinutes}m</p>
          {booking.time?.end ? (
            <p className="text-text-muted dark:text-text-dark-on-surface/70">
              {booking.status === 'completed' ? 'Ended at' : 'Ends at'} {new Date(booking.time.end).toLocaleTimeString()}
            </p>
          ) : (
            <p className="text-text-muted dark:text-text-dark-on-surface/70">End time not available</p>
          )}
          {booking.status === 'completed' ? (
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-slate-200 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
              <span className="text-sm font-semibold">✓ Completed</span>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                void handleEndParking();
              }}
              disabled={endingParking}
            >
              {endingParking ? "Ending parking..." : "End parking"}
            </Button>
          )}
        </motion.div>
        <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 1 }} className="space-y-4 rounded-3xl bg-white p-6 shadow dark:bg-surface-elevated-dark">
          <h2 className="text-xl font-heading dark:text-text-dark-on-surface">Garage view</h2>
          {(() => {
            // Extract coordinates with fallback logic
            // Try booking.place first, then garage.location, then fallback to NY
            const bookingPlace = (booking as any)?.place;
            const bookingGarage = (booking as any)?.garage;
            
            // Try multiple sources for coordinates
            const centerLat = Number(
              bookingPlace?.lat || 
              bookingPlace?.latitude || 
              bookingGarage?.location?.lat || 
              bookingGarage?.location?.latitude ||
              bookingGarage?.lat ||
              bookingGarage?.latitude ||
              garage?.location?.lat || 
              garage?.location?.latitude ||
              0
            ) || 40.7580; // Default to NYC if 0 or invalid
            
            const centerLng = Number(
              bookingPlace?.lng || 
              bookingPlace?.longitude || 
              bookingGarage?.location?.lng || 
              bookingGarage?.location?.longitude ||
              bookingGarage?.lng ||
              bookingGarage?.longitude ||
              garage?.location?.lng || 
              garage?.location?.longitude ||
              0
            ) || -73.9855; // Default to NYC if 0 or invalid
            
            // Debug logging
            console.log("🗺️ [ActiveBooking] Map coordinates:", { centerLat, centerLng });
            console.log("🗺️ [ActiveBooking] Booking place:", bookingPlace);
            console.log("🗺️ [ActiveBooking] Booking garage:", bookingGarage);
            console.log("🗺️ [ActiveBooking] Garage state:", garage);
            
            // Validate coordinates (not 0,0 which is in the ocean)
            const isValidCoords = centerLat !== 0 && centerLng !== 0 && 
                                   !isNaN(centerLat) && !isNaN(centerLng) &&
                                   centerLat >= -90 && centerLat <= 90 &&
                                   centerLng >= -180 && centerLng <= 180;
            
            if (!isValidCoords) {
              console.warn("⚠️ [ActiveBooking] Invalid coordinates, using NYC fallback");
            }
            
            return (
              <MapContainer
                key={`map-${booking?.id || 'unknown'}-${centerLat}-${centerLng}`}
                center={[centerLat, centerLng]}
                zoom={18}
                className="h-[400px] w-full rounded-xl"
                style={{ height: '400px', width: '100%', zIndex: 0 }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <MapInitializer />
                <Marker
                  position={[centerLat, centerLng]}
                  icon={L.divIcon({
                    className: "custom-marker",
                    html: `
                      <div style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        width: 56px;
                        height: 56px;
                        border-radius: 50%;
                        background: #35C27B;
                        border: 3px solid #ffffff;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                        color: #ffffff;
                        font-weight: bold;
                        font-size: 20px;
                      ">
                        🅿️
                      </div>
                    `,
                    iconSize: [56, 56],
                    iconAnchor: [28, 28],
                  })}
                >
                  <Popup>
                    <div className="text-center">
                      <strong className="text-lg">Your Spot</strong>
                      {slot && (
                        <p className="text-brand font-semibold mt-1">Slot #{slot.number}</p>
                      )}
                      {!slot && booking.slotId && (
                        <p className="text-brand font-semibold mt-1">Slot ID: {booking.slotId}</p>
                      )}
                      <p className="text-sm text-text-muted mt-2">
                        {garage?.name || bookingGarage?.name || bookingPlace?.name || "Garage"}
                      </p>
                      <p className="text-xs text-text-muted">
                        {garage?.location?.address || bookingGarage?.location?.address || bookingPlace?.address || "Location"}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            );
          })()}
          <div className="rounded-2xl bg-surface dark:bg-surface-dark p-4 text-sm space-y-2">
            <p className="dark:text-text-dark-on-surface"><span className="font-semibold">Garage:</span> {booking.garageId || "N/A"}</p>
            <p className="dark:text-text-dark-on-surface"><span className="font-semibold">Slot:</span> {booking.slotId || "N/A"}</p>
            <p className="dark:text-text-dark-on-surface"><span className="font-semibold">Vehicle:</span> {booking.vehiclePlate || "N/A"}</p>
            <p className="dark:text-text-dark-on-surface"><span className="font-semibold">Status:</span> <span className={`font-bold ${
              booking.status === 'active' ? 'text-green-600' : 
              booking.status === 'cancelled' ? 'text-red-600' : 
              'text-yellow-600'
            }`}>{booking.status?.toUpperCase() || "UNKNOWN"}</span></p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
