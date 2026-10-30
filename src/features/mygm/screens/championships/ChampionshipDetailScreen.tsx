import { useId, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";

import ChampionshipOverview from "../../components/championships/detail/ChampionshipOverview";
import ChampionshipReignHistory from "../../components/championships/detail/ChampionshipReignHistory";
import ReignDefensesModal from "../../components/championships/detail/ReignDefensesModal";

import { useChampionshipDetail } from "../../hooks/championships/useChampionshipDetail";

import type {
  ChampionshipDetailData,
  ChampionshipReign,
} from "../../types/championships/championshipDetail.types";
import type { MyGmOutletContext } from "../../types/mygm.types";

import "./ChampionshipDetailScreen.scss";

interface ChampionshipDetailContentProps {
  data: ChampionshipDetailData;
}

function ChampionshipDetailContent({ data }: ChampionshipDetailContentProps) {
  const [selectedReign, setSelectedReign] = useState<ChampionshipReign | null>(
    null,
  );

  const isBriefcase = data.championship.category === "mitb";

  function handleViewDefenses(reign: ChampionshipReign) {
    if (isBriefcase || reign.defenses === 0) {
      return;
    }

    setSelectedReign(reign);
  }

  return (
    <div className="championship-detail-screen__sections">
      <ChampionshipOverview data={data} />

      <ChampionshipReignHistory
        careerId={data.career_id}
        titleId={data.championship.id}
        category={data.championship.category}
        onViewDefenses={handleViewDefenses}
      />

      {selectedReign && !isBriefcase && (
        <ReignDefensesModal
          key={`defenses:${selectedReign.id}`}
          careerId={data.career_id}
          titleId={data.championship.id}
          reign={selectedReign}
          onClose={() => setSelectedReign(null)}
        />
      )}
    </div>
  );
}

export default function ChampionshipDetailScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();
  const { titleId } = useParams<{ titleId: string }>();
  const headingId = useId();

  const { data, isLoading, errorMessage, retry } = useChampionshipDetail(
    career.id,
    titleId,
  );

  const isBriefcase = data?.championship.category === "mitb";

  return (
    <section className="championship-detail-screen" aria-labelledby={headingId}>
      <header className="championship-detail-screen__header">
        <Link
          className="championship-detail-screen__back-link"
          to={`/mygm/${career.id}/titles`}
        >
          ← Back to championships
        </Link>

        <div className="championship-detail-screen__heading">
          <div>
            <p className="championship-detail-screen__eyebrow">Title history</p>

            <h1 id={headingId}>
              {isBriefcase ? "Briefcase details" : "Championship details"}
            </h1>

            <p className="championship-detail-screen__description">
              {isBriefcase
                ? "Explore current and previous briefcase holders."
                : "Explore current champions, reign history and successful defenses."}
            </p>
          </div>

          <button
            className="championship-detail-screen__button"
            type="button"
            disabled={isLoading || !titleId}
            onClick={retry}
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="championship-detail-screen__body" aria-busy={isLoading}>
        {isLoading && (
          <div className="championship-detail-screen__state">
            <p role="status">Loading championship details…</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="championship-detail-screen__state">
            <h2>The championship could not be loaded</h2>

            <p role="alert">{errorMessage}</p>

            {titleId && (
              <button
                className="championship-detail-screen__button"
                type="button"
                onClick={retry}
              >
                Try again
              </button>
            )}
          </div>
        )}

        {!isLoading && !errorMessage && data && (
          <ChampionshipDetailContent
            key={`championship:${data.career_id}:${data.championship.id}`}
            data={data}
          />
        )}
      </div>
    </section>
  );
}
