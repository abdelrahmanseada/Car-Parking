import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { clsx } from "clsx";
import { useNavigate } from "react-router-dom";

import heroOne from "@/assets/landing-1.jpg";
import heroTwo from "@/assets/landing-2.jpg";
import heroThree from "@/assets/landing-3.jpg";

const slides = [
  {
    id: 0,
    title: "Smart onboarding",
    description: "Plan your trip, reserve a slot, and unlock the gate from any device.",
    image: heroOne,
  },
  {
    id: 1,
    title: "Pick a parking floor",
    description: "Navigate immersive 2D layouts inspired by the provided UI references.",
    image: heroTwo,
  },
  {
    id: 2,
    title: "Visual booking recap",
    description: "Monitor timers, receipts, and EV-ready spots in one pane of glass.",
    image: heroThree,
  },
];

const perks = [
  { title: "EV & valet ready", copy: "Filter garages with concierge, CCTV, and EV chargers." },
  { title: "Live telematics", copy: "Socket-powered timer and incident alerts on every session." },
  { title: "Instant invoices", copy: "Downloadable PDF receipts and VAT-compliant invoices." },
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
    <section className="relative overflow-hidden pb-24 pt-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 lg:flex-row">
        <div className="space-y-8 lg:w-1/2">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-muted/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand">
              rideo
              <span className="text-[10px] font-normal normal-case text-brand-dark">signature fleet</span>
            </p>
            <h1 className="text-4xl font-heading text-text dark:text-text-dark-on-surface lg:text-5xl">
              Premium parking journeys, curated for modern mobility teams.
            </h1>
            <p className="text-lg text-text-muted dark:text-text-dark-on-surface/70">
              Discover elevated garages, visualize floors, and orchestrate every booking with cinematic UI that mirrors
              your deck inspiration.
            </p>
          </div>
          <div className="grid gap-4 rounded-3xl bg-surface-elevated/80 p-6 shadow-xl backdrop-blur dark:bg-surface-elevated-dark/80">
            {perks.map((perk) => (
              <div key={perk.title} className="flex gap-3">
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-muted text-brand">★</span>
                <div>
                  <p className="text-base font-semibold text-text dark:text-text-dark-on-surface">{perk.title}</p>
                  <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">{perk.copy}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/80 px-5 py-4 text-left shadow-md dark:bg-surface-elevated-dark/70">
                <p className="text-2xl font-heading text-brand">{stat.value}</p>
                <p className="text-xs uppercase tracking-wide text-text-muted dark:text-text-dark-on-surface/70">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" onClick={() => navigate("/home")}>
              Explore garages
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate("/auth/register")}>
              Create account
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
                  <p className="text-2xl font-heading">Rideo premium preview</p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-6 text-white">
              <h2 className="text-2xl font-semibold">{activeSlide.title}</h2>
              <p className="text-sm text-white/80">{activeSlide.description}</p>
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
