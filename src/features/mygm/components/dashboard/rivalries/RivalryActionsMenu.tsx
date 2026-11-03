import { useEffect, useId, useRef } from "react";
import { EllipsisVertical, Pencil, Trash2, Trophy } from "lucide-react";
import type { RivalryListItem } from "../../../types/rivalries/rivalries.types";

interface Props {
  rivalry: RivalryListItem;
  name: string;
  onEdit: () => void;
  onResolve: () => void;
  onDelete: () => void;
}

export default function RivalryActionsMenu({ rivalry, name, onEdit, onResolve, onDelete }: Props) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const panelId = useId();

  useEffect(() => {
    function dismiss(event: PointerEvent) {
      const details = detailsRef.current;
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false;
      }
    }
    function dismissOnFocus(event: FocusEvent) {
      const details = detailsRef.current;
      if (details?.open && event.target instanceof Node && !details.contains(event.target)) {
        details.open = false;
      }
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("focusin", dismissOnFocus);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("focusin", dismissOnFocus);
    };
  }, []);

  function choose(action: () => void) {
    const details = detailsRef.current;
    if (details) {
      details.open = false;
      details.querySelector("summary")?.focus();
    }
    action();
  }

  return (
    <details ref={detailsRef} className="rivalries-screen__menu" onKeyDown={event => {
      if (event.key === "Escape" && detailsRef.current?.open) {
        event.preventDefault();
        event.stopPropagation();
        detailsRef.current.open = false;
        detailsRef.current.querySelector("summary")?.focus();
      }
    }}>
      <summary aria-label={`Actions for rivalry: ${name}`} aria-controls={panelId}>
        <EllipsisVertical size={19} aria-hidden="true" />
      </summary>
      <div id={panelId} className="rivalries-screen__menu-panel" role="group" aria-label={`Rivalry actions: ${name}`}>
        {rivalry.kind !== "stable" && <button type="button" aria-haspopup="dialog" onClick={() => choose(onEdit)}><Pencil size={16} aria-hidden="true" /> Edit rivalry</button>}
        {rivalry.status === "active" && <button type="button" aria-haspopup="dialog" onClick={() => choose(onResolve)}><Trophy size={16} aria-hidden="true" /> Finish rivalry</button>}
        <button className="rivalries-screen__menu-danger" type="button" aria-haspopup="dialog" onClick={() => choose(onDelete)}><Trash2 size={16} aria-hidden="true" /> Delete rivalry</button>
      </div>
    </details>
  );
}
