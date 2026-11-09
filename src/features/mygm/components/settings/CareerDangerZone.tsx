import { useId, useState } from "react";
import { Trash2 } from "lucide-react";

import DeleteCareerModal from "./DeleteCareerModal";

import type { DeleteCareerResult } from "../../types/settings/careerSettings.types";

import "./CareerDangerZone.scss";

interface CareerDangerZoneProps {
  careerId: string;
  careerName: string;
  onDeleted: (result: DeleteCareerResult) => void;
}

export default function CareerDangerZone({
  careerId,
  careerName,
  onDeleted,
}: CareerDangerZoneProps) {
  const headingId = useId();
  const [isOpen, setIsOpen] = useState(false);

  function handleDeleted(result: DeleteCareerResult) {
    setIsOpen(false);
    onDeleted(result);
  }

  return (
    <section
      className="career-danger-zone career-settings-screen__section"
      aria-labelledby={headingId}
    >
      <header className="career-danger-zone__header">
        <h2 id={headingId}>Danger zone</h2>

        <p>
          Permanently delete this career and its associated history. This action
          cannot be undone.
        </p>
      </header>

      <button
        className="career-danger-zone__button"
        type="button"
        aria-haspopup="dialog"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 size={16} aria-hidden="true" />
        Delete career
      </button>

      {isOpen && (
        <DeleteCareerModal
          key={`delete:${careerId}:${careerName}`}
          careerId={careerId}
          careerName={careerName}
          onClose={() => setIsOpen(false)}
          onDeleted={handleDeleted}
        />
      )}
    </section>
  );
}
