import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";

import { useRenameCareer } from "../../hooks/settings/useRenameCareer";

import type { RenameCareerResult } from "../../types/settings/careerSettings.types";

import "./CareerNameForm.scss";

interface CareerNameFormProps {
  careerId: string;
  initialName: string;
  onSaved: (result: RenameCareerResult) => void;
}

function normalizeName(value: string): string {
  return value.replace(/^ +| +$/g, "");
}

export default function CareerNameForm({
  careerId,
  initialName,
  onSaved,
}: CareerNameFormProps) {
  const headingId = useId();
  const hintId = useId();

  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [successMessage, setSuccessMessage] = useState("");

  const mountedRef = useRef(true);

  const { isSaving, errorMessage, rename, clearError } = useRenameCareer();

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const normalizedName = normalizeName(name);
  const characterCount = Array.from(normalizedName).length;

  const hasValidName = characterCount >= 1 && characterCount <= 100;

  const hasChanges = normalizedName !== savedName;
  const canSave = hasValidName && hasChanges && !isSaving;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSave) {
      return;
    }

    const result = await rename({
      careerId,
      name: normalizedName,
    });

    if (!result || !mountedRef.current) {
      return;
    }

    setName(result.name);
    setSavedName(result.name);
    setSuccessMessage("Career name saved.");

    onSaved(result);
  }

  function handleReset() {
    if (isSaving) {
      return;
    }

    setName(savedName);
    setSuccessMessage("");
    clearError();
  }

  return (
    <section className="career-name-form" aria-labelledby={headingId}>
      <header className="career-name-form__header">
        <h2 id={headingId}>Career name</h2>

        <p>Choose a name to identify this career.</p>
      </header>

      <form onSubmit={handleSubmit} aria-busy={isSaving}>
        <fieldset className="career-name-form__fields" disabled={isSaving}>
          <legend className="career-name-form__legend">Edit career name</legend>

          <label className="career-name-form__field">
            <span>Name</span>

            <input
              type="text"
              value={name}
              required
              aria-describedby={hintId}
              aria-invalid={!hasValidName}
              onChange={(event) => {
                setName(event.target.value);
                setSuccessMessage("");
                clearError();
              }}
            />
          </label>

          <p id={hintId} className="career-name-form__hint">
            Between 1 and 100 characters. {characterCount} / 100
          </p>

          {!hasValidName && (
            <p className="career-name-form__error">
              Enter a name between 1 and 100 characters.
            </p>
          )}

          {errorMessage && (
            <p className="career-name-form__error" role="alert">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="career-name-form__success" role="status">
              {successMessage}
            </p>
          )}

          <div className="career-name-form__actions">
            <button
              className="career-name-form__button"
              type="button"
              disabled={isSaving || name === savedName}
              onClick={handleReset}
            >
              Reset
            </button>

            <button
              className="career-name-form__button career-name-form__button--primary"
              type="submit"
              disabled={!canSave}
            >
              {isSaving ? "Saving…" : "Save name"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
