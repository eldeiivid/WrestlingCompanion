import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Trash2, Trophy, X } from "lucide-react";
import { manageRivalry } from "../../../services/rivalries/rivalriesService";
import type { RivalryListItem, RivalrySide } from "../../../types/rivalries/rivalries.types";
import "./RivalryActionModal.scss";

interface Props {
  careerId: string;
  rivalry: RivalryListItem;
  action: "resolve" | "delete";
  onClose: () => void;
  onCompleted: () => void;
}

export default function RivalryActionModal({ careerId, rivalry, action, onClose, onCompleted }: Props) {
  const headingId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submittingRef = useRef(false);
  const mountedRef = useRef(false);
  const [winningSide, setWinningSide] = useState<RivalrySide | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const deleting = action === "delete";
  const title = deleting ? "Delete rivalry" : "Finish rivalry";
  const sides = ([1, 2] as const).map(side => ({
    side,
    name: rivalry.members.filter(member => member.side === side).map(member => member.name).join(" & ") || `Side ${side}`,
  }));
  const name = rivalry.name?.trim() || `${sides[0].name} vs ${sides[1].name}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scrollContainer = dialog?.closest<HTMLElement>(".mygm-layout__content");
    const bodyOverflow = document.body.style.overflow;
    const contentOverflow = scrollContainer?.style.overflowY;
    mountedRef.current = true;
    document.body.style.overflow = "hidden";
    if (scrollContainer) scrollContainer.style.overflowY = "hidden";
    dialog?.showModal();
    return () => {
      mountedRef.current = false;
      dialog?.close();
      document.body.style.overflow = bodyOverflow;
      if (scrollContainer) scrollContainer.style.overflowY = contentOverflow ?? "";
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  function close() {
    if (!submittingRef.current) onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || (deleting && !confirmed)) return;
    submittingRef.current = true;
    setSaving(true);
    setError("");
    try {
      await manageRivalry(careerId, rivalry.id, action, deleting ? null : winningSide);
      if (mountedRef.current) onCompleted();
    } catch (cause) {
      if (mountedRef.current) setError(cause instanceof Error ? cause.message : "The rivalry could not be updated.");
    } finally {
      submittingRef.current = false;
      if (mountedRef.current) setSaving(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="rivalry-action-modal" aria-labelledby={headingId} aria-describedby={descriptionId} onCancel={event => { event.preventDefault(); close(); }}>
      <header className="rivalry-action-modal__header">
        <div className="rivalry-action-modal__heading">
          <span className={deleting ? "rivalry-action-modal__icon rivalry-action-modal__icon--danger" : "rivalry-action-modal__icon"}>{deleting ? <Trash2 size={20} aria-hidden="true" /> : <Trophy size={20} aria-hidden="true" />}</span>
          <h2 id={headingId}>{title}</h2>
        </div>
        <button type="button" className="rivalry-action-modal__close" aria-label="Close rivalry action" disabled={saving} onClick={close}><X size={20} aria-hidden="true" /></button>
      </header>
      <form onSubmit={submit} aria-busy={saving}>
        <div className="rivalry-action-modal__content">
          <p className="rivalry-action-modal__name">{name}</p>
          <p id={descriptionId}>{deleting ? "Permanently delete this rivalry, its participants and its rivalry history. Associated matches and shows will be kept; their link to this rivalry will be removed. This cannot be undone." : "Mark this rivalry as Resolved in the current week. Its participants and history will be preserved. Choose a winner or finish without assigning one."}</p>
          {deleting ? (
            <label className="rivalry-action-modal__confirmation"><input type="checkbox" checked={confirmed} required disabled={saving} onChange={event => setConfirmed(event.target.checked)} /> I understand this permanently deletes the rivalry.</label>
          ) : (
            <fieldset disabled={saving}>
              <legend>Rivalry winner</legend>
              {[{ side: null, name: "No winner assigned" }, ...sides].map(option => <label className="rivalry-action-modal__winner" key={option.side ?? "none"}><input type="radio" name="winning-side" checked={winningSide === option.side} onChange={() => { setWinningSide(option.side); setError(""); }} /><span>{option.name}</span></label>)}
            </fieldset>
          )}
          {error && <p className="rivalry-action-modal__error" role="alert">{error}</p>}
        </div>
        <footer className="rivalry-action-modal__footer">
          <button type="button" disabled={saving} onClick={close} autoFocus>Cancel</button>
          <button type="submit" className={deleting ? "rivalry-action-modal__danger" : "rivalry-action-modal__primary"} disabled={saving || (deleting && !confirmed)}>{saving ? deleting ? "Deleting…" : "Finishing…" : title}</button>
        </footer>
      </form>
    </dialog>
  );
}
