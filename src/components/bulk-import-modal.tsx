"use client";

import { useState, useRef } from "react";

interface ParsedPiece {
  title: string;
  platform: string;
  content_type: string;
  duration: string;
  hook: string;
  script: string;
  shot_list: string;
  pro_tips: string;
}

interface BulkImportModalProps {
  planId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const EXPECTED_HEADERS = ["title", "platform", "content_type", "duration", "hook", "script", "shot_list", "pro_tips"];

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === "," || char === "\t") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseSpreadsheetData(text: string): ParsedPiece[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, "")
  );

  // Map common header aliases
  const headerMap: Record<string, string> = {};
  headers.forEach((h, i) => {
    if (h.includes("title") || h.includes("name") || h.includes("idea")) headerMap[i] = "title";
    else if (h.includes("platform")) headerMap[i] = "platform";
    else if (h.includes("type") || h.includes("format") || h.includes("content_type")) headerMap[i] = "content_type";
    else if (h.includes("duration") || h.includes("length")) headerMap[i] = "duration";
    else if (h.includes("hook") || h.includes("opening")) headerMap[i] = "hook";
    else if (h.includes("script") || h.includes("body") || h.includes("copy")) headerMap[i] = "script";
    else if (h.includes("shot") || h.includes("shot_list")) headerMap[i] = "shot_list";
    else if (h.includes("pro_tip") || h.includes("tip") || h.includes("pro tip")) headerMap[i] = "pro_tips";
    else if (EXPECTED_HEADERS.includes(h)) headerMap[i] = h;
  });

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const piece: ParsedPiece = {
      title: "",
      platform: "Instagram Reels",
      content_type: "",
      duration: "",
      hook: "",
      script: "",
      shot_list: "",
      pro_tips: "",
    };

    Object.entries(headerMap).forEach(([idx, field]) => {
      const val = values[Number(idx)] || "";
      if (val) (piece as unknown as Record<string, string>)[field] = val;
    });

    // If no hook provided, use title as hook
    if (!piece.hook && piece.title) piece.hook = piece.title;
    return piece;
  }).filter((p) => p.title);
}

function parseQuickAdd(text: string): ParsedPiece[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => ({
      title: line,
      platform: "Instagram Reels",
      content_type: "",
      duration: "",
      hook: line,
      script: "",
      shot_list: "",
      pro_tips: "",
    }));
}

