/**
 * client/runs.js — HTTP client for the Research Runs API.
 *
 * All fetch logic is isolated here so components and hooks never construct
 * URLs or interpret raw Response objects directly.
 */

const BASE = "https://research-run-3.onrender.com";

/**
 * Parse a non-OK response into a human-readable error string.
 * FastAPI returns { detail: string | array } depending on the error type.
 */
async function parseErrorResponse(res) {
  const body = await res.json().catch(() => ({}));
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail)) {
    return body.detail.map((d) => `${d.loc.join(".")}: ${d.msg}`).join(", ");
  }
  return `Server error ${res.status}`;
}

/**
 * Start a new research run.
 * @returns {Promise<string>} The run_id assigned by the server.
 * @throws {Error} On network failure or non-2xx response.
 */
export async function startRun(prompt, urls) {
  let res;
  try {
    res = await fetch(`${BASE}/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, urls }),
    });
  } catch (err) {
    console.error("[runs] network error on POST /runs:", err);
    throw new Error("Could not reach the server. Check your connection.");
  }

  if (!res.ok) {
    const msg = await parseErrorResponse(res);
    console.error("[runs] POST /runs failed:", res.status, msg);
    throw new Error(msg);
  }

  const data = await res.json();
  return data.run_id;
}

/**
 * Fetch the current status and result of a run.
 * @returns {Promise<object>} The run object { status, result?, error? }.
 * @throws {Error} On network failure or non-2xx response.
 */
export async function pollRun(runId) {
  let res;
  try {
    res = await fetch(`${BASE}/runs/${runId}`);
  } catch (err) {
    console.error(`[runs] network error on GET /runs/${runId}:`, err);
    throw new Error("Could not reach the server. Check your connection.");
  }

  if (!res.ok) {
    const msg = await parseErrorResponse(res);
    console.error(`[runs] GET /runs/${runId} failed:`, res.status, msg);
    throw new Error(msg);
  }

  return res.json();
}
