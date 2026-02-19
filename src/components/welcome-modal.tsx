"use client";

import { useState, useEffect } from "react";
import { CameraIcon, SparkleIcon, CheckIcon } from "./icons";

interface WelcomeModalProps {
  companyName: string;
}

const steps = [
  {
    icon: <SparkleIcon size={28} />,
    color: "#6366f1",
    bg: "rgba(99,102,241,0.15)",
    title: "We create the plan",
    desc: "Your content team writes the scripts, shot lists, and creative direction. It all shows up here.",
  },
  {
    icon: <CameraIcon size={28} />,
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.15)",
    title: "You film using our guides",
    desc: "Tap any piece to see exactly what to film. Use Filming Mode for a step-by-step walkthrough with teleprompter.",
  },
  {
    icon: <CheckIcon />,
    color: "#10b981",
    bg: "rgba(16,185,129,0.15)",
    title: "We edit and publish",
    desc: "Upload your footage and we handle the rest — editing, captions, posting. You just film.",
  },
];

export function WelcomeModal({ companyName }: WelcomeModalProps) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const key = "radius_onboarded";
    if (!localStorage.getItem(key)) {
      setShow(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem("radius_onboarded", "true");
    setShow(false);
  };

  if (!show) return null;

  const isLast = step === steps.length - 1;
  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
      <div
        className="w-full max-w-sm mx-4 rounded-3xl overflow-hidden"
        style={{ background: "#0f172a", border: "1px solid rgba(99,102,241,0.2)" }}
      >
        {/* Header */}
        <div
          className="px-6 pt-8 pb-6 text-center"
          style={{ background: "linear-gradient(180deg, #1e1b4b, #0f172a)" }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}
          >
            <span className="text-white text-xl font-black">R</span>
          </div>
          <h2 className="text-white text-xl font-bold mb-1">
            Welcome, {companyName}!
          </h2>
          <p className="text-slate-400 text-sm">
            Here&apos;s how Content Studio works
          </p>
        </div>

        {/* Step content */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: current.bg, color: current.color }}
            >
              {current.icon}
            </div>
            <div>
              <p className="text-white font-semibold text-base mb-1">{current.title}</p>
              <p className="text-slate-400 text-sm leading-relaxed">{current.desc}</p>
            </div>
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className="transition-all"
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === step ? "#6366f1" : "#334155",
                }}
              />
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="px-6 pb-6">
          {isLast ? (
            <button
              onClick={handleComplete}
              className="w-full py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
                color: "white",
              }}
            >
              Let&apos;s Go
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleComplete}
                className="flex-1 py-3.5 rounded-xl text-sm font-medium text-slate-400"
                style={{ background: "#1e293b" }}
              >
                Skip
              </button>
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #4f46e5, #06b6d4)" }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