export function BulkImportModal({ planId, onClose, onSuccess }: BulkImportModalProps) {
  const [mode, setMode] = useState<"quick" | "paste" | "csv">("quick");
  const [textInput, setTextInput] = useState("");
  const [parsed, setParsed] = useState<ParsedPiece[]>([]);
  const [step, setStep] = useState<"input" | "preview">("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleParse = () => {
    setError("");
    let results: ParsedPiece[];

    if (mode === "quick") {
      results = parseQuickAdd(textInput);
    } else {
      results = parseSpreadsheetData(textInput);
    }

    if (results.length === 0) {
      setError("No content pieces found. Check your formatting.");
      return;
    }

    setParsed(results);
    setStep("preview");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setTextInput(text);
      setMode("paste");
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/content-pieces/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId, pieces: parsed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
      } else {
        onSuccess();
      }
    } catch {
      setError("Something went wrong");
    }

    setLoading(false);
  };

  const removePiece = (index: number) => {
    setParsed(parsed.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div
        className="w-full max-w-2xl max-h-[85vh] rounded-2xl flex flex-col overflow-hidden"
        style={{ background: "#0f172a", border: "1px solid rgba(99,102,241,0.3)" }}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: "1px solid #1e293b" }}>
          <div>
            <h2 className="text-white text-lg font-bold">Bulk Import</h2>
            <p className="text-slate-500 text-xs">Add multiple content pieces at once</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl font-light px-2">
            &times;
          </button>
        </div>

        {step === "input" ? (
          <div className="flex-1 overflow-y-auto p-6">
            {/* Mode tabs */}
            <div className="flex gap-2 mb-5">
              {([
                { key: "quick", label: "Quick Add" },
                { key: "paste", label: "Paste from Sheet" },
                { key: "csv", label: "Upload CSV" },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setMode(tab.key); setError(""); }}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: mode === tab.key ? "rgba(99,102,241,0.15)" : "transparent",
                    border: `1px solid ${mode === tab.key ? "rgba(99,102,241,0.4)" : "#1e293b"}`,
                    color: mode === tab.key ? "#a5b4fc" : "#64748b",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {mode === "quick" && (
              <>
                <p className="text-slate-400 text-xs mb-3">
                  One content idea per line. Each line becomes a content piece.
                </p>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none font-mono"
                  style={{ background: "#020617", border: "1px solid #1e293b" }}
                  placeholder={`Why fishing in Venice beats everywhere else\n3 mistakes every new angler makes\nBest bait for inshore redfish\nHow to read the tides like a pro\nGear I wish I had when I started`}
                />
              </>
            )}

            {mode === "paste" && (
              <>
                <p className="text-slate-400 text-xs mb-3">
                  Paste rows from Google Sheets or Excel. First row should be headers:
                  <span className="text-slate-300 ml-1">Title, Platform, Content Type, Duration, Hook, Script, Shot List, Pro Tips</span>
                </p>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none resize-none font-mono"
                  style={{ background: "#020617", border: "1px solid #1e293b" }}
                  placeholder={`Title\tPlatform\tContent Type\tDuration\tHook\nWhy Venice fishing is the best\tTikTok + Reels\tTalking Head\t30-60s\tYou won't believe what we caught...\n3 beginner mistakes\tInstagram Reels\tB-Roll + VO\t15-30s\tStop making these mistakes!`}
                />
              </>
            )}

            {mode === "csv" && (
              <div className="flex flex-col items-center justify-center py-12">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="px-6 py-4 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "#020617", border: "2px dashed #334155", color: "#94a3b8" }}
                >
                  Click to select a CSV file
                </button>
                <p className="text-slate-600 text-xs mt-3">
                  Supports .csv and .tsv files
                </p>
                {textInput && (
                  <p className="text-emerald-400 text-xs mt-2">
                    File loaded — click &quot;Preview&quot; to continue
                  </p>
                )}
              </div>
            )}

            {error && (
              <div
                className="px-4 py-2.5 rounded-xl text-sm mt-4"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
              >
                {error}
              </div>
            )}
          </div>
        ) : (
          /* Preview step */
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-slate-400 text-xs mb-4">
              <span className="text-white font-semibold">{parsed.length}</span> content pieces ready to import. Review and remove any you don&apos;t want.
            </p>
            <div className="space-y-2">
              {parsed.map((piece, i) => (
                <div
                  key={i}
                  className="rounded-xl px-4 py-3 flex items-start gap-3"
                  style={{ background: "#020617", border: "1px solid #1e293b" }}
                >
                  <span className="text-slate-600 text-xs font-mono mt-0.5 shrink-0 w-5 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{piece.title}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-indigo-400 text-xs">{piece.platform}</span>
                      {piece.content_type && <span className="text-slate-500 text-xs">{piece.content_type}</span>}
                      {piece.duration && <span className="text-slate-500 text-xs">{piece.duration}</span>}
                    </div>
                    {piece.hook && piece.hook !== piece.title && (
                      <p className="text-slate-500 text-xs mt-1 italic truncate">&quot;{piece.hook}&quot;</p>
                    )}
                    <div className="flex gap-2 mt-1">
                      {piece.script && <span className="text-emerald-500 text-xs">Script</span>}
                      {piece.shot_list && <span className="text-amber-500 text-xs">Shot List</span>}
                      {piece.pro_tips && <span className="text-purple-400 text-xs">Pro Tips</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => removePiece(i)}
                    className="text-slate-600 hover:text-red-400 text-sm mt-0.5 shrink-0"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            {error && (
              <div
                className="px-4 py-2.5 rounded-xl text-sm mt-4"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
              >
                {error}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 flex justify-between shrink-0" style={{ borderTop: "1px solid #1e293b" }}>
          {step === "preview" && (
            <button
              onClick={() => setStep("input")}
              className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
            >
              Back
            </button>
          )}
          <div className="ml-auto flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            {step === "input" ? (
              <button
                onClick={handleParse}
                disabled={!textInput.trim()}
                className="px-6 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                Preview
              </button>
            ) : (
              <button
                onClick={handleImport}
                disabled={loading || parsed.length === 0}
                className="px-6 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
              >
                {loading ? "Importing..." : `Import ${parsed.length} Pieces`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
