import { useRef, useState } from "react";
import { moveSegment as moveSegmentRequest } from "../services/bookingService";

type MoveDirection = "up" | "down";

interface PendingMove {
  segmentId: string;
  direction: MoveDirection;
}

export function useMoveBookingSegment() {
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  const [errorMessage, setErrorMessage] = useState("");

  const inFlightRef = useRef(false);

  async function moveSegment(
    careerId: string,
    eventId: string,
    segmentId: string,
    direction: MoveDirection,
  ): Promise<boolean> {
    if (inFlightRef.current) return false;

    inFlightRef.current = true;
    setPendingMove({ segmentId, direction });
    setErrorMessage("");

    try {
      await moveSegmentRequest(careerId, eventId, segmentId, direction);

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
          : "Unable to reorder the segment. Please try again.";

      setErrorMessage(message);
      return false;
    } finally {
      inFlightRef.current = false;
      setPendingMove(null);
    }
  }

  function clearError() {
    setErrorMessage("");
  }

  return {
    isMoving: pendingMove !== null,
    movingSegmentId: pendingMove?.segmentId ?? null,
    movingDirection: pendingMove?.direction ?? null,
    errorMessage,
    moveSegment,
    clearError,
  };
}
