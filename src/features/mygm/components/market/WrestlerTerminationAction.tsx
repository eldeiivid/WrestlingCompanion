import { useState } from "react";

import TerminateContractModal from "./TerminateContractModal";

import type { TerminateContractResult } from "../../types/market/marketContracts.types";

interface WrestlerTerminationActionProps {
  careerId: string;
  membershipId: string;
  wrestlerName: string;
  hasChampionships: boolean;
  hasActiveRivalries: boolean;
  onTerminated: (result: TerminateContractResult) => void;
}

export default function WrestlerTerminationAction({
  careerId,
  membershipId,
  wrestlerName,
  hasChampionships,
  hasActiveRivalries,
  onTerminated,
}: WrestlerTerminationActionProps) {
  const [isOpen, setIsOpen] = useState(false);

  function handleTerminated(result: TerminateContractResult) {
    setIsOpen(false);
    onTerminated(result);
  }

  return (
    <div>
      <button
        className="wrestler-profile__button"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        Terminate contract
      </button>

      {isOpen && (
        <TerminateContractModal
          careerId={careerId}
          membershipId={membershipId}
          wrestlerName={wrestlerName}
          hasChampionships={hasChampionships}
          hasActiveRivalries={hasActiveRivalries}
          onClose={() => setIsOpen(false)}
          onTerminated={handleTerminated}
        />
      )}
    </div>
  );
}
