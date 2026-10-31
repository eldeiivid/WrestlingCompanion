import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  Clapperboard,
  Dumbbell,
  Flag,
  HeartHandshake,
  Megaphone,
  Mic2,
  Repeat2,
  Shuffle,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import PromoParticipantPicker from "./PromoParticipantPicker";

import { useBookingPromoOptions } from "../../hooks/useBookingPromoOptions";
import { getPromoParticipantSlots } from "../../rules/promoRules";
import { addPromo, updatePromo } from "../../services/bookingService";

import type {
  AddBookingPromoInput,
  BookingEditablePromo,
  BookingPromoOptions,
  BookingPromoTypeId,
  BookingPromoWrestler,
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

const promoPresentation: Record<
  BookingPromoTypeId,
  { icon: LucideIcon; description: string }
> = {
  ad_break: {
    icon: Clapperboard,
    description: "Schedule an advertising segment.",
  },
  call_out: {
    icon: Megaphone,
    description: "Challenge another wrestler.",
  },
  charity: {
    icon: HeartHandshake,
    description: "Book a charity appearance.",
  },
  class_change: {
    icon: Repeat2,
    description: "Swap a wrestler’s primary and secondary classes.",
  },
  invasion: {
    icon: Flag,
    description: "Book a brand invasion.",
  },
  self_promo: {
    icon: Mic2,
    description: "Give a wrestler the microphone.",
  },
  tag_call_out: {
    icon: Users,
    description: "Set up a confrontation between teams.",
  },
  training: {
    icon: Dumbbell,
    description: "Schedule a training segment.",
  },
  turn: {
    icon: Shuffle,
    description: "Change a wrestler’s role.",
  },
};

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

  const canRenderForm =
    !isLoading &&
    !errorMessage &&
    data !== null &&
    (!props.segmentId || segment !== null);

  return (
    <section className="promo-editor">
      <p className="promo-editor__description">
        {props.segmentId
          ? "Update the promo type or its participants."
          : "Choose a promo, then select who takes part."}
      </p>

      {isLoading && (
        <p className="promo-editor__hint" role="status">
          {props.segmentId ? "Loading promo…" : "Loading promo options…"}
        </p>
      )}

      {errorMessage && (
        <div className="promo-editor__error">
          <p role="alert">{errorMessage}</p>

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
  const formId = useId();
  const participantsTitleId = useId();
  const saveHintId = useId();

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

  const saveHint = !selectedType
    ? "Choose a promo type to get started."
    : !participantsAreValid
      ? "Choose an eligible wrestler for every position."
      : exceedsBudget
        ? "The card total must fit your available budget."
        : "Your promo is ready to save.";

  function getUnavailableReason(
    wrestler: BookingPromoWrestler,
    index: number,
  ): string {
    if (
      participantIds.some(
        (id, selectedIndex) => id === wrestler.id && selectedIndex !== index,
      )
    ) {
      return "Selected in another position";
    }

    if (slots[index]?.role === "initiator" && !wrestler.can_initiate) {
      return "Already booked for a promo or interference";
    }

    if (promoTypeId === "class_change" && !wrestler.can_swap_classes) {
      return "Class Change unavailable";
    }

    return "";
  }

  function handleTypeChange(value: string) {
    if (savingRef.current) return;

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
    if (savingRef.current || index < 0 || index >= slots.length) return;

    if (wrestlerId) {
      const wrestler = options.wrestlers.find((item) => item.id === wrestlerId);

      if (!wrestler || getUnavailableReason(wrestler, index)) return;
    }

    setParticipantIds((current) =>
      slots.map((_, currentIndex) =>
        currentIndex === index ? wrestlerId : (current[currentIndex] ?? ""),
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
    <form onSubmit={handleSubmit} aria-busy={isSaving}>
      <fieldset className="promo-editor__fields" disabled={isSaving}>
        <legend className="promo-editor__legend">Promo configuration</legend>

        <fieldset className="promo-editor__types">
          <legend>Promo type</legend>

          <div className="promo-editor__type-grid">
            {options.types.map((type) => {
              const presentation = promoPresentation[type.id];
              const Icon = presentation.icon;

              return (
                <label className="promo-editor__type" key={type.id}>
                  <input
                    type="radio"
                    name={`${formId}-promo-type`}
                    value={type.id}
                    checked={promoTypeId === type.id}
                    required
                    onChange={() => handleTypeChange(type.id)}
                  />

                  <span className="promo-editor__type-icon">
                    <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                  </span>

                  <span className="promo-editor__type-copy">
                    <strong>{type.name}</strong>
                    <span>{presentation.description}</span>
                  </span>

                  {financesEnabled && (
                    <span className="promo-editor__type-cost">
                      {formatMoney(type.cost)}
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          {options.types.length === 0 && (
            <p className="promo-editor__hint">
              No promo types are available for this show.
            </p>
          )}
        </fieldset>

        {selectedType && (
          <section
            className="promo-editor__participants"
            aria-labelledby={participantsTitleId}
          >
            <header className="promo-editor__participants-header">
              <h3 id={participantsTitleId}>Participants</h3>
              <span>
                {participantIds.filter(Boolean).length} / {slots.length}
              </span>
            </header>

            <p className="promo-editor__hint">
              A wrestler can perform one promo and still be the target of
              another Call Out.
            </p>

            {promoTypeId === "class_change" && (
              <p className="promo-editor__notice">
                Requires an in-ring level of at least 15 and two different
                classes. The classes will swap when the show is completed.
              </p>
            )}

            <PromoParticipantPicker
              key={selectedType.id}
              slots={slots}
              participantIds={participantIds}
              wrestlers={options.wrestlers}
              disabled={isSaving}
              getUnavailableReason={getUnavailableReason}
              onChange={handleParticipantChange}
            />
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

            <p>
              Available budget
              <strong>{formatMoney(budgetAvailable)}</strong>
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

        <footer className="promo-editor__footer">
          <p className="promo-editor__save-hint" id={saveHintId}>
            {isSaving ? "Saving your promo…" : saveHint}
          </p>

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
              disabled={!canSave || isSaving}
              aria-describedby={saveHintId}
            >
              {isSaving ? "Saving…" : isEditing ? "Save changes" : "Save promo"}
            </button>
          </div>
        </footer>
      </fieldset>
    </form>
  );
}
