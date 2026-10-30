import { useOutletContext, useParams } from "react-router-dom";

import WrestlerSigningAction from "../../components/market/WrestlerSigningAction";
import WrestlerTerminationAction from "../../components/market/WrestlerTerminationAction";
import WrestlerProfileView from "../../components/roster/profile/WrestlerProfileView";
import { useWrestlerProfile } from "../../hooks/roster/useWrestlerProfile";
import WrestlerContractActions from "../../components/market/WrestlerContractActions";
import type { MyGmOutletContext } from "../../types/mygm.types";

import "./WrestlerProfileScreen.scss";

interface WrestlerProfileScreenProps {
  origin?: "roster" | "market";
}

export default function WrestlerProfileScreen({
  origin = "roster",
}: WrestlerProfileScreenProps) {
  const { career, refreshCareer } = useOutletContext<MyGmOutletContext>();

  const { wrestlerId } = useParams<{ wrestlerId: string }>();

  const { data, isLoading, errorMessage, retry } = useWrestlerProfile(
    career.id,
    wrestlerId,
  );

  function handleContractChanged() {
    refreshCareer();
    retry();
  }

  return (
    <WrestlerProfileView
      careerId={career.id}
      backPath={`/mygm/${career.id}/${origin}`}
      backLabel={origin === "market" ? "Back to market" : "Back to roster"}
      data={data}
      isLoading={isLoading}
      errorMessage={errorMessage}
      canRefresh={Boolean(wrestlerId)}
      onRetry={retry}
      contractHistoryWrestlerId={data?.wrestler.id}
      actions={
        data ? (
          data.wrestler.is_on_roster ? (
            data.wrestler.membership ? (
              <WrestlerContractActions
                key={data.wrestler.membership.id}
                career={career}
                profile={data}
                onChanged={handleContractChanged}
              />
            ) : null
          ) : (
            <WrestlerSigningAction
              key={`${career.id}:${data.wrestler.id}`}
              career={career}
              wrestler={{
                source: "career",
                wrestlerId: data.wrestler.id,
              }}
              wrestlerName={data.wrestler.name}
              onSigned={handleContractChanged}
            />
          )
        ) : null
      }
    />
  );
}
