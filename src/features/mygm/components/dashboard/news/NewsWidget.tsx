import { Link } from "react-router-dom";

import { useMyGmNews } from "../../../hooks/news/useMyGmNews";
import NewsCarousel from "./NewsCarousel";

import "./NewsWidget.scss";

interface NewsWidgetProps {
  careerId: string;
}

export default function NewsWidget({ careerId }: NewsWidgetProps) {
  const { data, isLoading, errorMessage, retry } = useMyGmNews(careerId);

  return (
    <div className="news-widget-container">
      {isLoading ? (
        <section
          className="news-widget"
          aria-label="Career news"
          aria-busy="true"
        >
          <h2>Career news</h2>
          <p role="status">Loading career news…</p>
        </section>
      ) : errorMessage ? (
        <section className="news-widget" aria-label="Career news">
          <h2>Career news</h2>

          <p role="alert">{errorMessage}</p>

          <button className="news-widget__button" type="button" onClick={retry}>
            Try again
          </button>
        </section>
      ) : (
        <NewsCarousel careerId={careerId} items={data?.items ?? []} />
      )}

      <Link
        className="news-widget-container__all-link"
        to={`/mygm/${careerId}/news`}
      >
        View all news
      </Link>
    </div>
  );
}
