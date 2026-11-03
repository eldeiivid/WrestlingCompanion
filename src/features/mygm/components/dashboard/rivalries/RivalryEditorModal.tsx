import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Check, Search, Swords, UserRound, X } from "lucide-react";
import { getCareerRoster } from "../../../services/roster/careerRosterService";
import { saveRivalry } from "../../../services/rivalries/rivalriesService";
import type { RivalryLevel, RivalryListItem, RivalryWrestler, SaveRivalryInput } from "../../../types/rivalries/rivalries.types";
import type { CareerRosterGender } from "../../../types/roster/careerRoster.types";
import arenaBackground from "../../../../../assets/backgrounds/news-arena.png";
import "./RivalryEditorModal.scss";

interface Props {
  careerId: string;
  currentTick: number;
  rivalry: RivalryListItem | null;
  onClose: () => void;
  onSaved: () => void;
}

interface EditorWrestler extends RivalryWrestler {
  gender: CareerRosterGender | null;
}

function WrestlerPortrait({ wrestler }: { wrestler?: RivalryWrestler }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <span className="rivalry-editor__portrait" aria-hidden="true">
      {wrestler?.image_url && wrestler.image_url !== failedUrl ? (
        <img src={wrestler.image_url} alt="" loading="lazy" decoding="async" onError={() => setFailedUrl(wrestler.image_url)} />
      ) : (
        <UserRound size={36} strokeWidth={1.25} />
      )}
    </span>
  );
}

