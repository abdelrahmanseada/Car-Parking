// ==================== PRODUCTION MODE: REAL BACKEND API ====================
// This file is configured for production use with real backend API calls.
// All functions make HTTP requests to the backend server.

import axios, { type AxiosError, type AxiosInstance } from "axios";
import type { Booking, Floor, Garage, PaymentIntent, Slot, User } from "@/types";

// ==================== AXIOS CONFIGURATION ====================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

/**
 * Axios instance with default configuration
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==================== TOKEN HYDRATION ====================
// Auto-set Authorization header from localStorage on app load/page refresh
// This ensures the token persists across page navigations
(function hydrateAuthToken() {
  const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
  if (token && token !== "undefined" && token !== "null") {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    console.log("✅ [API] Auth token hydrated from localStorage");
  } else {
    console.log("ℹ️ [API] No auth token found in localStorage");
  }
})();

/**
 * Request interceptor to add auth token
 * This serves as a fallback and ensures token is always fresh
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    if (token && token !== "undefined" && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor for error handling
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear tokens
      localStorage.removeItem("auth_token");
      sessionStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ==================== HELPER FUNCTIONS ====================

/**
 * Extract data from response (handles both response.data and response.data.data)
 */
function extractData<T>(response: any): T {
  // Check if data is nested in response.data.data
  if (response.data && typeof response.data === "object" && "data" in response.data) {
    return response.data.data as T;
  }
  // Otherwise return response.data directly
  return response.data as T;
}

/**
 * Format error message for user display
 */
function formatError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    
    // Check for error message in response
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
    
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    
    // HTTP status errors
    if (axiosError.response?.status) {
      const status = axiosError.response.status;
      if (status === 404) return "Resource not found";
      if (status === 403) return "Access forbidden";
      if (status === 401) return "Unauthorized. Please login again";
      if (status === 500) return "Server error. Please try again later";
      if (status >= 400 && status < 500) return "Invalid request";
      if (status >= 500) return "Server error";
    }
    
    // Network errors
    if (axiosError.code === "ECONNABORTED") return "Request timeout. Please try again";
    if (axiosError.code === "ERR_NETWORK") return "Network error. Check your connection";
    
    return axiosError.message || "An error occurred";
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "An unexpected error occurred";
}

// ==================== AUTHENTICATION ====================

/**
 * Login with email and password
 * Endpoint: POST /auth-access-token
 */
export async function login(payload: { email: string; password: string }): Promise<{ user: User; token: string }> {
  try {
    const response = await api.post("/auth-access-token", payload);
    const extractedData = extractData<any>(response);
    
    // ==================== FLEXIBLE USER EXTRACTION ====================
    // Backend may return user in different locations:
    // - data.user (standard)
    // - data[0] or data["0"] (unusual but happens)
    // - data.data.user (nested)
    
    let rawUser: any = null;
    
    // Try standard location first
    if (extractedData.user && typeof extractedData.user === 'object') {
      rawUser = extractedData.user;
    }
    // Try index 0 (numeric or string)
    else if (extractedData[0] && typeof extractedData[0] === 'object') {
      rawUser = extractedData[0];
    }
    else if (extractedData["0"] && typeof extractedData["0"] === 'object') {
      rawUser = extractedData["0"];
    }
    // Try nested data.data.user
    else if (extractedData.data?.user && typeof extractedData.data.user === 'object') {
      rawUser = extractedData.data.user;
    }
    // Try data.data[0]
    else if (extractedData.data?.[0] && typeof extractedData.data[0] === 'object') {
      rawUser = extractedData.data[0];
    }
    
    // Validate user was found
    if (!rawUser) {
      console.error("❌ [login] No user found in response");
      throw new Error("Login failed: No user data received from server");
    }
    
    // ==================== NORMALIZE USER DATA ====================
    // Handle both camelCase and snake_case field names
    const normalizedUser: User = {
      id: String(rawUser.id || rawUser.user_id || ""),
      name: String(rawUser.name || rawUser.full_name || rawUser.username || ""),
      email: String(rawUser.email || ""),
      phone: rawUser.phone || rawUser.phone_number || undefined,
      avatarUrl: rawUser.avatarUrl || rawUser.avatar_url || rawUser.avatar || undefined,
      role: (rawUser.role || rawUser.user_role || "user") as "user" | "admin",
    };
    
    // Validate normalized user has required fields
    if (!normalizedUser.id || !normalizedUser.email) {
      console.error("❌ [login] User missing required fields");
      throw new Error("Login failed: Invalid user data structure");
    }
    
    // ==================== FLEXIBLE TOKEN EXTRACTION ====================
    let token: string | null = null;
    
    // Try different token locations
    if (extractedData.token) {
      token = String(extractedData.token);
    } else if (extractedData.access_token) {
      token = String(extractedData.access_token);
    } else if (extractedData.data?.token) {
      token = String(extractedData.data.token);
    } else if (extractedData.data?.access_token) {
      token = String(extractedData.data.access_token);
    }
    
    // Validate token
    if (!token) {
      console.error("❌ [login] No token in response:", extractedData);
      throw new Error("Login failed: No authentication token received from server");
    }
    
    // Ensure token is not undefined/null string
    if (token === "undefined" || token === "null" || !token) {
      console.error("❌ [login] Invalid token value:", token);
      throw new Error("Login failed: Invalid authentication token");
    }
    
    // ==================== SAVE TO LOCALSTORAGE ====================
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    
    // Set default Authorization header for all future requests
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    
    return { user: normalizedUser, token };
  } catch (error) {
    console.error("❌ [login] Login error:", error);
    
    // Clear any potentially corrupt data
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
    
    throw new Error(formatError(error));
  }
}

