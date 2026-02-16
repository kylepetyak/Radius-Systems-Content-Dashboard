"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { StatusBadge, statusConfig } from "@/components/status-badge";
import { ProgressRing } from "@/components/progress-ring";
import { ClockIcon, CameraIcon } from "@/components/icons";
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
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden transition-all duration-200 group"
      style={{ background: "#0f172a", border: "1px solid rgba(99,102,241,0.15)" }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-lg text-white"
            style={{ background: pColor }}
          >
            {item.platform}
          </span>
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
            <div className="text-xs text-slate-500">
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

  const filtered = filter === "all" ? pieces : pieces.filter((i) => i.status === filter);

  const getShotCount = (pieceId: string) =>
    shotItems.filter((s: { piece_id: string }) => s.piece_id === pieceId).length;

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
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
              <span className="text-4xl">📋</span>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">No content plan yet</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Your Radius team is working on your content plan. You&apos;ll see it here once it&apos;s ready.
            </p>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div
                className="rounded-2xl p-6 flex flex-col items-center justify-center"
                style={{ background: "#0f172a", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                <ProgressRing completed={counts.published} total={pieces.length} />
                <p className="text-slate-400 text-xs mt-3 font-medium">
                  {counts.published} of {pieces.length} published
                </p>
              </div>
              <div
                className="md:col-span-2 rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #312e81, #1e1b4b, #0f172a)",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              >
                <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
                  Welcome back
                </p>
                <h1 className="text-white text-2xl font-bold mb-2">Your Content Plan</h1>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                  Here&apos;s everything you need to film this month. Each piece has a full script,
                  shot-by-shot guide, and pro tips. Tap any card to get started.
                </p>
                <div className="mt-4 flex gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-slate-400 text-xs">{counts.to_film} to film</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-slate-400 text-xs">{counts.filming} filming</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-400" />
                    <span className="text-slate-400 text-xs">{counts.in_review} in review</span>
                  </div>
                </div>
              </div>
            </div>

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
