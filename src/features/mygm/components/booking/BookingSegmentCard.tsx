import { useId, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowDown,
  ArrowUp,
  LoaderCircle,
  Mic2,
  Pencil,
  Swords,
  Trash2,
  Trophy,
  UserRound,
} from "lucide-react";

import type { BookingSegmentSummary } from "../../types/booking.types";

import "./BookingSegmentCard.scss";

interface BookingSegmentCardProps {
  segment: BookingSegmentSummary;
  financesEnabled: boolean;
  editable: boolean;
  isBusy: boolean;
  isFirst: boolean;
  isLast: boolean;
  movingDirection: "up" | "down" | null;
  onMove: (direction: "up" | "down") => void;
  onEdit: () => void;
  onDelete: () => void;
  winningSide?: number | null;
}

interface Participant {
  wrestler_id: string;
  name: string;
  image_url: string | null;
}

interface ParticipantGroup {
  id: string;
  label: string;
  members: Participant[];
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function AssetImage({
  src,
  fallback,
}: {
  src: string | null;
  fallback: "wrestler" | "title" | "background";
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (src && src !== failedUrl) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailedUrl(src)}
      />
    );
  }

  if (fallback === "wrestler") {
    return <UserRound size={56} strokeWidth={1.25} aria-hidden="true" />;
  }

  if (fallback === "title") {
    return <Trophy size={32} strokeWidth={1.25} aria-hidden="true" />;
  }

  return null;
}

function getGroups(segment: BookingSegmentSummary): ParticipantGroup[] {
  if (segment.kind === "match") {
    const teams = new Map<number, Participant[]>();

    for (const participant of segment.participants) {
      const team = teams.get(participant.side) ?? [];

      team.push(participant);
      teams.set(participant.side, team);
    }

    return [...teams.entries()]
      .sort(([firstSide], [secondSide]) => firstSide - secondSide)
      .map(([side, members]) => ({
        id: `side-${side}`,
        label: `Side ${side}`,
        members,
      }));
  }

  return (["initiator", "target"] as const)
    .map((role) => ({
      id: role,
      label: role === "initiator" ? "Initiators" : "Targets",
      members: segment.participants.filter(
        (participant) => participant.role === role,
      ),
    }))
    .filter((group) => group.members.length > 0);
}

