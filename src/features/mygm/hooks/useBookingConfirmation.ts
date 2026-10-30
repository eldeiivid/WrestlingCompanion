import { useRef, useState } from "react";
import {
  confirmBooking as confirmBookingRequest,
  reopenBooking as reopenBookingRequest,
} from "../services/bookingService";

type BookingConfirmationAction = "confirm" | "reopen";

export function useBookingConfirmation() {
  const [pendingAction, setPendingAction] =
    useState<BookingConfirmationAction | null>(null);

  const [errorMessage, setErrorMessage] = useState("");

  const inFlightRef = useRef(false);

  async function updateCardStatus(
    action: BookingConfirmationAction,
    careerId: string,
    eventId: string,
  ): Promise<boolean> {
    if (inFlightRef.current) return false;

    inFlightRef.current = true;
    setPendingAction(action);
    setErrorMessage("");

    try {
      if (action === "confirm") {
        await confirmBookingRequest(careerId, eventId);
      } else {
        await reopenBookingRequest(careerId, eventId);
      }

      return true;
    } catch (error: unknown) {
      const fallbackMessage =
        action === "confirm"
          ? "Unable to confirm the card. Please try again."
          : "Unable to reopen the card. Please try again.";

      const message =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P0001" &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : fallbackMessage;

      setErrorMessage(message);
      return false;
    } finally {
      inFlightRef.current = false;
      setPendingAction(null);
    }
  }

  function confirmCard(careerId: string, eventId: string): Promise<boolean> {
    return updateCardStatus("confirm", careerId, eventId);
  }

  function reopenCard(careerId: string, eventId: string): Promise<boolean> {
    return updateCardStatus("reopen", careerId, eventId);
  }

  function clearError() {
    setErrorMessage("");
  }

  return {
    isSubmitting: pendingAction !== null,
    pendingAction,
    errorMessage,
    confirmCard,
    reopenCard,
    clearError,
  };
}
