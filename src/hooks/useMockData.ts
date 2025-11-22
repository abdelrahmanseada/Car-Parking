import { useEffect, useState } from "react";
import type { Garage } from "@/types";
import { garagesMock } from "@/services/mock";

export function useMockGarages() {
  const [garages, setGarages] = useState<Garage[]>([]);
  useEffect(() => {
    const timer = setTimeout(() => setGarages(garagesMock), 200);
    return () => clearTimeout(timer);
  }, []);
  return garages;
}
