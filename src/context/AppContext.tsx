import { createContext, useContext, useMemo, useReducer } from "react";
import type { Booking, User } from "@/types";

type State = {
  user: User | null;
  token: string | null;
  activeBooking: Booking | null;
  isDarkMode: boolean;
  useMock: boolean;
};

type Action =
  | { type: "LOGIN"; payload: { user: User; token: string } }
  | { type: "LOGOUT" }
  | { type: "SET_BOOKING"; payload: Booking | null }
  | { type: "TOGGLE_THEME" }
  | { type: "SET_MOCK"; payload: boolean };

const initialState: State = {
  user: null,
  token: null,
  activeBooking: null,
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
      return { ...state, user: null, token: null, activeBooking: null };
    case "SET_BOOKING":
      return { ...state, activeBooking: action.payload };
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
    const prefersDark =
      typeof window !== "undefined" ? window.matchMedia?.("(prefers-color-scheme: dark)")?.matches : false;
    return { ...base, isDarkMode: prefersDark ?? false };
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
