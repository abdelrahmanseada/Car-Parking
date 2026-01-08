import { createContext, useContext, useMemo, useReducer } from "react";
import type { Booking, User } from "@/types";

type State = {
  user: User | null;
  token: string | null;
  activeBooking: Booking | null;
  bookings: Booking[];
  isDarkMode: boolean;
  useMock: boolean;
};

type Action =
  | { type: "LOGIN"; payload: { user: User; token: string } }
  | { type: "LOGOUT" }
  | { type: "SET_BOOKING"; payload: Booking | null }
  | { type: "ADD_BOOKING"; payload: Booking }
  | { type: "SET_BOOKINGS"; payload: Booking[] }
  | { type: "TOGGLE_THEME" }
  | { type: "SET_MOCK"; payload: boolean };

const initialState: State = {
  user: null,
  token: null,
  activeBooking: null,
  bookings: [],
  isDarkMode: false,
  useMock: false,
};

const AppContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOGIN":
      return { ...state, user: action.payload.user, token: action.payload.token };
    case "LOGOUT":
      return { ...state, user: null, token: null, activeBooking: null, bookings: [] };
    case "SET_BOOKING":
      return { ...state, activeBooking: action.payload };
    case "ADD_BOOKING":
      const updatedBookings = [...state.bookings, action.payload];
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("bookings", JSON.stringify(updatedBookings));
      }
      return { ...state, bookings: updatedBookings };
    case "SET_BOOKINGS":
      return { ...state, bookings: action.payload };
    case "TOGGLE_THEME":
      return { ...state, isDarkMode: !state.isDarkMode };
    case "SET_MOCK":
      return { ...state, useMock: action.payload };
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (base) => {
    // Load user and token from localStorage on app initialization
    let user: User | null = null;
    let token: string | null = null;
    let bookings: Booking[] = [];
    
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("auth_token");
      const storedBookings = localStorage.getItem("bookings");
      
      if (storedUser) {
        try {
          user = JSON.parse(storedUser);
        } catch (e) {
          console.warn("Failed to parse stored user:", e);
        }
      }
      
      if (storedToken) {
        token = storedToken;
      }
      
      if (storedBookings) {
        try {
          bookings = JSON.parse(storedBookings);
        } catch (e) {
          console.warn("Failed to parse stored bookings:", e);
        }
      }
    }
    
    // Default to light mode (isDarkMode: false)
    return { 
      ...base, 
      isDarkMode: false,
      user,
      token,
      bookings,
    };
  });

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return ctx;
}
