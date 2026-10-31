import { useState } from "react";
import { UserPlus } from "lucide-react";

import SignWrestlerModal from "./SignWrestlerModal";

import type {
  SigningWrestlerReference,
  SignWrestlerResult,
} from "../../types/market/marketContracts.types";
import type { MyGmCareerDetails } from "../../types/mygm.types";

import "./WrestlerSigningAction.scss";

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
    <section className="wrestler-signing-action" aria-label="Sign wrestler">
      <div className="wrestler-signing-action__heading">
        <h2>Add to your roster</h2>
        <p>Enter the contract details from your game to sign this wrestler.</p>
      </div>

      <button
        className="wrestler-signing-action__button"
        type="button"
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
      >
        <UserPlus size={17} aria-hidden="true" />
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
    </section>
  );
}
