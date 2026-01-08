import { Slot } from "@/types";
import { motion } from "framer-motion";

interface ParkingLayoutProps {
  slots: Slot[];
  selectedSlotId?: string;
  onSelect?: (slot: Slot) => void;
  selectedDuration?: number;
}

const slotStateClasses: Record<Slot["status"], string> = {
  available: "bg-brand-muted/80 text-brand border-transparent dark:bg-brand-muted/30 dark:text-brand",
  occupied: "bg-surface border border-transparent text-text-muted opacity-60 dark:bg-surface-dark dark:text-text-dark-on-surface/40",
  reserved: "bg-warning/10 text-warning border-warning/40 dark:bg-warning/20 dark:text-warning",
};

export function ParkingLayout({ slots, selectedSlotId, onSelect, selectedDuration = 2 }: ParkingLayoutProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
        {slots.map((slot) => {
          const isSelected = selectedSlotId === slot.id;
          // Calculate total price for the selected duration
          const totalPrice = slot.pricePerHour * selectedDuration;
          return (
            <motion.button
              key={slot.id}
              layout
              whileTap={{ scale: 0.97 }}
              disabled={slot.status !== "available"}
              onClick={() => slot.status === "available" && onSelect?.(slot)}
              className={`rounded-2xl border p-4 text-left text-sm font-semibold shadow-sm transition ${
                slotStateClasses[slot.status]
              } ${isSelected ? "ring-2 ring-accent shadow-lg" : ""}`}
              aria-pressed={isSelected}
            >
              <p className="dark:text-text-dark-on-surface">Slot {slot.number}</p>
              <p className="text-xs font-normal text-text-muted dark:text-text-dark-on-surface/70">
                ${totalPrice.toFixed(2)} Total
              </p>
            </motion.button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-text-muted dark:text-text-dark-on-surface/70">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-brand" /> Available
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-400" /> Occupied
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-warning" /> Reserved
        </span>
      </div>
    </div>
  );
}