/**
 * Register new user
 * Endpoint: POST /register
 */
export async function register(payload: { name: string; email: string; password: string }): Promise<User> {
  try {
    const response = await api.post("/register", payload);
    const extractedData = extractData<any>(response);
    
    // ==================== FLEXIBLE USER EXTRACTION ====================
    let rawUser: any = null;
    
    if (extractedData.user && typeof extractedData.user === 'object') {
      rawUser = extractedData.user;
    } else if (extractedData[0] && typeof extractedData[0] === 'object') {
      rawUser = extractedData[0];
    } else if (extractedData["0"] && typeof extractedData["0"] === 'object') {
      rawUser = extractedData["0"];
    } else if (extractedData.data?.user) {
      rawUser = extractedData.data.user;
    }
    
    // Validate user was found
    if (!rawUser) {
      console.error("❌ [register] No user in response");
      throw new Error("Registration failed: No user data received");
    }
    
    // ==================== NORMALIZE USER DATA ====================
    const normalizedUser: User = {
      id: String(rawUser.id || rawUser.user_id || ""),
      name: String(rawUser.name || rawUser.full_name || rawUser.username || payload.name),
      email: String(rawUser.email || payload.email),
      phone: rawUser.phone || rawUser.phone_number || undefined,
      avatarUrl: rawUser.avatarUrl || rawUser.avatar_url || rawUser.avatar || undefined,
      role: (rawUser.role || rawUser.user_role || "user") as "user" | "admin",
    };
    
    // ==================== FLEXIBLE TOKEN EXTRACTION ====================
    let token: string | null = null;
    
    if (extractedData.token) {
      token = String(extractedData.token);
    } else if (extractedData.access_token) {
      token = String(extractedData.access_token);
    } else if (extractedData.data?.token) {
      token = String(extractedData.data.token);
    }
    
    // Store token and user if token is provided
    if (token && token !== "undefined" && token !== "null") {
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    
    return normalizedUser;
  } catch (error) {
    console.error("❌ [register] Registration error:", error);
    throw new Error(formatError(error));
  }
}

/**
 * Logout user
 * Endpoint: DELETE /logout/{token?}
 * Note: Token is optional in route, but we send it via Authorization header
 */
export async function logout(): Promise<void> {
  try {
    const token = localStorage.getItem("auth_token");
    await api.delete(`/logout/${token || ""}`);
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear local storage regardless of API response
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
  }
}

/**
 * Refresh authentication token
 * Note: Endpoint may need to be confirmed with backend team
 */
export async function refresh(): Promise<{ token: string }> {
  try {
    const response = await api.post("/auth/refresh");
    const data = extractData<{ token: string }>(response);
    
    localStorage.setItem("auth_token", data.token);
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
    
    return data;
  } catch (error) {
    throw new Error(formatError(error));
  }
}

// ==================== PROFILE ====================

/**
 * Get user profile by ID
 * Endpoint: GET /profile/{id}
 */
export async function fetchProfile(userId: string): Promise<User> {
  try {
    const response = await api.get(`/profile/${userId}`);
    return extractData<User>(response);
  } catch (error) {
    throw new Error(formatError(error));
  }
}

/**
 * Update user profile
 * Endpoint: PUT /profile/{id}
 */
export async function updateProfile(
  userId: string,
  updates: { name?: string; email?: string; phone?: string }
): Promise<User> {
  try {
    const response = await api.put(`/profile/${userId}`, updates);
    const user = extractData<User>(response);
    
    // Update user in localStorage
    localStorage.setItem("user", JSON.stringify(user));
    
    return user;
  } catch (error) {
    throw new Error(formatError(error));
  }
}

/**
 * Delete user profile
 * Endpoint: DELETE /profile/{id}
 */
export async function deleteProfile(userId: string): Promise<void> {
  try {
    await api.delete(`/profile/${userId}`);
    
    // Clear local storage after deletion
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
  } catch (error) {
    throw new Error(formatError(error));
  }
}

// ==================== GARAGES/PLACES ====================

/**
 * Get all garages with optional filters
 * Endpoint: GET /garages
 */
export async function fetchGarages(params?: {
  lat?: number;
  lng?: number;
  q?: string;
  filters?: string;
  name?: string;
}): Promise<Garage[]> {
  try {
    const response = await api.get("/garages", { params });
    const rawData = extractData<any[]>(response);
    
    // Normalize backend response to frontend Garage interface
    const mappedGarages = rawData.map((garage: any) => {
      // Extract image URL from ALL possible field names
      const imageUrl = garage.image || 
                       garage.image_url || 
                       garage.imageUrl || 
                       garage.photo || 
                       garage.photo_url || 
                       garage.photoUrl ||
                       garage.picture ||
                       garage.picture_url ||
                       garage.img ||
                       null;
      
      return {
        id: String(garage.id),
        name: garage.name || "",
        description: garage.description || "",
        image: imageUrl,
        rating: garage.rating ? Number(garage.rating) : undefined,
        pricePerHour: Number(garage.pricePerHour || garage.price_per_hour || 0),
        amenities: Array.isArray(garage.amenities) ? garage.amenities : [],
        totalSlots: Number(garage.totalSlots || garage.total_slots || 0),
        availableSlots: Number(
          garage.availableSlots || 
          garage.available_slots || 
          garage.real_available_slots || 
          0
        ),
        location: {
          lat: Number(garage.location?.lat || garage.latitude || 0),
          lng: Number(garage.location?.lng || garage.longitude || 0),
          address: garage.location?.address || garage.address || "",
          city: garage.location?.city || garage.city || undefined,
        },
        floors: garage.floors || undefined,
      };
    });
    
    return mappedGarages;
  } catch (error) {
    throw new Error(formatError(error));
  }
}

/**
 * Search places by name
 * Endpoint: GET /garages/search?name={query}
 * Note: Route is inside /garages prefix in Laravel routes
 */
export async function searchPlaces(name: string): Promise<Garage[]> {
  try {
    const response = await api.get("/garages/search", { params: { name } });
    const rawData = extractData<any[]>(response);
    
    // Normalize backend response (same mapping as fetchGarages)
    return rawData.map((garage: any) => {
      // Extract image URL from multiple possible field names
      const imageUrl = garage.image || 
                       garage.image_url || 
                       garage.imageUrl || 
                       garage.photo || 
                       garage.photo_url || 
                       garage.picture ||
                       garage.img ||
                       undefined;
      
      return {
        id: String(garage.id),
        name: garage.name || "",
        description: garage.description || "",
        image: imageUrl,
        rating: garage.rating ? Number(garage.rating) : undefined,
        pricePerHour: Number(garage.pricePerHour || garage.price_per_hour || 0),
        amenities: Array.isArray(garage.amenities) ? garage.amenities : [],
        totalSlots: Number(garage.totalSlots || garage.total_slots || 0),
        availableSlots: Number(
          garage.availableSlots || 
          garage.available_slots || 
          garage.real_available_slots || 
          0
        ),
        location: {
          lat: Number(garage.location?.lat || garage.latitude || 0),
          lng: Number(garage.location?.lng || garage.longitude || 0),
          address: garage.location?.address || garage.address || "",
          city: garage.location?.city || garage.city || undefined,
        },
        floors: garage.floors || undefined,
      };
    });
  } catch (error) {
    throw new Error(formatError(error));
  }
}

/**
 * Get single garage by ID
 * Endpoint: GET /garages/{id}
 */
export async function fetchGarage(id: string): Promise<Garage> {
  try {
    const response = await api.get(`/garages/${id}`);
    const garage = extractData<any>(response);
    
    // Extract image URL from multiple possible field names
    const imageUrl = garage.image || 
                     garage.image_url || 
                     garage.imageUrl || 
                     garage.photo || 
                     garage.photo_url || 
                     garage.photoUrl ||
                     garage.picture ||
                     garage.picture_url ||
                     garage.img ||
                     null;
    
    // Normalize backend response to frontend Garage interface
    return {
      id: String(garage.id),
      name: garage.name || "",
      description: garage.description || "",
      image: imageUrl,
      rating: garage.rating ? Number(garage.rating) : undefined,
      pricePerHour: Number(garage.pricePerHour || garage.price_per_hour || 0),
      amenities: Array.isArray(garage.amenities) ? garage.amenities : [],
      totalSlots: Number(garage.totalSlots || garage.total_slots || 0),
      availableSlots: Number(
        garage.availableSlots || 
        garage.available_slots || 
        garage.real_available_slots || 
        0
      ),
      location: {
        lat: Number(garage.location?.lat || garage.latitude || 0),
        lng: Number(garage.location?.lng || garage.longitude || 0),
        address: garage.location?.address || garage.address || "",
        city: garage.location?.city || garage.city || undefined,
      },
      floors: garage.floors || undefined,
    };
  } catch (error) {
    throw new Error(formatError(error));
  }
}

/**
 * Create a new garage (Admin only)
 * Endpoint: POST /garages
 */
export async function createGarage(garage: Partial<Garage>): Promise<Garage> {
  try {
    const response = await api.post("/garages", garage);
    return extractData<Garage>(response);
  } catch (error) {
    throw new Error(formatError(error));
  }
}

// ==================== PARKING SLOTS ====================

/**
 * Get parking slots for a garage
 * Endpoint: GET /garages/{id}/parking
 * Maps backend response to frontend Slot interface with robust error handling
 */
export async function fetchParkingSlots(placeId: string): Promise<Slot[]> {
  try {
    const response = await api.get(`/garages/${placeId}/parking`);
    const rawData = extractData<any>(response);
    
    // Handle different response formats
    let slotsArray: any[] = [];
    
    if (Array.isArray(rawData)) {
      // Direct array response
      slotsArray = rawData;
    } else if (rawData && typeof rawData === 'object') {
      // Check for common nested structures
      if (Array.isArray(rawData.slots)) {
        slotsArray = rawData.slots;
      } else if (Array.isArray(rawData.data)) {
        slotsArray = rawData.data;
      } else if (Array.isArray(rawData.parking)) {
        slotsArray = rawData.parking;
      } else if (Array.isArray(rawData.parkingSlots)) {
        slotsArray = rawData.parkingSlots;
      }
    }
    
    // If no data, return empty array
    if (!slotsArray || slotsArray.length === 0) {
      return [];
    }
    
    // Normalize backend response to frontend Slot interface
    const normalizedSlots = slotsArray.map((slot: any, index: number) => {
      // Handle status mapping (is_booked, is_available, etc.)
      let status: "available" | "occupied" | "reserved" = "available";
      
      if (slot.status) {
        // Direct status field
        const statusLower = String(slot.status).toLowerCase();
        if (statusLower === "available" || statusLower === "free") {
          status = "available";
        } else if (statusLower === "occupied" || statusLower === "booked" || statusLower === "taken") {
          status = "occupied";
        } else if (statusLower === "reserved") {
          status = "reserved";
        }
      } else if (slot.is_booked !== undefined) {
        // Boolean field
        status = slot.is_booked ? "occupied" : "available";
      } else if (slot.is_available !== undefined) {
        status = slot.is_available ? "available" : "occupied";
      }
      
      // Handle level/floor mapping
      const level = Number(
        slot.level ?? 
        slot.floor ?? 
        slot.floor_number ?? 
        slot.floor_id ?? 
        slot.floor_level ??
        0
      );
      
      // Handle vehicle size mapping
      let vehicleSize: "compact" | "standard" | "large" = "standard";
      const sizeField = (slot.vehicleSize || slot.vehicle_size || slot.size || "standard").toLowerCase();
      
      if (sizeField.includes("compact") || sizeField.includes("small")) {
        vehicleSize = "compact";
      } else if (sizeField.includes("large") || sizeField.includes("big")) {
        vehicleSize = "large";
      }
      
      return {
        id: String(slot.id || slot.slot_id || `slot-${index + 1}`),
        number: String(slot.number || slot.slot_number || slot.name || slot.id || index + 1),
        status,
        level,
        vehicleSize,
        pricePerHour: Number(slot.pricePerHour || slot.price_per_hour || slot.price || 5),
      };
    });
    
    return normalizedSlots;
  } catch (error) {
    console.error("❌ [fetchParkingSlots] Error:", error);
    throw new Error(formatError(error));
  }
}

/**
 * Get single parking slot
 * Note: May need to fetch all slots and filter, or confirm endpoint with backend
 */
export async function fetchParkingSlot(placeId: string, slotId: string): Promise<Slot> {
  try {
    // Fetch all slots and find the specific one
    const slots = await fetchParkingSlots(placeId);
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) {
      throw new Error("Slot not found");
    }
    return slot;
  } catch (error) {
    throw new Error(formatError(error));
  }
}

