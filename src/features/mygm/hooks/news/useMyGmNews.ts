import { useEffect, useState } from "react";
import { getNews } from "../../services/news/newsService";
import type { MyGmNewsFeed } from "../../types/news/news.types";

interface NewsState {
  scope: string;
  data: MyGmNewsFeed | null;
  isLoading: boolean;
  errorMessage: string;
}

export function useMyGmNews(careerId: string, limit = 10) {
  const scope = JSON.stringify([careerId, limit]);
  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<NewsState>(() => ({
    scope,
    data: null,
    isLoading: true,
    errorMessage: "",
  }));

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    setState({
      scope,
      data: null,
      isLoading: true,
      errorMessage: "",
    });

    async function loadNews() {
      try {
        const data = await getNews(careerId, controller.signal, limit);

        if (!isActive) {
          return;
        }

        setState({
          scope,
          data,
          isLoading: false,
          errorMessage: "",
        });
      } catch (error: unknown) {
        if (!isActive || controller.signal.aborted) {
          return;
        }

        setState({
          scope,
          data: null,
          isLoading: false,
          errorMessage:
            error instanceof Error
              ? error.message
              : "Career news could not be loaded.",
        });
      }
    }

    void loadNews();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [careerId, limit, scope, attempt]);

  const isCurrentScope = state.scope === scope;

  const isLoading = !isCurrentScope || state.isLoading;

  function retry() {
    if (isLoading) {
      return;
    }

    setState({
      scope,
      data: null,
      isLoading: true,
      errorMessage: "",
    });

    setAttempt((current) => current + 1);
  }

  return {
    data: isCurrentScope ? state.data : null,
    isLoading,
    errorMessage: isCurrentScope ? state.errorMessage : "",
    retry,
  };
}
