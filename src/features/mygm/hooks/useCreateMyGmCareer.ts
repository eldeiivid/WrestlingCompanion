import { useEffect, useRef, useState } from "react";

import { createCareerService } from "../services/createCareerService";
import { resolveMyGmRoute } from "../services/mygmRouteService";
import type { CreateCareerInput } from "../types/createCareer.types";

function getCreationError(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P0001" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unable to create your career. Please try again.";
}

export function useCreateMyGmCareer() {
  const [isCreating, setIsCreating] = useState(false);
  const [creationError, setCreationError] = useState("");

  const active = useRef(false);
  const inFlight = useRef(false);
  const createdGameId = useRef<string | null>(null);

  useEffect(() => {
    active.current = true;

    return () => {
      active.current = false;
    };
  }, []);

  async function createCareer(
    input: CreateCareerInput,
  ): Promise<string | null> {
    if (inFlight.current) return null;

    inFlight.current = true;
    setIsCreating(true);
    setCreationError("");

    try {
      const gameId = createdGameId.current ?? await createCareerService.create(input);
      createdGameId.current = gameId;

      const route = await resolveMyGmRoute(gameId, null);
      if (!route) throw new Error("The created career could not be resolved.");
      return active.current ? route.career_slug : null;
    } catch (error) {
      if (active.current) {
        setCreationError(
          createdGameId.current
            ? "Your career was saved, but its link could not be loaded. Try again or open it from your career list."
            : getCreationError(error),
        );
      }

      return null;
    } finally {
      inFlight.current = false;

      if (active.current) {
        setIsCreating(false);
      }
    }
  }

  return { createCareer, isCreating, creationError };
}
