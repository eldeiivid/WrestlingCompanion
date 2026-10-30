import { useId, useState } from "react";
import { Trophy } from "lucide-react";

import RivalryParticipants from "../dashboard/rivalries/RivalryParticipants";

import type {
  SeasonDraftReviewChampionship,
  SeasonDraftReviewRivalry,
  SeasonDraftReviewRivalryMember,
} from "../../types/season-draft/seasonDraftReview.types";

import "./SeasonDraftEffectsReview.scss";

interface SeasonDraftEffectsReviewProps {
  championships: SeasonDraftReviewChampionship[];
  rivalries: SeasonDraftReviewRivalry[];
}

function TitleImage({ src }: { src: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <span
      className="season-draft-effects-review__title-image"
      aria-hidden="true"
    >
      {src && src !== failedUrl ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailedUrl(src)}
        />
      ) : (
        <Trophy size={40} />
      )}
    </span>
  );
}

function getSideNames(
  members: SeasonDraftReviewRivalryMember[],
  side: 1 | 2,
): string {
  return (
    members
      .filter((member) => member.side === side)
      .map((member) => member.name)
      .join(" & ") || `Side ${side}`
  );
}

function getRivalryName(rivalry: SeasonDraftReviewRivalry): string {
  return (
    rivalry.name?.trim() ||
    `${getSideNames(rivalry.members, 1)} vs ${getSideNames(rivalry.members, 2)}`
  );
}

export default function SeasonDraftEffectsReview({
  championships,
  rivalries,
}: SeasonDraftEffectsReviewProps) {
  const headingId = useId();
  const titlesHeadingId = useId();
  const rivalriesHeadingId = useId();

  return (
    <section
      className="season-draft-effects-review"
      aria-labelledby={headingId}
    >
      <header className="season-draft-effects-review__header">
        <h2 id={headingId}>Championships and rivalries</h2>

        <p>
          Review how your final roster affects current titles and active
          rivalries.
        </p>
      </header>

      <div className="season-draft-effects-review__groups">
        <section
          className="season-draft-effects-review__group"
          aria-labelledby={titlesHeadingId}
        >
          <h3 id={titlesHeadingId}>Current titles ({championships.length})</h3>

          {championships.length === 0 ? (
            <p className="season-draft-effects-review__empty">
              No titles currently have holders.
            </p>
          ) : (
            <ul className="season-draft-effects-review__list">
              {championships.map((title) => {
                const isBriefcase = title.category === "mitb";

                const statusLabel = title.will_vacate
                  ? isBriefcase
                    ? "Will become unclaimed"
                    : "Will become vacant"
                  : "Will continue";

                return (
                  <li
                    className="season-draft-effects-review__card"
                    key={title.id}
                  >
                    <div className="season-draft-effects-review__title">
                      <TitleImage src={title.image_url} />

                      <div>
                        <h4>{title.name}</h4>

                        <p>
                          Current holders:{" "}
                          {title.holders
                            .map((holder) => holder.name)
                            .join(" & ") || "Unavailable"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`season-draft-effects-review__status season-draft-effects-review__status--${
                        title.will_vacate ? "changing" : "continuing"
                      }`}
                    >
                      {statusLabel}
                    </span>

                    {title.will_vacate && (
                      <p className="season-draft-effects-review__explanation">
                        All current holders must remain in the final roster to
                        preserve this reign.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          className="season-draft-effects-review__group"
          aria-labelledby={rivalriesHeadingId}
        >
          <h3 id={rivalriesHeadingId}>Active rivalries ({rivalries.length})</h3>

          {rivalries.length === 0 ? (
            <p className="season-draft-effects-review__empty">
              No active rivalries to carry into the new season.
            </p>
          ) : (
            <ul className="season-draft-effects-review__list">
              {rivalries.map((rivalry) => (
                <li
                  className="season-draft-effects-review__card"
                  key={rivalry.id}
                >
                  <h4>{getRivalryName(rivalry)}</h4>

                  <RivalryParticipants
                    compact
                    members={rivalry.members.map((member) => ({
                      wrestler_id: member.id,
                      name: member.name,
                      image_url: member.image_url,
                      side: member.side,
                    }))}
                  />

                  <p className="season-draft-effects-review__level">
                    Level {rivalry.level} / 4
                  </p>

                  <span
                    className={`season-draft-effects-review__status season-draft-effects-review__status--${
                      rivalry.will_end ? "changing" : "continuing"
                    }`}
                  >
                    {rivalry.will_end
                      ? "Will become inactive"
                      : "Will continue"}
                  </span>

                  {rivalry.will_end && (
                    <p className="season-draft-effects-review__explanation">
                      All members must remain in the final roster for this
                      rivalry to continue.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