/**
 * Create a new parking slot (Admin only)
 * Endpoint: POST /garages/{id}/parking
 */
export async function createParkingSlot(placeId: string, slot: Partial<Slot>): Promise<Slot> {
  try {
    const response = await api.post(`/garages/${placeId}/parking`, slot);
    return extractData<Slot>(response);
  } catch (error) {
    throw new Error(formatError(error));
  }
}

/**
 * Delete a parking slot (Admin only)
 * Endpoint: DELETE /garages/{id}/parking/{slotId}
 */
export async function deleteParkingSlot(placeId: string, slotId: string): Promise<void> {
  try {
    await api.delete(`/garages/${placeId}/parking/${slotId}`);
  } catch (error) {
    throw new Error(formatError(error));
  }
}

/**
 * Reserve a parking slot
 * Endpoint: POST /garages/{id}/parking/{slotId}/reserve
 */
export async function reserveSlot(
  placeId: string,
  slotId: string,
  payload?: { vehiclePlate?: string; durationHours?: number }
): Promise<Booking> {
  try {
    const response = await api.post(`/garages/${placeId}/parking/${slotId}/reserve`, payload);
    return extractData<Booking>(response);
  } catch (error) {
    throw new Error(formatError(error));
  }
}

/**
 * Release (cancel) a parking slot reservation
 * Endpoint: POST /garages/{id}/parking/{slotId}/release
 */
