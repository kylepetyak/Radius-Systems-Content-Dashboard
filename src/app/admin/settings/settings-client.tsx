"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { ArrowLeftIcon, FolderIcon } from "@/components/icons";
import { useRouter } from "next/navigation";

export function SettingsClient() {
  const [driveConfigured, setDriveConfigured] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/google-drive")
      .then((r) => r.json())
      .then((d) => setDriveConfigured(d.configured))
      .catch(() => setDriveConfigured(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#020617" }}>
      <Navbar isAdmin />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeftIcon />
          </button>
          <h1 className="text-white text-xl font-bold">Settings</h1>
        </div>

        {/* Google Drive Integration */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "#0f172a", border: "1px solid #1e293b" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-emerald-400"
              style={{ background: "rgba(34,197,94,0.15)" }}
            >
              <FolderIcon size={20} />
            </div>
            <div>
              <h2 className="text-white font-semibold">Google Drive Integration</h2>
              <p className="text-slate-400 text-xs">
                Auto-create folders for content pieces
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#020617" }}>
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  background:
                    driveConfigured === null
                      ? "#64748b"
                      : driveConfigured
                      ? "#10b981"
                      : "#ef4444",
                }}
              />
              <p className="text-sm" style={{ color: driveConfigured ? "#10b981" : "#94a3b8" }}>
                {driveConfigured === null
                  ? "Checking..."
                  : driveConfigured
                  ? "Connected — folders will be created automatically"
                  : "Not configured"}
              </p>
            </div>

            {!driveConfigured && driveConfigured !== null && (
              <div
                className="p-4 rounded-xl space-y-3"
                style={{
                  background: "rgba(245,158,11,0.06)",
                  border: "1px solid rgba(245,158,11,0.15)",
                }}
              >
                <p className="text-amber-400 text-sm font-medium">Setup Instructions</p>
                <ol className="text-slate-400 text-xs space-y-2 list-decimal list-inside">
                  <li>
                    Go to{" "}
                    <span className="text-slate-300">Google Cloud Console</span> and create a
                    project with the <span className="text-slate-300">Google Drive API</span>{" "}
                    enabled
                  </li>
                  <li>
                    Create a <span className="text-slate-300">Service Account</span> and download
                    the JSON key file
                  </li>
                  <li>
                    Share your target Google Drive folder with the service account email address
                    (give it <span className="text-slate-300">Editor</span> access)
                  </li>
                  <li>
                    Add these environment variables:
                    <div
                      className="mt-2 p-3 rounded-lg font-mono text-xs text-slate-300 leading-relaxed"
                      style={{ background: "#020617" }}
                    >
                      GOOGLE_SERVICE_ACCOUNT_EMAIL=...
                      <br />
                      GOOGLE_SERVICE_ACCOUNT_KEY=...
                      <br />
                      GOOGLE_DRIVE_PARENT_FOLDER_ID=...
                    </div>
                  </li>
                  <li>Restart the application</li>
                </ol>
              </div>
            )}

            {driveConfigured && (
              <div className="text-slate-500 text-xs">
                <p>
                  When a content piece is created, a Google Drive folder is automatically created
                  with the naming convention:{" "}
                  <span className="text-slate-300">
                    Client Name - Content Title - YYYY-MM-DD
                  </span>
                </p>
                <p className="mt-1">
                  Each folder includes subfolders:{" "}
                  <span className="text-slate-300">Raw Footage</span>,{" "}
                  <span className="text-slate-300">Audio</span>, and{" "}
                  <span className="text-slate-300">Photos</span>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
