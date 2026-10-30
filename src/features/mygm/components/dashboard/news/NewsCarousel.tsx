import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Link } from "react-router-dom";
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

interface NewsPortraitProps {
  person: NewsWrestler;
}

function NewsPortrait({ person }: NewsPortraitProps) {
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
      <div className="news-carousel__portrait" aria-hidden="true">
        <span>{initials || "?"}</span>

        {showImage && person.image_url && (
          <img
            src={person.image_url}
            alt=""
            loading="lazy"
            onError={() => setFailedUrl(person.image_url)}
          />
        )}
      </div>

      <figcaption>{person.name}</figcaption>
    </figure>
  );
}

export default function NewsCarousel({ careerId, items }: NewsCarouselProps) {
  const headingId = useId();
  const instructionsId = useId();
  const trackId = useId();

  const trackRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const feedKey = JSON.stringify([careerId, items.map((item) => item.id)]);

  const currentIndex =
    items.length > 0 ? Math.min(activeIndex, items.length - 1) : 0;

  useEffect(() => {
    trackRef.current?.scrollTo({
      left: 0,
      behavior: "auto",
    });

    setActiveIndex(0);
  }, [feedKey]);

  function updateActiveSlide() {
    const track = trackRef.current;
    const firstSlide = track?.children.item(0);

    if (!track || !(firstSlide instanceof HTMLElement)) {
      return;
    }

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    Array.from(track.children).forEach((slide, index) => {
      if (!(slide instanceof HTMLElement)) {
        return;
      }

      const position = slide.offsetLeft - firstSlide.offsetLeft;
      const distance = Math.abs(position - track.scrollLeft);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    setActiveIndex(nearestIndex);
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
      behavior: reduceMotion ? "auto" : "smooth",
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

  return (
    <section
      className="news-carousel"
      aria-labelledby={headingId}
      aria-roledescription="carousel"
    >
      <header className="news-carousel__header">
        <h2 id={headingId}>Career news</h2>

        {items.length > 1 && (
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
              <span aria-hidden="true">←</span>
            </button>

            <span className="news-carousel__position" role="status">
              {currentIndex + 1} / {items.length}
            </span>

            <button
              type="button"
              aria-label="Next news"
              aria-controls={trackId}
              disabled={currentIndex === items.length - 1}
              onClick={() => goToSlide(currentIndex + 1)}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </header>

      {items.length === 0 ? (
        <div className="news-carousel__empty">
          <h3>No news yet</h3>

          <p>
            Championship and rivalry updates will appear as your career
            develops.
          </p>
        </div>
      ) : (
        <>
          <p className="news-carousel__sr-only" id={instructionsId}>
            Use the left and right arrow keys to browse news. Use Home or End to
            reach the first or last item.
          </p>

          <ul
            className="news-carousel__track"
            id={trackId}
            ref={trackRef}
            aria-label="Career news items"
            aria-describedby={instructionsId}
            tabIndex={items.length > 1 ? 0 : undefined}
            onScroll={updateActiveSlide}
            onKeyDown={handleKeyDown}
          >
            {items.map((item, index) => {
              const news = getNewsPresentation(item);

              return (
                <li className="news-carousel__slide" key={item.id}>
                  <article
                    className="news-carousel__card"
                    aria-roledescription="slide"
                    aria-label={`News ${index + 1} of ${items.length}`}
                  >
                    <div className="news-carousel__content">
                      <span className="news-carousel__category">
                        {news.category}
                      </span>

                      <p className="news-carousel__period">
                        {news.periodLabel}
                      </p>

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
                        </Link>
                      )}
                    </div>

                    <div className="news-carousel__visual">
                      {news.championship?.image_url && (
                        <img
                          className="news-carousel__championship"
                          src={news.championship.image_url}
                          alt=""
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.hidden = true;
                          }}
                        />
                      )}

                      <div className="news-carousel__people">
                        {news.people.map((person) => (
                          <NewsPortrait key={person.id} person={person} />
                        ))}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
