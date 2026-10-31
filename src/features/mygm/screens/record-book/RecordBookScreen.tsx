import { useId } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { Medal, Sparkles, Star, Swords, Trophy } from "lucide-react";

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
  icon: typeof Trophy;
}[] = [
  {
    value: "championships",
    label: "Championships",
    icon: Trophy,
  },
  {
    value: "matches",
    label: "Matches",
    icon: Swords,
  },
  {
    value: "shows",
    label: "Shows",
    icon: Star,
  },
  {
    value: "wrestlemania",
    label: "WrestleMania",
    icon: Sparkles,
  },
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
        <div>
          <p className="record-book-screen__eyebrow">
            The legacy of your brand
          </p>

          <h1 id={headingId}>Record Book</h1>

          <p className="record-book-screen__description">
            Historic reigns, standout performances and the names setting the
            standard.
          </p>
        </div>

        <span className="record-book-screen__emblem" aria-hidden="true">
          <Medal size={30} strokeWidth={1.5} />
        </span>
      </header>

      <nav
        className="record-book-screen__sections"
        aria-label="Record Book sections"
      >
        {sectionOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedSection === option.value;

          return (
            <button
              key={option.value}
              className={`record-book-screen__section-button${
                isSelected ? " is-active" : ""
              }`}
              type="button"
              aria-pressed={isSelected}
              aria-controls={contentId}
              onClick={() => handleSectionChange(option.value)}
            >
              <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
              <span>{option.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="record-book-screen__filters">
        <label className="record-book-screen__field">
          <span>Explore records</span>

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
