import { useEffect, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { resolveMyGmRoute } from "../services/mygmRouteService";
import type { MyGmRoute } from "../routes/mygmPaths";

interface RouteResult {
  key: string;
  route: MyGmRoute | null;
  error: boolean;
}

export function useMyGmRoute(careerRef: string, titleRef: string | null) {
  const { user } = useAuth();
  const ownerId = user?.id;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<RouteResult | null>(null);
  const key = JSON.stringify([ownerId, careerRef, titleRef, attempt]);
  const current = result?.key === key ? result : null;

  useEffect(() => {
    if (!ownerId || !careerRef) return;

    const controller = new AbortController();
    void resolveMyGmRoute(careerRef, titleRef, controller.signal).then(
      (route) => {
        if (!controller.signal.aborted) setResult({ key, route, error: false });
      },
      () => {
        if (!controller.signal.aborted) setResult({ key, route: null, error: true });
      },
    );

    return () => controller.abort();
  }, [ownerId, careerRef, titleRef, key]);

  return {
    route: current?.route ?? null,
    isLoading: Boolean(ownerId && careerRef && !current),
    hasError: current?.error ?? false,
    retry: () => setAttempt((value) => value + 1),
  };
}