export async function releaseSlot(placeId: string, slotId: string): Promise<void> {
  try {
    await api.post(`/garages/${placeId}/parking/${slotId}/release`);
  } catch (error) {
    throw new Error(formatError(error));
  }
}

// ==================== FLOORS ====================

/**
 * Get floors for a garage
 * Endpoint: GET /garages/{id}/parking (returns flat slots list, we group by floor)
 * Groups slots by floor level and returns Floor[] structure for UI
 */
export async function fetchFloors(garageId: string): Promise<Floor[]> {
  try {
    // Fetch all parking slots from the backend
    const slots = await fetchParkingSlots(garageId);
    
    // If no slots, return a default floor
    if (!slots || slots.length === 0) {
      return [{
        id: "general-parking",
        name: "General Parking",
        level: 0,
        totalSlots: 0,
        availableSlots: 0,
        layout: []
      }];
    }
    
    // Group slots by floor level
    const floorMap = new Map<number, Slot[]>();
    
    slots.forEach((slot) => {
      const level = slot.level ?? 0;
      if (!floorMap.has(level)) {
        floorMap.set(level, []);
      }
      floorMap.get(level)!.push(slot);
    });
    
    // Convert map to Floor[] array
    const floors: Floor[] = Array.from(floorMap.entries())
      .sort(([levelA], [levelB]) => levelA - levelB)
      .map(([level, floorSlots]) => {
        const availableSlots = floorSlots.filter((s) => s.status === "available").length;
        
        return {
          id: `floor-${level}`,
          name: level === 0 ? "Ground Floor" : level === 1 ? "1st Floor" : level === 2 ? "2nd Floor" : `Floor ${level}`,
          level,
          totalSlots: floorSlots.length,
          availableSlots,
          layout: floorSlots
        };
      });
    
    return floors;
  } catch (error) {
    console.error("❌ [fetchFloors] Error:", error);
    throw new Error(formatError(error));
  }
}

