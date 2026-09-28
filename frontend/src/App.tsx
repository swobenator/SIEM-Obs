import { useEffect, useState, type FormEvent } from "react";
import { getHealth, getMetrics, getSession, login } from "./api";

import type { DashboardMetrics } from "./api";


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
        </main>
      </div>
    </div>
  );
}



export default App;