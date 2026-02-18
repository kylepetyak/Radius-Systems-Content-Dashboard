"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { StatusBadge } from "@/components/status-badge";
import { ArrowLeftIcon, PlusIcon, TrashIcon, FolderIcon, ExternalLinkIcon } from "@/components/icons";
import type { ContentPlan, ContentPiece, ShotListItem, ProTip } from "@/lib/types/database";

interface PieceEditorClientProps {
  piece: ContentPiece;
  plan: ContentPlan;
  shotItems: ShotListItem[];
  proTips: ProTip[];
}

export function PieceEditorClient({
  piece,
  plan,
  shotItems,
  proTips,
}: PieceEditorClientProps) {
  const [script, setScript] = useState(piece.script || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Shot list state
  const [newShotDesc, setNewShotDesc] = useState("");
  const [newShotFraming, setNewShotFraming] = useState("");
  const [newShotNotes, setNewShotNotes] = useState("");
  const [addingShot, setAddingShot] = useState(false);

  // Pro tips state
  const [newTip, setNewTip] = useState("");
  const [addingTip, setAddingTip] = useState(false);

  const router = useRouter();

  const handleSaveScript = async () => {
    setSaving(true);
    await fetch("/api/content-pieces", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: piece.id, script }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddShot = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingShot(true);

    await fetch("/api/shot-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        piece_id: piece.id,
        shot_number: shotItems.length + 1,
        shot_desc: newShotDesc,
        framing: newShotFraming || null,
        notes: newShotNotes || null,
        sort_order: shotItems.length,
      }),
    });

    setNewShotDesc("");
    setNewShotFraming("");
    setNewShotNotes("");
    setAddingShot(false);
    router.refresh();
  };

  const handleDeleteShot = async (shotId: string) => {
    await fetch(`/api/shot-items?id=${shotId}`, { method: "DELETE" });
    router.refresh();
  };

  const handleAddTip = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingTip(true);

    await fetch("/api/shot-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        piece_id: piece.id,
        tip_text: newTip,
        sort_order: proTips.length,
        _type: "tip",
      }),
    });

    setNewTip("");
    setAddingTip(false);
    router.refresh();
  };

  const handleDeleteTip = async (tipId: string) => {
    await fetch(`/api/shot-items?id=${tipId}&type=tip`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
      <Navbar isAdmin />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push(`/admin/plans/${plan.id}`)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeftIcon />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white text-xl font-bold truncate">{piece.title}</h1>
            <p className="text-slate-400 text-sm">
              {piece.platform} &middot; {piece.duration || "No duration"}
            </p>
          </div>
          <StatusBadge status={piece.status} />
        </div>

        {/* Google Drive Folder Link */}
        {piece.drive_folder_url && (
          <a
            href={piece.drive_folder_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl mb-6 transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #1a4731, #14532d)",
              border: "1px solid #166534",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-emerald-400"
              style={{ background: "rgba(34,197,94,0.15)" }}
            >
              <FolderIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-emerald-300 text-sm font-semibold">Google Drive Folder</p>
              <p className="text-emerald-500 text-xs truncate">
                Footage, audio &amp; photos
              </p>
            </div>
            <span className="text-emerald-400">
              <ExternalLinkIcon size={18} />
            </span>
          </a>
        )}

        {/* Script Editor */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: "#0f172a", border: "1px solid #1e293b" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Script</h2>
            <div className="flex items-center gap-2">
              {saved && <span className="text-emerald-400 text-xs">Saved!</span>}
              <button
                onClick={handleSaveScript}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                {saving ? "Saving..." : "Save Script"}
              </button>
            </div>
          </div>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 rounded-xl text-slate-300 text-sm leading-relaxed outline-none resize-y"
            style={{ background: "#020617", border: "1px solid #1e293b", fontFamily: "inherit" }}
            placeholder="Write your script here..."
          />
        </div>

        {/* Shot List Builder */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: "#0f172a", border: "1px solid #1e293b" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Shot List ({shotItems.length} shots)</h2>
          </div>
          <div className="space-y-3 mb-4">
            {shotItems.map((shot) => (
              <div
                key={shot.id}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "#020617" }}
              >
                <span className="text-indigo-400 text-xs font-bold mt-0.5 shrink-0">
                  #{shot.shot_number}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">{shot.shot_desc}</p>
                  {shot.framing && (
                    <p className="text-cyan-400 text-xs mt-0.5 opacity-60">{shot.framing}</p>
                  )}
                  {shot.notes && (
                    <p className="text-slate-500 text-xs mt-0.5">{shot.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteShot(shot.id)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddShot} className="space-y-3 p-4 rounded-xl" style={{ background: "#020617" }}>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Add Shot</p>
            <input
              type="text"
              value={newShotDesc}
              onChange={(e) => setNewShotDesc(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
              style={{ background: "#0f172a", border: "1px solid #1e293b" }}
              placeholder="Shot description"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newShotFraming}
                onChange={(e) => setNewShotFraming(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                style={{ background: "#0f172a", border: "1px solid #1e293b" }}
                placeholder="Framing (e.g. Medium close-up)"
              />
              <input
                type="text"
                value={newShotNotes}
                onChange={(e) => setNewShotNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none"
                style={{ background: "#0f172a", border: "1px solid #1e293b" }}
                placeholder="Director's notes"
              />
            </div>
            <button
              type="submit"
              disabled={addingShot}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-indigo-400 disabled:opacity-50"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              <PlusIcon /> Add Shot
            </button>
          </form>
        </div>

        {/* Pro Tips Builder */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "#0f172a", border: "1px solid #1e293b" }}
        >
          <h2 className="text-white font-semibold mb-4">Pro Tips ({proTips.length})</h2>
          <div className="space-y-3 mb-4">
            {proTips.map((tip, i) => (
              <div
                key={tip.id}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "#020617" }}
              >
                <span
                  className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 text-indigo-400"
                  style={{ background: "rgba(99,102,241,0.15)" }}
                >
                  {i + 1}
                </span>
                <p className="text-slate-300 text-sm flex-1">{tip.tip_text}</p>
                <button
                  onClick={() => handleDeleteTip(tip.id)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddTip} className="flex gap-3">
            <input
              type="text"
              value={newTip}
              onChange={(e) => setNewTip(e.target.value)}
              required
              className="flex-1 px-3 py-2 rounded-lg text-white text-sm outline-none"
              style={{ background: "#020617", border: "1px solid #1e293b" }}
              placeholder="Add a pro tip..."
            />
            <button
              type="submit"
              disabled={addingTip}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-indigo-400 disabled:opacity-50 shrink-0"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              <PlusIcon /> Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
