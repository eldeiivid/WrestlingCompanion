import { useEffect, useRef, useState } from "react";

import { terminateContract as saveTermination } from "../../services/market/marketContractsService";

import type {
  TerminateContractInput,
  TerminateContractResult,
} from "../../types/market/marketContracts.types";

export function useTerminateContract() {
  const [isTerminating, setIsTerminating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function terminate(
    input: TerminateContractInput,
  ): Promise<TerminateContractResult | null> {
    if (inFlightRef.current || !mountedRef.current) {
      return null;
    }

    inFlightRef.current = true;
    setIsTerminating(true);
    setErrorMessage("");

    try {
      return await saveTermination(input);
    } catch (error: unknown) {
      if (mountedRef.current) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to terminate the contract. Please try again.",
        );
      }

      return null;
    } finally {
      inFlightRef.current = false;

      if (mountedRef.current) {
        setIsTerminating(false);
      }
    }
  }

  function clearError() {
    if (!mountedRef.current || inFlightRef.current) {
      return;
    }

    setErrorMessage("");
  }

  return {
    isTerminating,
    errorMessage,
    terminate,
    clearError,
  };
}
