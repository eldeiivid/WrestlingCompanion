import { useId, useState } from "react";
import { Check, Star, Trophy, UserRound } from "lucide-react";

import type { BookingSegmentSummary } from "../../types/booking.types";
import type {
  BookingMatchRatingOption,
  BookingMatchResultDraft,
  BookingMatchResultsDraft,
} from "../../types/bookingResults.types";

import "./MatchResultsEditor.scss";

type MatchSegment = Extract<BookingSegmentSummary, { kind: "match" }>;
type MatchParticipant = MatchSegment["participants"][number];

interface MatchTeam {
  side: number;
  name: string;
  members: MatchParticipant[];
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

interface MatchResultCardProps {
  segment: MatchSegment;
  ratings: BookingMatchRatingOption[];
  result: BookingMatchResultDraft;
  disabled: boolean;
  onChange: (changes: Partial<BookingMatchResultDraft>) => void;
}

function getMatchTeams(segment: MatchSegment): MatchTeam[] {
  const teams = new Map<number, MatchParticipant[]>();

  for (const participant of segment.participants) {
    const members = teams.get(participant.side) ?? [];

    members.push(participant);
    teams.set(participant.side, members);
  }

  return [...teams.entries()]
    .sort(([firstSide], [secondSide]) => firstSide - secondSide)
    .map(([side, members]) => ({
      side,
      name: members.map((member) => member.name).join(" & "),
      members,
    }));
}

function ParticipantImage({ src }: { src: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return src && src !== failedUrl ? (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailedUrl(src)}
    />
  ) : (
    <UserRound size={28} strokeWidth={1.25} aria-hidden="true" />
  );
}

function MatchResultCard({
  segment,
  ratings,
  result,
  disabled,
  onChange,
}: MatchResultCardProps) {
  const headingId = useId();
  const winnerName = useId();

  const teams = getMatchTeams(segment);

  const hasValidWinner = teams.some((team) => team.side === result.winningSide);

  const selectedRating = ratings.find(
    (rating) => rating.stars === result.ratingStars,
  );

  const isComplete = hasValidWinner && selectedRating !== undefined;

  const hasUnavailableRating =
    result.ratingStars !== null && selectedRating === undefined;

  return (
    <article className="match-results__match" aria-labelledby={headingId}>
      <header className="match-results__match-header">
        <div className="match-results__match-info">
          <p className="match-results__position">Segment {segment.position}</p>

          <h3 id={headingId} className="match-results__title">
            {teams.map((team) => team.name).join(" vs ") ||
              "Participants unavailable"}
          </h3>

          <p className="match-results__meta">
            {[segment.label, segment.stipulation_name]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>

        <span
          className={`match-results__status${
            isComplete ? " match-results__status--complete" : ""
          }`}
        >
          {isComplete && <Check size={13} aria-hidden="true" />}
          {isComplete ? "Complete" : "Pending"}
        </span>
      </header>

      {segment.title && (
        <p className="match-results__championship">
          <Trophy size={14} aria-hidden="true" />
          <span>Title match</span>
          <strong>{segment.title.name}</strong>
        </p>
      )}

      {segment.interference && (
        <p className="match-results__meta">
          Interference · {segment.interference.wrestler_name}
          {" → "}
          {segment.interference.target_wrestler_name}
        </p>
      )}

      <fieldset className="match-results__fields" disabled={disabled}>
        <legend className="match-results__legend">
          Results for segment {segment.position}
        </legend>

        <fieldset className="match-results__winner">
          <legend>Who won?</legend>

          <div className="match-results__teams">
            {teams.map((team) => (
              <label className="match-results__team" key={team.side}>
                <input
                  type="radio"
                  name={winnerName}
                  value={team.side}
                  checked={result.winningSide === team.side}
                  onChange={() => onChange({ winningSide: team.side })}
                />

                <span className="match-results__portraits" aria-hidden="true">
                  {team.members.map((member) => (
                    <span
                      className="match-results__portrait"
                      key={member.wrestler_id}
                    >
                      <ParticipantImage src={member.image_url} />
                    </span>
                  ))}
                </span>

                <span className="match-results__team-name">{team.name}</span>

                <span className="match-results__team-state">
                  {result.winningSide === team.side ? (
                    <>
                      <Check size={13} aria-hidden="true" />
                      Winner
                    </>
                  ) : (
                    "Select winner"
                  )}
                </span>
              </label>
            ))}
          </div>

          {hasValidWinner && (
            <button
              className="match-results__clear"
              type="button"
              onClick={() => onChange({ winningSide: null })}
            >
              Clear winner
            </button>
          )}
        </fieldset>

        <div className="match-results__rating">
          <label className="match-results__field">
            <span>
              <Star size={15} aria-hidden="true" />
              Match rating
            </span>

            <select
              value={selectedRating ? String(selectedRating.stars) : ""}
              disabled={ratings.length === 0}
              onChange={(event) => {
                const value = event.target.value;

                if (value === "") {
                  onChange({ ratingStars: null });
                  return;
                }

                const rating = ratings.find(
                  (item) => String(item.stars) === value,
                );

                if (rating) {
                  onChange({ ratingStars: rating.stars });
                }
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

          {selectedRating && (
            <p className="match-results__rating-preview">
              <Star size={16} aria-hidden="true" />
              <strong>{selectedRating.stars}</strong>
              <span>{selectedRating.name}</span>
            </p>
          )}

          {ratings.length === 0 && (
            <p className="match-results__warning">
              No match ratings are available.
            </p>
          )}

          {hasUnavailableRating && (
            <p className="match-results__warning">
              The saved rating is no longer available. Choose another rating.
            </p>
          )}
        </div>
      </fieldset>
    </article>
  );
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

  const completeCount = matches.filter((segment) => {
    const result = results[segment.id];

    return (
      result !== undefined &&
      getMatchTeams(segment).some((team) => team.side === result.winningSide) &&
      ratings.some((rating) => rating.stars === result.ratingStars)
    );
  }).length;

  return (
    <section className="match-results" aria-labelledby={titleId}>
      <header className="match-results__header">
        <div>
          <h2 id={titleId}>Match results</h2>
          <p>Select the winning team and match rating from your game.</p>
        </div>

        {matches.length > 0 && (
          <p className="match-results__progress" role="status">
            <strong>{completeCount}</strong> / {matches.length} complete
          </p>
        )}
      </header>

      {matches.length === 0 ? (
        <p className="match-results__empty">No matches are available.</p>
      ) : (
        <div className="match-results__list">
          {matches.map((segment) => (
            <MatchResultCard
              key={segment.id}
              segment={segment}
              ratings={ratings}
              result={
                results[segment.id] ?? {
                  winningSide: null,
                  ratingStars: null,
                }
              }
              disabled={disabled}
              onChange={(changes) => onResultChange(segment.id, changes)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
