export class CollectorStats {
    eventsReceived = 0;
    batchesSent = 0;
    eventsSent = 0;
    sendFailures = 0;
    retries = 0;

    log() {
        console.log({
            eventsReceived: this.eventsReceived,
            batchesSent: this.batchesSent,
            eventsSent: this.eventsSent,
            sendFailures: this.sendFailures,
            retries: this.retries,
        });
    }
}