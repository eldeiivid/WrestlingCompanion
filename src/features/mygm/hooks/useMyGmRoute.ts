import { useEffect, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  resolveMyGmRoute,
  resolveMyGmWrestlerRoute,
} from "../services/mygmRouteService";
import type { ResolvedMyGmRoute } from "../routes/mygmPaths";

interface RouteResult {
  key: string;
  route: ResolvedMyGmRoute | null;
  error: boolean;
}

export function useMyGmRoute(
  careerRef: string,
  titleRef: string | null,
  wrestlerRef: string | null,
) {
  const { user } = useAuth();
  const ownerId = user?.id;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<RouteResult | null>(null);
  const key = JSON.stringify([ownerId, careerRef, titleRef, wrestlerRef, attempt]);
  const current = result?.key === key ? result : null;

  useEffect(() => {
    if (!ownerId || !careerRef) return;

    const controller = new AbortController();
    const request = wrestlerRef
      ? resolveMyGmWrestlerRoute(careerRef, wrestlerRef, controller.signal)
      : resolveMyGmRoute(careerRef, titleRef, controller.signal);

    void request.then(
      (route) => {
        if (!controller.signal.aborted) setResult({ key, route, error: false });
      },
      () => {
        if (!controller.signal.aborted) setResult({ key, route: null, error: true });
      },
    );

    return () => controller.abort();
  }, [ownerId, careerRef, titleRef, wrestlerRef, key]);

  return {
    route: current?.route ?? null,
    isLoading: Boolean(ownerId && careerRef && !current),
    hasError: current?.error ?? false,
    retry: () => setAttempt((value) => value + 1),
  };
}
