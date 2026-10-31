import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Newspaper,
  Swords,
  Trophy,
} from "lucide-react";

import type {
  MyGmNewsItem,
  NewsWrestler,
} from "../../../types/news/news.types";

import { getNewsPresentation } from "./newsPresentation";

import "./NewsCarousel.scss";

interface NewsCarouselProps {
  careerId: string;
  items: MyGmNewsItem[];
}

function NewsPortrait({ person }: { person: NewsWrestler }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const showImage = person.image_url !== null && person.image_url !== failedUrl;

  const initials = person.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <figure className="news-carousel__person">
      <div className="news-carousel__portrait">
        {showImage && person.image_url ? (
          <img
            src={person.image_url}
            alt=""
            loading="lazy"
            onError={() => setFailedUrl(person.image_url)}
          />
        ) : (
          <span className="news-carousel__initials">{initials || "?"}</span>
        )}
      </div>

      <figcaption className="news-carousel__sr-only">{person.name}</figcaption>
    </figure>
  );
}

function NewsBelt({ src }: { src: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <span className="news-carousel__belt" aria-hidden="true">
      {src && src !== failedUrl ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailedUrl(src)}
        />
      ) : (
        <Trophy size={32} strokeWidth={1.4} />
      )}

      <span className="news-carousel__belt-label">Championship</span>
    </span>
  );
}

