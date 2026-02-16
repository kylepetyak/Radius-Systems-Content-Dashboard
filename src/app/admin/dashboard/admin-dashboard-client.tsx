"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { StatusBadge } from "@/components/status-badge";
import { UsersIcon, FileTextIcon, ChevronRightIcon, PlusIcon } from "@/components/icons";
import type { Profile, ContentPlan, ContentPiece } from "@/lib/types/database";

interface AdminDashboardClientProps {
  clients: Profile[];
  plans: ContentPlan[];
  pieces: ContentPiece[];
}

export function AdminDashboardClient({ clients, plans, pieces }: AdminDashboardClientProps) {
  const router = useRouter();

  const stats = {
    totalClients: clients.length,
    totalPieces: pieces.length,
    toFilm: pieces.filter((p) => p.status === "to_film").length,
    filming: pieces.filter((p) => p.status === "filming").length,
    inReview: pieces.filter((p) => p.status === "in_review").length,
    published: pieces.filter((p) => p.status === "published").length,
  };

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
      <Navbar isAdmin />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-white text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manage clients and content plans</p>
          </div>
          <button
            onClick={() => router.push("/admin/clients")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
          >
            <PlusIcon /> Invite Client
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Clients", value: stats.totalClients, color: "#6366f1" },
            { label: "To Film", value: stats.toFilm, color: "#f59e0b" },
            { label: "Filming", value: stats.filming, color: "#3b82f6" },
            { label: "Published", value: stats.published, color: "#34d399" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-5"
              style={{ background: "#0f172a", border: "1px solid #1e293b" }}
            >
              <p className="text-slate-500 text-xs font-medium mb-1">{stat.label}</p>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Clients list */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold flex items-center gap-2">
              <UsersIcon /> Clients
            </h2>
            <button
              onClick={() => router.push("/admin/clients")}
              className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {clients.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: "#0f172a", border: "1px solid #1e293b" }}
              >
                <p className="text-slate-500 text-sm">No clients yet. Invite your first client.</p>
              </div>
            ) : (
              clients.slice(0, 5).map((client) => {
                const clientPlans = plans.filter((p) => p.client_id === client.id);
                const clientPieces = pieces.filter((p) =>
                  clientPlans.some((plan) => plan.id === p.plan_id)
                );
                const publishedCount = clientPieces.filter(
                  (p) => p.status === "published"
                ).length;

                return (
                  <button
                    key={client.id}
                    onClick={() => router.push(`/admin/clients/${client.id}`)}
                    className="w-full text-left rounded-2xl p-4 flex items-center gap-4 transition-all hover:border-indigo-500/30"
                    style={{ background: "#0f172a", border: "1px solid #1e293b" }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}
                    >
                      {(client.company_name || client.email)
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {client.company_name || client.full_name || client.email}
                      </p>
                      <p className="text-slate-500 text-xs">{client.email}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-slate-400 text-xs">
                        {clientPieces.length} pieces
                      </p>
                      <p className="text-emerald-400 text-xs">
                        {publishedCount} published
                      </p>
                    </div>
                    <ChevronRightIcon />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Recent pieces needing attention */}
        <div>
          <h2 className="text-white text-lg font-semibold flex items-center gap-2 mb-4">
            <FileTextIcon /> Pieces In Review
          </h2>
          <div className="space-y-3">
            {pieces.filter((p) => p.status === "in_review").length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: "#0f172a", border: "1px solid #1e293b" }}
              >
                <p className="text-slate-500 text-sm">No pieces currently in review.</p>
              </div>
            ) : (
              pieces
                .filter((p) => p.status === "in_review")
                .map((piece) => (
                  <button
                    key={piece.id}
                    onClick={() => router.push(`/content/${piece.id}`)}
                    className="w-full text-left rounded-2xl p-4 flex items-center justify-between transition-all hover:border-indigo-500/30"
                    style={{ background: "#0f172a", border: "1px solid #1e293b" }}
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{piece.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{piece.platform}</p>
                    </div>
                    <StatusBadge status={piece.status} />
                  </button>
                ))
            )}
          </div>
        </div>

        <div className="mt-12 pt-6" style={{ borderTop: "1px solid #1e293b" }}>
          <p className="text-slate-600 text-xs">Content Studio Admin — Radius Systems</p>
        </div>
      </div>
    </div>
  );
}
