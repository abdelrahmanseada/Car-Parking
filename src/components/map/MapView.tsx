import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Garage } from "@/types";

interface MapViewProps {
  garages: Garage[];
  onSelect?: (garage: Garage) => void;
  selectedGarageId?: string;
}

const createMarkerIcon = (isActive: boolean, price: number, available: number) =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        width:64px;
        border-radius:24px;
        padding:6px;
        border:2px solid ${isActive ? "#35C27B" : "#ffffff"};
        background:${isActive ? "#35C27B" : "#ffffff"};
        color:${isActive ? "#ffffff" : "#0B1D2C"};
        box-shadow:0 10px 25px rgba(0,0,0,0.15);
      ">
        <span style="font-size:12px;font-weight:600;">$${price}/h</span>
        <span style="font-size:10px;opacity:0.8;">${available} free</span>
      </div>
    `,
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  });

function FitBounds({ garages }: { garages: Garage[] }) {
  const map = useMap();
  useEffect(() => {
    if (!garages.length) return;
    const bounds = L.latLngBounds(garages.map((garage) => [garage.location.lat, garage.location.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [garages, map]);
  return null;
}

export function MapView({ garages, onSelect, selectedGarageId }: MapViewProps) {
  const hasGarages = garages.length > 0;
  const center = useMemo(() => {
    if (!hasGarages) return { lat: 23.8103, lng: 90.4125 };
    return garages[0].location;
  }, [garages, hasGarages]);

  if (!hasGarages) {
    return (
      <div className="flex h-[420px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-brand-muted bg-white text-center text-sm text-text-muted">
        <p className="font-semibold text-text">Map preview unavailable</p>
        <p className="max-w-sm">Add garages to preview their positions on the city map.</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      className="h-[420px] w-full overflow-hidden rounded-3xl"
      scrollWheelZoom={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      <FitBounds garages={garages} />
      {garages.map((garage) => (
        <Marker
          key={garage.id}
          position={[garage.location.lat, garage.location.lng]}
          icon={createMarkerIcon(garage.id === selectedGarageId, garage.pricePerHour, garage.availableSlots)}
          eventHandlers={{
            click: () => onSelect?.(garage),
          }}
        >
          <Popup>
            <strong>{garage.name}</strong>
            <p className="text-sm text-text-muted">
              ${garage.pricePerHour}/h Â· {garage.availableSlots} spots free
            </p>
            <button className="text-brand underline" type="button" onClick={() => onSelect?.(garage)}>
              View garage
            </button>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
