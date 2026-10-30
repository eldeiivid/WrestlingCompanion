import { useEffect, useState } from "react";

import { useAuth } from "../../auth/hooks/useAuth";
import { mygmService } from "../services/mygmService";
import type { MyGmCareerDetails } from "../types/mygm.types";

interface CareerState {
  requestKey: string;
  career: MyGmCareerDetails | null;
  isLoading: boolean;
  errorMessage: string;
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useMyGmCareer(careerId: string | undefined) {
  const { user } = useAuth();
  const ownerId = user?.id;

  const requestKey = `${ownerId ?? ""}:${careerId ?? ""}`;

  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<CareerState>({
    requestKey,
    career: null,
    isLoading: true,
    errorMessage: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    if (!ownerId || !careerId || !uuidPattern.test(careerId)) {
      setState({
        requestKey,
        career: null,
        isLoading: false,
        errorMessage: "",
      });

      return;
    }

    setState((previous) => ({
      requestKey,
      career: previous.requestKey === requestKey ? previous.career : null,
      isLoading: true,
      errorMessage: "",
    }));

    async function loadCareer(id: string) {
      try {
        const career = await mygmService.getCareer(id, controller.signal);

        if (!active) return;

        setState({
          requestKey,
          career,
          isLoading: false,
          errorMessage: "",
        });
      } catch {
        if (!active) return;

        setState((previous) => ({
          requestKey,
          career: previous.requestKey === requestKey ? previous.career : null,
          isLoading: false,
          errorMessage: "Unable to load your career. Please try again.",
        }));
      }
    }

    void loadCareer(careerId);

    return () => {
      active = false;
      controller.abort();
    };
  }, [careerId, ownerId, requestKey, attempt]);

  function refreshCareer() {
    setAttempt((value) => value + 1);
  }

  if (state.requestKey !== requestKey) {
    return {
      career: null,
      isLoading: true,
      errorMessage: "",
      refreshCareer,
    };
  }

  return {
    career: state.career,
    isLoading: state.isLoading,
    errorMessage: state.errorMessage,
    refreshCareer,
  };
}
