"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ArrowLeftIcon, PlusIcon, ChevronRightIcon, MailIcon } from "@/components/icons";
import type { Profile } from "@/lib/types/database";

export function ClientsPageClient({ clients }: { clients: Profile[] }) {
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, full_name: fullName, company_name: companyName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to invite client" });
      } else {
        setMessage({ type: "success", text: "Client invited successfully!" });
        setEmail("");
        setFullName("");
        setCompanyName("");
        router.refresh();
      }
    } catch {
      setMessage({ type: "error", text: "Something went wrong" });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
      <Navbar isAdmin />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeftIcon />
          </button>
          <div className="flex-1">
            <h1 className="text-white text-2xl font-bold">Clients</h1>
            <p className="text-slate-400 text-sm">Manage and invite clients</p>
          </div>
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
          >
            <PlusIcon /> Invite
          </button>
        </div>

        {/* Invite form */}
        {showInvite && (
          <div
            className="rounded-2xl p-6 mb-6"
            style={{ background: "#0f172a", border: "1px solid rgba(99,102,241,0.3)" }}
          >
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <MailIcon /> Invite New Client
            </h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                  style={{ background: "#020617", border: "1px solid #1e293b" }}
                  placeholder="client@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "#020617", border: "1px solid #1e293b" }}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-medium mb-1.5">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
                    style={{ background: "#020617", border: "1px solid #1e293b" }}
                    placeholder="Company Inc."
                  />
                </div>
              </div>

              {message && (
                <div
                  className="px-4 py-2.5 rounded-xl text-sm"
                  style={{
                    background: message.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                    color: message.type === "success" ? "#34d399" : "#f87171",
                  }}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
              >
                {loading ? "Sending..." : "Send Invite"}
              </button>
            </form>
          </div>
        )}

        {/* Client list */}
        <div className="space-y-3">
          {clients.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ background: "#0f172a", border: "1px solid #1e293b" }}
            >
              <p className="text-slate-500 text-sm mb-2">No clients yet</p>
              <p className="text-slate-600 text-xs">
                Click &quot;Invite&quot; to add your first client.
              </p>
            </div>
          ) : (
            clients.map((client) => (
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
                <div className="text-slate-500">
                  <ChevronRightIcon />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