export default function BookingSegmentCard({
  segment,
  financesEnabled,
  editable,
  isBusy,
  isFirst,
  isLast,
  movingDirection,
  onMove,
  onEdit,
  onDelete,
  winningSide,
}: BookingSegmentCardProps) {
  const headingId = useId();

  const groups = getGroups(segment);
  const isMatch = segment.kind === "match";
  const isMultiSide = groups.length > 2;

  const participantsLabel =
    groups
      .map((group) => group.members.map((member) => member.name).join(" & "))
      .join(isMatch ? " vs " : " → ") || "Participants unavailable";

  const formatLabel = isMatch
    ? [segment.label, segment.stipulation_name].filter(Boolean).join(" · ")
    : segment.label;

  const positionLabel =
    isFirst && isLast
      ? "Only segment"
      : isFirst
        ? "Opener"
        : isLast
          ? "Final segment"
          : null;

  const teamsStyle = {
    "--booking-side-count": Math.max(1, groups.length),
  } as CSSProperties;

  return (
    <article className="booking-segment-card" aria-labelledby={headingId}>
      <header className="booking-segment-card__header">
        <div className="booking-segment-card__meta">
          <span
            className="booking-segment-card__position"
            aria-label={`Segment ${segment.position}`}
          >
            {segment.position}
          </span>

          <span className="booking-segment-card__kind">
            {isMatch ? (
              <Swords size={14} aria-hidden="true" />
            ) : (
              <Mic2 size={14} aria-hidden="true" />
            )}
            {isMatch ? "Match" : "Promo"}
          </span>

          {positionLabel && (
            <span className="booking-segment-card__position-label">
              {positionLabel}
            </span>
          )}
        </div>

        {financesEnabled && (
          <span className="booking-segment-card__cost">
            <span className="booking-segment-card__sr-only">Cost: </span>
            {currencyFormatter.format(BigInt(segment.cost))}
          </span>
        )}

        <h3 id={headingId} className="booking-segment-card__format">
          {formatLabel}
          <span className="booking-segment-card__sr-only">
            {": "}
            {participantsLabel}
          </span>
        </h3>
      </header>

      <div className="booking-segment-card__visual">
        <div className="booking-segment-card__backdrop" aria-hidden="true">
          <AssetImage
            src={isMatch ? segment.stipulation_image_url : null}
            fallback="background"
          />
        </div>

        {groups.length > 0 ? (
          <div
            className={`booking-segment-card__teams${
              isMultiSide ? " booking-segment-card__teams--multi" : ""
            }${groups.length === 1 ? " booking-segment-card__teams--single" : ""}`}
            style={teamsStyle}
          >
            {groups.map((group, groupIndex) => {
              const isWinningTeam =
                isMatch &&
                winningSide != null &&
                group.id === `side-${winningSide}`;

              return (
                <div
                  key={group.id}
                  className={`booking-segment-card__team${
                    isWinningTeam ? " booking-segment-card__team--winner" : ""
                  }`}
                  role="group"
                  aria-label={group.label}
                >
                  <div className="booking-segment-card__members">
                    {group.members.map((member) => (
                      <figure
                        className="booking-segment-card__participant"
                        key={member.wrestler_id}
                      >
                        <div
                          className="booking-segment-card__portrait"
                          aria-hidden="true"
                        >
                          <AssetImage
                            src={member.image_url}
                            fallback="wrestler"
                          />
                        </div>

                        <figcaption>{member.name}</figcaption>
                      </figure>
                    ))}
                  </div>

                  {isWinningTeam && (
                    <span className="booking-segment-card__winner-label">
                      {group.members.length === 1 ? "Winner" : "Winners"}
                    </span>
                  )}

                  {groups.length === 2 && groupIndex === 0 && (
                    <span
                      className="booking-segment-card__versus"
                      aria-hidden="true"
                    >
                      {isMatch ? "VS" : "→"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="booking-segment-card__missing">
            Participants unavailable
          </p>
        )}
      </div>

      {isMatch && segment.title && (
        <div className="booking-segment-card__championship">
          <div className="booking-segment-card__belt" aria-hidden="true">
            <AssetImage src={segment.title.image_url} fallback="title" />
          </div>

          <div>
            <p>Championship match</p>
            <strong>{segment.title.name}</strong>
          </div>
        </div>
      )}

      {isMatch && segment.interference && (
        <p className="booking-segment-card__interference">
          <span>Interference</span>
          <strong>
            {segment.interference.wrestler_name}
            {" → "}
            {segment.interference.target_wrestler_name}
          </strong>
        </p>
      )}

      {editable && (
        <footer className="booking-segment-card__actions">
          <div
            className="booking-segment-card__reorder"
            role="group"
            aria-label={`Reorder segment ${segment.position}`}
          >
            <button
              className="booking-segment-card__icon-button"
              type="button"
              disabled={isBusy || isFirst}
              title="Move up"
              aria-label={`Move segment ${segment.position} up: ${participantsLabel}`}
              onClick={() => onMove("up")}
            >
              {movingDirection === "up" ? (
                <LoaderCircle
                  className="booking-segment-card__spinner"
                  size={16}
                  aria-hidden="true"
                />
              ) : (
                <ArrowUp size={16} aria-hidden="true" />
              )}
            </button>

            <button
              className="booking-segment-card__icon-button"
              type="button"
              disabled={isBusy || isLast}
              title="Move down"
              aria-label={`Move segment ${segment.position} down: ${participantsLabel}`}
              onClick={() => onMove("down")}
            >
              {movingDirection === "down" ? (
                <LoaderCircle
                  className="booking-segment-card__spinner"
                  size={16}
                  aria-hidden="true"
                />
              ) : (
                <ArrowDown size={16} aria-hidden="true" />
              )}
            </button>
          </div>

          <div className="booking-segment-card__edit-actions">
            <button
              className="booking-segment-card__edit"
              type="button"
              disabled={isBusy}
              aria-label={`Edit segment ${segment.position}: ${participantsLabel}`}
              onClick={onEdit}
            >
              <Pencil size={15} aria-hidden="true" />
              Edit
            </button>

            <button
              className="booking-segment-card__icon-button booking-segment-card__icon-button--danger"
              type="button"
              disabled={isBusy}
              title="Delete segment"
              aria-label={`Delete segment ${segment.position}: ${participantsLabel}`}
              onClick={onDelete}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        </footer>
      )}
    </article>
  );
}
