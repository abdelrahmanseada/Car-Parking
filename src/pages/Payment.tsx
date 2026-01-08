import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { processPayment } from "@/services/api";
import type { PaymentIntent, Booking as ApiBooking, Garage, Slot } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { useBookingContext, type Booking } from "@/context/BookingContext";

const methods = [
  { value: "card", label: "Card" },
  { value: "wallet", label: "Wallet" },
  { value: "cash", label: "Cash" },
];

// Helper function to safely parse localStorage JSON
const safeParseJSON = (key: string): any | null => {
  try {
    const stored = localStorage.getItem(key);
    
    // Check for invalid values
    if (!stored || stored === "undefined" || stored === "null" || stored === "") {
      console.warn(`⚠️ [Payment] Invalid ${key} in localStorage, clearing...`);
      localStorage.removeItem(key);
      return null;
    }
    
    const parsed = JSON.parse(stored);
    
    // Validate parsed result is not null/undefined
    if (parsed === null || parsed === undefined) {
      console.warn(`⚠️ [Payment] Parsed ${key} is null/undefined, clearing...`);
      localStorage.removeItem(key);
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error(`❌ [Payment] Error parsing ${key} from localStorage:`, error);
    console.error(`Corrupt data was:`, localStorage.getItem(key));
    // Clear corrupt data
    localStorage.removeItem(key);
    return null;
  }
};

export function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useAppContext();
  const { addBooking } = useBookingContext();
  
  const locationState = location.state as { 
    booking?: ApiBooking; 
    price?: number; 
    totalPrice?: number; 
    garage?: Garage; 
    slot?: Slot; 
    duration?: number;
  } | undefined;
  
  const apiBooking = locationState?.booking ?? state.activeBooking;
  const [method, setMethod] = useState(methods[0].value);
  const [vehiclePlate, setVehiclePlate] = useState(apiBooking?.vehiclePlate || "");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Get price from state - prioritize price, then totalPrice, then booking.totalPrice
  const totalPrice = locationState?.price ?? locationState?.totalPrice ?? apiBooking?.totalPrice ?? 0;
  
  // Check for auth token first
  const authToken = typeof window !== 'undefined' ? (
    localStorage.getItem('auth_token') || 
    sessionStorage.getItem('auth_token')
  ) : null;
  
  // Safely get user from context or localStorage
  let currentUser = state.user;
  
  if (!currentUser && typeof window !== 'undefined') {
    const storedUser = safeParseJSON('user');
    if (storedUser && storedUser.id) {
      currentUser = storedUser;
    }
  }
  
  // Validate consistency: if we have a user but no token, it's invalid state
  if (currentUser && !authToken) {
    localStorage.removeItem('user');
    currentUser = null;
  } else if (!currentUser && authToken) {
    const storedUser = safeParseJSON('user');
    if (storedUser && storedUser.id) {
      currentUser = storedUser;
    }
  }

  // Redirect if no booking data or no authentication (direct access)
  useEffect(() => {
    // Check booking data first
    if (!apiBooking && !locationState) {
      navigate("/home", { replace: true });
      return;
    }
    
    // Check authentication - be defensive, only redirect if BOTH token AND user are missing
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    if (!token && !currentUser) {
      // Clear potentially corrupt auth data
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      navigate("/auth/login", { 
        replace: true,
        state: { message: "Please login to complete your payment" }
      });
      return;
    }
    
    // If we have user but no ID, that's invalid
    if (currentUser && !currentUser.id) {
      localStorage.removeItem('user');
      navigate("/auth/login", { 
        replace: true,
        state: { message: "Invalid session. Please login again" }
      });
      return;
    }
  }, [apiBooking, locationState, currentUser, navigate]);

  // Validate required data - will auto-redirect via useEffect
  if (!apiBooking && !locationState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated - will auto-redirect via useEffect
  if (!currentUser || !currentUser.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!apiBooking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md text-center space-y-4">
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Booking Data Missing</h2>
            <p className="text-red-700 dark:text-red-300 mb-4">No booking information found. Please complete the booking first.</p>
            <Button onClick={() => navigate("/")}>Go Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!locationState?.garage || !locationState?.slot) {
    console.error("❌ [Payment] Missing garage or slot data:", {
      hasGarage: !!locationState?.garage,
      hasSlot: !!locationState?.slot,
      locationState
    });
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md text-center space-y-4">
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Missing Garage or Slot Data</h2>
            <p className="text-red-700 dark:text-red-300 mb-4">
              Required booking details are missing. This might be due to page refresh or navigation error.
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">
              Please start the booking process again from the beginning.
            </p>
            <Button onClick={() => navigate("/")}>Go Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    // Comprehensive validation before proceeding
    if (!apiBooking) {
      setStatus("❌ Missing booking data. Please try again.");
      return;
    }
    
    if (!locationState?.garage) {
      setStatus("❌ Missing garage data. Please restart the booking.");
      return;
    }
    
    if (!locationState?.slot) {
      setStatus("❌ Missing slot data. Please restart the booking.");
      return;
    }
    
    if (!currentUser?.id) {
      setStatus("❌ User not logged in. Redirecting to login...");
      setTimeout(() => {
        navigate("/auth/login", { 
          state: { message: "Please login to complete payment" }
        });
      }, 2000);
      return;
    }
    
    // Validate vehicle plate is provided and valid
    const trimmedPlate = vehiclePlate.trim();
    if (!trimmedPlate) {
      setStatus("❌ Please enter your vehicle plate number.");
      return;
    }
    
    if (trimmedPlate.length < 3) {
      setStatus("❌ Vehicle plate must be at least 3 characters.");
      return;
    }
    
    // Validate slot and garage have required IDs
    if (!locationState.slot.id) {
      setStatus("❌ Invalid slot data. Please restart the booking.");
      return;
    }
    
    if (!locationState.garage.id) {
      setStatus("❌ Invalid garage data. Please restart the booking.");
      return;
    }
    
    setLoading(true);
    setStatus("");
    
    try {
      // ==================== EXTRACT DURATION ====================
      let durationHours = 2; // default
      
      if (typeof locationState.duration === 'number') {
        durationHours = locationState.duration;
      } else if (typeof locationState.duration === 'string') {
        // Try to extract number from strings like "2 hours", "3", etc.
        const match = locationState.duration.match(/\d+/);
        if (match) {
          durationHours = parseInt(match[0], 10);
        }
      } else if (apiBooking.time?.durationHours) {
        durationHours = apiBooking.time.durationHours;
      }
      
      // ==================== FORMAT MYSQL TIMESTAMPS ====================
      // Helper function to format date as MySQL timestamp (YYYY-MM-DD HH:mm:ss)
      const formatMySQLTimestamp = (date: Date): string => {
        const pad = (n: number) => String(n).padStart(2, '0');
        
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };
      
      // Calculate start and end times
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);
      
      const startTime = formatMySQLTimestamp(startDate);
      const endTime = formatMySQLTimestamp(endDate);
      
      // ==================== CONSTRUCT EXACT PAYLOAD ====================
      // Map payment method to backend expected values
      let paymentMethodValue = method;
      if (method === "card") {
        paymentMethodValue = "credit_card"; // Backend might expect this
      }
      
      const paymentPayload = {
        parkingSpotId: locationState.slot.id,
        garageId: locationState.garage.id,
        userId: currentUser.id,
        totalAmount: totalPrice > 0 ? totalPrice : apiBooking.totalPrice,
        startTime: startTime,
        endTime: endTime,
        durationHours: durationHours,
        paymentMethod: paymentMethodValue as "card" | "wallet" | "cash",
        vehiclePlate: vehiclePlate.trim(),
      };
      
      // Process payment with backend
      const paymentResult = await processPayment(paymentPayload);
      
      // Generate new booking object for local storage
      const newBooking: Booking = {
        id: paymentResult?.booking?.id || paymentResult?.id || apiBooking.id,
        garageId: locationState.garage.id,
        garageName: locationState.garage.name,
        slotId: locationState.slot.id,
        userId: currentUser.id,
        vehiclePlate: vehiclePlate.trim(),
        price: locationState.slot.pricePerHour,
        totalPrice: paymentPayload.totalAmount,
        date: startTime,
        status: "active",
        time: apiBooking.time,
      };
      
      // Save booking to context/localStorage
      addBooking(newBooking);
      
      // Update AppContext for active booking tracking
      dispatch({ type: "SET_BOOKING", payload: apiBooking });
      
      setStatus("✅ Payment successful! Redirecting...");
      
      // Navigate to bookings page
      setTimeout(() => {
        navigate("/bookings");
      }, 1500);
    } catch (err) {
      console.error("❌ Payment failed:", err);
      setStatus("❌ " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold text-brand uppercase tracking-wider">Step 3</p>
        <h1 className="text-3xl font-bold font-heading">Payment</h1>
      </header>
      <div className="grid gap-8 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 1 }} className="space-y-5 rounded-3xl bg-white p-8 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-surface-elevated-dark dark:border dark:border-slate-700/50 dark:hover:shadow-2xl dark:hover:shadow-brand/10">
          <h2 className="text-2xl font-bold font-heading dark:text-text-dark-on-surface">Booking summary</h2>
          <dl className="space-y-3 text-base">
            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <dt className="font-medium dark:text-text-dark-on-surface/70">Garage</dt>
              <dd className="font-bold dark:text-text-dark-on-surface">{locationState?.garage?.name ?? apiBooking.garageId}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <dt className="font-medium dark:text-text-dark-on-surface/70">Slot</dt>
              <dd className="font-bold dark:text-text-dark-on-surface">{locationState?.slot?.number || apiBooking.slotId}</dd>
            </div>
          </dl>
          
          {/* Vehicle Plate Input */}
          <div className="space-y-2">
            <Input
              label="Vehicle Plate Number *"
              type="text"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
              placeholder="e.g., ABC-123"
              required
            />
            {!vehiclePlate && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">⚠️ Vehicle plate number is required</p>
            )}
            {vehiclePlate && vehiclePlate.length < 3 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">⚠️ Plate should be at least 3 characters</p>
            )}
          </div>
          
          <div className="rounded-2xl bg-gradient-to-br from-brand/10 to-accent/10 p-6 dark:bg-gradient-to-br dark:from-brand/20 dark:to-accent/20 shadow-lg">
            <p className="text-sm font-semibold text-text-muted dark:text-text-dark-on-surface/70 uppercase tracking-wide">Total Amount</p>
            <p className="text-4xl font-bold font-heading text-brand dark:text-brand mt-2">${(totalPrice > 0 ? totalPrice : apiBooking.totalPrice).toFixed(2)}</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 1 }} className="space-y-5 rounded-3xl bg-white p-8 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-surface-elevated-dark dark:border dark:border-slate-700/50 dark:hover:shadow-2xl dark:hover:shadow-brand/10">
          <h3 className="text-2xl font-bold font-heading dark:text-text-dark-on-surface">Payment method</h3>
          <div className="grid gap-4">
            {methods.map((item) => (
              <button
                key={item.value}
                onClick={() => setMethod(item.value)}
                className={`flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all duration-200 hover:scale-[1.02] ${
                  method === item.value 
                    ? "border-brand bg-brand-muted/40 shadow-lg dark:bg-brand-muted/20" 
                    : "border-slate-200 bg-white hover:border-brand/50 dark:border-slate-700 dark:bg-surface-elevated-dark"
                }`}
              >
                <span className="font-semibold dark:text-text-dark-on-surface">{item.label}</span>
                {method === item.value && <span className="text-brand font-bold">✓ Selected</span>}
              </button>
            ))}
          </div>
          <Button 
            className="w-full text-lg py-4" 
            onClick={handlePayment} 
            disabled={loading || !vehiclePlate.trim() || vehiclePlate.trim().length < 3}
          >
            {loading ? "Processing..." : vehiclePlate.trim().length < 3 ? "Enter Vehicle Plate" : "Pay Now"}
          </Button>
          {status && (
            <p className={`text-sm font-semibold text-center ${
              status.includes("❌") ? "text-red-600 dark:text-red-400" : "text-brand"
            }`}>
              {status}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
