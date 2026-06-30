import { useEffect, useRef } from "react";
import { pollRun } from "../client/runs";

const POLL_INTERVAL_MS = 1000;
const MAX_CONSECUTIVE_FAILURES = 3;

/**
 * useRunPoller — polls GET /runs/{runId} until the run reaches a terminal state.
 *
 * @param {string|null} runId   - The run to poll; polling is inactive when null.
 * @param {string|null} status  - Current run status; polling stops on "done"/"error".
 * @param {Function} onUpdate   - Called with the latest run object on each successful poll.
 * @param {Function} onError    - Called with an error message after MAX_CONSECUTIVE_FAILURES.
 * @param {Function} onDone     - Called once when a terminal status is first observed.
 */
export function useRunPoller(runId, status, onUpdate, onError, onDone) {
  // Track consecutive failures without triggering re-renders.
  const failureCount = useRef(0);

  useEffect(() => {
    if (!runId) return;
    if (status === "done" || status === "error") return;

    const interval = setInterval(async () => {
      try {
        const data = await pollRun(runId);
        failureCount.current = 0;
        onUpdate(data);

        if (data.status === "done" || data.status === "error") {
          clearInterval(interval);
          onDone();
        }
      } catch (err) {
        failureCount.current += 1;
        console.error(
          `[useRunPoller] poll failed (${failureCount.current}/${MAX_CONSECUTIVE_FAILURES}):`,
          err,
        );

        // Only surface the error to the user after consecutive failures —
        // a single transient network blip should not abort the run.
        if (failureCount.current >= MAX_CONSECUTIVE_FAILURES) {
          clearInterval(interval);
          onError(`Polling stopped after ${MAX_CONSECUTIVE_FAILURES} failed attempts: ${err.message}`);
          onDone();
        }
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [runId, status]);
}
