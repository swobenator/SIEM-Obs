import { useEffect, useState, type FormEvent } from "react";
import {
  getEvents,
  getHealth,
  getMetrics,
  getSession,
  login,
} from "./api";
import type { DashboardMetrics, EventRecord } from "./types";
import { EventDetails } from "./components/EventDetails";


function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [loginError, setLoginError] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [activeView, setActiveView] = useState<
    "dashboard" | "events" | "metrics"
  >("dashboard");
  const [health, setHealth] = useState<"loading" | "online" | "offline">(
    "loading"
  );
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsError, setMetricsError] = useState(false);

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [eventLevel, setEventLevel] = useState<EventRecord["level"] | "">("");
  const [eventSource, setEventSource] = useState("");
  const [eventFrom, setEventFrom] = useState("");
  const [eventTo, setEventTo] = useState("");

  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    setLoginError("");

    try {
      await login(apiKey);
      setApiKey("");
      setAuthenticated(true);
    } catch {
      setLoginError("Invalid API key");
    }
  }

  useEffect(() => {
    Promise.all([
      getSession(),
      getHealth(),
    ])
      .then(([sessionValid]) => {
        setAuthenticated(sessionValid);
        setHealth("online");
      })
      .catch(() => {
        setAuthenticated(false);
        setHealth("offline");
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    setMetricsError(false);

    getMetrics()
      .then((data) => {
        setMetrics(data);
      })
      .catch(() => {
        setMetrics(null);
        setMetricsError(true);
      });
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated || activeView !== "events") {
      return;
    }

    setEventsLoading(true);
    setEventsError(false);

    getEvents({
      level: eventLevel || undefined,
      source: eventSource || undefined,
      from: eventFrom
        ? new Date(`${eventFrom}T00:00:00`).toISOString()
        : undefined,
      to: eventTo
        ? new Date(`${eventTo}T23:59:59.999`).toISOString()
        : undefined,
    }).then((response) => {
      setEvents(response.data);
      setNextCursor(response.nextCursor);
    })
      .catch(() => {
        setEvents([]);
        setNextCursor(undefined);
        setEventsError(true);
      })
      .finally(() => {
        setEventsLoading(false);
      });
  }, [
    authenticated,
    activeView,
    eventLevel,
    eventSource,
    eventFrom,
    eventTo,
  ]);

  async function handleLoadMore() {
    if (!nextCursor || eventsLoading) {
      return;
    }

    setEventsLoading(true);
    setEventsError(false);

    try {
      const response = await getEvents({
        level: eventLevel || undefined,
        source: eventSource || undefined,
        from: eventFrom
          ? new Date(`${eventFrom}T00:00:00`).toISOString()
          : undefined,
        to: eventTo
          ? new Date(`${eventTo}T23:59:59.999`).toISOString()
          : undefined,
        before: nextCursor,
      });

      setEvents((current) => [...current, ...response.data]);
      setNextCursor(response.nextCursor);
    } catch {
      setEventsError(true);
    } finally {
      setEventsLoading(false);
    }
  }
  if (authLoading) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>SIEM-Obs</h1>
          <p>Checking session...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <h1>SIEM-Obs</h1>
          <p>Sign in to access the dashboard.</p>

          <label htmlFor="api-key">
            API key
          </label>

          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(event) =>
              setApiKey(event.target.value)
            }
            autoComplete="off"
          />

          {loginError && (
            <p className="login-error">
              {loginError}
            </p>
          )}

          <button type="submit">
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>SIEM-Obs</h1>
          <p>Security Information &amp; Event Monitoring</p>
        </div>

        <div className={`status status-${health}`}>
          <span className="status-dot" />
          {health === "loading" && "Checking backend..."}
          {health === "online" && "Backend online"}
          {health === "offline" && "Backend offline"}
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <nav>
            <button
              className={`nav-item ${activeView === "dashboard" ? "active" : ""
                }`}
              onClick={() => setActiveView("dashboard")}
            >
              Dashboard
            </button>

            <button
              className={`nav-item ${activeView === "events" ? "active" : ""
                }`}
              onClick={() => setActiveView("events")}
            >
              Events
            </button>

            <button
              className={`nav-item ${activeView === "metrics" ? "active" : ""
                }`}
              onClick={() => setActiveView("metrics")}
            >
              Metrics
            </button>
          </nav>
        </aside>

        <main className="main-content">
          <section className="page-header">
            <h2>
              {activeView === "dashboard" && "Dashboard"}
              {activeView === "events" && "Events"}
              {activeView === "metrics" && "Metrics"}
            </h2>

            <p>
              {activeView === "dashboard" &&
                "Overview of your SIEM-Obs service."}

              {activeView === "events" &&
                "Search and review security events."}

              {activeView === "metrics" &&
                "Monitor SIEM-Obs service metrics."}
            </p>
          </section>

          {activeView === "dashboard" && (
            <>
              <section className="cards">
                <article className="card">
                  <span className="card-label">Events processed</span>
                  <strong>
                    {metrics
                      ? metrics.eventsProcessed.toLocaleString()
                      : metricsError
                        ? "Unavailable"
                        : "Loading"}
                  </strong>
                </article>

                <article className="card">
                  <span className="card-label">HTTP requests</span>
                  <strong>
                    {metrics
                      ? metrics.httpRequests.toLocaleString()
                      : metricsError
                        ? "Unavailable"
                        : "Loading"}
                  </strong>
                </article>

                <article className="card">
                  <span className="card-label">HTTP errors</span>
                  <strong>
                    {metrics
                      ? (
                        metrics.http4xx +
                        metrics.http5xx
                      ).toLocaleString()
                      : metricsError
                        ? "Unavailable"
                        : "Loading"}
                  </strong>
                </article>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h3>Operational summary</h3>
                    <p>
                      Current activity reported by the SIEM-Obs backend.
                    </p>
                  </div>
                </div>

                <div className="summary-grid">
                  <div>
                    <span className="card-label">Events received</span>
                    <strong>
                      {metrics?.eventsReceived.toLocaleString() ?? "—"}
                    </strong>
                  </div>

                  <div>
                    <span className="card-label">Batches processed</span>
                    <strong>
                      {metrics?.batchesProcessed.toLocaleString() ?? "—"}
                    </strong>
                  </div>

                  <div>
                    <span className="card-label">Flush failures</span>
                    <strong>
                      {metrics?.flushFailures.toLocaleString() ?? "—"}
                    </strong>
                  </div>

                  <div>
                    <span className="card-label">Retries</span>
                    <strong>
                      {metrics?.retries.toLocaleString() ?? "—"}
                    </strong>
                  </div>

                  <div>
                    <span className="card-label">HTTP 4xx</span>
                    <strong>
                      {metrics?.http4xx.toLocaleString() ?? "—"}
                    </strong>
                  </div>

                  <div>
                    <span className="card-label">HTTP 5xx</span>
                    <strong>
                      {metrics?.http5xx.toLocaleString() ?? "—"}
                    </strong>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeView === "metrics" && (
            <section className="panel">
              <div className="panel-header">
                <h3>Metrics</h3>
                <p>Metrics visualization will be added next.</p>
              </div>

              <div className="empty-state">
                Metrics view coming soon.
              </div>
            </section>
          )}
          {activeView === "events" && (
            <section className="events-page">
              <div className="events-page-header">
                <div>
                  <div className="eyebrow">OBSERVABILITY</div>
                  <h2>Events</h2>
                  <p>
                    Review incoming security and application events collected
                    by SIEM-Obs.
                  </p>
                </div>

                <div className="events-status">
                  <span className="status-dot" />
                  Live event stream
                </div>
              </div>

              <div className="event-filters">
                <div className="filter-field">
                  <label htmlFor="event-level">Level</label>
                  <select
                    id="event-level"
                    value={eventLevel}
                    onChange={(event) =>
                      setEventLevel(
                        event.target.value as EventRecord["level"] | ""
                      )
                    }
                  >
                    <option value="">All levels</option>
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                </div>

                <div className="filter-field">
                  <label htmlFor="event-source">Source</label>
                  <input
                    id="event-source"
                    type="text"
                    placeholder="e.g. application"
                    value={eventSource}
                    onChange={(event) => setEventSource(event.target.value)}
                  />
                </div>

                <div className="filter-field">
                  <label htmlFor="event-from">From</label>
                  <input
                    id="event-from"
                    type="date"
                    value={eventFrom}
                    onChange={(event) => setEventFrom(event.target.value)}
                  />
                </div>

                <div className="filter-field">
                  <label htmlFor="event-to">To</label>
                  <input
                    id="event-to"
                    type="date"
                    value={eventTo}
                    onChange={(event) => setEventTo(event.target.value)}
                  />
                </div>

                <button
                  className="clear-filters"
                  onClick={() => {
                    setEventLevel("");
                    setEventSource("");
                    setEventFrom("");
                    setEventTo("");
                  }}
                >
                  Clear filters
                </button>
              </div>

              <div className="events-summary">
                <div className="summary-card">
                  <span className="summary-label">Loaded events</span>
                  <strong>{events.length}</strong>
                </div>

                <div className="summary-card">
                  <span className="summary-label">Errors</span>
                  <strong>
                    {events.filter((event) => event.level === "ERROR").length}
                  </strong>
                </div>

                <div className="summary-card">
                  <span className="summary-label">Warnings</span>
                  <strong>
                    {events.filter((event) => event.level === "WARN").length}
                  </strong>
                </div>
              </div>

              <div className="events-panel">
                <div className="events-panel-header">
                  <div>
                    <h3>Event stream</h3>
                    <span>
                      Latest events returned by the API
                    </span>
                  </div>
                </div>

                {eventsLoading && events.length === 0 ? (
                  <div className="events-empty">
                    <div className="loading-spinner" />
                    <p>Loading events...</p>
                  </div>
                ) : eventsError ? (
                  <div className="events-empty">
                    <p>Unable to load events.</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="events-empty">
                    <p>No events have been collected yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="events-table-wrapper">
                      <table className="events-table">
                        <thead>
                          <tr>
                            <th>Timestamp</th>
                            <th>Level</th>
                            <th>Source</th>
                            <th>Message</th>
                            <th>Metadata</th>
                          </tr>
                        </thead>

                        <tbody>
                          {events.map((event) => (
                            <tr key={event.id}>
                              <td>
                                <div className="event-time">
                                  {new Date(
                                    event.timestamp
                                  ).toLocaleDateString()}
                                </div>
                                <div className="event-time-secondary">
                                  {new Date(
                                    event.timestamp
                                  ).toLocaleTimeString()}
                                </div>
                              </td>

                              <td>
                                <span
                                  className={`severity-badge severity-${event.level.toLowerCase()}`}
                                >
                                  <span className="severity-dot" />
                                  {event.level}
                                </span>
                              </td>

                              <td>
                                <span className="source-badge">
                                  {event.source}
                                </span>
                              </td>

                              <td>
                                <td>
                                  <button
                                    className="event-message-button"
                                    onClick={() => setSelectedEvent(event)}
                                  >
                                    {event.message}
                                  </button>
                                </td>

                                <div
                                  className="event-id"
                                  title={event.id}
                                >
                                  {event.id}
                                </div>
                              </td>

                              <td>
                                <span className="metadata-badge">
                                  {Object.keys(event.metadata)
                                    .length}{" "}
                                  field
                                  {Object.keys(event.metadata)
                                    .length === 1
                                    ? ""
                                    : "s"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {nextCursor && (
                      <div className="events-panel-footer">
                        <button
                          className="load-more-button"
                          onClick={handleLoadMore}
                          disabled={eventsLoading}
                        >
                          {eventsLoading ? (
                            <>
                              <span className="button-spinner" />
                              Loading...
                            </>
                          ) : (
                            "Load more events"
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
                {selectedEvent && (
                  <EventDetails
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                  />
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}



export default App;