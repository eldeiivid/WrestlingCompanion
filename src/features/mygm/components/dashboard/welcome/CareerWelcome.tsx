import { useMyGmCareerPath } from "../../../hooks/useMyGmCareerPath";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import "./CareerWelcome.scss";

interface CareerWelcomeProps {
  hasCompletedShows: boolean;
}

export default function CareerWelcome({
  hasCompletedShows,
}: CareerWelcomeProps) {
  const careerPath = useMyGmCareerPath();
  return (
    <section className="career-welcome" aria-labelledby="career-welcome-title">
      <div>
        <h2 id="career-welcome-title">
          {hasCompletedShows
            ? "Build your next chapter."
            : "Your career is ready."}
        </h2>

        <p>
          {hasCompletedShows
            ? "Plan your next show and keep your story moving."
            : "Your brand and roster are set. Start by preparing your first show."}
        </p>
      </div>

      <Link to={`${careerPath}/booking`} className="career-welcome__action">
        {hasCompletedShows ? "Prepare show" : "Prepare first show"}
        <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </section>
  );
}
