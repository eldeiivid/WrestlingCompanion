import { useId } from "react";
import type { BookingSegmentSummary } from "../../types/booking.types";
import type {
  BookingMatchRatingOption,
  BookingMatchResultDraft,
  BookingMatchResultsDraft,
} from "../../types/bookingResults.types";
import "./MatchResultsEditor.scss";

type MatchSegment = Extract<BookingSegmentSummary, { kind: "match" }>;

interface MatchTeam {
  side: number;
  name: string;
}

interface MatchResultsEditorProps {
  segments: BookingSegmentSummary[];
  ratings: BookingMatchRatingOption[];
  results: BookingMatchResultsDraft;
  disabled?: boolean;
  onResultChange: (
    segmentId: string,
    changes: Partial<BookingMatchResultDraft>,
  ) => void;
}

function getMatchTeams(segment: MatchSegment): MatchTeam[] {
  const teams = new Map<number, string[]>();

  for (const participant of segment.participants) {
    const members = teams.get(participant.side) ?? [];

    members.push(participant.name);
    teams.set(participant.side, members);
  }

  return [...teams.entries()]
    .sort(([firstSide], [secondSide]) => firstSide - secondSide)
    .map(([side, members]) => ({
      side,
      name: members.join(" & "),
    }));
}

export default function MatchResultsEditor({
  segments,
  ratings,
  results,
  disabled = false,
  onResultChange,
}: MatchResultsEditorProps) {
  const titleId = useId();

  const matches = segments
    .filter((segment): segment is MatchSegment => segment.kind === "match")
    .sort((first, second) => first.position - second.position);

  return (
    <section className="match-results" aria-labelledby={titleId}>
      <header className="match-results__header">
        <h2 id={titleId}>Match results</h2>
        <p>Choose the winning side and rating for each match.</p>
      </header>

      {matches.length === 0 ? (
        <p className="match-results__empty">No matches are available.</p>
      ) : (
        <div className="match-results__list">
          {matches.map((segment) => {
            const teams = getMatchTeams(segment);

            const result = results[segment.id] ?? {
              winningSide: null,
              ratingStars: null,
            };

            const hasValidWinner = teams.some(
              (team) => team.side === result.winningSide,
            );

            const selectedRating = ratings.find(
              (rating) => rating.stars === result.ratingStars,
            );

            const isComplete = hasValidWinner && selectedRating !== undefined;

            const hasUnavailableRating =
              result.ratingStars !== null && selectedRating === undefined;

            return (
              <article className="match-results__match" key={segment.id}>
                <header className="match-results__match-header">
                  <div className="match-results__match-info">
                    <p className="match-results__position">
                      Segment {segment.position}
                    </p>

                    <h3 className="match-results__title">
                      {teams.map((team) => team.name).join(" vs ")}
                    </h3>

                    <p className="match-results__meta">
                      {[segment.label, segment.stipulation_name]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

                    {segment.title && (
                      <p className="match-results__meta">
                        Title match · {segment.title.name}
                      </p>
                    )}

                    {segment.interference && (
                      <p className="match-results__meta">
                        Interference · {segment.interference.wrestler_name}
                        {" → "}
                        {segment.interference.target_wrestler_name}
                      </p>
                    )}
                  </div>

                  <span
                    className={
                      isComplete
                        ? "match-results__status match-results__status--complete"
                        : "match-results__status"
                    }
                  >
                    {isComplete ? "Complete" : "Pending"}
                  </span>
                </header>

                <fieldset className="match-results__fields" disabled={disabled}>
                  <legend className="match-results__legend">
                    Results for segment {segment.position}
                  </legend>

                  <label className="match-results__field">
                    <span>Winner</span>

                    <select
                      value={hasValidWinner ? String(result.winningSide) : ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        const side = value === "" ? null : Number(value);

                        if (
                          side !== null &&
                          !teams.some((team) => team.side === side)
                        ) {
                          return;
                        }

                        onResultChange(segment.id, {
                          winningSide: side,
                        });
                      }}
                    >
                      <option value="">Select a winner</option>

                      {teams.map((team) => (
                        <option key={team.side} value={team.side}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="match-results__field">
                    <span>Match rating</span>

                    <select
                      value={selectedRating ? String(selectedRating.stars) : ""}
                      disabled={ratings.length === 0}
                      onChange={(event) => {
                        const value = event.target.value;

                        if (value === "") {
                          onResultChange(segment.id, {
                            ratingStars: null,
                          });
                          return;
                        }

                        const rating = ratings.find(
                          (item) => String(item.stars) === value,
                        );

                        if (!rating) return;

                        onResultChange(segment.id, {
                          ratingStars: rating.stars,
                        });
                      }}
                    >
                      <option value="">Select a rating</option>

                      {ratings.map((rating) => (
                        <option key={rating.stars} value={rating.stars}>
                          {rating.stars} {rating.stars === 1 ? "star" : "stars"}
                          {" — "}
                          {rating.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </fieldset>

                {hasUnavailableRating && (
                  <p className="match-results__warning">
                    The saved rating is no longer available. Choose another
                    rating.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
