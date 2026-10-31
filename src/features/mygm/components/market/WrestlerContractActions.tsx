import { useState } from "react";
import { CalendarPlus } from "lucide-react";

import ExtendContractModal from "./ExtendContractModal";
import WrestlerTerminationAction from "./WrestlerTerminationAction";

import type { MyGmCareerDetails } from "../../types/mygm.types";
import type { WrestlerProfileData } from "../../types/roster/wrestlerProfile.types";

import "./WrestlerContractActions.scss";

interface WrestlerContractActionsProps {
  career: MyGmCareerDetails;
  profile: WrestlerProfileData;
  onChanged: () => void;
}

export default function WrestlerContractActions({
  career,
  profile,
  onChanged,
}: WrestlerContractActionsProps) {
  const [isExtensionOpen, setIsExtensionOpen] = useState(false);

  const { wrestler } = profile;
  const membership = wrestler.membership;

  if (!wrestler.is_on_roster || !membership) {
    return null;
  }

  const endTick = membership.contract_end_tick;
  const canExtend = endTick !== null && endTick >= profile.current_tick;

  function handleExtended() {
    setIsExtensionOpen(false);
    onChanged();
  }

  return (
    <section className="wrestler-contract-actions" aria-label="Manage contract">
      <div className="wrestler-contract-actions__heading">
        <h2>Manage contract</h2>
        <p>
          {canExtend
            ? "Extend this contract or release the wrestler from your roster."
            : "Release the wrestler from your roster."}
        </p>
      </div>

      <div className="wrestler-contract-actions__buttons">
        {canExtend && (
          <button
            className="wrestler-profile__button wrestler-contract-actions__extend"
            type="button"
            aria-haspopup="dialog"
            onClick={() => setIsExtensionOpen(true)}
          >
            <CalendarPlus size={17} aria-hidden="true" />
            Extend contract
          </button>
        )}

        <WrestlerTerminationAction
          key={`terminate:${membership.id}`}
          careerId={career.id}
          membershipId={membership.id}
          wrestlerName={wrestler.name}
          hasChampionships={profile.championships.length > 0}
          hasActiveRivalries={profile.rivalries.length > 0}
          onTerminated={onChanged}
        />
      </div>

      {isExtensionOpen && canExtend && endTick !== null && (
        <ExtendContractModal
          key={`extend:${membership.id}`}
          careerId={career.id}
          membershipId={membership.id}
          wrestlerName={wrestler.name}
          currentTick={profile.current_tick}
          contractEndTick={endTick}
          financesEnabled={career.finances_enabled}
          budgetAvailable={career.budget_total}
          onClose={() => setIsExtensionOpen(false)}
          onExtended={handleExtended}
        />
      )}
    </section>
  );
}
