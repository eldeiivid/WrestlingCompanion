import { useMyGmCareerPath } from "../../../hooks/useMyGmCareerPath";
import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarPlus, ClipboardCheck } from "lucide-react";

import { dashboardService } from "../../../services/dashboardService";
import type { DashboardCurrentShow } from "../../../types/dashboard.types";
import type { MyGmCareerDetails } from "../../../types/mygm.types";

import "./DashboardWelcome.scss";

export default function DashboardWelcome({ career }: { career: MyGmCareerDetails }) {
  const careerPath = useMyGmCareerPath();
  const headingId = useId();
  const key = `${career.id}:${career.current_tick}`;
  const [state, setState] = useState<{ key: string; show: DashboardCurrentShow | null }>({ key, show: null });

  useEffect(() => {
    const controller = new AbortController();
    void dashboardService.getCurrentShow(career.id, career.current_tick, controller.signal).then(
      show => {
        if (!controller.signal.aborted) setState({ key, show });
      },
      () => {
        // Booking remains accessible when the optional show preview is unavailable.
        if (!controller.signal.aborted) setState({ key, show: null });
      },
    );
    return () => controller.abort();
  }, [career.id, career.current_tick, key]);

  const show = state.key === key ? state.show : null;
  const confirmed = show?.status === "confirmed";
  const ActionIcon = confirmed ? ClipboardCheck : CalendarPlus;

  return (
    <header className="dashboard-welcome" aria-labelledby={headingId}>
      <div className="dashboard-welcome__copy">
        <p className="dashboard-welcome__eyebrow"><span aria-hidden="true" /> Your command center</p>
        <h1 id={headingId}>
          {confirmed ? "The stage is set." : "Your next big night."}
          <span>{confirmed ? "Make it count." : "Starts here."}</span>
        </h1>
        <p className="dashboard-welcome__description">
          {confirmed
            ? "Your card is confirmed. Play your show, then record the results and bring your stories to life."
            : "Build the card, shape your rivalries and set the stage for a show worth remembering."}
        </p>
        <div className="dashboard-welcome__actions">
          <Link className="dashboard-welcome__cta" to={`${careerPath}/booking${confirmed ? "/results" : ""}`}>
            <ActionIcon size={18} aria-hidden="true" />
            {confirmed ? "Record results" : show ? "Continue booking" : "Open booking"}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          {show && (
            <div className="dashboard-welcome__show">
              <span>{confirmed ? "Card confirmed" : "In preparation"}</span>
              <strong>{show.name}</strong>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
