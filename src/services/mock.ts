import type { Booking, Floor, Garage, Slot } from "@/types";
import heroOne from "@/assets/Down-town.jpeg";
import heroTwo from "@/assets/Air-Port.jpeg";
import heroThree from "@/assets/landing-3.jpg";

const slots: Slot[] = Array.from({ length: 12 }).map((_, index) => ({
  id: `slot-${index + 1}`,
  number: `${index + 1}`,
  status: index % 3 === 0 ? "occupied" : "available",
  level: 1,
  vehicleSize: "standard",
  pricePerHour: 5 + (index % 4),
}));

const floors: Floor[] = [
  {
    id: "floor-a",
    name: "Ground Floor",
    level: 0,
    totalSlots: slots.length,
    availableSlots: slots.filter((s) => s.status === "available").length,
    layout: slots,
  },
  {
    id: "floor-b",
    name: "Second Floor",
    level: 1,
    totalSlots: slots.length,
    availableSlots: slots.filter((s) => s.status === "available").length - 2,
    layout: slots.map((slot, idx) => ({
      ...slot,
      id: `${slot.id}-b`,
      level: 2,
      status: idx % 4 === 1 ? "occupied" : "available",
    })),
  },
];

export const garagesMock: Garage[] = [
  {
    id: "garage-1",
    name: "Downtown Eco Park",
    description: "Secure multi-level parking with EV charging and concierge.",
    pricePerHour: 6,
    amenities: ["CCTV", "EV", "Valet"],
    totalSlots: 120,
    availableSlots: 48,
    rating: 4.6,
    image: heroOne,
    location: { lat: 23.8103, lng: 90.4125, address: "12 West Park St" },
    floors,
  },
  {
    id: "garage-2",
    name: "Airport Express Parking",
    description: "Best place to keep your car before a flight.",
    pricePerHour: 8,
    amenities: ["24/7", "Shuttle"],
    totalSlots: 80,
    availableSlots: 20,
    rating: 4.2,
    image: heroTwo,
    location: { lat: 23.8203, lng: 90.4225, address: "Airport Rd" },
    floors,
  },
  {
    id: "garage-3",
    name: "Harbor Panorama Parking",
    description: "Rooftop views, EV superchargers, and luggage assistance.",
    pricePerHour: 7,
    amenities: ["Rooftop", "EV", "Concierge"],
    totalSlots: 150,
    availableSlots: 72,
    rating: 4.8,
    image: heroThree,
    location: { lat: 23.799, lng: 90.406, address: "Harbor Link Road" },
    floors,
  },
];

export const bookingsMock: Booking[] = [
  {
    id: "booking-1",
    garageId: "garage-1",
    userId: "user-1",
    slotId: "slot-1",
    status: "active",
    totalPrice: 18,
    vehiclePlate: "ABX-9080",
    time: {
      start: new Date().toISOString(),
      end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      durationHours: 2,
    },
  },
];
