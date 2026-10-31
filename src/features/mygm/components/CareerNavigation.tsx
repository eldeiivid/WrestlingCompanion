import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  CalendarPlus,
  ChevronRight,
  Ellipsis,
  History,
  LayoutDashboard,
  Newspaper,
  PanelLeft,
  Settings2,
  Store,
  Swords,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import "./CareerNavigation.scss";

interface NavigationItem {
  label: string;
  mobileLabel?: string;
  description: string;
  path: string;
  icon: LucideIcon;
}

interface CareerNavigationProps {
  careerId: string;
}

type SidebarMode = "expanded" | "collapsed" | "hover";

const sidebarStorageKey = "wrestlingbook.sidebar-mode";

const sidebarModes: { value: SidebarMode; label: string }[] = [
  { value: "expanded", label: "Expanded" },
  { value: "collapsed", label: "Collapsed" },
  { value: "hover", label: "Expand on hover" },
];

function getSavedSidebarMode(): SidebarMode {
  try {
    const saved = window.localStorage.getItem(sidebarStorageKey);

    if (saved === "expanded" || saved === "collapsed" || saved === "hover") {
      return saved;
    }
  } catch {
    // Use the default when browser storage is unavailable.
  }

  return "expanded";
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const dashboard: NavigationItem = {
  label: "Dashboard",
  mobileLabel: "Home",
  description: "Your career at a glance",
  path: "",
  icon: LayoutDashboard,
};

const roster: NavigationItem = {
  label: "Roster",
  description: "Wrestlers and contracts",
  path: "roster",
  icon: UsersRound,
};

const market: NavigationItem = {
  label: "Market",
  description: "Find your next signing",
  path: "market",
  icon: Store,
};

const records: NavigationItem = {
  label: "Record Book",
  mobileLabel: "Records",
  description: "Milestones and career records",
  path: "record-book",
  icon: Trophy,
};

const booking: NavigationItem = {
  label: "Booking",
  description: "Build your next show",
  path: "booking",
  icon: CalendarPlus,
};

const rivalries: NavigationItem = {
  label: "Rivalries",
  description: "Follow every feud",
  path: "rivalries",
  icon: Swords,
};

const titles: NavigationItem = {
  label: "Titles",
  description: "Champions and title history",
  path: "titles",
  icon: Award,
};

const history: NavigationItem = {
  label: "Show history",
  description: "Revisit your past shows",
  path: "history",
  icon: History,
};

const news: NavigationItem = {
  label: "News",
  description: "Stories from your career",
  path: "news",
  icon: Newspaper,
};

const settings: NavigationItem = {
  label: "Career settings",
  description: "Manage your career",
  path: "settings",
  icon: Settings2,
};

const navigationGroups = [
  {
    label: "Workspace",
    items: [dashboard, booking, roster, market],
  },
  {
    label: "Career",
    items: [rivalries, titles, history, news, records],
  },
];

const moreItems = [market, rivalries, titles, history, news, settings];

export default function CareerNavigation({ careerId }: CareerNavigationProps) {
  const { pathname } = useLocation();

  const [sidebarMode, setSidebarMode] =
    useState<SidebarMode>(getSavedSidebarMode);
  const [isControlOpen, setIsControlOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const controlButtonRef = useRef<HTMLButtonElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const moreAnimationRef = useRef<Animation | null>(null);
  const isClosingRef = useRef(false);
  const backdropPointerRef = useRef(false);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const basePath = `/mygm/${careerId}`;

  function getPath(item: NavigationItem) {
    return item.path ? `${basePath}/${item.path}` : basePath;
  }

  const isMoreActive = moreItems.some(
    (item) =>
      pathname === getPath(item) || pathname.startsWith(`${getPath(item)}/`),
  );

  const currentModeLabel =
    sidebarModes.find((mode) => mode.value === sidebarMode)?.label ??
    "Expanded";

  useEffect(() => {
    try {
      window.localStorage.setItem(sidebarStorageKey, sidebarMode);
    } catch {
      // The selected mode still works without persistence.
    }
  }, [sidebarMode]);

  const closeSidebarControl = useCallback(() => {
    const panel = controlRef.current;

    if (panel?.matches(":popover-open")) {
      panel.hidePopover();
    }

    setIsControlOpen(false);
  }, []);

  function toggleSidebarControl() {
    const panel = controlRef.current;
    const button = controlButtonRef.current;

    if (!panel || !button) return;

    if (panel.matches(":popover-open")) {
      closeSidebarControl();
      return;
    }

    const rect = button.getBoundingClientRect();
    const width = Math.min(224, window.innerWidth - 24);

    const left = Math.max(
      12,
      Math.min(rect.left, window.innerWidth - width - 12),
    );

    panel.style.width = `${width}px`;
    panel.style.left = `${left}px`;
    panel.style.bottom = `${window.innerHeight - rect.top + 10}px`;

    panel.showPopover();

    if (!prefersReducedMotion()) {
      panel.animate(
        [
          { opacity: 0, transform: "translateY(6px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 160,
          easing: "ease-out",
        },
      );
    }
  }

  function selectSidebarMode(mode: SidebarMode) {
    setSidebarMode(mode);
    closeSidebarControl();
    controlButtonRef.current?.focus({ preventScroll: true });
  }

  const finishMoreClose = useCallback(() => {
    moreAnimationRef.current?.cancel();
    moreAnimationRef.current = null;
    isClosingRef.current = false;

    const dialog = dialogRef.current;

    if (dialog?.open) {
      dialog.close();
    }

    dialog?.classList.remove("is-closing");
    backdropPointerRef.current = false;
    setIsMoreOpen(false);
  }, []);

  const closeMore = useCallback(() => {
    const dialog = dialogRef.current;

    if (!dialog?.open || isClosingRef.current) return;

    if (prefersReducedMotion()) {
      finishMoreClose();
      return;
    }

    isClosingRef.current = true;

    const computed = window.getComputedStyle(dialog);

    const currentFrame = {
      opacity: computed.opacity,
      transform: computed.transform,
    };

    moreAnimationRef.current?.cancel();

    dialog.classList.add("is-closing");

    const animation = dialog.animate(
      [
        currentFrame,
        {
          opacity: 0,
          transform: "translateY(32px)",
        },
      ],
      {
        duration: 180,
        easing: "cubic-bezier(0.4, 0, 1, 1)",
        fill: "both",
      },
    );

    moreAnimationRef.current = animation;

    void animation.finished.then(
      () => {
        if (moreAnimationRef.current === animation) {
          finishMoreClose();
        }
      },
      () => {
        // Cancellation is expected when resizing or unmounting.
      },
    );
  }, [finishMoreClose]);

  function openMore() {
    const dialog = dialogRef.current;

    if (!dialog || dialog.open) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    isClosingRef.current = false;
    dialog.classList.remove("is-closing");

    dialog.showModal();
    setIsMoreOpen(true);

    if (prefersReducedMotion()) return;

    const animation = dialog.animate(
      [
        {
          opacity: 0,
          transform: "translateY(48px)",
        },
        {
          opacity: 1,
          transform: "translateY(0)",
        },
      ],
      {
        duration: 280,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "both",
      },
    );

    moreAnimationRef.current = animation;

    void animation.finished.then(
      () => {
        if (moreAnimationRef.current === animation) {
          moreAnimationRef.current = null;
          animation.cancel();
        }
      },
      () => {
        // A close action may interrupt the opening animation.
      },
    );
  }

  function isOutsideDialog(clientX: number, clientY: number) {
    const dialog = dialogRef.current;

    if (!dialog) return false;

    const rect = dialog.getBoundingClientRect();

    return (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    );
  }

  useEffect(() => {
    closeMore();
    closeSidebarControl();
  }, [pathname, closeMore, closeSidebarControl]);

  useEffect(() => {
    if (!isMoreOpen) return;

    const scrollArea = dialogRef.current
      ?.closest(".mygm-layout")
      ?.querySelector<HTMLElement>(".mygm-layout__content");

    const previousBodyOverflow = document.body.style.overflow;
    const previousContentOverflow = scrollArea?.style.overflow;

    document.body.style.overflow = "hidden";

    if (scrollArea) {
      scrollArea.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;

      if (scrollArea) {
        scrollArea.style.overflow = previousContentOverflow ?? "";
      }

      const previousFocus = previousFocusRef.current;

      if (
        previousFocus?.isConnected &&
        previousFocus.getClientRects().length > 0
      ) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [isMoreOpen]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 960px)");

    function handleBreakpointChange() {
      if (desktopQuery.matches) {
        finishMoreClose();
      } else {
        closeSidebarControl();
      }
    }

    function handleResize() {
      closeSidebarControl();
    }

    desktopQuery.addEventListener("change", handleBreakpointChange);
    window.addEventListener("resize", handleResize);

    return () => {
      desktopQuery.removeEventListener("change", handleBreakpointChange);
      window.removeEventListener("resize", handleResize);
    };
  }, [finishMoreClose, closeSidebarControl]);

  useEffect(() => {
    const dialog = dialogRef.current;

    return () => {
      moreAnimationRef.current?.cancel();
      dialog?.close();
    };
  }, []);

  function renderDesktopItem(item: NavigationItem) {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={getPath(item)}
        end={item.path === ""}
        title={item.label}
        aria-label={item.label}
        className={({ isActive }) =>
          `career-navigation__desktop-item ${isActive ? "is-active" : ""}`
        }
      >
        <span className="career-navigation__desktop-icon">
          <Icon size={20} aria-hidden="true" />
        </span>

        <span className="career-navigation__text">{item.label}</span>
      </NavLink>
    );
  }

  function renderMobileItem(item: NavigationItem) {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.path}
        to={getPath(item)}
        end={item.path === ""}
        aria-label={item.label}
        className={({ isActive }) =>
          `career-navigation__mobile-item ${isActive ? "is-active" : ""}`
        }
      >
        <span className="career-navigation__mobile-icon">
          <Icon size={21} aria-hidden="true" />
        </span>

        <span className="career-navigation__mobile-label">
          {item.mobileLabel ?? item.label}
        </span>
      </NavLink>
    );
  }

  return (
    <>
      <nav
        className="career-navigation__desktop"
        data-sidebar-mode={sidebarMode}
        aria-label="Career navigation"
      >
        <div className="career-navigation__groups">
          {navigationGroups.map((group) => (
            <section
              className="career-navigation__group"
              aria-label={group.label}
              key={group.label}
            >
              <h2>{group.label}</h2>
              {group.items.map(renderDesktopItem)}
            </section>
          ))}
        </div>

        <div className="career-navigation__footer">
          {renderDesktopItem(settings)}

          <Link
            className="career-navigation__desktop-item"
            to="/mygm"
            title="Back to careers"
            aria-label="Back to careers"
          >
            <span className="career-navigation__desktop-icon">
              <ArrowLeft size={19} aria-hidden="true" />
            </span>

            <span className="career-navigation__text">Back to careers</span>
          </Link>

          <button
            ref={controlButtonRef}
            className="career-navigation__control-button"
            type="button"
            title={`Sidebar: ${currentModeLabel}`}
            aria-label={`Sidebar control. ${currentModeLabel}`}
            aria-expanded={isControlOpen}
            aria-controls="career-sidebar-control"
            onClick={toggleSidebarControl}
          >
            <span className="career-navigation__desktop-icon">
              <PanelLeft size={19} aria-hidden="true" />
            </span>

            <span className="career-navigation__text">Sidebar control</span>
          </button>
        </div>
      </nav>

      <div
        ref={controlRef}
        id="career-sidebar-control"
        className="career-sidebar-control"
        popover="auto"
        role="group"
        aria-labelledby="career-sidebar-control-title"
        onToggle={() => {
          setIsControlOpen(
            controlRef.current?.matches(":popover-open") ?? false,
          );
        }}
      >
        <p id="career-sidebar-control-title">Sidebar control</p>

        <div>
          {sidebarModes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              aria-pressed={sidebarMode === mode.value}
              onClick={() => selectSidebarMode(mode.value)}
            >
              <span
                className="career-sidebar-control__dot"
                aria-hidden="true"
              />
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <nav
        className="career-navigation__mobile"
        aria-label="Mobile career navigation"
      >
        {renderMobileItem(dashboard)}
        {renderMobileItem(roster)}

        <button
          className={`career-navigation__mobile-item ${
            isMoreActive || isMoreOpen ? "is-active" : ""
          }`}
          type="button"
          onClick={openMore}
          aria-haspopup="dialog"
          aria-expanded={isMoreOpen}
          aria-controls="career-more-menu"
        >
          <span className="career-navigation__mobile-icon">
            <Ellipsis size={21} aria-hidden="true" />
          </span>

          <span className="career-navigation__mobile-label">More</span>
        </button>

        {renderMobileItem(records)}
        {renderMobileItem(booking)}
      </nav>

      <dialog
        ref={dialogRef}
        id="career-more-menu"
        className="career-more"
        aria-labelledby="career-more-title"
        onClose={finishMoreClose}
        onCancel={(event) => {
          event.preventDefault();
          closeMore();
        }}
        onPointerDown={(event) => {
          backdropPointerRef.current =
            event.target === event.currentTarget &&
            isOutsideDialog(event.clientX, event.clientY);
        }}
        onPointerCancel={() => {
          backdropPointerRef.current = false;
        }}
        onClick={(event) => {
          const shouldClose =
            backdropPointerRef.current &&
            event.target === event.currentTarget &&
            isOutsideDialog(event.clientX, event.clientY);

          backdropPointerRef.current = false;

          if (shouldClose) closeMore();
        }}
      >
        <header className="career-more__header">
          <div>
            <p>Your career</p>
            <h2 id="career-more-title">Where to next?</h2>
          </div>

          <button
            className="career-more__close"
            type="button"
            onClick={closeMore}
            aria-label="Close career menu"
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
                <span className="career-more__icon">
                  <Icon size={21} aria-hidden="true" />
                </span>

                <span className="career-more__copy">
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </span>

                <ChevronRight
                  className="career-more__arrow"
                  size={17}
                  aria-hidden="true"
                />
              </NavLink>
            );
          })}
        </nav>

        <Link className="career-more__exit" to="/mygm" onClick={closeMore}>
          <ArrowLeft size={18} aria-hidden="true" />
          Back to careers
        </Link>
      </dialog>
    </>
  );
}
