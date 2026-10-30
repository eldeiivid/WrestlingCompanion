import { useState } from "react";

import SignWrestlerModal from "./SignWrestlerModal";

import type {
  SigningWrestlerReference,
  SignWrestlerResult,
} from "../../types/market/marketContracts.types";
import type { MyGmCareerDetails } from "../../types/mygm.types";

interface WrestlerSigningActionProps {
  career: MyGmCareerDetails;
  wrestler: SigningWrestlerReference;
  wrestlerName: string;
  onSigned: (result: SignWrestlerResult) => void;
}

export default function WrestlerSigningAction({
  career,
  wrestler,
  wrestlerName,
  onSigned,
}: WrestlerSigningActionProps) {
  const [isOpen, setIsOpen] = useState(false);

  function handleSigned(result: SignWrestlerResult) {
    setIsOpen(false);
    onSigned(result);
  }

  return (
    <div>
      <button
        className="wrestler-profile__button"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        Sign wrestler
      </button>

      {isOpen && (
        <SignWrestlerModal
          careerId={career.id}
          wrestler={wrestler}
          wrestlerName={wrestlerName}
          currentTick={career.current_tick}
          financesEnabled={career.finances_enabled}
          budgetAvailable={career.budget_total}
          onClose={() => setIsOpen(false)}
          onSigned={handleSigned}
        />
      )}
    </div>
  );
}