/**
 * Get slots for a specific floor
 * Note: Filters parking slots by floor level
 */
export async function fetchSlots(floorId: string): Promise<Slot[]> {
  try {
    // This requires knowing the garageId from the floorId
    // For now, this is a limitation - may need to be refactored
    // or the floorId format needs to encode the garageId
    throw new Error("fetchSlots by floorId alone is not supported. Use fetchParkingSlots with garageId instead.");
  } catch (error) {
    throw new Error(formatError(error));
  }
}

// ==================== BOOKINGS ====================

/**
 * Create a new booking (Uses reserveSlot instead)
 * This function wraps reserveSlot for backward compatibility
 */
export async function createBooking(payload: Partial<Booking>): Promise<Booking> {
  try {
    if (!payload.garageId || !payload.slotId) {
      throw new Error("Garage ID and Slot ID are required");
    }
    
    // Use reserveSlot endpoint
    return await reserveSlot(payload.garageId, payload.slotId, {
      vehiclePlate: payload.vehiclePlate,
      durationHours: payload.time?.durationHours,
    });
  } catch (error) {
    throw new Error(formatError(error));
  }
}

/**
 * End a booking (mark as completed)
 * Endpoint: PUT /bookings/{id}/end
 * Full URL: {baseURL}/bookings/{id}/end (e.g., http://127.0.0.1:8000/api/bookings/{id}/end)
 */
