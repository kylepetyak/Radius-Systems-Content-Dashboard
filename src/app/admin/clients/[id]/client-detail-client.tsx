"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ProgressRing } from "@/components/progress-ring";
import { ArrowLeftIcon, PlusIcon, ChevronRightIcon } from "@/components/icons";
import type { Profile, ContentPlan, ContentPiece } from "@/lib/types/database";

interface ClientDetailClientProps {
  client: Profile;
  plans: ContentPlan[];
  pieces: ContentPiece[];
}

export function ClientDetailClient({ client, plans, pieces }: ClientDetailClientProps) {
  const [showNewPlan, setShowNewPlan] = useState(false);
  const [planTitle, setPlanTitle] = useState("");
  const [planMonth, setPlanMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const published = pieces.filter((p) => p.status === "published").length;

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/content-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: client.id,
          title: planTitle,
          month: planMonth,
        }),
      });

      if (res.ok) {
        await res.json();
        setPlanTitle("");
        setPlanMonth("");
        setShowNewPlan(false);
        router.refresh();
      }
    } catch {
      // Handle error
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
      <Navbar isAdmin />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push("/admin/clients")}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeftIcon />
          </button>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}
          >
            {(client.company_name || client.email)
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-white text-xl font-bold">
              {client.company_name || client.full_name || client.email}
            </h1>
            <p className="text-slate-400 text-sm">{client.email}</p>
          </div>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div
            className="rounded-2xl p-6 flex flex-col items-center justify-center"
            style={{ background: "#0f172a", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <ProgressRing completed={published} total={pieces.length} />
            <p className="text-slate-400 text-xs mt-3 font-medium">
              {published} of {pieces.length} published
            </p>
          </div>
          <div
            className="md:col-span-2 rounded-2xl p-6 grid grid-cols-2 gap-4"
            style={{ background: "#0f172a", border: "1px solid #1e293b" }}
          >
            {[
              { label: "Plans", value: plans.length, color: "#6366f1" },
              { label: "Total Pieces", value: pieces.length, color: "#06b6d4" },
              { label: "To Film", value: pieces.filter((p) => p.status === "to_film").length, color: "#f59e0b" },
              { label: "In Review", value: pieces.filter((p) => p.status === "in_review").length, color: "#a78bfa" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-slate-500 text-xs font-medium">{stat.label}</p>
                <p className="text-xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Content Plans */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-semibold">Content Plans</h2>
          <button
            onClick={() => setShowNewPlan(!showNewPlan)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
          >
            <PlusIcon /> New Plan
          </button>
        </div>

        {showNewPlan && (
          <div
            className="rounded-2xl p-6 mb-4"
            style={{ background: "#0f172a", border: "1px solid rgba(99,102,241,0.3)" }}
          >
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1.5">
                    Plan Title *
                  </label>
                  <input
                    type="text"
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "#020617", border: "1px solid #1e293b" }}
                    placeholder="February 2026 Content Plan"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1.5">
                    Month
                  </label>
                  <input
                    type="text"
                    value={planMonth}
                    onChange={(e) => setPlanMonth(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "#020617", border: "1px solid #1e293b" }}
                    placeholder="February 2026"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                {loading ? "Creating..." : "Create Plan"}
              </button>
            </form>
          </div>
        )}

        <div className="space-y-3">
          {plans.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ background: "#0f172a", border: "1px solid #1e293b" }}
            >
              <p className="text-slate-500 text-sm">No content plans yet.</p>
            </div>
          ) : (
            plans.map((plan) => {
              const planPieces = pieces.filter((p) => p.plan_id === plan.id);
              const planPublished = planPieces.filter((p) => p.status === "published").length;

              return (
                <button
                  key={plan.id}
                  onClick={() => router.push(`/admin/plans/${plan.id}`)}
                  className="w-full text-left rounded-2xl p-4 flex items-center justify-between transition-all hover:border-indigo-500/30"
                  style={{ background: "#0f172a", border: "1px solid #1e293b" }}
                >
                  <div>
                    <p className="text-white text-sm font-medium">{plan.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {plan.month || "No month set"} &middot; {planPieces.length} pieces &middot;{" "}
                      {planPublished} published
                    </p>
                  </div>
                  <ChevronRightIcon />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
