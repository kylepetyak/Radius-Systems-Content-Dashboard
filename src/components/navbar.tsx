"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "./icons";

interface NavbarProps {
  companyName?: string;
  planMonth?: string;
  initials?: string;
  isAdmin?: boolean;
}

export function Navbar({ companyName, planMonth, initials, isAdmin }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav
      className="sticky top-0 z-20"
      style={{ background: "rgba(2,6,23,0.95)", borderBottom: "1px solid #1e293b" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}
          >
            <span className="text-white text-sm font-black">R</span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">
              Content Studio{isAdmin ? " — Admin" : ""}
            </p>
            <p className="text-slate-500 text-xs">by Radius Systems</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {companyName && (
            <div className="text-right hidden sm:block">
              <p className="text-white text-xs font-medium">{companyName}</p>
              {planMonth && <p className="text-slate-500 text-xs">{planMonth}</p>}
            </div>
          )}
          {initials && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}
            >
              {initials}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Sign out"
          >
            <LogOutIcon />
          </button>
        </div>
      </div>
    </nav>
  );
}