export async function endBooking(id: string): Promise<Booking> {
  try {
    const endpoint = `/bookings/${id}/end`;
    console.log(`🔄 [endBooking] Making PUT request to: ${endpoint}`);
    const response = await api.put(endpoint);
    console.log(`✅ [endBooking] PUT request successful, status: ${response.status}`);
    const rawData = extractData<any>(response);
    
    // Handle different response formats
    let rawBooking: any = null;
    
    if (rawData && typeof rawData === 'object') {
      if (rawData.id) {
        rawBooking = rawData;
      } else if (rawData.booking) {
        rawBooking = rawData.booking;
      } else if (rawData.data?.booking) {
        rawBooking = rawData.data.booking;
      } else if (rawData.data?.id) {
        rawBooking = rawData.data;
      }
    }
    
    if (!rawBooking) {
      throw new Error("Invalid response from server");
    }
    
    // Normalize booking data (same as fetchBookingById)
    const garageId = String(
      rawBooking.garage?.id ||
      rawBooking.place?.id ||
      rawBooking.garage_id ||
      rawBooking.place_id ||
      rawBooking.garageId ||
      rawBooking.placeId ||
      ""
    );
    
    const userId = String(
      rawBooking.user?.id ||
      rawBooking.user_id ||
      rawBooking.userId ||
      ""
    );
    
    const slotId = String(
      rawBooking.parking_spot?.id ||
      rawBooking.spot?.id ||
      rawBooking.slot?.id ||
      rawBooking.parking_spot_id ||
      rawBooking.spot_id ||
      rawBooking.slot_id ||
      rawBooking.slotId ||
      rawBooking.spotId ||
      rawBooking.parkingSpotId ||
      ""
    );
    
    const normalizedBooking: Booking = {
      id: String(rawBooking.id),
      garageId: garageId,
      userId: userId,
      slotId: slotId,
      status: (rawBooking.status || "completed") as Booking["status"],
      totalPrice: Number(
        rawBooking.total_amount ||
        rawBooking.total_price ||
        rawBooking.totalPrice ||
        rawBooking.amount ||
        0
      ),
      vehiclePlate: String(
        rawBooking.vehicle_plate ||
        rawBooking.vehiclePlate ||
        rawBooking.plate ||
        rawBooking.license_plate ||
        "N/A"
      ),
      time: {
        start: rawBooking.start_time || rawBooking.startTime || rawBooking.time?.start || new Date().toISOString(),
        end: rawBooking.end_time || rawBooking.endTime || rawBooking.time?.end || new Date().toISOString(),
        durationHours: Number(
          rawBooking.duration_hours ||
          rawBooking.durationHours ||
          rawBooking.duration ||
          rawBooking.time?.durationHours ||
          1
        ),
      },
    };
    
    return normalizedBooking;
  } catch (error) {
    throw new Error(formatError(error));
  }
}

/**
 * Cancel a booking (Uses releaseSlot instead)
 * This function wraps releaseSlot for backward compatibility
 */
export async function cancelBooking(id: string): Promise<Booking> {
  try {
    // Note: This requires garageId and slotId which we may need to fetch first
    // For now, fetch the booking to get those details
    const booking = await fetchActiveBooking(id);
    await releaseSlot(booking.garageId, booking.slotId);
    
    // Return the booking with updated status
    return { ...booking, status: "cancelled" };
  } catch (error) {
    throw new Error(formatError(error));
  }
}

/**
 * Get active booking by ID
 * @deprecated Use fetchBookingById instead
 * This function now delegates to fetchBookingById for better performance
 */
export async function fetchActiveBooking(id: string): Promise<Booking> {
  console.log("⚠️ [fetchActiveBooking] Deprecated function called, using fetchBookingById instead");
  return fetchBookingById(id);
}

/**
 * Normalize a single booking object from backend format to frontend format
 */
