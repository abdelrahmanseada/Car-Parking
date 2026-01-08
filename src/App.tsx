import { Suspense, useCallback, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/Home";
import { LandingPage } from "@/pages/Landing";
import { LoginPage } from "@/pages/Login";
import { RegisterPage } from "@/pages/Register";
import { ForgotPasswordPage } from "@/pages/ForgotPassword";
import { GaragesPage } from "@/pages/Garages";
import { GarageDetailsPage } from "@/pages/GarageDetails";
import { ChooseFloorPage } from "@/pages/ChooseFloor";
import { BookingConfirmPage } from "@/pages/BookingConfirm";
import { PaymentPage } from "@/pages/Payment";
import { ActiveBookingPage } from "@/pages/ActiveBooking";
import { BookingsPage } from "@/pages/Bookings";
import { ProfilePage } from "@/pages/Profile";
import { AdminDashboardPage } from "@/pages/AdminDashboard";
import { ToastMessage, ToastStack } from "@/components/ui/Toast";
import { AppProvider, useAppContext } from "@/context/AppContext";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Topbar } from "@/components/layout/Topbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

function Layout({ children }: { children: React.ReactNode }) {
  const { state } = useAppContext();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: ToastMessage) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== toast.id)), 3000);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", state.isDarkMode);
  }, [state.isDarkMode]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-40 blur-3xl">
        <div className="absolute -left-10 top-10 h-60 w-60 rounded-full bg-accent/20" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-brand/20" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-6">
        <Topbar onToast={addToast} />
        <main className="pt-6">
          <div className="space-y-8">{children}</div>
        </main>
      </div>
      <BottomNav />
      <ThemeToggle />
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))} />
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />
      <Route path="/auth/forgot" element={<ForgotPasswordPage />} />
      <Route
        path="/home"
        element={
          <Layout>
            <HomePage />
          </Layout>
        }
      />
      <Route
        path="/garages"
        element={
          <Layout>
            <GaragesPage />
          </Layout>
        }
      />
      <Route
        path="/garage/:id"
        element={
          <Layout>
            <GarageDetailsPage />
          </Layout>
        }
      />
      <Route
        path="/garage/:id/choose-floor"
        element={
          <Layout>
            <ChooseFloorPage />
          </Layout>
        }
      />
      <Route
        path="/booking/confirm"
        element={
          <Layout>
            <BookingConfirmPage />
          </Layout>
        }
      />
      <Route
        path="/payment"
        element={
          <Layout>
            <PaymentPage />
          </Layout>
        }
      />
      <Route
        path="/booking/active/:id"
        element={
          <Layout>
            <ActiveBookingPage />
          </Layout>
        }
      />
      <Route
        path="/bookings"
        element={
          <Layout>
            <BookingsPage />
          </Layout>
        }
      />
      <Route
        path="/profile"
        element={
          <Layout>
            <ProfilePage />
          </Layout>
        }
      />
      <Route
        path="/admin"
        element={
          <Layout>
            <AdminDashboardPage />
          </Layout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Suspense fallback={<LoadingSpinner label="Loading screens" />}>
          <AppRoutes />
        </Suspense>
      </AppProvider>
    </BrowserRouter>
  );
}
