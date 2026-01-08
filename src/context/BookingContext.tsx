import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface Booking {
  id: string;
  garageId: string;
  garageName?: string;
  price: number;
  totalPrice: number;
  date: string;
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
  slotId: string;
  userId: string;
  vehiclePlate: string;
  time: {
    start: string;
    end: string;
    durationHours: number;
  };
}

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, updater: (prev: Booking) => Booking) => void;
}

const BookingContext = createContext<BookingContextType | null>(null);

const STORAGE_KEY = "parkspot_bookings";

export function BookingProvider({ children }: { children: ReactNode }) {
  // CRITICAL: Initialize state directly from localStorage using function initializer
  const [bookings, setBookings] = useState<Booking[]>(() => {
    if (typeof window === "undefined") return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn("Failed to load bookings from localStorage:", error);
    }
    return [];
  });

  // Add booking function - updates both state AND localStorage
  const addBooking = useCallback((newBooking: Booking) => {
    setBookings((prev) => {
      // Check if booking already exists (avoid duplicates)
      const exists = prev.some((b) => b.id === newBooking.id);
      if (exists) {
        return prev;
      }
      
      const updated = [...prev, newBooking];
      
      // CRITICAL: Save to localStorage immediately
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.warn("Failed to save booking to localStorage:", error);
      }
      
      return updated;
    });
  }, []);

  const updateBooking = useCallback((id: string, updater: (prev: Booking) => Booking) => {
    setBookings((prev) => {
      const updated = prev.map((b) => (b.id === id ? updater(b) : b));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.warn("Failed to update booking in localStorage:", error);
      }
      return updated;
    });
  }, []);

  return (
    <BookingContext.Provider value={{ bookings, addBooking, updateBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookingContext() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBookingContext must be used within BookingProvider");
  }
  return context;
}
