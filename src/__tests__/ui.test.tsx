import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ParkingLayout } from "@/components/ParkingLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Slot } from "@/types";

const slots: Slot[] = [
  { id: "1", number: "A1", status: "available", level: 1, vehicleSize: "compact", pricePerHour: 5 },
  { id: "2", number: "A2", status: "occupied", level: 1, vehicleSize: "compact", pricePerHour: 5 },
];

describe("UI components", () => {
  it("renders button text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: /click me/i })).toBeVisible();
  });

  it("shows input label and error state", () => {
    render(<Input label="Email" error="Required" />);
    expect(screen.getByLabelText(/email/i)).toBeVisible();
    expect(screen.getByText(/required/i)).toBeVisible();
  });

  it("triggers slot selection callback", () => {
    const onSelect = vi.fn();
    render(<ParkingLayout slots={slots} onSelect={onSelect} />);
    fireEvent.click(screen.getByText(/slot a1/i));
    expect(onSelect).toHaveBeenCalled();
  });

  it("disables occupied slots", () => {
    render(<ParkingLayout slots={slots} />);
    expect(screen.getByText(/slot a2/i).closest("button")).toBeDisabled();
  });

  it("renders loading spinner label", () => {
    render(<LoadingSpinner label="Fetching data" />);
    expect(screen.getByText(/fetching data/i)).toBeVisible();
  });
});
