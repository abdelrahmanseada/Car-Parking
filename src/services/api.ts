import axios from "axios";
import type { ApiResult, Booking, Floor, Garage, PaymentIntent, Slot, User } from "@/types";
import { bookingsMock, garagesMock } from "./mock";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "false").toLowerCase() === "true";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message ?? error.message ?? "Unknown error";
    return Promise.reject(new Error(message));
  },
);

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchGarages(params?: {
  lat?: number;
  lng?: number;
  q?: string;
  filters?: string;
}): Promise<Garage[]> {
  if (USE_MOCK) {
    await delay();
    if (!params?.q) return garagesMock;
    return garagesMock.filter((garage) =>
      garage.name.toLowerCase().includes(params.q?.toLowerCase() ?? ""),
    );
  }
  const { data } = await api.get<ApiResult<Garage[]>>("/api/garages", { params });
  return data.data;
}

export async function fetchGarage(id: string): Promise<Garage> {
  if (USE_MOCK) {
    await delay();
    const match = garagesMock.find((garage) => garage.id === id);
    if (!match) {
      throw new Error("Garage not found");
    }
    return match;
  }
  const { data } = await api.get<ApiResult<Garage>>(`/api/garages/${id}`);
  return data.data;
}

export async function fetchFloors(garageId: string): Promise<Floor[]> {
  if (USE_MOCK) {
    await delay();
    const garage = garagesMock.find((g) => g.id === garageId);
    if (!garage?.floors) {
      throw new Error("Floors unavailable");
    }
    return garage.floors;
  }
  const { data } = await api.get<ApiResult<Floor[]>>(`/api/garages/${garageId}/floors`);
  return data.data;
}

export async function fetchSlots(floorId: string): Promise<Slot[]> {
  if (USE_MOCK) {
    await delay();
    const floor = garagesMock.flatMap((g) => g.floors ?? []).find((f) => f.id === floorId);
    if (!floor?.layout) {
      throw new Error("Slots unavailable");
    }
    return floor.layout;
  }
  const { data } = await api.get<ApiResult<Slot[]>>(`/api/floors/${floorId}/slots`);
  return data.data;
}

export async function createBooking(payload: Partial<Booking>): Promise<Booking> {
  if (USE_MOCK) {
    await delay();
    const booking: Booking = {
      id: `mock-${Date.now()}`,
      status: "confirmed",
      totalPrice: payload.totalPrice ?? 0,
      userId: payload.userId ?? "user-mock",
      garageId: payload.garageId ?? garagesMock[0].id,
      slotId: payload.slotId ?? "slot-1",
      vehiclePlate: payload.vehiclePlate ?? "TEMP",
      time:
        payload.time ??
        ({
          start: new Date().toISOString(),
          end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          durationHours: 1,
        } as Booking["time"]),
    };
    bookingsMock.push(booking);
    return booking;
  }
  const { data } = await api.post<ApiResult<Booking>>("/api/bookings", payload);
  return data.data;
}

export async function cancelBooking(id: string): Promise<Booking> {
  if (USE_MOCK) {
    await delay();
    const booking = bookingsMock.find((b) => b.id === id);
    if (!booking) throw new Error("Booking not found");
    booking.status = "cancelled";
    return booking;
  }
  const { data } = await api.patch<ApiResult<Booking>>(`/api/bookings/${id}/cancel`, {});
  return data.data;
}

export async function fetchActiveBooking(id: string): Promise<Booking> {
  if (USE_MOCK) {
    await delay();
    const booking = bookingsMock.find((b) => b.id === id) ?? bookingsMock[0];
    return booking;
  }
  const { data } = await api.get<ApiResult<Booking>>(`/api/bookings/${id}`);
  return data.data;
}

export async function fetchUserBookings(userId: string): Promise<Booking[]> {
  if (USE_MOCK) {
    await delay();
    return bookingsMock.filter((b) => b.userId === userId);
  }
  const { data } = await api.get<ApiResult<Booking[]>>(`/api/users/${userId}/bookings`);
  return data.data;
}

export async function mockPayment(payload: PaymentIntent): Promise<PaymentIntent> {
  if (USE_MOCK) {
    await delay();
    return { ...payload, status: "paid" };
  }
  const { data } = await api.post<ApiResult<PaymentIntent>>("/api/payments/mock", payload);
  return data.data;
}

export async function login(payload: { email: string; password: string }): Promise<{ user: User; token: string }> {
  if (USE_MOCK) {
    await delay();
    return {
      user: {
        id: "user-mock",
        name: "Demo Driver",
        email: payload.email,
      },
      token: "mock-token",
    };
  }
  const { data } = await api.post<ApiResult<{ user: User; token: string }>>("/api/auth/login", payload);
  return data.data;
}

export async function register(payload: { name: string; email: string; password: string }): Promise<User> {
  if (USE_MOCK) {
    await delay();
    return {
      id: `user-${Date.now()}`,
      name: payload.name,
      email: payload.email,
    };
  }
  const { data } = await api.post<ApiResult<User>>("/api/auth/register", payload);
  return data.data;
}

export async function refresh(): Promise<{ token: string }> {
  const { data } = await api.post<ApiResult<{ token: string }>>("/api/auth/refresh", {});
  return data.data;
}
