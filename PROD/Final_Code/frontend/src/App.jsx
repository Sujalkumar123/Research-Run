import { useState } from "react";
import { startRun } from "./client/runs";
import { useRunPoller } from "./hooks/useRunPoller";
import { RunForm } from "./components/RunForm";
import { RunResult } from "./components/RunResult";

export default function App() {
  const [runId, setRunId] = useState(null);
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingInfo, setPendingInfo] = useState(null);

  async function handleSubmit(prompt, urls) {
    setError(null);
    setRun(null);
    setLoading(true);
    setPendingInfo({ prompt, urlCount: urls.length });
    try {
      const id = await startRun(prompt, urls);
      setRunId(id);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  useRunPoller(
    runId,
    run?.status,
    (data) => setRun(data),
    (msg) => setError(msg),
    () => setLoading(false),
  );

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Research Runs</h1>

      {error && (
        <div style={errorBannerStyle}>{error}</div>
      )}

      <RunForm onSubmit={handleSubmit} loading={loading} />
      <RunResult run={run} loading={loading} pendingInfo={pendingInfo} />
    </div>
  );
}

const errorBannerStyle = {
  color: "#d32f2f",
  backgroundColor: "#ffebee",
  padding: "8px 12px",
  borderRadius: 4,
  marginBottom: 12,
};
