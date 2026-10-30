import { useRef, useState } from "react";
import { deleteSegment as deleteSegmentRequest } from "../services/bookingService";

export function useDeleteBookingSegment() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inFlightRef = useRef(false);

  async function deleteSegment(
    careerId: string,
    eventId: string,
    segmentId: string,
  ): Promise<boolean> {
    if (inFlightRef.current) return false;

    inFlightRef.current = true;
    setIsDeleting(true);
    setErrorMessage("");

    try {
      await deleteSegmentRequest(careerId, eventId, segmentId);
      return true;
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P0001" &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Unable to delete the segment. Please try again.";

      setErrorMessage(message);
      return false;
    } finally {
      inFlightRef.current = false;
      setIsDeleting(false);
    }
  }

  function clearError() {
    setErrorMessage("");
  }

  return {
    isDeleting,
    errorMessage,
    deleteSegment,
    clearError,
  };
}
