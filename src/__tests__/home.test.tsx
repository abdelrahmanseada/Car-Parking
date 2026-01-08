import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { HomePage } from "@/pages/Home";
import type { Garage } from "@/types";

vi.mock("@/components/map/MapView", () => ({
  MapView: () => <div data-testid="mock-map">Map here</div>,
}));

const garages: Garage[] = [
  {
    id: "g1",
    name: "Mock Garage",
    description: "Safe place",
    pricePerHour: 4,
    amenities: ["CCTV"],
    totalSlots: 10,
    availableSlots: 4,
    image: "/assets/mock.jpg",
    location: { lat: 0, lng: 0, address: "Main St" },
    floors: [
      {
        id: "f1",
        name: "Ground",
        level: 0,
        totalSlots: 2,
        availableSlots: 1,
        layout: [
          { id: "s1", number: "1", status: "available", level: 0, vehicleSize: "compact", pricePerHour: 4 },
          { id: "s2", number: "2", status: "occupied", level: 0, vehicleSize: "compact", pricePerHour: 4 },
        ],
      },
    ],
  },
];

vi.mock("@/services/api", () => ({
  __esModule: true,
  fetchGarages: vi.fn(() => Promise.resolve(garages)),
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads garages and renders cards", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/mock garage/i)).toBeVisible();
    });

    expect(screen.getByTestId("mock-map")).toBeVisible();
    expect(screen.getByText(/Main St/)).toBeVisible();
  });
});