function PortraitGroup({ people }: { people: readonly NewsWrestler[] }) {
  const visiblePeople = people.slice(0, 2);
  const extraCount = people.length - visiblePeople.length;

  return (
    <div
      className={[
        "news-carousel__group",
        visiblePeople.length > 1 ? "news-carousel__group--pair" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {visiblePeople.map((person) => (
        <NewsPortrait key={person.id} person={person} />
      ))}

      {extraCount > 0 && (
        <span
          className="news-carousel__extra"
          aria-label={`${extraCount} additional participants`}
        >
          +{extraCount}
        </span>
      )}
    </div>
  );
}

function NewsVisual({ item }: { item: MyGmNewsItem }) {
  const news = getNewsPresentation(item);

  if (
    item.event_type === "rivalry_started" ||
    item.event_type === "rivalry_ended"
  ) {
    const firstSide = item.data.members.filter((member) => member.side === 1);

    const secondSide = item.data.members.filter((member) => member.side === 2);

    return (
      <div className="news-carousel__visual news-carousel__visual--rivalry">
        <div className="news-carousel__versus">
          <PortraitGroup people={firstSide} />

          <span className="news-carousel__vs" aria-hidden="true">
            VS
          </span>

          <PortraitGroup people={secondSide} />
        </div>
      </div>
    );
  }

  return (
    <div className="news-carousel__visual news-carousel__visual--championship">
      <div className="news-carousel__champions">
        <PortraitGroup people={news.people} />
      </div>

      <NewsBelt src={news.championship?.image_url ?? null} />
    </div>
  );
}

export default function NewsCarousel({ careerId, items }: NewsCarouselProps) {
  const instructionsId = useId();
  const trackId = useId();

  const trackRef = useRef<HTMLUListElement>(null);
  const activeIndexRef = useRef(0);
  const scrollFrameRef = useRef<number | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);

  const feedKey = JSON.stringify([careerId, items.map((item) => item.id)]);

  const currentIndex =
    items.length > 0 ? Math.min(activeIndex, items.length - 1) : 0;

  useEffect(() => {
    activeIndexRef.current = 0;
    setActiveIndex(0);

    trackRef.current?.scrollTo({
      left: 0,
      behavior: "instant",
    });
  }, [feedKey]);

  // Keep the current item aligned when the sidebar changes width.
  useEffect(() => {
    const track = trackRef.current;

    if (!track) return;

    let resizeFrame: number | null = null;

    const observer = new ResizeObserver(() => {
      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = window.requestAnimationFrame(() => {
        const first = track.children.item(0);
        const selected = track.children.item(activeIndexRef.current);

        if (first instanceof HTMLElement && selected instanceof HTMLElement) {
          track.scrollTo({
            left: selected.offsetLeft - first.offsetLeft,
            behavior: "instant",
          });
        }

        resizeFrame = null;
      });
    });

    observer.observe(track);

    return () => {
      observer.disconnect();

      if (resizeFrame !== null) {
        window.cancelAnimationFrame(resizeFrame);
      }
    };
  }, [feedKey]);

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  function updateActiveSlide() {
    const track = trackRef.current;
    const firstSlide = track?.children.item(0);

    if (!track || !(firstSlide instanceof HTMLElement)) return;

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    Array.from(track.children).forEach((slide, index) => {
      if (!(slide instanceof HTMLElement)) return;

      const position = slide.offsetLeft - firstSlide.offsetLeft;
      const distance = Math.abs(position - track.scrollLeft);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    activeIndexRef.current = nearestIndex;

    setActiveIndex((previous) =>
      previous === nearestIndex ? previous : nearestIndex,
    );
  }

  function handleScroll() {
    if (scrollFrameRef.current !== null) return;

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      updateActiveSlide();
    });
  }

  function goToSlide(index: number) {
    const track = trackRef.current;
    const firstSlide = track?.children.item(0);
    const slide = track?.children.item(index);

    if (
      !track ||
      !(firstSlide instanceof HTMLElement) ||
      !(slide instanceof HTMLElement)
    ) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    track.scrollTo({
      left: slide.offsetLeft - firstSlide.offsetLeft,
      behavior: reduceMotion ? "instant" : "smooth",
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.target !== event.currentTarget || items.length < 2) {
      return;
    }

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        goToSlide(Math.max(0, currentIndex - 1));
        break;

      case "ArrowRight":
        event.preventDefault();
        goToSlide(Math.min(items.length - 1, currentIndex + 1));
        break;

      case "Home":
        event.preventDefault();
        goToSlide(0);
        break;

      case "End":
        event.preventDefault();
        goToSlide(items.length - 1);
        break;
    }
  }

  if (items.length === 0) {
    return (
      <div className="news-carousel__empty">
        <span className="news-carousel__empty-icon">
          <Newspaper size={30} aria-hidden="true" />
        </span>

        <div>
          <h3>Your stories start in the ring.</h3>
          <p>
            Championship and rivalry updates will appear as your career
            develops.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section
      className="news-carousel"
      aria-label="Career news carousel"
      aria-roledescription="carousel"
    >
      <p className="news-carousel__sr-only" id={instructionsId}>
        Swipe or use the left and right arrow keys to browse news. Use Home or
        End to reach the first or last item.
      </p>

      <ul
        className="news-carousel__track"
        id={trackId}
        ref={trackRef}
        aria-label="Career news items"
        aria-describedby={instructionsId}
        tabIndex={items.length > 1 ? 0 : undefined}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
      >
        {items.map((item, index) => {
          const news = getNewsPresentation(item);

          const isRivalry =
            item.event_type === "rivalry_started" ||
            item.event_type === "rivalry_ended";

          const isTeamNews = news.people.length > 2;

          const CategoryIcon = isRivalry ? Swords : Trophy;

          return (
            <li className="news-carousel__slide" key={item.id}>
              <article
                className={[
                  "news-carousel__card",
                  isTeamNews ? "news-carousel__card--team" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-roledescription="slide"
                aria-label={`News ${index + 1} of ${items.length}`}
              >
                <div className="news-carousel__content">
                  <div className="news-carousel__meta">
                    <span className="news-carousel__category">
                      <CategoryIcon size={14} aria-hidden="true" />
                      {news.category}
                    </span>

                    <span className="news-carousel__period">
                      {news.periodLabel}
                    </span>
                  </div>

                  <h3>{news.title}</h3>

                  <p className="news-carousel__description">
                    {news.description}
                  </p>

                  {news.eventId && (
                    <Link
                      className="news-carousel__link"
                      to={`/mygm/${careerId}/history/${news.eventId}`}
                    >
                      View show
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </Link>
                  )}
                </div>

                <NewsVisual item={item} />
              </article>
            </li>
          );
        })}
      </ul>

      {items.length > 1 && (
        <div className="news-carousel__footer">
          <div className="news-carousel__pagination" aria-hidden="true">
            {items.map((item, index) => (
              <span
                key={item.id}
                className={index === currentIndex ? "is-active" : ""}
              />
            ))}
          </div>

          <div
            className="news-carousel__controls"
            role="group"
            aria-label="News carousel controls"
          >
            <button
              type="button"
              aria-label="Previous news"
              aria-controls={trackId}
              disabled={currentIndex === 0}
              onClick={() => goToSlide(currentIndex - 1)}
            >
              <ChevronLeft size={19} aria-hidden="true" />
            </button>

            <span
              className="news-carousel__position"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {currentIndex + 1} / {items.length}
            </span>

            <button
              type="button"
              aria-label="Next news"
              aria-controls={trackId}
              disabled={currentIndex === items.length - 1}
              onClick={() => goToSlide(currentIndex + 1)}
            >
              <ChevronRight size={19} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
