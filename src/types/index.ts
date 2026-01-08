export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role?: "user" | "admin";
}

export interface GarageLocation {
  lat: number;
  lng: number;
  address: string;
  city?: string;
}

export interface Slot {
  id: string;
  number: string;
  status: "available" | "occupied" | "reserved";
  level: number;
  vehicleSize: "compact" | "standard" | "large";
  pricePerHour: number;
}

export interface Floor {
  id: string;
  name: string;
  level: number;
  totalSlots: number;
  availableSlots: number;
  layout?: Slot[];
}

export interface Garage {
  id: string;
  name: string;
  description: string;
  image?: string;
  rating?: number;
  pricePerHour: number;
  amenities?: string[];
  totalSlots: number;
  availableSlots: number;
  location: GarageLocation;
  floors?: Floor[];
}

export interface BookingTimeRange {
  start: string;
  end: string;
  durationHours: number;
}

export interface Booking {
  id: string;
  garageId: string;
  userId: string;
  slotId: string;
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
  totalPrice: number;
  vehiclePlate: string;
  time: BookingTimeRange;
  place?: {
    id: string;
    name?: string;
    title?: string;
    address?: string;
    image?: string;
    [key: string]: any;
  };
  garage?: {
    id: string;
    name?: string;
    title?: string;
    address?: string;
    image?: string;
    [key: string]: any;
  };
}

export interface PaymentIntent {
  bookingId: string;
  amount: number;
  method: "card" | "wallet" | "cash";
  status: "pending" | "paid" | "failed";
}

export interface ApiResult<T> {
  data: T;
  message?: string;
}
