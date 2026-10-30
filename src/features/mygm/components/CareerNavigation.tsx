import { useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  CalendarPlus,
  Ellipsis,
  History,
  LayoutDashboard,
  Settings2,
  Swords,
  Trophy,
  Store,
  UsersRound,
  Newspaper,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import "./CareerNavigation.scss";

interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface CareerNavigationProps {
  careerId: string;
}

const dashboard: NavigationItem = {
  label: "Dashboard",
  path: "",
  icon: LayoutDashboard,
};

const roster: NavigationItem = {
  label: "Roster",
  path: "roster",
  icon: UsersRound,
};

const market: NavigationItem = {
  label: "Market",
  path: "market",
  icon: Store,
};

const records: NavigationItem = {
  label: "Record Book",
  path: "record-book",
  icon: Trophy,
};

const booking: NavigationItem = {
  label: "Booking",
  path: "booking",
  icon: CalendarPlus,
};

const rivalries: NavigationItem = {
  label: "Rivalries",
  path: "rivalries",
  icon: Swords,
};

const titles: NavigationItem = {
  label: "Titles",
  path: "titles",
  icon: Award,
};

const history: NavigationItem = {
  label: "Show history",
  path: "history",
  icon: History,
};

const news: NavigationItem = {
  label: "News",
  path: "news",
  icon: Newspaper,
};

const settings: NavigationItem = {
  label: "Career settings",
  path: "settings",
  icon: Settings2,
};

const moreItems = [market, rivalries, titles, history, news, settings];

const desktopItems = [
  dashboard,
  roster,
  market,
  rivalries,
  titles,
  history,
  news,
  records,
  booking,
  settings,
];

export default function CareerNavigation({ careerId }: CareerNavigationProps) {
  const { pathname } = useLocation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const basePath = `/mygm/${careerId}`;

  function getPath(item: NavigationItem) {
    return item.path ? `${basePath}/${item.path}` : basePath;
  }

  const isMoreActive = moreItems.some(
    (item) =>
      pathname === getPath(item) || pathname.startsWith(`${getPath(item)}/`),
  );

  function openMore() {
    if (!dialogRef.current || dialogRef.current.open) return;

    dialogRef.current.showModal();
    setIsMoreOpen(true);
  }

  function closeMore() {
    dialogRef.current?.close();
    setIsMoreOpen(false);
  }

  function renderMobileItem(item: NavigationItem) {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={getPath(item)}
        end={item.path === ""}
        className={({ isActive }) =>
          `career-navigation__mobile-item ${isActive ? "is-active" : ""}`
        }
      >
        <Icon size={22} aria-hidden="true" />
        <span>{item.label}</span>
      </NavLink>
    );
  }

  return (
    <>
      <nav
        className="career-navigation__mobile"
        aria-label="Mobile career navigation"
      >
        {renderMobileItem(dashboard)}
        {renderMobileItem(roster)}

        <button
          type="button"
          className={`career-navigation__mobile-item ${
            isMoreActive || isMoreOpen ? "is-active" : ""
          }`}
          onClick={openMore}
          aria-haspopup="dialog"
          aria-expanded={isMoreOpen}
          aria-controls="career-more-menu"
        >
          <Ellipsis size={22} aria-hidden="true" />
          <span>More</span>
        </button>

        {renderMobileItem(records)}
        {renderMobileItem(booking)}
      </nav>

      <nav
        className="career-navigation__desktop"
        aria-label="Career navigation"
      >
        <p className="career-navigation__label">Career menu</p>

        {desktopItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={getPath(item)}
              end={item.path === ""}
              className={({ isActive }) =>
                `career-navigation__desktop-item ${isActive ? "is-active" : ""}`
              }
            >
              <Icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <Link className="career-navigation__exit" to="/mygm">
          <ArrowLeft size={20} aria-hidden="true" />
          <span>Back to careers</span>
        </Link>
      </nav>

      <dialog
        ref={dialogRef}
        id="career-more-menu"
        className="career-more"
        aria-labelledby="career-more-title"
        onClose={() => setIsMoreOpen(false)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;

          const rect = event.currentTarget.getBoundingClientRect();

          const outside =
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom;

          if (outside) closeMore();
        }}
      >
        <header className="career-more__header">
          <h2 id="career-more-title">More</h2>

          <button
            type="button"
            onClick={closeMore}
            aria-label="Close menu"
            autoFocus
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <nav className="career-more__links" aria-label="More career options">
          {moreItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={getPath(item)}
                onClick={closeMore}
                className={({ isActive }) =>
                  `career-more__link ${isActive ? "is-active" : ""}`
                }
              >
                <Icon size={20} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <Link className="career-more__exit" to="/mygm" onClick={closeMore}>
          <ArrowLeft size={20} aria-hidden="true" />
          <span>Back to careers</span>
        </Link>
      </dialog>
    </>
  );
}
