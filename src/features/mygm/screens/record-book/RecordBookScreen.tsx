import { useId } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";

import RatingRecordsRanking from "../../components/record-book/rankings/RatingRecordsRanking";
import ReignRecordsRanking from "../../components/record-book/rankings/ReignRecordsRanking";
import WrestlerRecordsRanking from "../../components/record-book/rankings/WrestlerRecordsRanking";

import type {
  RecordBookRecord,
  RecordBookSection,
} from "../../types/record-book/recordBookPage.types";
import type { MyGmOutletContext } from "../../types/mygm.types";

import "./RecordBookScreen.scss";

const sectionOptions: {
  value: RecordBookSection;
  label: string;
}[] = [
  { value: "championships", label: "Championships" },
  { value: "matches", label: "Matches" },
  { value: "shows", label: "Shows" },
  { value: "wrestlemania", label: "WrestleMania" },
];

const recordOptions: Record<
  RecordBookSection,
  { value: RecordBookRecord; label: string }[]
> = {
  championships: [
    { value: "longest_reigns", label: "Longest reigns" },
    { value: "most_defenses", label: "Most successful defenses" },
    { value: "most_reigns", label: "Most championship reigns" },
  ],

  matches: [
    { value: "most_wins", label: "Most wins" },
    { value: "most_matches", label: "Most match appearances" },
    { value: "high_rated_matches", label: "Most 4.5+ star matches" },
  ],

  shows: [
    { value: "best_shows", label: "Highest-rated shows" },
    { value: "best_matches", label: "Highest-rated matches" },
  ],

  wrestlemania: [
    {
      value: "wrestlemania_main_events",
      label: "Most WrestleMania main events",
    },
  ],
};

const defaultRecords: Record<RecordBookSection, RecordBookRecord> = {
  championships: "longest_reigns",
  matches: "most_wins",
  shows: "best_shows",
  wrestlemania: "wrestlemania_main_events",
};

function renderRanking(careerId: string, record: RecordBookRecord) {
  switch (record) {
    case "longest_reigns":
    case "most_defenses":
      return <ReignRecordsRanking careerId={careerId} record={record} />;

    case "most_reigns":
    case "most_wins":
    case "most_matches":
    case "high_rated_matches":
    case "wrestlemania_main_events":
      return <WrestlerRecordsRanking careerId={careerId} record={record} />;

    case "best_shows":
    case "best_matches":
      return <RatingRecordsRanking careerId={careerId} record={record} />;
  }
}

export default function RecordBookScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();

  const headingId = useId();
  const contentId = useId();

  const selectedSection =
    sectionOptions.find(
      (option) => option.value === searchParams.get("section"),
    )?.value ?? "championships";

  const availableRecords = recordOptions[selectedSection];

  const selectedRecord =
    availableRecords.find(
      (option) => option.value === searchParams.get("record"),
    )?.value ?? defaultRecords[selectedSection];

  function handleSectionChange(section: RecordBookSection) {
    if (section === selectedSection) {
      return;
    }

    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);

      next.set("section", section);
      next.set("record", defaultRecords[section]);

      return next;
    });
  }

  function handleRecordChange(record: RecordBookRecord) {
    if (
      record === selectedRecord ||
      !availableRecords.some((option) => option.value === record)
    ) {
      return;
    }

    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);

      next.set("section", selectedSection);
      next.set("record", record);

      return next;
    });
  }

  return (
    <section className="record-book-screen" aria-labelledby={headingId}>
      <header className="record-book-screen__header">
        <p className="record-book-screen__eyebrow">Your brand history</p>

        <h1 id={headingId}>Record Book</h1>

        <p className="record-book-screen__description">
          Choose a category and explore your career records.
        </p>
      </header>

      <nav
        className="record-book-screen__sections"
        aria-label="Record Book sections"
      >
        {sectionOptions.map((option) => (
          <button
            key={option.value}
            className={`record-book-screen__section-button${
              selectedSection === option.value ? " is-active" : ""
            }`}
            type="button"
            aria-pressed={selectedSection === option.value}
            aria-controls={contentId}
            onClick={() => handleSectionChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </nav>

      <div className="record-book-screen__filters">
        <label className="record-book-screen__field record-book-screen__field--section">
          <span>Section</span>

          <select
            value={selectedSection}
            aria-controls={contentId}
            onChange={(event) => {
              const option = sectionOptions.find(
                (item) => item.value === event.target.value,
              );

              if (option) {
                handleSectionChange(option.value);
              }
            }}
          >
            {sectionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="record-book-screen__field">
          <span>Record</span>

          <select
            value={selectedRecord}
            aria-controls={contentId}
            onChange={(event) => {
              const option = availableRecords.find(
                (item) => item.value === event.target.value,
              );

              if (option) {
                handleRecordChange(option.value);
              }
            }}
          >
            {availableRecords.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        key={`ranking:${career.id}:${selectedRecord}`}
        id={contentId}
        className="record-book-screen__rankings"
      >
        {renderRanking(career.id, selectedRecord)}
      </div>
    </section>
  );
}
