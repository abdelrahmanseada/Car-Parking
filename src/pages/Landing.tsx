import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { clsx } from "clsx";
import { useNavigate } from "react-router-dom";

import heroOne from "@/assets/1.jpg";
import heroTwo from "@/assets/2.jpg";
import heroThree from "@/assets/3.jpg";

const slides = [
  {
    id: 0,
    title: "Book Instantly, Park Stress-Free",
    description: "Plan your trip, reserve a slot, and unlock the gate from any device.",
    image: heroOne,
  },
  {
    id: 1,
    title: "Choose Your Perfect Spot",
    description: "Browse real-time availability with our interactive floor layouts.",
    image: heroTwo,
  },
  {
    id: 2,
    title: "Track Your Parking Session",
    description: "Monitor your booking, manage receipts, and extend time on the go.",
    image: heroThree,
  },
];

const perks = [
  { title: "24/7 Security", copy: "All facilities feature CCTV surveillance and secure access control." },
  { title: "Contactless Entry", copy: "Unlock gates and enter parking facilities directly from your phone." },
  { title: "Best Price Guarantee", copy: "Competitive hourly rates with transparent pricing and instant invoices." },
  { title: "Wide Vehicle Support", copy: "Accommodate sedans, SUVs, electric vehicles, and motorcycles." },
];

const stats = [
  { label: "Garages onboarded", value: "120+" },
  { label: "Avg. check-in time", value: "38s" },
  { label: "Active drivers", value: "12K" },
];

export function LandingPage() {
  const [current, setCurrent] = useState(0);
  const [brokenSlides, setBrokenSlides] = useState<Record<number, boolean>>({});
  const navigate = useNavigate();

  const activeSlide = useMemo(() => slides[current], [current]);

  return (
    <section className="relative overflow-hidden pb-32 pt-20">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 lg:flex-row">
        <div className="space-y-10 lg:w-1/2">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-muted/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand">
              <img src="/favicon.png" alt="ParkSpot" className="h-4 w-4" />
              <span>ParkSpot</span>
            </div>
            <h1 className="text-4xl font-bold font-heading text-text dark:text-text-dark-on-surface lg:text-5xl leading-tight">
              Secure, Convenient Parking at Your Fingertips
            </h1>
            <p className="text-xl text-text-muted dark:text-text-dark-on-surface/70">
              Discover premium parking locations, visualize available spots in real-time, and reserve your space in seconds. The modern way to park.
            </p>
          </div>
          <div className="grid gap-5 rounded-3xl bg-surface-elevated/80 p-8 shadow-2xl backdrop-blur hover:shadow-2xl transition-all duration-300 dark:bg-surface-elevated-dark/80 dark:hover:shadow-brand/10">
            {perks.map((perk) => (
              <div key={perk.title} className="flex gap-4">
                <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted text-brand text-lg font-bold shadow-md">★</span>
                <div>
                  <p className="text-lg font-bold text-text dark:text-text-dark-on-surface">{perk.title}</p>
                  <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70 mt-1">{perk.copy}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/80 px-6 py-5 text-left shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 dark:bg-surface-elevated-dark/70 dark:hover:shadow-brand/10">
                <p className="text-3xl font-bold font-heading text-brand">{stat.value}</p>
                <p className="text-xs uppercase tracking-wide font-semibold text-text-muted dark:text-text-dark-on-surface/70 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" onClick={() => navigate("/home")}>
              Find Parking Now
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate("/auth/register")}>
              Get Started Free
            </Button>
          </div>
        </div>

        <div className="lg:w-1/2">
          <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-surface-elevated to-brand-muted shadow-2xl">
            <AnimatePresence mode="wait">
              {!brokenSlides[activeSlide.id] && (
                <motion.img
                  key={activeSlide.id}
                  src={activeSlide.image}
                  alt={activeSlide.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.6 }}
                  className="h-[520px] w-full object-cover"
                  onError={() => setBrokenSlides((prev) => ({ ...prev, [activeSlide.id]: true }))}
                />
              )}
              {brokenSlides[activeSlide.id] && (
                <motion.div
                  key={`fallback-${activeSlide.id}`}
                  className="flex h-[520px] w-full items-center justify-center bg-gradient-to-br from-brand to-accent text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-2xl font-heading">ParkSpot</p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-8 text-white">
              <h2 className="text-2xl font-bold">{activeSlide.title}</h2>
              <p className="text-base text-white/90 mt-2">{activeSlide.description}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setCurrent(index)}
                className={clsx(
                  "h-2 w-10 rounded-full transition",
                  current === index ? "bg-brand" : "bg-brand-muted",
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
