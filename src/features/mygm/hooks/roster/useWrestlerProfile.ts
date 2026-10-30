import { useEffect, useState } from "react";
import { getWrestlerProfile } from "../../services/roster/careerRosterService";
import type { WrestlerProfileData } from "../../types/roster/wrestlerProfile.types";

interface WrestlerProfileState {
  scope: string;
  data: WrestlerProfileData | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useWrestlerProfile(
  careerId: string,
  wrestlerId: string | undefined,
  historyLimit = 5,
) {
  const scope = JSON.stringify([careerId, wrestlerId ?? "", historyLimit]);

  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<WrestlerProfileState>(() => ({
    scope,
    data: null,
    isLoading: Boolean(wrestlerId),
    errorMessage: wrestlerId ? "" : "No wrestler was selected.",
  }));

  useEffect(() => {
    if (!wrestlerId) {
      setState({
        scope,
        data: null,
        isLoading: false,
        errorMessage: "No wrestler was selected.",
      });

      return;
    }

    const controller = new AbortController();
    let isActive = true;

    setState({
      scope,
      data: null,
      isLoading: true,
      errorMessage: "",
    });

    async function loadProfile(selectedWrestlerId: string) {
      try {
        const data = await getWrestlerProfile(
          careerId,
          selectedWrestlerId,
          controller.signal,
          historyLimit,
        );

        if (!isActive) {
          return;
        }

        setState({
          scope,
          data,
          isLoading: false,
          errorMessage: "",
        });
      } catch (error: unknown) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setState({
          scope,
          data: null,
          isLoading: false,
          errorMessage:
            error instanceof Error
              ? error.message
              : "The wrestler profile could not be loaded.",
        });
      }
    }

    void loadProfile(wrestlerId);

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [careerId, wrestlerId, historyLimit, scope, attempt]);

  const isCurrentScope = state.scope === scope;

  const isLoading = Boolean(wrestlerId) && (!isCurrentScope || state.isLoading);

  function retry() {
    if (!wrestlerId || isLoading) {
      return;
    }

    setState({
      scope,
      data: null,
      isLoading: true,
      errorMessage: "",
    });

    setAttempt((current) => current + 1);
  }

  return {
    data: wrestlerId && isCurrentScope ? state.data : null,
    isLoading,
    errorMessage: !wrestlerId
      ? "No wrestler was selected."
      : isCurrentScope
        ? state.errorMessage
        : "",
    retry,
  };
}
