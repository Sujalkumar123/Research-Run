import { useState, useEffect } from "react";

const API = "http://localhost:8000";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [urls, setUrls] = useState("");
  const [runId, setRunId] = useState(null);
  const [run, setRun] = useState(null);

  async function startRun() {
    const res = await fetch(`${API}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, urls: urls.split("\n") }),
    });
    const data = await res.json();
    setRunId(data.run_id);
    setRun(null);
  }

  useEffect(() => {
    if (!runId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`${API}/runs/${runId}`);
      const data = await res.json();
      setRun(data);
    }, 1000);
  }, [runId]);

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>Research Runs</h1>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="What do you want researched?"
        rows={2}
        style={{ width: "100%" }}
      />
      <textarea
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder="One source URL per line"
        rows={4}
        style={{ width: "100%", marginTop: 8 }}
      />
      <button onClick={startRun} style={{ marginTop: 8 }}>
        Run
      </button>

      {run && run.status === "running" && <p>Running…</p>}

      {run && run.status === "done" && (
        <div style={{ marginTop: 16 }}>
          <p>
            Pages scraped: {run.result.pages_scraped} · Success rate:{" "}
            {run.result.success_rate} · Tokens: {run.result.tokens_used}
          </p>
          <h3>Sources</h3>
          <ul>
            {run.result.sources.map((s) => (
              <li>{s}</li>
            ))}
          </ul>
          <h3>Brief</h3>
          <div dangerouslySetInnerHTML={{ __html: run.result.brief }} />
        </div>
      )}
    </div>
  );
}
