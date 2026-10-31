import { useId, useState } from "react";
import { Mic2, UserRound } from "lucide-react";

import ShowDetailRivalryOutcome from "./ShowDetailRivalryOutcome";

import type { ShowDetailPromo } from "../../types/show-history/showDetail.types";

import "./ShowDetailPromoCard.scss";

interface ShowDetailPromoCardProps {
  promo: ShowDetailPromo;
  financesRecorded: boolean;
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const moneyChangeFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
  signDisplay: "exceptZero",
});

const fanChangeFormatter = new Intl.NumberFormat("en-US", {
  signDisplay: "exceptZero",
});

function ParticipantPortrait({ src }: { src: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <span className="show-promo-card__portrait" aria-hidden="true">
      {src && src !== failedUrl ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailedUrl(src)}
        />
      ) : (
        <UserRound size={48} strokeWidth={1.25} />
      )}
    </span>
  );
}

export default function ShowDetailPromoCard({
  promo,
  financesRecorded,
}: ShowDetailPromoCardProps) {
  const headingId = useId();

  const performers = promo.participants.filter(
    (participant) => participant.role === "initiator",
  );

  const targets = promo.participants.filter(
    (participant) => participant.role === "target",
  );

  const supportingParticipants = promo.participants.filter(
    (participant) => participant.role === "support",
  );

  const groups = [
    {
      id: "performers",
      label: performers.length > 1 ? "Performers" : "Performer",
      members: performers,
    },
    ...(targets.length > 0
      ? [
          {
            id: "targets",
            label: targets.length > 1 ? "Targets" : "Target",
            members: targets,
          },
        ]
      : []),
  ];

  const hasReportedAmounts =
    promo.reported_money_change !== null || promo.reported_fan_change !== null;

  const rivalries = promo.rivalries?.length ? promo.rivalries : [promo.rivalry];

  return (
    <article className="show-promo-card" aria-labelledby={headingId}>
      <div className="show-promo-card__hero">
        <header className="show-promo-card__header">
          <div className="show-promo-card__identity">
            <p className="show-promo-card__position">
              <span>{promo.position}</span>
              <Mic2 size={14} aria-hidden="true" />
              Promo
            </p>

            <h3 id={headingId}>{promo.label}</h3>
          </div>

          <div className="show-promo-card__rating">
            <span>Promo rating</span>
            <strong>{promo.promo_rating?.name ?? "Not recorded"}</strong>
          </div>
        </header>

        <div
          className={`show-promo-card__participants${
            groups.length === 1 ? " show-promo-card__participants--single" : ""
          }`}
        >
          {groups.map((group) => (
            <section
              className="show-promo-card__group"
              key={group.id}
              aria-label={group.label}
            >
              <h4>{group.label}</h4>

              {group.members.length > 0 ? (
                <ul className="show-promo-card__members">
                  {group.members.map((participant) => (
                    <li
                      className="show-promo-card__member"
                      key={participant.wrestler_id}
                    >
                      <ParticipantPortrait src={participant.image_url} />
                      <span>{participant.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="show-promo-card__missing">Not recorded</p>
              )}
            </section>
          ))}
        </div>

        {supportingParticipants.length > 0 && (
          <section
            className="show-promo-card__support"
            aria-label="Supporting participants"
          >
            <h4>Supporting participants</h4>

            <ul>
              {supportingParticipants.map((participant) => (
                <li key={participant.wrestler_id}>
                  <ParticipantPortrait src={participant.image_url} />
                  <span>{participant.name}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="show-promo-card__content">
        {hasReportedAmounts && (
          <section className="show-promo-card__section">
            <h4>Reported promo outcome</h4>

            <dl className="show-promo-card__amounts">
              {promo.reported_money_change !== null && (
                <div>
                  <dt>Money change</dt>
                  <dd>
                    {moneyChangeFormatter.format(
                      BigInt(promo.reported_money_change),
                    )}
                  </dd>
                </div>
              )}

              {promo.reported_fan_change !== null && (
                <div>
                  <dt>Fan change</dt>
                  <dd>
                    {fanChangeFormatter.format(
                      BigInt(promo.reported_fan_change),
                    )}
                  </dd>
                </div>
              )}
            </dl>

            <p className="show-promo-card__hint">
              Included in the overall show change. Displayed here for reference.
            </p>
          </section>
        )}

        {promo.promo_type_id === "turn" && (
          <section className="show-promo-card__section">
            <h4>Applied change</h4>
            <p>The performing wrestler switched between Face and Heel.</p>
          </section>
        )}

        {promo.promo_type_id === "class_change" && (
          <section className="show-promo-card__section">
            <h4>Applied change</h4>
            <p>
              The performing wrestler’s primary and secondary classes were
              swapped.
            </p>
          </section>
        )}

        {rivalries.map((rivalry) => (
          <ShowDetailRivalryOutcome
            key={rivalry.id ?? `${promo.id}:no-rivalry`}
            rivalry={rivalry}
          />
        ))}

        {financesRecorded && (
          <p className="show-promo-card__cost">
            <span>Promo cost</span>
            <strong>{moneyFormatter.format(BigInt(promo.cost))}</strong>
          </p>
        )}
      </div>
    </article>
  );
}
