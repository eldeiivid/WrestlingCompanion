import {
  Link,
  Navigate,
  Route,
  Routes,
  useOutletContext,
} from "react-router-dom";

import LoginScreen from "../features/auth/screens/LoginScreen";
import CreateAccountScreen from "../features/auth/screens/CreateAccountScreen";
import LobbyScreen from "../features/lobby/screens/LobbyScreen";
import { useAuth } from "../features/auth/hooks/useAuth";
import MyGmCareersScreen from "../features/mygm/screens/MyGmCareersScreen";
import NewCareerScreen from "../features/mygm/screens/NewCareerScreen";
import MyGmLayout from "../features/mygm/layouts/MyGmLayout";
import type { MyGmOutletContext } from "../features/mygm/types/mygm.types";
import DashboardScreen from "../features/mygm/screens/DashboardScreen";
import BookingScreen from "../features/mygm/screens/BookingScreen";
import BookingResultsScreen from "../features/mygm/screens/BookingResultsScreen";
import ShowHistoryScreen from "../features/mygm/screens/show-history/ShowHistoryScreen";
import ShowDetailScreen from "../features/mygm/screens/show-history/ShowDetailScreen";
import RivalriesScreen from "../features/mygm/screens/rivalries/RivalriesScreen";
import RosterScreen from "../features/mygm/screens/roster/RosterScreen";
import WrestlerProfileScreen from "../features/mygm/screens/roster/WrestlerProfileScreen";
import MarketScreen from "../features/mygm/screens/market/MarketScreen";
import MarketWrestlerProfileScreen from "../features/mygm/screens/market/MarketWrestlerProfileScreen";
import ChampionshipsScreen from "../features/mygm/screens/championships/ChampionshipsScreen";
import ChampionshipDetailScreen from "../features/mygm/screens/championships/ChampionshipDetailScreen";
import RecordBookScreen from "../features/mygm/screens/record-book/RecordBookScreen";
import NewsScreen from "../features/mygm/screens/news/NewsScreen";
import CareerSettingsScreen from "../features/mygm/screens/settings/CareerSettingsScreen";
import SeasonDraftScreen from "../features/mygm/screens/season-draft/SeasonDraftScreen";

import "./App.scss";

function CareerDashboardScreen() {
  const { career } = useOutletContext<MyGmOutletContext>();

  return (
    <section>
      <Link to="/mygm">Back to careers</Link>

      <h1>{career.name}</h1>
    </section>
  );
}

function CareerSectionScreen({ title }: { title: string }) {
  const { career } = useOutletContext<MyGmOutletContext>();

  return (
    <section>
      <h1>{title}</h1>

      <Link to={`/mygm/${career.id}`}>Back to dashboard</Link>
    </section>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, initializationError } = useAuth();

  if (isLoading || initializationError) {
    return (
      <main className="app">
        <section className="app__welcome" aria-live="polite">
          <p>
            {initializationError
              ? "Unable to restore your session. Please try again."
              : "Loading session…"}
          </p>

          {initializationError && (
            <button type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
          )}
        </section>
      </main>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginScreen />
        }
      />

      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <CreateAccountScreen />
          )
        }
      />

      <Route
        path="/"
        element={
          isAuthenticated ? <LobbyScreen /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/mygm"
        element={
          isAuthenticated ? (
            <MyGmCareersScreen />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/mygm/new"
        element={
          isAuthenticated ? (
            <NewCareerScreen />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/mygm/:careerId"
        element={
          isAuthenticated ? <MyGmLayout /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<DashboardScreen />} />

        <Route path="roster" element={<RosterScreen />} />

        <Route path="roster/:wrestlerId" element={<WrestlerProfileScreen />} />

        <Route path="market" element={<MarketScreen />} />

        <Route
          path="market/wrestlers/:wrestlerId"
          element={<WrestlerProfileScreen origin="market" />}
        />

        <Route
          path="market/catalog/:catalogWrestlerId"
          element={<MarketWrestlerProfileScreen />}
        />

        <Route path="news" element={<NewsScreen />} />

        <Route path="record-book" element={<RecordBookScreen />} />

        <Route path="booking" element={<BookingScreen />} />

        <Route path="booking/results" element={<BookingResultsScreen />} />

        <Route path="season-draft" element={<SeasonDraftScreen />} />

        <Route path="rivalries" element={<RivalriesScreen />} />

        <Route path="titles" element={<ChampionshipsScreen />} />

        <Route path="titles/:titleId" element={<ChampionshipDetailScreen />} />

        <Route path="history" element={<ShowHistoryScreen />} />

        <Route path="history/:eventId" element={<ShowDetailScreen />} />

        <Route path="settings" element={<CareerSettingsScreen />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
