"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { StatusBadge } from "@/components/status-badge";
import { ArrowLeftIcon, PlusIcon, ChevronRightIcon, TrashIcon } from "@/components/icons";
import { BulkImportModal } from "@/components/bulk-import-modal";
import type { Profile, ContentPlan, ContentPiece } from "@/lib/types/database";

interface PlanEditorClientProps {
  plan: ContentPlan;
  client: Profile;
  pieces: ContentPiece[];
}

export function PlanEditorClient({ plan, client, pieces }: PlanEditorClientProps) {
  const [showNewPiece, setShowNewPiece] = useState(false);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("Instagram Reels");
  const [contentType, setContentType] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [duration, setDuration] = useState("");
  const [hook, setHook] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const router = useRouter();

  const handleCreatePiece = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/content-pieces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: plan.id,
          title,
          platform,
          content_type: contentType || null,
          due_date: dueDate || null,
          duration: duration || null,
          hook,
          sort_order: pieces.length,
        }),
      });

      if (res.ok) {
        setTitle("");
        setPlatform("Instagram Reels");
        setContentType("");
        setDueDate("");
        setDuration("");
        setHook("");
        setShowNewPiece(false);
        router.refresh();
      }
    } catch {
      // Handle error
    }

    setLoading(false);
  };

  const handleDeletePiece = async (pieceId: string) => {
    if (!confirm("Delete this content piece?")) return;

    await fetch(`/api/content-pieces?id=${pieceId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
      <Navbar isAdmin />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.push(`/admin/clients/${client.id}`)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeftIcon />
          </button>
          <div className="flex-1">
            <h1 className="text-white text-xl font-bold">{plan.title}</h1>
            <p className="text-slate-400 text-sm">
              {client.company_name || client.email} &middot; {plan.month || "No month"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 mt-6">
          <p className="text-slate-400 text-sm">{pieces.length} content pieces</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkImport(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "transparent",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#a5b4fc",
              }}
            >
              Bulk Import
            </button>
            <button
              onClick={() => setShowNewPiece(!showNewPiece)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
            >
              <PlusIcon /> Add Piece
            </button>
          </div>
        </div>

        {showNewPiece && (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ background: "#0f172a", border: "1px solid rgba(99,102,241,0.3)" }}
          >
            <h3 className="text-white font-semibold mb-4">New Content Piece</h3>
            <form onSubmit={handleCreatePiece} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: "#020617", border: "1px solid #1e293b" }}
                  placeholder="e.g. Why Fishing in Venice Beats Everywhere Else"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1.5">Platform *</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "#020617", border: "1px solid #1e293b" }}
                  >
                    <option>Instagram Reels</option>
                    <option>TikTok + Reels</option>
                    <option>TikTok + Shorts</option>
                    <option>YouTube Shorts</option>
                    <option>TikTok</option>
                    <option>Instagram</option>
                    <option>YouTube</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1.5">Content Type</label>
                  <input
                    type="text"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "#020617", border: "1px solid #1e293b" }}
                    placeholder="e.g. Talking Head + B-Roll"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "#020617", border: "1px solid #1e293b" }}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1.5">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "#020617", border: "1px solid #1e293b" }}
                    placeholder="e.g. 30-60s"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">Hook *</label>
                <input
                  type="text"
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: "#020617", border: "1px solid #1e293b" }}
                  placeholder="The opening hook line..."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                {loading ? "Creating..." : "Create Piece"}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {pieces.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ background: "#0f172a", border: "1px solid #1e293b" }}
            >
              <p className="text-slate-500 text-sm">No content pieces yet. Add your first piece.</p>
            </div>
          ) : (
            pieces.map((piece) => (
              <div
                key={piece.id}
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: "#0f172a", border: "1px solid #1e293b" }}
              >
                <button
                  onClick={() => router.push(`/admin/pieces/${piece.id}`)}
                  className="flex-1 text-left flex items-center gap-4 min-w-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white text-sm font-medium truncate">{piece.title}</p>
                      <StatusBadge status={piece.status} />
                    </div>
                    <p className="text-slate-500 text-xs">
                      {piece.platform}
                      {piece.duration ? ` · ${piece.duration}` : ""}
                      {piece.due_date
                        ? ` · Due ${new Date(piece.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                        : ""}
                    </p>
                  </div>
                  <ChevronRightIcon />
                </button>
                <button
                  onClick={() => handleDeletePiece(piece.id)}
                  className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
                >
                  <TrashIcon />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {showBulkImport && (
        <BulkImportModal
          planId={plan.id}
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => {
            setShowBulkImport(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
