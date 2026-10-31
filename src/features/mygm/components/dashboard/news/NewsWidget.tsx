import { useId } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { useMyGmNews } from "../../../hooks/news/useMyGmNews";
import NewsCarousel from "./NewsCarousel";

import "./NewsWidget.scss";

interface NewsWidgetProps {
  careerId: string;
}

export default function NewsWidget({ careerId }: NewsWidgetProps) {
  const headingId = useId();

  const { data, isLoading, errorMessage, retry } = useMyGmNews(careerId);

  return (
    <section className="news-widget" aria-labelledby={headingId}>
      <header className="news-widget__header">
        <h2 id={headingId}>Career news</h2>

        <Link to={`/mygm/${careerId}/news`}>
          View all news
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </header>

      <div aria-busy={isLoading}>
        {isLoading ? (
          <div className="news-widget__loading">
            <p role="status">Loading career news…</p>

            <div className="news-widget__skeleton" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        ) : errorMessage ? (
          <div className="news-widget__error">
            <p role="alert">{errorMessage}</p>

            <button
              className="news-widget__button"
              type="button"
              onClick={retry}
            >
              Try again
            </button>
          </div>
        ) : (
          <NewsCarousel careerId={careerId} items={data?.items ?? []} />
        )}
      </div>
    </section>
  );
}