function normalizeBooking(rawBooking: any): Booking {
  const garageId = String(
    rawBooking.garage?.id ||
    rawBooking.place?.id ||
    rawBooking.garage_id ||
    rawBooking.place_id ||
    rawBooking.garageId ||
    rawBooking.placeId ||
    ""
  );
  
  const userId = String(
    rawBooking.user?.id ||
    rawBooking.user_id ||
    rawBooking.userId ||
    ""
  );
  
  const slotId = String(
    rawBooking.parking_spot?.id ||
    rawBooking.spot?.id ||
    rawBooking.slot?.id ||
    rawBooking.parking_spot_id ||
    rawBooking.spot_id ||
    rawBooking.slot_id ||
    rawBooking.slotId ||
    rawBooking.spotId ||
    rawBooking.parkingSpotId ||
    ""
  );
  
  // Preserve the place/garage object if it exists
  const normalized: Booking = {
    id: String(rawBooking.id || ""),
    garageId: garageId,
    userId: userId,
    slotId: slotId,
    status: (rawBooking.status || "pending") as Booking["status"],
    totalPrice: Number(
      rawBooking.total_amount ||
      rawBooking.total_price ||
      rawBooking.totalPrice ||
      rawBooking.amount ||
      0
    ),
    vehiclePlate: String(
      rawBooking.vehicle_plate ||
      rawBooking.vehiclePlate ||
      rawBooking.plate ||
      rawBooking.license_plate ||
      "N/A"
    ),
    time: {
      start: rawBooking.start_time || rawBooking.startTime || rawBooking.time?.start || new Date().toISOString(),
      end: rawBooking.end_time || rawBooking.endTime || rawBooking.time?.end || new Date().toISOString(),
      durationHours: Number(
        rawBooking.duration_hours ||
        rawBooking.durationHours ||
        rawBooking.duration ||
        rawBooking.time?.durationHours ||
        1
      ),
    },
  };

  // Preserve place object if it exists (backend sends nested place data)
  if (rawBooking.place && typeof rawBooking.place === 'object') {
    normalized.place = rawBooking.place;
  }

  // Preserve garage object if it exists (alternative to place)
  if (rawBooking.garage && typeof rawBooking.garage === 'object') {
    normalized.garage = rawBooking.garage;
  }

  return normalized;
}

/**
 * Get all bookings for the current user
 * Endpoint: GET /bookings
 * Returns: { current: Booking[], past: Booking[] }
 */
export async function fetchUserBookings(userId?: string): Promise<{ current: Booking[]; past: Booking[] }> {
  try {
    const response = await api.get("/bookings");
    const rawData = extractData<any>(response);
    
    // Handle new response format: { current: [...], past: [...] }
    if (rawData && typeof rawData === 'object') {
      const currentRaw = Array.isArray(rawData.current) ? rawData.current : [];
      const pastRaw = Array.isArray(rawData.past) ? rawData.past : [];
      
      // Normalize each booking
      const current = currentRaw.map(normalizeBooking);
      const past = pastRaw.map(normalizeBooking);
      
      return { current, past };
    }
    
    // Fallback: Handle old format (flat array) for backward compatibility
    let bookingsArray: any[] = [];
    if (Array.isArray(rawData)) {
      bookingsArray = rawData;
    } else if (rawData && typeof rawData === 'object') {
      if (Array.isArray(rawData.bookings)) {
        bookingsArray = rawData.bookings;
      } else if (Array.isArray(rawData.data)) {
        bookingsArray = rawData.data;
      }
    }
    
    // If old format, split by status (backward compatibility)
    const currentRaw = bookingsArray.filter((b: any) => 
      ["active", "upcoming", "confirmed", "pending"].includes(b.status)
    );
    const pastRaw = bookingsArray.filter((b: any) => 
      ["completed", "cancelled"].includes(b.status)
    );
    
    // Normalize each booking
    const current = currentRaw.map(normalizeBooking);
    const past = pastRaw.map(normalizeBooking);
    
    return { current, past };
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    // Return empty arrays instead of throwing to prevent crashes
    return { current: [], past: [] };
  }
}

/**
 * Get a single booking by ID
 * Endpoint: GET /bookings/{id}
 * Normalizes backend response to frontend Booking interface
 */
