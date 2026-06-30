/**
 * RunResult — displays the current state of a research run.
 *
 * Renders one of four states:
 *   - nothing (run is null or status is "running" with no prior result)
 *   - running spinner
 *   - error banner
 *   - completed result with KPIs, sources, and brief
 *
 * @param {object|null} run - The run object from GET /runs/{id}, or null.
 */
export function RunResult({ run, loading, pendingInfo }) {
  // Show immediately after submit, before the first poll comes back
  if (loading && !run) {
    return (
      <div style={{ marginTop: 16, color: "#555" }}>
        <p>
          <strong>Submitting…</strong>
          {pendingInfo && (
            <> researching <em>"{pendingInfo.prompt}"</em> across {pendingInfo.urlCount} source{pendingInfo.urlCount !== 1 ? "s" : ""}</>
          )}
        </p>
      </div>
    );
  }

  if (!run) return null;

  if (run.status === "running") {
    return (
      <div style={{ marginTop: 16, color: "#555" }}>
        <p>
          <strong>Running…</strong>
          {pendingInfo && (
            <> scraping {pendingInfo.urlCount} source{pendingInfo.urlCount !== 1 ? "s" : ""} and synthesizing brief</>
          )}
        </p>
      </div>
    );
  }

  if (run.status === "error") {
    return (
      <div style={{ marginTop: 16, color: "#d32f2f" }}>
        <strong>Run failed.</strong>
        <p style={{ margin: "4px 0 0" }}>
          {run.error ?? "An unexpected error occurred."}
        </p>
      </div>
    );
  }

  if (run.status === "done" && run.result) {
    const { timestamp, pages_scraped, success_rate, tokens_used, sources, brief } = run.result;
    return (
      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: "0.9em", color: "#666" }}>
          Finished: {new Date(timestamp).toLocaleString()}
        </p>
        <p>
          Pages scraped: {pages_scraped} · Success rate:{" "}
          {(success_rate * 100).toFixed(0)}% · Tokens: {tokens_used}
        </p>

        <h3>Sources</h3>
        <ul>
          {sources.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>

        <h3>Brief</h3>
        {/* Render as plain text with pre-wrap to preserve newlines; avoids XSS risk of innerHTML. */}
        <p style={{ whiteSpace: "pre-wrap", background: "#f9f9f9", padding: 12, borderRadius: 4 }}>
          {brief}
        </p>
      </div>
    );
  }

  return null;
}
