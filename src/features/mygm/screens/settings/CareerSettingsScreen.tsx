import { useId, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import CareerDangerZone from "../../components/settings/CareerDangerZone";
import CareerNameForm from "../../components/settings/CareerNameForm";
import CareerRulesOverview from "../../components/settings/CareerRulesOverview";
import { useCareerSettings } from "../../hooks/settings/useCareerSettings";
import { RefreshCw } from "lucide-react";
import type { MyGmOutletContext } from "../../types/mygm.types";
import type {
  CareerSettingsData,
  DeleteCareerResult,
  RenameCareerResult,
} from "../../types/settings/careerSettings.types";

import "./CareerSettingsScreen.scss";

interface CareerSettingsContentProps {
  data: CareerSettingsData;
  onRenamed: () => void;
  onDeleted: (result: DeleteCareerResult) => void;
}

function CareerSettingsContent({
  data,
  onRenamed,
  onDeleted,
}: CareerSettingsContentProps) {
  const [currentName, setCurrentName] = useState(data.career.name);

  function handleNameSaved(result: RenameCareerResult) {
    setCurrentName(result.name);
    onRenamed();
  }

  return (
    <div className="career-settings-screen__sections">
      <CareerNameForm
        careerId={data.career.id}
        initialName={data.career.name}
        onSaved={handleNameSaved}
      />

      <CareerRulesOverview data={data} />

      <CareerDangerZone
        careerId={data.career.id}
        careerName={currentName}
        onDeleted={onDeleted}
      />
    </div>
  );
}

export default function CareerSettingsScreen() {
  const { career, refreshCareer } = useOutletContext<MyGmOutletContext>();

  const navigate = useNavigate();
  const headingId = useId();

  const { data, isLoading, errorMessage, retry } = useCareerSettings(career.id);

  function handleDeleted(result: DeleteCareerResult) {
    // Remove this career's local results drafts when storage is available.
    try {
      const prefix = `wc:mygm:results:v1:${result.career_id}:`;
      const keysToRemove: string[] = [];

      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);

        if (key?.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch {
      // Storage cleanup must not prevent navigation after deletion.
    }

    navigate("/mygm", { replace: true });
  }

  return (
    <section className="career-settings-screen" aria-labelledby={headingId}>
      <header className="career-settings-screen__header">
        <div>
          <p className="career-settings-screen__eyebrow">Your career</p>

          <h1 id={headingId}>Career settings</h1>

          <p className="career-settings-screen__description">
            Manage your career and review its configuration.
          </p>

          <p className="career-settings-screen__identity">
            {career.brand_name}
            {" · "}
            {career.manager_name}
          </p>
        </div>

        <button
          className="career-settings-screen__button career-settings-screen__refresh"
          type="button"
          aria-label="Refresh career settings"
          disabled={isLoading}
          onClick={retry}
        >
          <RefreshCw size={17} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </header>

      <div className="career-settings-screen__body" aria-busy={isLoading}>
        {isLoading && (
          <div className="career-settings-screen__state">
            <p role="status">Loading career settings…</p>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div className="career-settings-screen__state">
            <h2>Career settings could not be loaded</h2>

            <p role="alert">{errorMessage}</p>

            <button
              className="career-settings-screen__button"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !errorMessage && data && (
          <CareerSettingsContent
            key={`settings:${data.career.id}`}
            data={data}
            onRenamed={refreshCareer}
            onDeleted={handleDeleted}
          />
        )}
      </div>
    </section>
  );
}
