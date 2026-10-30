import { useEffect, useRef, useState } from "react";

import { extendContract as saveExtension } from "../../services/market/marketContractsService";

import type {
  ExtendContractInput,
  ExtendContractResult,
} from "../../types/market/marketContracts.types";

export function useExtendContract() {
  const [isExtending, setIsExtending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function extend(
    input: ExtendContractInput,
  ): Promise<ExtendContractResult | null> {
    if (inFlightRef.current || !mountedRef.current) {
      return null;
    }

    inFlightRef.current = true;
    setIsExtending(true);
    setErrorMessage("");

    try {
      return await saveExtension(input);
    } catch (error: unknown) {
      if (mountedRef.current) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to extend the contract. Please try again.",
        );
      }

      return null;
    } finally {
      inFlightRef.current = false;

      if (mountedRef.current) {
        setIsExtending(false);
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
    isExtending,
    errorMessage,
    extend,
    clearError,
  };
}
