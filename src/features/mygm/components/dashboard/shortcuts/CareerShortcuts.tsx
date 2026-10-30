import { useId } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, History, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "./CareerShortcuts.scss";

interface CareerShortcutsProps {
  careerId: string;
}

interface CareerShortcut {
  id: string;
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
}

const shortcuts: CareerShortcut[] = [
  {
    id: "booking",
    label: "Booking",
    description: "Prepare your card and record show results.",
    path: "booking",
    icon: CalendarDays,
  },
  {
    id: "roster",
    label: "Roster",
    description: "Review the wrestlers in your brand.",
    path: "roster",
    icon: Users,
  },
  {
    id: "history",
    label: "Show history",
    description: "Revisit completed shows and their results.",
    path: "history",
    icon: History,
  },
];

export default function CareerShortcuts({ careerId }: CareerShortcutsProps) {
  const headingId = useId();

  return (
    <section className="career-shortcuts" aria-labelledby={headingId}>
      <h2 id={headingId}>Shortcuts</h2>

      <ul className="career-shortcuts__list">
        {shortcuts.map((shortcut) => {
          const Icon = shortcut.icon;

          return (
            <li key={shortcut.id}>
              <Link
                className="career-shortcuts__link"
                to={`/mygm/${careerId}/${shortcut.path}`}
              >
                <span className="career-shortcuts__icon">
                  <Icon size={22} aria-hidden="true" />
                </span>

                <div className="career-shortcuts__content">
                  <h3>{shortcut.label}</h3>
                  <p>{shortcut.description}</p>
                </div>

                <ArrowRight
                  className="career-shortcuts__arrow"
                  size={18}
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
