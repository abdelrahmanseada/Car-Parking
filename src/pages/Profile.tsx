import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppContext } from "@/context/AppContext";
import { updateProfile, fetchProfile } from "@/services/api";
import { useBookingContext } from "@/context/BookingContext";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

type ProfileForm = z.infer<typeof schema>;
type TabType = "overview" | "vehicles" | "payments" | "settings";

// Mock data for vehicles
const mockVehicles = [
  { id: "1", name: "BMW X5", plate: "ABC 123", type: "SUV", color: "Black" },
  { id: "2", name: "Toyota Camry", plate: "XYZ 789", type: "Sedan", color: "White" },
];

// Mock data for payment methods
const mockPaymentMethods = [
  { id: "1", type: "Visa", last4: "4567", expiry: "12/25", isDefault: true },
  { id: "2", type: "Mastercard", last4: "8901", expiry: "06/26", isDefault: false },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const { bookings } = useBookingContext();
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(schema),
    defaultValues: { 
      name: "", 
      email: "", 
      phone: "" 
    },
  });

  // Fetch real user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!state.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const profile = await fetchProfile(state.user.id);
        
        // Update form with real data
        reset({
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || ""
        });

        // Update context with fresh profile data
        dispatch({
          type: "LOGIN",
          payload: {
            user: profile,
            token: state.token || ""
          }
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
        // Fallback to context user data if API fails
        if (state.user) {
          reset({
            name: state.user.name || "",
            email: state.user.email || "",
            phone: state.user.phone || ""
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [state.user?.id]);

  const onSubmit = handleSubmit(async (values) => {
    if (!state.user?.id) {
      setMessage("Please log in first.");
      return;
    }
    
    try {
      const updated = await updateProfile(state.user.id, values);
      dispatch({ 
        type: "LOGIN", 
        payload: { 
          user: updated, 
          token: state.token ?? "mock-token" 
        } 
      });
      setMessage("Profile saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("Failed to save profile.");
    }
  });

  const handleLogout = () => {
    // Clear user state via AppContext
    dispatch({ type: "LOGOUT" });
    
    // Clear all localStorage items
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("bookings");
    localStorage.removeItem("parkspot_bookings"); // BookingContext storage key
    
    // Redirect to landing page
    navigate("/");
  };

  const userBookings = bookings.filter((b) => b.userId === state.user?.id || !state.user?.id);
  const totalBookings = userBookings.length;
  const activeBookings = userBookings.filter((b) => ["active", "upcoming", "confirmed"].includes(b.status)).length;

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: "👤" },
    { id: "vehicles" as TabType, label: "My Vehicles", icon: "🚗" },
    { id: "payments" as TabType, label: "Payments", icon: "💳" },
    { id: "settings" as TabType, label: "Settings", icon: "⚙️" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-8 pb-20">
      {/* Header Summary Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl bg-gradient-to-br from-brand to-accent p-8 shadow-2xl text-white"
      >
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur transition-all hover:scale-105 font-semibold"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          <span className="hidden sm:inline">Logout</span>
        </button>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-4xl font-bold shadow-lg">
            {state.user?.name?.charAt(0) ?? "D"}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold font-heading">{state.user?.name ?? "Demo Driver"}</h1>
            <p className="text-white/90 mt-1">{state.user?.email ?? "demo@parkspot.app"}</p>
            <div className="flex flex-wrap gap-6 mt-4">
              <div>
                <p className="text-white/80 text-sm">Member Since</p>
                <p className="text-xl font-bold">2024</p>
              </div>
              <div>
                <p className="text-white/80 text-sm">Total Bookings</p>
                <p className="text-xl font-bold">{totalBookings}</p>
              </div>
              <div>
                <p className="text-white/80 text-sm">Active Bookings</p>
                <p className="text-xl font-bold">{activeBookings}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-brand text-white shadow-lg scale-105"
                : "bg-surface-elevated text-text hover:bg-brand-muted/30 dark:bg-surface-elevated-dark dark:text-text-dark-on-surface"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-8 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-surface-elevated-dark dark:border dark:border-slate-700/50">
              <h2 className="text-2xl font-bold font-heading dark:text-text-dark-on-surface mb-6">Personal Information</h2>
              <form onSubmit={onSubmit} className="space-y-5">
                <Input label="Full name" {...register("name")} error={errors.name?.message} />
                <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
                <Input label="Phone" type="tel" {...register("phone")} error={errors.phone?.message} />
                {message && <p className="text-success dark:text-success font-semibold">{message}</p>}
                <Button type="submit">Save Changes</Button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "vehicles" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-8 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-surface-elevated-dark dark:border dark:border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-heading dark:text-text-dark-on-surface">My Vehicles</h2>
                <Button variant="tonal" size="sm">+ Add New Vehicle</Button>
              </div>
              <div className="space-y-4">
                {mockVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between p-5 rounded-2xl bg-surface hover:bg-brand-muted/20 transition-all border-2 border-transparent hover:border-brand dark:bg-surface-dark"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-brand-muted flex items-center justify-center text-2xl">
                        🚗
                      </div>
                      <div>
                        <h3 className="text-lg font-bold dark:text-text-dark-on-surface">{vehicle.name}</h3>
                        <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">
                          {vehicle.plate} • {vehicle.type} • {vehicle.color}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button variant="ghost" size="sm" className="text-danger">Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-8 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-surface-elevated-dark dark:border dark:border-slate-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-heading dark:text-text-dark-on-surface">Payment Methods</h2>
                <Button variant="tonal" size="sm">+ Add Payment Method</Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {mockPaymentMethods.map((payment) => (
                  <div
                    key={payment.id}
                    className="relative p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-lg hover:shadow-2xl transition-all hover:scale-105"
                  >
                    {payment.isDefault && (
                      <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-brand text-xs font-bold">
                        Default
                      </span>
                    )}
                    <div className="mb-4">
                      <p className="text-sm text-white/70">Card Type</p>
                      <p className="text-xl font-bold">{payment.type}</p>
                    </div>
                    <div className="mb-4">
                      <p className="text-2xl font-mono tracking-wider">•••• •••• •••• {payment.last4}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-white/70">Expires</p>
                        <p className="font-semibold">{payment.expiry}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-white hover:text-white">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-8 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-surface-elevated-dark dark:border dark:border-slate-700/50">
              <h2 className="text-2xl font-bold font-heading dark:text-text-dark-on-surface mb-6">Account Settings</h2>
              <div className="space-y-6">
                {/* Notifications Toggle */}
                <div className="flex items-center justify-between p-5 rounded-2xl bg-surface dark:bg-surface-dark">
                  <div>
                    <h3 className="text-lg font-bold dark:text-text-dark-on-surface">Push Notifications</h3>
                    <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">
                      Receive notifications about bookings and updates
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`relative w-14 h-8 rounded-full transition-all ${
                      notifications ? "bg-brand" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                        notifications ? "translate-x-6" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Email Alerts Toggle */}
                <div className="flex items-center justify-between p-5 rounded-2xl bg-surface dark:bg-surface-dark">
                  <div>
                    <h3 className="text-lg font-bold dark:text-text-dark-on-surface">Email Alerts</h3>
                    <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">
                      Get email confirmations and reminders
                    </p>
                  </div>
                  <button
                    onClick={() => setEmailAlerts(!emailAlerts)}
                    className={`relative w-14 h-8 rounded-full transition-all ${
                      emailAlerts ? "bg-brand" : "bg-slate-300 dark:bg-slate-600"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                        emailAlerts ? "translate-x-6" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Change Password */}
                <div className="p-5 rounded-2xl bg-surface dark:bg-surface-dark">
                  <h3 className="text-lg font-bold dark:text-text-dark-on-surface mb-2">Security</h3>
                  <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70 mb-4">
                    Manage your password and security settings
                  </p>
                  <Button variant="secondary">Change Password</Button>
                </div>

                {/* Danger Zone */}
                <div className="p-5 rounded-2xl bg-danger/10 border-2 border-danger/30 dark:bg-danger/20">
                  <h3 className="text-lg font-bold text-danger mb-2">Danger Zone</h3>
                  <p className="text-sm text-danger/80 mb-4">
                    Permanently delete your account and all associated data
                  </p>
                  <Button variant="ghost" className="text-danger hover:bg-danger/20">
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
}
