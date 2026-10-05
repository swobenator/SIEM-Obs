import { useEffect } from "react";
import type { EventRecord } from "../types";

type EventDetailsProps = {
    event: EventRecord;
    onClose: () => void;
};

export function EventDetails({
    event,
    onClose,
}: EventDetailsProps) {
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    return (
        <div
            className="event-details-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-details-title"
            onMouseDown={onClose}
        >
            <div
                className="event-details-panel"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="event-details-header">
                    <div>
                        <p className="event-details-eyebrow">
                            EVENT DETAILS
                        </p>

                        <h2 id="event-details-title">
                            {event.message}
                        </h2>
                    </div>

                    <button
                        className="event-details-close"
                        onClick={onClose}
                        aria-label="Close event details"
                    >
                        ×
                    </button>
                </div>

                <div className="event-details-grid">
                    <div className="event-detail-item">
                        <span>ID</span>
                        <strong>{event.id}</strong>
                    </div>

                    <div className="event-detail-item">
                        <span>Level</span>
                        <strong>{event.level}</strong>
                    </div>

                    <div className="event-detail-item">
                        <span>Source</span>
                        <strong>{event.source}</strong>
                    </div>

                    <div className="event-detail-item">
                        <span>Timestamp</span>
                        <strong>
                            {new Date(event.timestamp).toLocaleString()}
                        </strong>
                    </div>
                </div>

                <section className="event-details-section">
                    <h3>Message</h3>

                    <div className="event-details-message">
                        {event.message}
                    </div>
                </section>

                <section className="event-details-section">
                    <h3>Metadata</h3>

                    <pre className="event-details-json">
                        {JSON.stringify(event.metadata, null, 2)}
                    </pre>
                </section>
            </div>
        </div>
    );
}