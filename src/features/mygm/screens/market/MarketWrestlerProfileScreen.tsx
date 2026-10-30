import { useNavigate, useOutletContext, useParams } from "react-router-dom";

import WrestlerSigningAction from "../../components/market/WrestlerSigningAction";
import WrestlerProfileView from "../../components/roster/profile/WrestlerProfileView";
import { useMarketProfile } from "../../hooks/market/useMarketProfile";

import type { SignWrestlerResult } from "../../types/market/marketContracts.types";
import type { MyGmOutletContext } from "../../types/mygm.types";
import WrestlerContractActions from "../../components/market/WrestlerContractActions";

import "../roster/WrestlerProfileScreen.scss";

export default function MarketWrestlerProfileScreen() {
  const { career, refreshCareer } = useOutletContext<MyGmOutletContext>();

  const navigate = useNavigate();

  const { catalogWrestlerId } = useParams<{
    catalogWrestlerId: string;
  }>();

  const { data, isLoading, errorMessage, retry } = useMarketProfile(
    career.id,
    catalogWrestlerId,
  );

  const profile = data?.profile;

  function handleSigned(result: SignWrestlerResult) {
    refreshCareer();

    navigate(`/mygm/${career.id}/market/wrestlers/${result.wrestler_id}`, {
      replace: true,
    });
  }

  function handleTerminated() {
    refreshCareer();
    retry();
  }

  return (
    <WrestlerProfileView
      careerId={career.id}
      backPath={`/mygm/${career.id}/market`}
      backLabel="Back to market"
      data={profile ?? null}
      isLoading={isLoading}
      errorMessage={errorMessage}
      canRefresh={Boolean(catalogWrestlerId)}
      onRetry={retry}
      contractHistoryWrestlerId={
        data?.source === "career" ? data.profile.wrestler.id : undefined
      }
      actions={
        data && profile ? (
          profile.wrestler.is_on_roster ? (
            profile.wrestler.membership ? (
              <WrestlerContractActions
                key={profile.wrestler.membership.id}
                career={career}
                profile={profile}
                onChanged={handleTerminated}
              />
            ) : null
          ) : (
            <WrestlerSigningAction
              key={`${career.id}:${data.catalog_wrestler_id}`}
              career={career}
              wrestler={
                data.source === "career"
                  ? {
                      source: "career",
                      wrestlerId: profile.wrestler.id,
                    }
                  : {
                      source: "catalog",
                      catalogWrestlerId: data.catalog_wrestler_id,
                    }
              }
              wrestlerName={profile.wrestler.name}
              onSigned={handleSigned}
            />
          )
        ) : null
      }
    />
  );
}