export default function RivalryEditorModal({ careerId, currentTick, rivalry, onClose, onSaved }: Props) {
  const headingId = useId();
  const hintId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submittingRef = useRef(false);
  const mountedRef = useRef(false);
  const requestRef = useRef<{ signature: string; id: string } | null>(null);
  const [kind, setKind] = useState<SaveRivalryInput["kind"]>(rivalry?.kind === "tag_team" ? "tag_team" : "singles");
  const [level, setLevel] = useState<RivalryLevel>(rivalry?.level ?? 1);
  const [season, setSeason] = useState(String(rivalry?.started_season ?? Math.floor((currentTick - 1) / 50) + 1));
  const [week, setWeek] = useState(rivalry ? String(rivalry.started_week) : "");
  const [selected, setSelected] = useState<string[]>(() => ([1, 2] as const).flatMap(side => {
    const members = rivalry?.members.filter(member => member.side === side) ?? [];
    return [members[0]?.wrestler_id ?? "", members[1]?.wrestler_id ?? ""];
  }));
  const [roster, setRoster] = useState<EditorWrestler[]>([]);
  const [gender, setGender] = useState<CareerRosterGender>("male");
  const [search, setSearch] = useState("");
  const [activeSlot, setActiveSlot] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const scrollContainer = dialog?.closest<HTMLElement>(".mygm-layout__content");
    const previousContentOverflow = scrollContainer?.style.overflowY;
    mountedRef.current = true;
    document.body.style.overflow = "hidden";
    if (scrollContainer) scrollContainer.style.overflowY = "hidden";
    dialog?.showModal();
    return () => {
      mountedRef.current = false;
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (scrollContainer) scrollContainer.style.overflowY = previousContentOverflow ?? "";
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const wrestlers = new Map<string, EditorWrestler>();
        let page = 1;
        let totalPages = 1;
        do {
          const result = await getCareerRoster({ careerId, championsOnly: false, gender: "all", primaryClass: "all", role: "all", category: "all", search: "", sort: "name_asc", page, pageSize: 20 }, controller.signal);
          totalPages = result.total_pages;
          for (const wrestler of result.items) {
            wrestlers.set(wrestler.id, { wrestler_id: wrestler.id, name: wrestler.name, image_url: wrestler.image_url, gender: wrestler.gender });
          }
          page++;
        } while (page <= totalPages && !controller.signal.aborted);
        // Existing participants remain editable even if their contracts have expired.
        for (const member of rivalry?.members ?? []) {
          if (!wrestlers.has(member.wrestler_id)) wrestlers.set(member.wrestler_id, { ...member, gender: null });
        }
        if (!controller.signal.aborted) setRoster([...wrestlers.values()].sort((a, b) => a.name.localeCompare(b.name)));
      } catch (cause) {
        if (!controller.signal.aborted) setLoadError(cause instanceof Error ? cause.message : "Participants could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [careerId, rivalry, attempt]);

  const slots = kind === "singles" ? [0, 2] : [0, 1, 2, 3];
  const participants = slots.map(slot => ({ wrestler_id: selected[slot], side: (slot < 2 ? 1 : 2) as 1 | 2 }));
  const uniqueParticipants = new Set(participants.map(member => member.wrestler_id));
  const startedTick = week === "" ? null : (Number(season) - 1) * 50 + Number(week);
  const validDate = (startedTick === null ? currentTick <= (rivalry?.ended_tick ?? currentTick) : (
    Number.isSafeInteger(Number(season)) && Number(season) >= 1 &&
    Number.isSafeInteger(Number(week)) && Number(week) >= 1 && Number(week) <= 50 &&
    Number.isSafeInteger(startedTick) && startedTick >= 1 && startedTick <= (rivalry?.ended_tick ?? currentTick)
  ));
  const validParticipants = participants.every(member => member.wrestler_id && roster.some(wrestler => wrestler.wrestler_id === member.wrestler_id)) && uniqueParticipants.size === participants.length;
  const canSubmit = !loading && !loadError && validDate && validParticipants;
  const visibleRoster = roster.filter(wrestler => wrestler.gender === gender && wrestler.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));

  function chooseWrestler(wrestlerId: string) {
    if (submittingRef.current || slots.some(slot => slot !== activeSlot && selected[slot] === wrestlerId)) return;
    const next = selected.map((value, slot) => slot === activeSlot ? wrestlerId : value);
    setSelected(next);
    setError("");
    const nextSlot = slots.find(slot => slot !== activeSlot && !next[slot]);
    if (nextSlot !== undefined) setActiveSlot(nextSlot);
  }

  function close() {
    if (!submittingRef.current) onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    setSaving(true);
    setError("");
    try {
      const values = { careerId, feudId: rivalry?.id ?? null, kind, level, startedTick, participants };
      const signature = JSON.stringify(values);
      if (requestRef.current?.signature !== signature) requestRef.current = { signature, id: crypto.randomUUID() };
      await saveRivalry({ ...values, requestId: requestRef.current.id });
      if (mountedRef.current) onSaved();
    } catch (cause) {
      if (mountedRef.current) setError(cause instanceof Error ? cause.message : "The rivalry could not be saved.");
    } finally {
      submittingRef.current = false;
      if (mountedRef.current) setSaving(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="rivalry-editor" style={{ "--rivalry-editor-arena": `url("${arenaBackground}")` } as CSSProperties} aria-labelledby={headingId} onCancel={event => { event.preventDefault(); close(); }}>
      <header className="rivalry-editor__header">
        <div className="rivalry-editor__heading">
          <span className="rivalry-editor__icon"><Swords size={20} aria-hidden="true" /></span>
          <div>
          <p className="rivalry-editor__eyebrow">Build your next story</p>
          <h2 id={headingId}>{rivalry ? "Edit rivalry" : "Create rivalry"}</h2>
          </div>
        </div>
        <button className="rivalry-editor__close" type="button" aria-label="Close rivalry form" disabled={saving} autoFocus onClick={close}><X size={20} aria-hidden="true" /></button>
      </header>
      <form className="rivalry-editor__form" onSubmit={submit} aria-busy={saving || loading}>
        <div className="rivalry-editor__content">
        <fieldset disabled={saving}>
          <legend className="rivalry-editor__sr-only">Rivalry details</legend>
          <div className="rivalry-editor__section">
          <h3>Rivalry details</h3>
          <div className="rivalry-editor__sides">
          <label>Rivalry type
            <select value={kind} onChange={event => { setKind(event.target.value as SaveRivalryInput["kind"]); setActiveSlot(0); setError(""); }}>
              <option value="singles">1v1</option><option value="tag_team">2v2</option>
            </select>
          </label>
          <label>Level
            <select value={level} onChange={event => { setLevel(Number(event.target.value) as RivalryLevel); setError(""); }}>
              {[1, 2, 3, 4].map(value => <option key={value} value={value}>Level {value}</option>)}
            </select>
          </label>
          </div>
          </div>
          <div className="rivalry-editor__matchup" role="group" aria-label="Selected rivalry participants">
            {([1, 2] as const).map(side => (
              <div className="rivalry-editor__team" key={side}>
                <p className="rivalry-editor__team-label">Side {side}</p>
                <div className="rivalry-editor__slots">
                  {slots.filter(slot => (slot < 2 ? 1 : 2) === side).map((slot, index) => {
                    const wrestler = roster.find(member => member.wrestler_id === selected[slot]) ?? rivalry?.members.find(member => member.wrestler_id === selected[slot]);
                    return (
                      <div className="rivalry-editor__slot" key={slot}>
                        <button type="button" className="rivalry-editor__slot-button" aria-pressed={activeSlot === slot} aria-label={`Choose side ${side}, participant ${index + 1}${wrestler ? `: ${wrestler.name}` : ""}`} onClick={() => setActiveSlot(slot)}>
                          <WrestlerPortrait wrestler={wrestler} />
                          <span>{wrestler?.name ?? "Choose wrestler"}</span>
                          <small>Participant {index + 1}</small>
                        </button>
                        {selected[slot] && <button className="rivalry-editor__remove" type="button" aria-label={`Remove ${wrestler?.name ?? "participant"} from side ${side}`} onClick={() => { setSelected(current => current.map((value, position) => position === slot ? "" : value)); setActiveSlot(slot); setError(""); }}><X size={14} /></button>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <span className="rivalry-editor__versus" aria-hidden="true">VS</span>
          </div>
          <fieldset disabled={loading || !!loadError} className="rivalry-editor__picker">
            <legend>Choose participants</legend>
            <div className="rivalry-editor__picker-tools">
              <div className="rivalry-editor__gender" role="group" aria-label="Filter participants by gender">
                {(["male", "female"] as const).map(value => <button key={value} type="button" aria-pressed={gender === value} onClick={() => setGender(value)}>{value === "male" ? "Male" : "Female"}</button>)}
              </div>
              <label className="rivalry-editor__search">
                <Search size={16} aria-hidden="true" />
                <input type="search" aria-label="Search participants by name" placeholder="Search wrestlers" maxLength={200} value={search} onChange={event => setSearch(event.target.value)} />
              </label>
            </div>
            <p className="rivalry-editor__picker-hint" aria-live="polite">Selecting for side {activeSlot < 2 ? 1 : 2}, participant {(activeSlot % 2) + 1}. {slots.filter(slot => selected[slot]).length}/{slots.length} selected.</p>
            {!loading && !loadError && (
              <ul className="rivalry-editor__roster" aria-label={`${gender === "male" ? "Male" : "Female"} wrestlers`}>
                {visibleRoster.map(wrestler => {
                  const selectedSlot = slots.find(slot => selected[slot] === wrestler.wrestler_id);
                  return (
                    <li key={wrestler.wrestler_id}>
                      <button className="rivalry-editor__wrestler" type="button" aria-pressed={selectedSlot !== undefined} disabled={selectedSlot !== undefined && selectedSlot !== activeSlot} onClick={() => chooseWrestler(wrestler.wrestler_id)}>
                        <WrestlerPortrait wrestler={wrestler} />
                        <span>{wrestler.name}</span>
                        {selectedSlot !== undefined && <small><Check size={12} aria-hidden="true" /> Side {selectedSlot < 2 ? 1 : 2}</small>}
                      </button>
                    </li>
                  );
                })}
                {visibleRoster.length === 0 && <li className="rivalry-editor__no-results">{search.trim() ? "No wrestlers match your search." : `No ${gender} wrestlers available.`}</li>}
              </ul>
            )}
          </fieldset>
          <div className="rivalry-editor__section">
          <h3>Starting point</h3>
          <div className="rivalry-editor__sides">
            <label>Start season<input type="number" min={1} max={Math.floor((currentTick - 1) / 50) + 1} required={week !== ""} disabled={week === ""} value={season} onChange={event => { setSeason(event.target.value); setError(""); }} /></label>
            <label>Start week (optional)<input type="number" min={1} max={50} value={week} aria-describedby={hintId} placeholder={String(((currentTick - 1) % 50) + 1)} onChange={event => { setWeek(event.target.value); setError(""); }} /></label>
          </div>
          <p className="rivalry-editor__hint" id={hintId}>Leave the start week empty to use the current week and season.</p>
          </div>
        </fieldset>
        {loading && <p role="status">Loading participants…</p>}
        {loadError && <div role="alert"><p>{loadError}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Retry participants</button></div>}
        {!validDate && <p role="alert">Choose a start between season 1, week 1 and {rivalry?.ended_tick ? "the rivalry end" : "the current week"}.</p>}
        {error && <p role="alert">{error}</p>}
        </div>
        <footer className="rivalry-editor__actions">
          <button type="button" disabled={saving} onClick={close}>Cancel</button>
          <button type="submit" className="rivalry-editor__primary" disabled={!canSubmit || saving}>{saving ? "Saving…" : rivalry ? "Save changes" : "Create rivalry"}</button>
        </footer>
      </form>
    </dialog>
  );
}
