// Displays collector metrics and refreshes them periodically while this view is mounted.
import { useCallback, useEffect, useState } from "react";
import { getMetrics, type MetricsResponse } from "../api";

export function MetricsView() {
    const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadMetrics = useCallback(async () => {
        try {
            const response = await getMetrics();

            setMetrics(response);
            setError(false);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    // Poll while the metrics screen is mounted, and clear the timer on navigation away.
    useEffect(() => {
        // Defer the initial request until effect setup has completed.
        const initialLoad = window.setTimeout(() => {
            void loadMetrics();
        }, 0);

        const interval = window.setInterval(loadMetrics, 5000);

        return () => {
            window.clearTimeout(initialLoad);
            window.clearInterval(interval);
        };
    }, [loadMetrics]);

    // Avoid dividing by zero before the collector has received any events.
    const processingRate =
        metrics && metrics.eventsReceived > 0
            ? (metrics.eventsProcessed / metrics.eventsReceived) * 100
            : 0;

    return (
        <section className="metrics-page">
            <div className="metrics-page-header">
                <div>
                    <p className="metrics-eyebrow">SYSTEM OBSERVABILITY</p>
                    <h1>Metrics</h1>
                    <p>
                        Live operational metrics for the SIEM event pipeline.
                    </p>
                </div>

                <div className="metrics-live-status">
                    <span className="metrics-live-dot" />
                    Updating every 5 seconds
                </div>
            </div>

            {loading && !metrics ? (
                <div className="metrics-state">
                    <span className="loading-spinner" />
                    <p>Loading metrics...</p>
                </div>
            ) : error && !metrics ? (
                <div className="metrics-state metrics-error-state">
                    <p>Unable to load metrics.</p>

                    <button
                        className="metrics-retry-button"
                        onClick={loadMetrics}
                    >
                        Retry
                    </button>
                </div>
            ) : metrics ? (
                <>
                    <div className="metrics-card-grid">
                        <article className="metric-card">
                            <span className="metric-card-label">
                                Events Received
                            </span>

                            <strong>{metrics.eventsReceived}</strong>

                            <span className="metric-card-description">
                                Total events accepted by the collector
                            </span>
                        </article>

                        <article className="metric-card">
                            <span className="metric-card-label">
                                Events Processed
                            </span>

                            <strong>{metrics.eventsProcessed}</strong>

                            <span className="metric-card-description">
                                Events successfully processed
                            </span>
                        </article>

                        <article className="metric-card">
                            <span className="metric-card-label">
                                Batches Processed
                            </span>

                            <strong>{metrics.batchesProcessed}</strong>

                            <span className="metric-card-description">
                                Completed processing batches
                            </span>
                        </article>

                        <article className="metric-card">
                            <span className="metric-card-label">
                                Retries
                            </span>

                            <strong>{metrics.retries}</strong>

                            <span className="metric-card-description">
                                Processing retries recorded
                            </span>
                        </article>

                        <article className="metric-card metric-card-warning">
                            <span className="metric-card-label">
                                Flush Failures
                            </span>

                            <strong>{metrics.flushFailures}</strong>

                            <span className="metric-card-description">
                                Failed buffer flush operations
                            </span>
                        </article>
                    </div>

                    <div className="metrics-analysis-grid">
                        <article className="metrics-panel">
                            <div className="metrics-panel-header">
                                <div>
                                    <h2>Processing Efficiency</h2>
                                    <span>
                                        Processed events compared with received
                                        events
                                    </span>
                                </div>

                                <strong>
                                    {processingRate.toFixed(1)}%
                                </strong>
                            </div>

                            <div className="metrics-progress-track">
                                <div
                                    className="metrics-progress-fill"
                                    style={{
                                        width: `${Math.min(
                                            processingRate,
                                            100
                                        )}%`,
                                    }}
                                />
                            </div>

                            <div className="metrics-progress-labels">
                                <span>
                                    {metrics.eventsProcessed} processed
                                </span>

                                <span>
                                    {metrics.eventsReceived} received
                                </span>
                            </div>
                        </article>

                        <article className="metrics-panel">
                            <div className="metrics-panel-header">
                                <div>
                                    <h2>Pipeline Health</h2>
                                    <span>
                                        Operational indicators from the
                                        collector
                                    </span>
                                </div>
                            </div>

                            <div className="pipeline-health-list">
                                <div className="pipeline-health-row">
                                    <span>Processing</span>

                                    <span className="health-value">
                                        {metrics.eventsProcessed >=
                                        metrics.eventsReceived
                                            ? "Healthy"
                                            : "Active"}
                                    </span>
                                </div>

                                <div className="pipeline-health-row">
                                    <span>Retries</span>

                                    <span className="health-value">
                                        {metrics.retries}
                                    </span>
                                </div>

                                <div className="pipeline-health-row">
                                    <span>Flush failures</span>

                                    <span className="health-value">
                                        {metrics.flushFailures}
                                    </span>
                                </div>

                                <div className="pipeline-health-row">
                                    <span>Batch processing</span>

                                    <span className="health-value">
                                        {metrics.batchesProcessed}
                                    </span>
                                </div>
                            </div>
                        </article>
                    </div>

                    {error && (
                        <div className="metrics-refresh-warning">
                            Metrics could not be refreshed. Showing the last
                            successful values.
                        </div>
                    )}
                </>
            ) : null}
        </section>
    );
}