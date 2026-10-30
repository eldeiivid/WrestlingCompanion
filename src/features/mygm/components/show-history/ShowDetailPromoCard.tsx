import { useId } from "react";
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

  const hasReportedAmounts =
    promo.reported_money_change !== null || promo.reported_fan_change !== null;

  return (
    <article className="show-promo-card" aria-labelledby={headingId}>
      <header className="show-promo-card__header">
        <div>
          <p className="show-promo-card__position">
            Segment {promo.position} · Promo
          </p>

          <h3 id={headingId}>{promo.label}</h3>
        </div>

        <div className="show-promo-card__rating">
          <span>Promo rating</span>
          <strong>{promo.promo_rating?.name ?? "Not recorded"}</strong>
        </div>
      </header>

      <dl className="show-promo-card__participants">
        <div>
          <dt>{performers.length > 1 ? "Performers" : "Performer"}</dt>

          <dd>
            {performers.length > 0
              ? performers.map((participant) => participant.name).join(" & ")
              : "Not recorded"}
          </dd>
        </div>

        {targets.length > 0 && (
          <div>
            <dt>{targets.length > 1 ? "Targets" : "Target"}</dt>

            <dd>
              {targets.map((participant) => participant.name).join(" & ")}
            </dd>
          </div>
        )}

        {supportingParticipants.length > 0 && (
          <div>
            <dt>Supporting participants</dt>

            <dd>
              {supportingParticipants
                .map((participant) => participant.name)
                .join(" & ")}
            </dd>
          </div>
        )}
      </dl>

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
                  {fanChangeFormatter.format(BigInt(promo.reported_fan_change))}
                </dd>
              </div>
            )}
          </dl>

          <p className="show-promo-card__hint">
            This outcome is already included in the overall show change and is
            displayed for reference.
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

      <ShowDetailRivalryOutcome rivalry={promo.rivalry} />

      {financesRecorded && (
        <p className="show-promo-card__cost">
          <span>Promo cost</span>
          <strong>{moneyFormatter.format(BigInt(promo.cost))}</strong>
        </p>
      )}
    </article>
  );
}
