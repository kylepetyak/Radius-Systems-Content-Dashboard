"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { StatusBadge, statusConfig } from "@/components/status-badge";
import { ProgressRing } from "@/components/progress-ring";
import { WelcomeModal } from "@/components/welcome-modal";
import { ClockIcon, CameraIcon, ZapIcon, FireIcon, TrophyIcon, ChevronRightIcon } from "@/components/icons";
import type { Profile, ContentPlan, ContentPiece, ShotListItem, ProTip } from "@/lib/types/database";

interface DashboardClientProps {
  profile: Profile;
  plan: ContentPlan | null;
  pieces: ContentPiece[];
  shotItems: ShotListItem[];
  proTips: ProTip[];
}

const platformColors: Record<string, string> = {
  "Instagram Reels": "#E1306C",
  "TikTok + Reels": "#25F4EE",
  "TikTok + Shorts": "#FF0000",
  TikTok: "#25F4EE",
  Instagram: "#E1306C",
  YouTube: "#FF0000",
  "YouTube Shorts": "#FF0000",
};

type FilterKey = "all" | "to_film" | "filming" | "in_review" | "published";

// --- Urgency helpers ---
function getDueUrgency(dueDate: string | null): "overdue" | "today" | "soon" | "normal" {
  if (!dueDate) return "normal";
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  const diff = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 2) return "soon";
  return "normal";
}

function getUrgencyStyle(urgency: "overdue" | "today" | "soon" | "normal") {
  switch (urgency) {
    case "overdue": return { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)", label: "Overdue" };
    case "today": return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", label: "Due today" };
    case "soon": return { color: "#06b6d4", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.2)", label: "Due soon" };
    default: return null;
  }
}

// --- Encouragement messages ---
function getEncouragement(filmed: number, total: number): { message: string; sub: string } {
  if (total === 0) return { message: "Your plan is on the way!", sub: "Check back soon." };
  const pct = filmed / total;
  if (pct === 0) return { message: "Ready to make some content?", sub: "Tap your first piece below to get started. You've got this." };
  if (pct < 0.25) return { message: "Great start!", sub: "You're building momentum. Keep it rolling." };
  if (pct < 0.5) return { message: "You're on a roll!", sub: "Almost halfway there. Your team is going to love this footage." };
  if (pct < 0.75) return { message: "More than halfway!", sub: "This content is going to be fire. Keep filming." };
  if (pct < 1) return { message: "Almost done!", sub: "Just a few more to go. You're crushing it." };
  return { message: "All filmed!", sub: "You're a content machine. Your team is editing now." };
}

