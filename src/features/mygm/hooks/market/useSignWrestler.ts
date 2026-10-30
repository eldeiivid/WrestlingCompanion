import { useEffect, useRef, useState } from "react";

import { signWrestler as saveSigning } from "../../services/market/marketContractsService";

import type {
  SignWrestlerInput,
  SignWrestlerResult,
} from "../../types/market/marketContracts.types";

export function useSignWrestler() {
  const [isSigning, setIsSigning] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function sign(
    input: SignWrestlerInput,
  ): Promise<SignWrestlerResult | null> {
    if (inFlightRef.current || !mountedRef.current) {
      return null;
    }

    inFlightRef.current = true;
    setIsSigning(true);
    setErrorMessage("");

    try {
      const result = await saveSigning(input);

      return result;
    } catch (error: unknown) {
      if (mountedRef.current) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to sign the wrestler. Please try again.",
        );
      }

      return null;
    } finally {
      inFlightRef.current = false;

      if (mountedRef.current) {
        setIsSigning(false);
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
    isSigning,
    errorMessage,
    sign,
    clearError,
  };
}
