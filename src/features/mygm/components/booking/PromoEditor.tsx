import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useBookingPromoOptions } from "../../hooks/useBookingPromoOptions";
import { getPromoParticipantSlots } from "../../rules/promoRules";
import { addPromo, updatePromo } from "../../services/bookingService";
import type {
  AddBookingPromoInput,
  BookingEditablePromo,
  BookingPromoOptions,
  BookingPromoTypeId,
} from "../../types/booking.types";
import "./PromoEditor.scss";

interface PromoEditorProps {
  careerId: string;
  eventId: string;
  segmentId?: string;
  financesEnabled: boolean;
  budgetAvailable: string;
  currentCardCost: string;
  onCancel: () => void;
  onSaved: () => void;
  onSavingChange?: (isSaving: boolean) => void;
}

interface PromoEditorFormProps extends PromoEditorProps {
  options: BookingPromoOptions;
  initialSegment: BookingEditablePromo | null;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatMoney(value: string | bigint) {
  return currencyFormatter.format(BigInt(value));
}

function getInitialParticipantIds(
  segment: BookingEditablePromo | null,
): string[] {
  if (!segment) return [];

  const initiators = segment.participants.filter(
    (participant) => participant.role === "initiator",
  );

  const targets = segment.participants.filter(
    (participant) => participant.role === "target",
  );

  let initiatorIndex = 0;
  let targetIndex = 0;

  return getPromoParticipantSlots(segment.promo_type_id).map((slot) => {
    if (slot.role === "initiator") {
      const id = initiators[initiatorIndex]?.wrestler_id ?? "";

      initiatorIndex += 1;
      return id;
    }

    const id = targets[targetIndex]?.wrestler_id ?? "";

    targetIndex += 1;
    return id;
  });
}

export default function PromoEditor(props: PromoEditorProps) {
  const { data, segment, isLoading, errorMessage, retry } =
    useBookingPromoOptions(props.careerId, props.eventId, props.segmentId);

  const canRenderForm = data !== null && (!props.segmentId || segment !== null);

  return (
    <section className="promo-editor">
      <p className="promo-editor__description">
        {props.segmentId
          ? "Update the promo type or its participants."
          : "Choose a promo type and its participants."}
      </p>

      {isLoading && (
        <p role="status">
          {props.segmentId ? "Loading promo…" : "Loading promo options…"}
        </p>
      )}

      {errorMessage && (
        <div className="promo-editor__error" role="alert">
          <p>{errorMessage}</p>

          <button
            className="promo-editor__button"
            type="button"
            onClick={retry}
          >
            Try again
          </button>
        </div>
      )}

      {canRenderForm && data && (
        <PromoEditorForm
          key={`${props.careerId}:${props.eventId}:${props.segmentId ?? "new"}`}
          {...props}
          options={data}
          initialSegment={segment}
        />
      )}

      {!canRenderForm && (
        <button
          className="promo-editor__button"
          type="button"
          onClick={props.onCancel}
        >
          Cancel
        </button>
      )}
    </section>
  );
}

function PromoEditorForm({
  careerId,
  eventId,
  financesEnabled,
  budgetAvailable,
  currentCardCost,
  onCancel,
  onSaved,
  onSavingChange,
  options,
  initialSegment,
}: PromoEditorFormProps) {
  const isEditing = initialSegment !== null;

  const [segmentId] = useState(() => initialSegment?.id ?? crypto.randomUUID());

  const [promoTypeId, setPromoTypeId] = useState<BookingPromoTypeId | "">(
    initialSegment?.promo_type_id ?? "",
  );

  const [participantIds, setParticipantIds] = useState<string[]>(() =>
    getInitialParticipantIds(initialSegment),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const savingRef = useRef(false);

  const selectedType = options.types.find((type) => type.id === promoTypeId);

  const slots = selectedType ? getPromoParticipantSlots(selectedType.id) : [];

  const promoCost =
    financesEnabled && selectedType ? BigInt(selectedType.cost) : 0n;

  const previousCost = initialSegment ? BigInt(initialSegment.cost) : 0n;

  const projectedCost = BigInt(currentCardCost) - previousCost + promoCost;

  const exceedsBudget =
    financesEnabled && projectedCost > BigInt(budgetAvailable);

  const participantsAreValid =
    slots.length > 0 &&
    participantIds.length === slots.length &&
    new Set(participantIds).size === slots.length &&
    participantIds.every((id, index) => {
      const wrestler = options.wrestlers.find((item) => item.id === id);

      if (!wrestler) return false;

      if (slots[index].role === "initiator" && !wrestler.can_initiate) {
        return false;
      }

      return promoTypeId !== "class_change" || wrestler.can_swap_classes;
    });

  const canSave =
    Boolean(selectedType) && participantsAreValid && !exceedsBudget;

  function handleTypeChange(value: string) {
    const nextType = options.types.find((type) => type.id === value);

    setPromoTypeId(nextType?.id ?? "");

    setParticipantIds(
      nextType
        ? Array<string>(getPromoParticipantSlots(nextType.id).length).fill("")
        : [],
    );

    setSaveError("");
  }

  function handleParticipantChange(index: number, wrestlerId: string) {
    setParticipantIds((current) =>
      current.map((id, currentIndex) =>
        currentIndex === index ? wrestlerId : id,
      ),
    );

    setSaveError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSave || !selectedType || savingRef.current) return;

    savingRef.current = true;
    setIsSaving(true);
    onSavingChange?.(true);
    setSaveError("");

    try {
      const input: AddBookingPromoInput = {
        careerId,
        eventId,
        segmentId,
        promoTypeId: selectedType.id,
        participants: slots.map((slot, index) => ({
          wrestler_id: participantIds[index] ?? "",
          role: slot.role,
        })),
      };

      if (isEditing) {
        await updatePromo(input);
      } else {
        await addPromo(input);
      }

      onSaved();
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P0001" &&
        "message" in error &&
        typeof error.message === "string"
          ? error.message
          : "Unable to save the promo. Please try again.";

      setSaveError(message);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
      onSavingChange?.(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset className="promo-editor__fields" disabled={isSaving}>
        <legend className="promo-editor__legend">Promo configuration</legend>

        <label className="promo-editor__field">
          <span>Promo type</span>

          <select
            value={promoTypeId}
            required
            onChange={(event) => handleTypeChange(event.target.value)}
          >
            <option value="">Select a promo type</option>

            {options.types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
                {financesEnabled ? ` — ${formatMoney(type.cost)}` : ""}
              </option>
            ))}
          </select>
        </label>

        {selectedType && (
          <section
            className="promo-editor__participants"
            aria-labelledby="promo-participants-title"
          >
            <h3 id="promo-participants-title">Participants</h3>

            <p className="promo-editor__hint">
              A wrestler can perform one promo and still be the target of
              another Call Out.
            </p>

            {promoTypeId === "class_change" && (
              <p className="promo-editor__hint">
                Requires an in-ring level of at least 15 and two different
                classes. The classes will swap when the show is completed.
              </p>
            )}

            <div className="promo-editor__participant-grid">
              {slots.map((slot, index) => (
                <label
                  className="promo-editor__field"
                  key={`${promoTypeId}-${index}`}
                >
                  <span>{slot.label}</span>

                  <select
                    value={participantIds[index] ?? ""}
                    required
                    onChange={(event) =>
                      handleParticipantChange(index, event.target.value)
                    }
                  >
                    <option value="">Select a wrestler</option>

                    {options.wrestlers.map((wrestler) => {
                      let reason = "";

                      if (
                        participantIds.some(
                          (id, selectedIndex) =>
                            id === wrestler.id && selectedIndex !== index,
                        )
                      ) {
                        reason = "Selected";
                      } else if (
                        slot.role === "initiator" &&
                        !wrestler.can_initiate
                      ) {
                        reason = "Already booked for a promo or interference";
                      } else if (
                        promoTypeId === "class_change" &&
                        !wrestler.can_swap_classes
                      ) {
                        reason = "Class Change unavailable";
                      }

                      return (
                        <option
                          key={wrestler.id}
                          value={wrestler.id}
                          disabled={reason !== ""}
                        >
                          {wrestler.name}
                          {reason ? ` — ${reason}` : ""}
                        </option>
                      );
                    })}
                  </select>
                </label>
              ))}
            </div>
          </section>
        )}

        {financesEnabled && selectedType && (
          <div className="promo-editor__cost" aria-live="polite">
            <p>
              Promo cost
              <strong>{formatMoney(promoCost)}</strong>
            </p>

            <p>
              {isEditing
                ? "Card total after changes"
                : "Card total after adding"}
              <strong>{formatMoney(projectedCost)}</strong>
            </p>

            {exceedsBudget && (
              <p className="promo-editor__budget-error">
                This promo exceeds the available budget.
              </p>
            )}
          </div>
        )}

        {saveError && (
          <p className="promo-editor__error" role="alert">
            {saveError}
          </p>
        )}

        <div className="promo-editor__actions">
          <button
            className="promo-editor__button"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            className="promo-editor__button promo-editor__button--primary"
            type="submit"
            disabled={!canSave}
          >
            {isSaving ? "Saving…" : isEditing ? "Save changes" : "Save promo"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
