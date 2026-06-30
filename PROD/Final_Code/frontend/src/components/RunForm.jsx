import { useState } from "react";

/**
 * RunForm — prompt input, URL list input, and submit button.
 *
 * Owns local textarea state and client-side validation. Calls onSubmit only
 * after validation passes; validation errors are rendered inline.
 *
 * @param {Function} onSubmit  - Called with (prompt: string, urls: string[]).
 * @param {boolean}  loading   - Disables inputs and button while a run is active.
 */
export function RunForm({ onSubmit, loading }) {
  const [prompt, setPrompt] = useState("");
  const [urls, setUrls] = useState("");
  const [validationError, setValidationError] = useState(null);

  function handleSubmit() {
    setValidationError(null);

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setValidationError("Prompt cannot be empty.");
      return;
    }

    const cleanedUrls = urls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    if (cleanedUrls.length === 0) {
      setValidationError("At least one source URL is required.");
      return;
    }

    for (const u of cleanedUrls) {
      let parsed;
      try {
        parsed = new URL(u);
      } catch {
        setValidationError(`Invalid URL: "${u}". Must start with http:// or https://`);
        return;
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        setValidationError(`Invalid URL: "${u}". Must start with http:// or https://`);
        return;
      }
    }

    onSubmit(trimmedPrompt, cleanedUrls);
  }

  return (
    <div>
      {validationError && (
        <div style={styles.errorBanner}>{validationError}</div>
      )}

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="What do you want researched?"
        rows={2}
        style={styles.textarea}
        disabled={loading}
      />
      <textarea
        value={urls}
        onChange={(e) => setUrls(e.target.value)}
        placeholder="One source URL per line"
        rows={4}
        style={{ ...styles.textarea, marginTop: 8 }}
        disabled={loading}
      />
      <button
        onClick={handleSubmit}
        style={{ marginTop: 8, cursor: loading ? "not-allowed" : "pointer" }}
        disabled={loading}
      >
        {loading ? "Running…" : "Run"}
      </button>
    </div>
  );
}

const styles = {
  textarea: { width: "100%" },
  errorBanner: {
    color: "#d32f2f",
    backgroundColor: "#ffebee",
    padding: "8px 12px",
    borderRadius: 4,
    marginBottom: 8,
  },
};
