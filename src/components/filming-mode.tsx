"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  XIcon,
  PlayIcon,
  PauseIcon,
  CheckIcon,
  CameraIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparkleIcon,
} from "./icons";
import type { ContentPiece, ShotListItem, ProTip } from "@/lib/types/database";

interface FilmingModeProps {
  piece: ContentPiece;
  shotItems: ShotListItem[];
  proTips: ProTip[];
  onClose: () => void;
  onShotToggle: (shotId: string, completed: boolean) => void;
  onAllShotsComplete: () => void;
}

export function FilmingMode({
  piece,
  shotItems,
  proTips,
  onClose,
  onShotToggle,
  onAllShotsComplete,
}: FilmingModeProps) {
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2); // 1-5 scale
  const [showComplete, setShowComplete] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [shots, setShots] = useState(shotItems);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>();
  const supabase = createClient();

  const completedCount = shots.filter((s) => s.is_completed).length;
  const currentShot = shots[currentShotIndex];
  const isLastShot = currentShotIndex === shots.length - 1;

  // Auto-scroll teleprompter
  useEffect(() => {
    if (!isScrolling || !scrollRef.current) return;
    const el = scrollRef.current;
    const speedPx = scrollSpeed * 0.4; // px per frame at 60fps

    const scroll = () => {
      el.scrollTop += speedPx;
      if (el.scrollTop >= el.scrollHeight - el.clientHeight) {
        setIsScrolling(false);
        return;
      }
      animRef.current = requestAnimationFrame(scroll);
    };
    animRef.current = requestAnimationFrame(scroll);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isScrolling, scrollSpeed]);

  const handleMarkShot = useCallback(async () => {
    if (!currentShot) return;

    const newCompleted = !currentShot.is_completed;
    setShots((prev) =>
      prev.map((s) =>
        s.id === currentShot.id ? { ...s, is_completed: newCompleted } : s
      )
    );
    onShotToggle(currentShot.id, newCompleted);

    await supabase
      .from("shot_list_items")
      .update({ is_completed: newCompleted })
      .eq("id", currentShot.id);

    if (newCompleted) {
      // Check if all shots are now done
      const allDone = shots.every((s) =>
        s.id === currentShot.id ? true : s.is_completed
      );

      if (allDone) {
        setShowComplete(true);
        onAllShotsComplete();
      } else if (!isLastShot) {
        // Auto-advance to next incomplete shot
        const nextIncomplete = shots.findIndex(
          (s, i) => i > currentShotIndex && !s.is_completed
        );
        if (nextIncomplete !== -1) {
          setCurrentShotIndex(nextIncomplete);
        } else {
          // Wrap around to first incomplete
          const firstIncomplete = shots.findIndex(
            (s) => !s.is_completed && s.id !== currentShot.id
          );
          if (firstIncomplete !== -1) setCurrentShotIndex(firstIncomplete);
        }
      }
    }
  }, [currentShot, shots, currentShotIndex, isLastShot, onShotToggle, onAllShotsComplete, supabase]);

  // No shots? Show teleprompter-only mode
  if (shots.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#020617" }}>
        <FilmingHeader
          title={piece.title}
          subtitle="Script Mode"
          onClose={onClose}
        />
        <div className="flex-1 overflow-hidden flex flex-col">
          <TeleprompterView
            script={piece.script || "No script provided."}
            scrollRef={scrollRef}
            isScrolling={isScrolling}
            scrollSpeed={scrollSpeed}
            onToggleScroll={() => setIsScrolling(!isScrolling)}
            onSpeedChange={setScrollSpeed}
          />
        </div>
      </div>
    );
  }

  // All shots complete celebration
  if (showComplete) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center" style={{ background: "#020617" }}>
        <div className="text-center px-8 max-w-sm">
          <div className="text-6xl mb-6 animate-bounce">
            <span role="img" aria-label="celebration">&#127881;</span>
          </div>
          <h2 className="text-white text-2xl font-bold mb-3">All shots filmed!</h2>
          <p className="text-slate-400 text-sm mb-2">
            You crushed it. Every single shot — done.
          </p>
          <p className="text-slate-500 text-xs mb-8">
            {piece.drive_folder_url
              ? "Upload your footage to Google Drive and your team will take it from here."
              : "Your team will take it from here."}
          </p>
          {piece.drive_folder_url && (
            <a
              href={piece.drive_folder_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold mb-4 transition-all"
              style={{
                background: "linear-gradient(135deg, #059669, #10b981)",
                color: "white",
              }}
            >
              Upload Footage
            </a>
          )}
          <div>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
              style={{ background: "#1e293b" }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "#020617" }}>
      <FilmingHeader
        title={piece.title}
        subtitle={`Shot ${currentShotIndex + 1} of ${shots.length} — ${completedCount} done`}
        onClose={onClose}
      />

      {/* Shot progress dots */}
      <div className="flex items-center justify-center gap-1.5 py-3 px-4">
        {shots.map((shot, i) => (
          <button
            key={shot.id}
            onClick={() => setCurrentShotIndex(i)}
            className="transition-all"
            style={{
              width: i === currentShotIndex ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: shot.is_completed
                ? "#10b981"
                : i === currentShotIndex
                ? "#6366f1"
                : "#334155",
            }}
          />
        ))}
      </div>

      {/* Main shot content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Current shot card */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{
            background: "linear-gradient(135deg, #312e81, #1e1b4b)",
            border: "1px solid rgba(99,102,241,0.3)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <CameraIcon size={16} />
            <span className="text-indigo-300 text-xs font-bold uppercase tracking-wider">
              Shot {currentShot.shot_number}
            </span>
            {currentShot.framing && (
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(6,182,212,0.15)", color: "#22d3ee" }}
              >
                {currentShot.framing}
              </span>
            )}
          </div>
          <p className="text-white text-lg font-medium leading-relaxed mb-2">
            {currentShot.shot_desc}
          </p>
          {currentShot.notes && (
            <p className="text-indigo-300 text-sm leading-relaxed" style={{ opacity: 0.7 }}>
              {currentShot.notes}
            </p>
          )}
        </div>

        {/* Teleprompter toggle */}
        {piece.script && (
          <button
            onClick={() => setShowTeleprompter(!showTeleprompter)}
            className="w-full flex items-center justify-between p-4 rounded-2xl mb-4 transition-all"
            style={{
              background: showTeleprompter ? "rgba(99,102,241,0.1)" : "#0f172a",
              border: `1px solid ${showTeleprompter ? "rgba(99,102,241,0.3)" : "#1e293b"}`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 text-sm font-medium">Teleprompter</span>
            </div>
            <span className="text-slate-400">
              {showTeleprompter ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
            </span>
          </button>
        )}

        {showTeleprompter && piece.script && (
          <div className="mb-4">
            <TeleprompterView
              script={piece.script}
              scrollRef={scrollRef}
              isScrolling={isScrolling}
              scrollSpeed={scrollSpeed}
              onToggleScroll={() => setIsScrolling(!isScrolling)}
              onSpeedChange={setScrollSpeed}
            />
          </div>
        )}

        {/* Pro tips collapsible */}
        {proTips.length > 0 && (
          <>
            <button
              onClick={() => setShowTips(!showTips)}
              className="w-full flex items-center justify-between p-4 rounded-2xl mb-4 transition-all"
              style={{
                background: showTips ? "rgba(245,158,11,0.06)" : "#0f172a",
                border: `1px solid ${showTips ? "rgba(245,158,11,0.2)" : "#1e293b"}`,
              }}
            >
              <div className="flex items-center gap-2">
                <SparkleIcon size={14} />
                <span className="text-amber-400 text-sm font-medium">
                  {proTips.length} Pro Tip{proTips.length > 1 ? "s" : ""}
                </span>
              </div>
              <span className="text-slate-400">
                {showTips ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
              </span>
            </button>
            {showTips && (
              <div className="space-y-2 mb-4">
                {proTips.map((tip, i) => (
                  <div
                    key={tip.id}
                    className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
                    style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.1)" }}
                  >
                    <span className="text-amber-400 text-xs font-bold mt-0.5">{i + 1}.</span>
                    <p className="text-amber-200 text-sm leading-relaxed" style={{ opacity: 0.85 }}>
                      {tip.tip_text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Shot navigation */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setCurrentShotIndex(Math.max(0, currentShotIndex - 1))}
            disabled={currentShotIndex === 0}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "#1e293b",
              color: currentShotIndex === 0 ? "#334155" : "#94a3b8",
              opacity: currentShotIndex === 0 ? 0.5 : 1,
            }}
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentShotIndex(Math.min(shots.length - 1, currentShotIndex + 1))}
            disabled={isLastShot}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "#1e293b",
              color: isLastShot ? "#334155" : "#94a3b8",
              opacity: isLastShot ? 0.5 : 1,
            }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Bottom action bar */}
      <div
        className="shrink-0 px-4 pb-6 pt-4"
        style={{ background: "linear-gradient(to top, #020617 60%, transparent)", borderTop: "1px solid #1e293b" }}
      >
        <button
          onClick={handleMarkShot}
          className="w-full py-4 rounded-2xl text-base font-bold transition-all active:scale-[0.98]"
          style={{
            background: currentShot.is_completed
              ? "#1e293b"
              : "linear-gradient(135deg, #4f46e5, #06b6d4)",
            color: currentShot.is_completed ? "#94a3b8" : "white",
          }}
        >
          {currentShot.is_completed ? (
            <span className="flex items-center justify-center gap-2">
              <CheckIcon /> Shot Complete — Tap to Undo
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <CameraIcon size={18} /> Mark Shot {currentShot.shot_number} Done
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

function FilmingHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <div
      className="shrink-0 flex items-center justify-between px-4 py-3"
      style={{ borderBottom: "1px solid #1e293b" }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{title}</p>
        <p className="text-indigo-400 text-xs font-medium">{subtitle}</p>
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <XIcon size={20} />
      </button>
    </div>
  );
}

function TeleprompterView({
  script,
  scrollRef,
  isScrolling,
  scrollSpeed,
  onToggleScroll,
  onSpeedChange,
}: {
  script: string;
  scrollRef: React.RefObject<HTMLDivElement>;
  isScrolling: boolean;
  scrollSpeed: number;
  onToggleScroll: () => void;
  onSpeedChange: (speed: number) => void;
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#0a0a0a", border: "1px solid #1e293b" }}>
      {/* Teleprompter controls */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid #1e293b" }}>
        <button
          onClick={onToggleScroll}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: isScrolling ? "rgba(99,102,241,0.15)" : "#1e293b",
            color: isScrolling ? "#a5b4fc" : "#94a3b8",
          }}
        >
          {isScrolling ? <PauseIcon size={12} /> : <PlayIcon size={12} />}
          {isScrolling ? "Pause" : "Auto-scroll"}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs">Speed</span>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className="w-6 h-6 rounded-md text-xs font-bold transition-all"
              style={{
                background: scrollSpeed === s ? "#6366f1" : "transparent",
                color: scrollSpeed === s ? "white" : "#64748b",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Script text */}
      <div
        ref={scrollRef}
        className="overflow-y-auto px-6 py-8"
        style={{ maxHeight: "40vh" }}
      >
        <p className="text-white text-xl leading-[1.8] font-medium" style={{ fontFamily: "inherit" }}>
          {script}
        </p>
      </div>

      {/* Gradient fade at bottom */}
      <div
        className="h-8 -mt-8 relative z-10 pointer-events-none"
        style={{ background: "linear-gradient(to top, #0a0a0a, transparent)" }}
      />
    </div>
  );
}
