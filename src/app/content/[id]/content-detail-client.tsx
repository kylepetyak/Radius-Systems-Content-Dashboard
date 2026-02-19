"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge, statusConfig, type ContentStatus } from "@/components/status-badge";
import { FilmingMode } from "@/components/filming-mode";
import {
  ArrowLeftIcon,
  MicIcon,
  CameraIcon,
  SparkleIcon,
  CheckIcon,
  FolderIcon,
  ExternalLinkIcon,
  EyeIcon,
  ZapIcon,
} from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import type { ContentPiece, ShotListItem, ProTip } from "@/lib/types/database";

interface ContentDetailClientProps {
  piece: ContentPiece;
  shotItems: ShotListItem[];
  proTips: ProTip[];
  isAdmin: boolean;
}

// Client-allowed statuses (no "published" — that's the agency's call)
const clientStatuses: ContentStatus[] = ["to_film", "filming", "in_review"];

export function ContentDetailClient({
  piece,
  shotItems,
  proTips,
  isAdmin,
}: ContentDetailClientProps) {
  const [activeTab, setActiveTab] = useState<"script" | "shots" | "tips">("script");
  const [currentStatus, setCurrentStatus] = useState<ContentStatus>(piece.status);
  const [shots, setShots] = useState(shotItems);
  const [showFilmingMode, setShowFilmingMode] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const completedShots = shots.filter((s) => s.is_completed).length;

  const handleStatusChange = async (newStatus: ContentStatus) => {
    setCurrentStatus(newStatus);
    await supabase
      .from("content_pieces")
      .update({ status: newStatus })
      .eq("id", piece.id);
    router.refresh();
  };

  const toggleShot = async (shotId: string, currentCompleted: boolean) => {
    setShots((prev) =>
      prev.map((s) => (s.id === shotId ? { ...s, is_completed: !currentCompleted } : s))
    );
    await supabase
      .from("shot_list_items")
      .update({ is_completed: !currentCompleted })
      .eq("id", shotId);
  };

  const handleFilmingShotToggle = useCallback((shotId: string, completed: boolean) => {
    setShots((prev) =>
      prev.map((s) => (s.id === shotId ? { ...s, is_completed: !completed } : s))
    );
  }, []);

  const handleAllShotsComplete = useCallback(async () => {
    // Auto-advance status to in_review when all shots are done
    if (currentStatus === "to_film" || currentStatus === "filming") {
      setCurrentStatus("in_review");
      await supabase
        .from("content_pieces")
        .update({ status: "in_review" })
        .eq("id", piece.id);
      router.refresh();
    }
  }, [currentStatus, piece.id, supabase, router]);

  // Auto-advance: if user starts completing shots and status is to_film, move to filming
  const handleShotToggleWithAutoAdvance = async (shotId: string, currentCompleted: boolean) => {
    await toggleShot(shotId, currentCompleted);

    if (!currentCompleted && currentStatus === "to_film") {
      // User completed a shot, auto-advance from to_film to filming
      setCurrentStatus("filming");
      await supabase
        .from("content_pieces")
        .update({ status: "filming" })
        .eq("id", piece.id);
      router.refresh();
    }
  };

  const availableStatuses = isAdmin
    ? (Object.keys(statusConfig) as ContentStatus[])
    : clientStatuses;

  const tabs = [
    { id: "script" as const, label: "Script", icon: <MicIcon size={16} /> },
    { id: "shots" as const, label: "Shot List", icon: <CameraIcon size={16} /> },
    { id: "tips" as const, label: "Pro Tips", icon: <SparkleIcon size={16} /> },
  ];

  // Filming mode overlay
  if (showFilmingMode) {
    return (
      <FilmingMode
        piece={piece}
        shotItems={shots}
        proTips={proTips}
        onClose={() => {
          setShowFilmingMode(false);
          router.refresh();
        }}
        onShotToggle={handleFilmingShotToggle}
        onAllShotsComplete={handleAllShotsComplete}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10"
        style={{ background: "rgba(2,6,23,0.95)", borderBottom: "1px solid #1e293b" }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeftIcon />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-semibold text-sm truncate">{piece.title}</h1>
            <p className="text-slate-500 text-xs">
              {piece.platform} &middot; {piece.duration || ""}
            </p>
          </div>
          <StatusBadge status={currentStatus} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Start Filming Mode CTA */}
        {(currentStatus === "to_film" || currentStatus === "filming") && (
          <button
            onClick={() => setShowFilmingMode(true)}
            className="w-full rounded-2xl p-5 text-left transition-all active:scale-[0.99] group"
            style={{
              background: "linear-gradient(135deg, #312e81, #0c4a6e)",
              border: "1px solid rgba(99,102,241,0.3)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <ZapIcon size={14} /> Filming Mode
                </span>
                <p className="text-white text-base font-semibold mb-1">
                  Ready to film? Start here.
                </p>
                <p className="text-slate-400 text-sm">
                  Step-by-step guide with teleprompter.
                  {shots.length > 0 && ` ${shots.length} shots to walk through.`}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                style={{ background: "rgba(99,102,241,0.2)" }}
              >
                <CameraIcon size={24} />
              </div>
            </div>
          </button>
        )}

        {/* Hook card */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "linear-gradient(135deg, #312e81, #1e1b4b)" }}
        >
          <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
            The Hook
          </p>
          <p className="text-white text-lg font-medium leading-relaxed">
            &ldquo;{piece.hook}&rdquo;
          </p>
        </div>

        {/* Reference Video/Link */}
        {piece.reference_url && (
          <a
            href={piece.reference_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #1e1b4b, #312e81)",
              border: "1px solid rgba(139,92,246,0.3)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-violet-400"
              style={{ background: "rgba(139,92,246,0.15)" }}
            >
              <EyeIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-violet-300 text-sm font-semibold">Reference Example</p>
              <p className="text-violet-400 text-xs truncate" style={{ opacity: 0.7 }}>
                See what we&apos;re going for — tap to watch
              </p>
            </div>
            <span className="text-violet-400">
              <ExternalLinkIcon size={18} />
            </span>
          </a>
        )}

        {/* Google Drive Folder Link */}
        {piece.drive_folder_url && (
          <a
            href={piece.drive_folder_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl transition-all hover:opacity-90"
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
              <p className="text-emerald-300 text-sm font-semibold">Upload Footage</p>
              <p className="text-emerald-500 text-xs truncate">
                Drop your filmed footage into Google Drive
              </p>
            </div>
            <span className="text-emerald-400">
              <ExternalLinkIcon size={18} />
            </span>
          </a>
        )}

        {/* Status buttons */}
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Update Status
          </p>
          <div className="flex gap-2 flex-wrap">
            {availableStatuses.map((key) => {
              const val = statusConfig[key];
              return (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: currentStatus === key ? val.color : "#1e293b",
                    color: currentStatus === key ? "#020617" : val.color,
                    border: `1px solid ${currentStatus === key ? val.color : "#334155"}`,
                    fontWeight: currentStatus === key ? 700 : 500,
                  }}
                >
                  {val.label}
                </button>
              );
            })}
            {currentStatus === "published" && !isAdmin && (
              <span
                className="px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-1.5"
                style={{
                  background: statusConfig.published.color,
                  color: "#020617",
                }}
              >
                <CheckIcon /> Published
              </span>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <div
          className="flex gap-1 p-1 rounded-2xl"
          style={{ background: "#0f172a", border: "1px solid #1e293b" }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: activeTab === t.id ? "rgba(99,102,241,0.15)" : "transparent",
                color: activeTab === t.id ? "#a5b4fc" : "#64748b",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Script tab */}
        {activeTab === "script" && (
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: "#0f172a", border: "1px solid #1e293b" }}
          >
            <div className="flex items-center gap-2 text-slate-300">
              <MicIcon size={18} />
              <h2 className="text-white font-semibold">Full Script</h2>
            </div>
            <div className="rounded-xl p-4" style={{ background: "#020617" }}>
              <pre
                className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap"
                style={{ fontFamily: "inherit" }}
              >
                {piece.script || "No script provided yet."}
              </pre>
            </div>
            <div
              className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              <span className="text-xs shrink-0 mt-0.5">&#128161;</span>
              <p className="text-amber-400 text-xs">
                Don&apos;t memorize word-for-word. Hit the key points in your own voice — or use Filming Mode for a teleprompter.
              </p>
            </div>
          </div>
        )}

        {/* Shots tab */}
        {activeTab === "shots" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-slate-400 text-xs font-semibold">
                {completedShots} of {shots.length} shots completed
              </p>
              <div
                className="h-1.5 w-32 rounded-full overflow-hidden"
                style={{ background: "#1e293b" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${shots.length > 0 ? (completedShots / shots.length) * 100 : 0}%`,
                    background: completedShots === shots.length && shots.length > 0 ? "#10b981" : "#6366f1",
                  }}
                />
              </div>
            </div>
            {completedShots === shots.length && shots.length > 0 && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <span className="text-emerald-400"><CheckIcon /></span>
                <p className="text-emerald-400 text-sm font-medium">All shots done! Time to upload your footage.</p>
              </div>
            )}
            {shots.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm">No shots added yet.</p>
              </div>
            ) : (
              shots.map((shot) => (
                <button
                  key={shot.id}
                  onClick={() => handleShotToggleWithAutoAdvance(shot.id, shot.is_completed)}
                  className="w-full text-left rounded-2xl p-4 transition-all"
                  style={{
                    background: shot.is_completed ? "rgba(16,185,129,0.06)" : "#0f172a",
                    border: `1px solid ${shot.is_completed ? "#065f46" : "#1e293b"}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        marginTop: 2,
                        background: shot.is_completed ? "#10b981" : "transparent",
                        border: `2px solid ${shot.is_completed ? "#10b981" : "#475569"}`,
                      }}
                    >
                      {shot.is_completed && (
                        <span className="text-white">
                          <CheckIcon />
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-indigo-400 text-xs font-bold">
                        SHOT {shot.shot_number}
                      </span>
                      <p className="text-white text-sm font-medium mb-1">{shot.shot_desc}</p>
                      {shot.framing && (
                        <p className="text-cyan-400 text-xs mb-1.5" style={{ opacity: 0.6 }}>
                          {shot.framing}
                        </p>
                      )}
                      {shot.notes && (
                        <p className="text-slate-400 text-xs leading-relaxed">{shot.notes}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Tips tab */}
        {activeTab === "tips" && (
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: "#0f172a", border: "1px solid #1e293b" }}
          >
            <div className="flex items-center gap-2 text-slate-300">
              <SparkleIcon size={18} />
              <h2 className="text-white font-semibold">Pro Tips from Your Team</h2>
            </div>
            {proTips.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm">No tips added yet.</p>
              </div>
            ) : (
              proTips.map((tip, i) => (
                <div key={tip.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "#020617" }}>
                  <span
                    className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 text-indigo-400"
                    style={{ marginTop: 2, background: "rgba(99,102,241,0.15)" }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-slate-300 text-sm leading-relaxed">{tip.tip_text}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