export async function fetchBookingById(id: string): Promise<Booking> {
  try {
    const response = await api.get(`/bookings/${id}`);
    const rawData = extractData<any>(response);
    
    // Handle different response formats
    let rawBooking: any = null;
    
    if (rawData && typeof rawData === 'object') {
      // Check if it's a direct booking object
      if (rawData.id) {
        rawBooking = rawData;
      }
      // Check for nested booking
      else if (rawData.booking && typeof rawData.booking === 'object') {
        rawBooking = rawData.booking;
      }
      // Check for data.data.booking
      else if (rawData.data?.booking) {
        rawBooking = rawData.data.booking;
      }
      // Check for data.data (direct booking)
      else if (rawData.data?.id) {
        rawBooking = rawData.data;
      }
    }
    
    if (!rawBooking) {
      console.error("❌ [fetchBookingById] No booking found in response");
      throw new Error(`Booking #${id} not found`);
    }
    
    // ==================== NORMALIZE BOOKING DATA ====================
    // Backend returns snake_case, frontend expects camelCase with nested time object
    // Handle ALL possible field names and nested objects
    
    // Extract Garage ID from ALL possible locations
    const garageId = String(
      rawBooking.garage?.id ||           // Nested: garage.id
      rawBooking.place?.id ||            // Nested: place.id
      rawBooking.garage_id ||            // Direct: garage_id
      rawBooking.place_id ||             // Direct: place_id
      rawBooking.garageId ||             // CamelCase: garageId
      rawBooking.placeId ||              // CamelCase: placeId
      ""
    );
    
    // Extract User ID from ALL possible locations
    const userId = String(
      rawBooking.user?.id ||             // Nested: user.id
      rawBooking.user_id ||              // Direct: user_id
      rawBooking.userId ||               // CamelCase: userId
      ""
    );
    
    // Extract Parking Spot/Slot ID from ALL possible locations
    const slotId = String(
      rawBooking.parking_spot?.id ||     // Nested: parking_spot.id
      rawBooking.spot?.id ||             // Nested: spot.id
      rawBooking.slot?.id ||             // Nested: slot.id
      rawBooking.parking_spot_id ||      // Direct: parking_spot_id
      rawBooking.spot_id ||              // Direct: spot_id
      rawBooking.slot_id ||              // Direct: slot_id
      rawBooking.slotId ||               // CamelCase: slotId
      rawBooking.spotId ||               // CamelCase: spotId
      rawBooking.parkingSpotId ||        // CamelCase: parkingSpotId
      ""
    );
    
    const normalizedBooking: Booking = {
      id: String(rawBooking.id),
      garageId: garageId,
      userId: userId,
      slotId: slotId,
      status: (rawBooking.status || "pending") as Booking["status"],
      totalPrice: Number(
        rawBooking.total_amount || 
        rawBooking.total_price || 
        rawBooking.totalPrice || 
        rawBooking.amount || 
        0
      ),
      vehiclePlate: String(
        rawBooking.vehicle_plate || 
        rawBooking.vehiclePlate || 
        rawBooking.plate || 
        rawBooking.license_plate ||
        "N/A"
      ),
      time: {
        start: rawBooking.start_time || rawBooking.startTime || rawBooking.time?.start || new Date().toISOString(),
        end: rawBooking.end_time || rawBooking.endTime || rawBooking.time?.end || new Date().toISOString(),
        durationHours: Number(
          rawBooking.duration_hours || 
          rawBooking.durationHours || 
          rawBooking.duration ||
          rawBooking.time?.durationHours || 
          1
        ),
      },
    };
    
    // Validate critical fields exist
    if (!normalizedBooking.id) {
      console.error("❌ [fetchBookingById] Missing booking ID");
      throw new Error("Invalid booking data: Missing ID");
    }
    
    if (!normalizedBooking.garageId) {
      console.error("❌ [fetchBookingById] Missing garage ID");
      throw new Error("Invalid booking data: Missing garage ID");
    }
    
    return normalizedBooking;
  } catch (error) {
    console.error("❌ [fetchBookingById] Error:", error);
    throw new Error(formatError(error));
  }
}

// ==================== PAYMENT ====================

/**
 * Process payment for a booking
 * Endpoint: POST /bookings/pay
 * Maps frontend data to backend-expected snake_case format
 */
export async function processPayment(payload: {
  parkingSpotId: string;
  garageId: string;
  userId: string;
  totalAmount: number;
  startTime: string;
  endTime: string;
  durationHours: number;
  paymentMethod: "card" | "wallet" | "cash" | "credit_card";
  vehiclePlate?: string;
}): Promise<any> {
  try {
    // Map frontend camelCase to backend snake_case
    const backendPayload = {
      parking_spot_id: payload.parkingSpotId,
      garage_id: payload.garageId,
      user_id: payload.userId,
      total_amount: payload.totalAmount,
      start_time: payload.startTime,
      end_time: payload.endTime,
      duration_hours: payload.durationHours, // CRITICAL: Required by backend
      payment_method: payload.paymentMethod,
      vehicle_plate: payload.vehiclePlate,
    };
    
    const response = await api.post("/bookings/pay", backendPayload);
    const result = extractData<any>(response);
    
    return result;
  } catch (error) {
    console.error("❌ Payment error:", error);
    throw new Error(formatError(error));
  }
}

/**
 * @deprecated Use processPayment instead
 */
export const mockPayment = processPayment;

// ==================== EXPORTS ====================

export { api };