// --- Content card ---
function ContentCard({
  item,
  shotCount,
  onClick,
}: {
  item: ContentPiece;
  shotCount: number;
  onClick: () => void;
}) {
  const pColor = platformColors[item.platform] || "#6366f1";
  const urgency = getDueUrgency(item.due_date);
  const urgencyStyle = getUrgencyStyle(urgency);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden transition-all duration-200 group"
      style={{
        background: "#0f172a",
        border: urgencyStyle
          ? `1px solid ${urgencyStyle.border}`
          : "1px solid rgba(99,102,241,0.15)",
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
              style={{ background: pColor }}
            >
              {item.platform}
            </span>
            {urgencyStyle && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-md"
                style={{ background: urgencyStyle.bg, color: urgencyStyle.color }}
              >
                {urgencyStyle.label}
              </span>
            )}
          </div>
          <StatusBadge status={item.status} />
        </div>
        <h3 className="text-white font-semibold text-base mb-2 leading-snug group-hover:text-indigo-300 transition-colors">
          {item.title}
        </h3>
        <p
          className="text-slate-400 text-sm mb-4 leading-relaxed overflow-hidden"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {item.hook}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {item.duration && (
              <span className="flex items-center gap-1">
                <ClockIcon /> {item.duration}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CameraIcon size={14} /> {shotCount} shots
            </span>
          </div>
          {item.due_date && (
            <div
              className="text-xs"
              style={{ color: urgencyStyle?.color || "#64748b" }}
            >
              Due {new Date(item.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          )}
        </div>
      </div>
      <div
        className="h-0.5 w-full"
        style={{
          background: `linear-gradient(90deg, ${statusConfig[item.status].color}, transparent)`,
        }}
      />
    </button>
  );
}

// --- Film Next Hero Card ---
function FilmNextCard({ piece, shotCount, onClick }: { piece: ContentPiece; shotCount: number; onClick: () => void }) {
  const urgency = getDueUrgency(piece.due_date);
  const urgencyStyle = getUrgencyStyle(urgency);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden transition-all group active:scale-[0.99]"
      style={{
        background: "linear-gradient(135deg, #312e81, #1e1b4b, #0c4a6e)",
        border: "1px solid rgba(99,102,241,0.3)",
      }}
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <ZapIcon size={14} /> Film Next
          </span>
          {urgencyStyle && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-md"
              style={{ background: urgencyStyle.bg, color: urgencyStyle.color }}
            >
              {urgencyStyle.label}
            </span>
          )}
        </div>
        <h2 className="text-white text-xl font-bold mb-2 group-hover:text-indigo-200 transition-colors">
          {piece.title}
        </h2>
        <p className="text-slate-300 text-sm mb-4 leading-relaxed" style={{ opacity: 0.75 }}>
          &ldquo;{piece.hook}&rdquo;
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <CameraIcon size={14} /> {shotCount} shots
            </span>
            {piece.duration && (
              <span className="flex items-center gap-1">
                <ClockIcon /> {piece.duration}
              </span>
            )}
            {piece.due_date && (
              <span style={{ color: urgencyStyle?.color || "#94a3b8" }}>
                Due {new Date(piece.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-indigo-300 text-sm font-medium group-hover:text-white transition-colors">
            Start <ChevronRightIcon />
          </span>
        </div>
      </div>
      <div
        className="h-1 w-full"
        style={{ background: "linear-gradient(90deg, #6366f1, #06b6d4)" }}
      />
    </button>
  );
}

// --- Main Dashboard ---
export function DashboardClient({
  profile,
  plan,
  pieces,
  shotItems,
}: DashboardClientProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const router = useRouter();

  const initials = profile.company_name
    ? profile.company_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : profile.email.slice(0, 2).toUpperCase();

  const counts = {
    all: pieces.length,
    to_film: pieces.filter((i) => i.status === "to_film").length,
    filming: pieces.filter((i) => i.status === "filming").length,
    in_review: pieces.filter((i) => i.status === "in_review").length,
    published: pieces.filter((i) => i.status === "published").length,
  };

  // Client-focused progress: filmed = in_review + published (things the client has finished filming)
  const filmed = counts.in_review + counts.published;

  // Find the most urgent piece to film next
  const filmablePieces = pieces
    .filter((p) => p.status === "to_film" || p.status === "filming")
    .sort((a, b) => {
      // Overdue first, then by due date
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return a.sort_order - b.sort_order;
    });
  const filmNext = filmablePieces[0] || null;

  const filtered = filter === "all" ? pieces : pieces.filter((i) => i.status === filter);

  const getShotCount = (pieceId: string) =>
    shotItems.filter((s: { piece_id: string }) => s.piece_id === pieceId).length;

  const encouragement = getEncouragement(filmed, pieces.length);

  // Streak: how many pieces have they completed in a row recently
  const streakIcon = filmed >= 3 ? <FireIcon size={14} /> : null;
  const streakText = filmed >= pieces.length && pieces.length > 0
    ? "All done!"
    : filmed >= 3
    ? `${filmed}-piece streak!`
    : null;

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
      <WelcomeModal companyName={profile.company_name || profile.email} />
      <Navbar
        companyName={profile.company_name || profile.email}
        planMonth={plan?.month || undefined}
        initials={initials}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {!plan ? (
          <div className="text-center py-24">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(99,102,241,0.1)" }}
            >
              <CameraIcon size={32} />
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">No content plan yet</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Your Radius team is working on your content plan. You&apos;ll see it here once it&apos;s ready.
            </p>
          </div>
        ) : (
          <>
            {/* Encouragement + Progress header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div
                className="md:col-span-2 rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #312e81, #1e1b4b, #0f172a)",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                    {plan.month || "Your Content Plan"}
                  </p>
                  {streakText && (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                      {streakIcon} {streakText}
                    </span>
                  )}
                </div>
                <h1 className="text-white text-2xl font-bold mb-2">{encouragement.message}</h1>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md">{encouragement.sub}</p>
                <div className="mt-4 flex gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-slate-400 text-xs">{counts.to_film} to film</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-slate-400 text-xs">{counts.filming} in progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-400" />
                    <span className="text-slate-400 text-xs">{counts.in_review} with your team</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-slate-400 text-xs">{counts.published} published</span>
                  </div>
                </div>
              </div>

              {/* Progress ring - now measures client filming effort */}
              <div
                className="rounded-2xl p-6 flex flex-col items-center justify-center"
                style={{ background: "#0f172a", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                <ProgressRing completed={filmed} total={pieces.length} />
                <p className="text-slate-400 text-xs mt-3 font-medium">
                  {filmed} of {pieces.length} filmed
                </p>
                {filmed === pieces.length && pieces.length > 0 && (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold mt-1">
                    <TrophyIcon size={12} /> Complete!
                  </span>
                )}
              </div>
            </div>

            {/* Film Next Hero */}
            {filmNext && (
              <div className="mb-6">
                <FilmNextCard
                  piece={filmNext}
                  shotCount={getShotCount(filmNext.id)}
                  onClick={() => router.push(`/content/${filmNext.id}`)}
                />
              </div>
            )}

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
              {(
                [
                  { key: "all" as FilterKey, label: "All" },
                  { key: "to_film" as FilterKey, label: "To Film" },
                  { key: "filming" as FilterKey, label: "Filming" },
                  { key: "in_review" as FilterKey, label: "In Review" },
                  { key: "published" as FilterKey, label: "Published" },
                ] as const
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
                  style={{
                    background: filter === f.key ? "rgba(99,102,241,0.15)" : "#0f172a",
                    color: filter === f.key ? "#a5b4fc" : "#94a3b8",
                    border: `1px solid ${filter === f.key ? "rgba(99,102,241,0.3)" : "#1e293b"}`,
                  }}
                >
                  {f.label}{" "}
                  <span className="ml-1 text-xs opacity-50">{counts[f.key]}</span>
                </button>
              ))}
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  shotCount={getShotCount(item.id)}
                  onClick={() => router.push(`/content/${item.id}`)}
                />
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-slate-500 text-sm">No content with this status yet.</p>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 flex items-center justify-between" style={{ borderTop: "1px solid #1e293b" }}>
          <p className="text-slate-600 text-xs">Powered by Radius Systems</p>
          <p className="text-slate-600 text-xs">Questions? Text your content team anytime.</p>
        </div>
      </div>
    </div>
  );
}
